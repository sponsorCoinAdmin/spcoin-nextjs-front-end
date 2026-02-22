// File: @/lib/server/spCoinAuth.ts
import crypto from 'crypto';
import { verifyMessage } from 'viem';

type SessionRecord = {
  address: string;
  token: string;
  expiresAt: number;
};

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const NONCE_RATE_LIMIT_MAX = 15;
const VERIFY_RATE_LIMIT_MAX = 30;
const SESSION_TOKEN_VERSION = 'v1';

const usedNonceStore = new Map<string, number>();
const nonceRateStore = new Map<string, { count: number; windowStartedAt: number }>();
const verifyRateStore = new Map<string, { count: number; windowStartedAt: number }>();

function getSessionTokenSecret(): string | null {
  const secret =
    process.env.SPCOIN_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    '';
  const normalized = secret.trim();
  return normalized.length > 0 ? normalized : null;
}

function getUpstashConfig(): { url: string; token: string } | null {
  const url = String(process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;
  return { url, token };
}

async function runRedisPipeline(commands: Array<Array<string>>): Promise<Array<unknown>> {
  const cfg = getUpstashConfig();
  if (!cfg) {
    throw new Error('Upstash Redis not configured');
  }
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Redis pipeline failed (${response.status})`);
  }
  const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  return payload.map((item) => {
    if (item?.error) throw new Error(`Redis command failed: ${item.error}`);
    return item?.result;
  });
}

function signSessionTokenPayload(payload: string): string {
  const secret = getSessionTokenSecret();
  if (!secret) {
    throw new Error('Server auth secret not configured');
  }
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function buildSessionToken(address: string, expiresAt: number): string {
  const normalized = normalizeAddress(address);
  const addressHex = normalized.slice(2).toLowerCase();
  const exp36 = Math.trunc(expiresAt).toString(36);
  const payload = `${SESSION_TOKEN_VERSION}.${exp36}.${addressHex}`;
  const sig = signSessionTokenPayload(payload);
  return `${payload}.${sig}`;
}

function parseAndValidateStatelessSessionToken(token: string): SessionRecord | null {
  if (!getSessionTokenSecret()) return null;
  const parts = String(token ?? '').trim().split('.');
  if (parts.length !== 4) return null;
  const [version, exp36, addressHex, sig] = parts;
  if (version !== SESSION_TOKEN_VERSION) return null;
  if (!/^[0-9a-f]{40}$/i.test(addressHex)) return null;
  if (!/^[0-9a-f]{64}$/i.test(sig)) return null;
  const payload = `${version}.${exp36}.${addressHex.toLowerCase()}`;
  const expectedSig = signSessionTokenPayload(payload);
  const sigBuf = Buffer.from(sig.toLowerCase(), 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  const expiresAt = Number.parseInt(exp36, 36);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null;
  return {
    address: `0x${addressHex.toLowerCase()}`,
    token,
    expiresAt,
  };
}

function nowMs(): number {
  return Date.now();
}

function normalizeAddress(value: string): string {
  return `0x${value.slice(2).toLowerCase()}`;
}

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(value);
}

function pruneExpiredMemoryState() {
  const now = nowMs();
  for (const [k, expiresAt] of usedNonceStore.entries()) {
    if (expiresAt <= now) usedNonceStore.delete(k);
  }
  for (const [k, v] of nonceRateStore.entries()) {
    if (v.windowStartedAt + RATE_LIMIT_WINDOW_MS <= now) nonceRateStore.delete(k);
  }
  for (const [k, v] of verifyRateStore.entries()) {
    if (v.windowStartedAt + RATE_LIMIT_WINDOW_MS <= now) verifyRateStore.delete(k);
  }
}

function parseNonceIssuedAtMs(nonce: string): number | null {
  const [tsPart] = String(nonce ?? '').split('.', 2);
  if (!tsPart) return null;
  const ms = Number.parseInt(tsPart, 36);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms;
}

function buildAuthMessage(address: string, nonce: string): string {
  return [
    'SponsorCoin Account Write Authorization',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    'Purpose: authorize create/update account data and logo',
  ].join('\n');
}

function normalizeRateKey(key: string): string {
  return String(key ?? '').trim().toLowerCase();
}

function consumeInMemoryRateLimit(
  store: Map<string, { count: number; windowStartedAt: number }>,
  key: string,
  limit: number,
) {
  const now = nowMs();
  const normalizedKey = normalizeRateKey(key);
  if (!normalizedKey) return { ok: false as const, retryAfterSeconds: 1 };
  const current = store.get(normalizedKey);
  if (!current || current.windowStartedAt + RATE_LIMIT_WINDOW_MS <= now) {
    store.set(normalizedKey, { count: 1, windowStartedAt: now });
    return { ok: true as const };
  }
  if (current.count >= limit) {
    const retryAfterMs = Math.max(1000, current.windowStartedAt + RATE_LIMIT_WINDOW_MS - now);
    return { ok: false as const, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }
  current.count += 1;
  store.set(normalizedKey, current);
  return { ok: true as const };
}

async function consumeSharedRateLimit(kind: 'nonce' | 'verify', key: string) {
  const normalizedKey = normalizeRateKey(key);
  if (!normalizedKey) return { ok: false as const, retryAfterSeconds: 1 };
  const limit = kind === 'nonce' ? NONCE_RATE_LIMIT_MAX : VERIFY_RATE_LIMIT_MAX;
  const redisKey = `spcoin:auth:ratelimit:${kind}:${normalizedKey}`;
  const [countRaw, , pttlRaw] = await runRedisPipeline([
    ['INCR', redisKey],
    ['PEXPIRE', redisKey, String(RATE_LIMIT_WINDOW_MS), 'NX'],
    ['PTTL', redisKey],
  ]);
  const count = Number(countRaw ?? 0);
  const pttl = Math.max(1000, Number(pttlRaw ?? RATE_LIMIT_WINDOW_MS));
  if (Number.isFinite(count) && count > limit) {
    return { ok: false as const, retryAfterSeconds: Math.ceil(pttl / 1000) };
  }
  return { ok: true as const };
}

function getUsedNonceKey(address: string, nonce: string): string {
  return `${address.toLowerCase()}::${nonce}`;
}

async function markNonceUsed(address: string, nonce: string, ttlMs: number): Promise<boolean> {
  const key = getUsedNonceKey(address, nonce);
  const safeTtlMs = Math.max(1000, ttlMs);
  const redisConfig = getUpstashConfig();
  if (redisConfig) {
    const [setResult] = await runRedisPipeline([
      ['SET', `spcoin:auth:nonce:used:${key}`, '1', 'NX', 'PX', String(safeTtlMs)],
    ]);
    return String(setResult ?? '').toUpperCase() === 'OK';
  }

  pruneExpiredMemoryState();
  const now = nowMs();
  const existingExpiry = usedNonceStore.get(key);
  if (existingExpiry && existingExpiry > now) return false;
  usedNonceStore.set(key, now + safeTtlMs);
  return true;
}

export function isAuthConfigured(): boolean {
  return Boolean(getSessionTokenSecret());
}

export async function consumeAuthRateLimit(kind: 'nonce' | 'verify', key: string) {
  pruneExpiredMemoryState();
  if (getUpstashConfig()) {
    try {
      return await consumeSharedRateLimit(kind, key);
    } catch {
      // Fail closed only when shared store is configured but unavailable.
      return { ok: false as const, retryAfterSeconds: 2 };
    }
  }
  if (kind === 'nonce') {
    return consumeInMemoryRateLimit(nonceRateStore, key, NONCE_RATE_LIMIT_MAX);
  }
  return consumeInMemoryRateLimit(verifyRateStore, key, VERIFY_RATE_LIMIT_MAX);
}

export function issueNonce(rawAddress: string) {
  if (!getSessionTokenSecret()) {
    throw new Error('Server auth secret not configured');
  }
  if (!isAddress(rawAddress)) {
    throw new Error('Invalid address');
  }
  const address = normalizeAddress(rawAddress);
  const nonce = `${Date.now().toString(36)}.${crypto.randomBytes(16).toString('hex')}`;
  const message = buildAuthMessage(address, nonce);
  const expiresAt = nowMs() + NONCE_TTL_MS;
  return { address, nonce, message, expiresAt };
}

export async function verifyNonceSignature(input: {
  address: string;
  nonce: string;
  signature: string;
}) {
  if (!getSessionTokenSecret()) {
    return { ok: false as const, error: 'Server auth not configured' };
  }
  const rawAddress = String(input.address ?? '');
  if (!isAddress(rawAddress)) return { ok: false as const, error: 'Invalid address' };
  const address = normalizeAddress(rawAddress);
  const nonce = String(input.nonce ?? '').trim();
  const signature = String(input.signature ?? '').trim();
  if (!nonce || !signature) {
    return { ok: false as const, error: 'Missing nonce or signature' };
  }

  const issuedAtMs = parseNonceIssuedAtMs(nonce);
  if (!issuedAtMs) {
    return { ok: false as const, error: 'Malformed nonce' };
  }
  const now = nowMs();
  if (issuedAtMs + NONCE_TTL_MS <= now) {
    return { ok: false as const, error: 'Nonce expired' };
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message: buildAuthMessage(address, nonce),
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return { ok: false as const, error: 'Invalid signature' };
  }

  const ttlMs = issuedAtMs + NONCE_TTL_MS - now;
  let claimed = false;
  try {
    claimed = await markNonceUsed(address, nonce, ttlMs);
  } catch {
    return { ok: false as const, error: 'Nonce store unavailable' };
  }
  if (!claimed) {
    return { ok: false as const, error: 'Nonce already used' };
  }

  const expiresAt = nowMs() + SESSION_TTL_MS;
  const token = buildSessionToken(address, expiresAt);
  return { ok: true as const, token, address, expiresAt };
}

export function readBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function validateSessionToken(token: string | null, rawAddress: string) {
  if (!getSessionTokenSecret()) {
    return { ok: false as const, error: 'Server auth not configured' };
  }
  if (!token) return { ok: false as const, error: 'Missing bearer token' };
  if (!isAddress(rawAddress)) return { ok: false as const, error: 'Invalid address' };
  const address = normalizeAddress(rawAddress);
  const record = parseAndValidateStatelessSessionToken(token);
  if (!record) return { ok: false as const, error: 'Invalid or expired token' };
  if (record.expiresAt <= nowMs()) {
    return { ok: false as const, error: 'Token expired' };
  }
  if (record.address !== address) {
    return { ok: false as const, error: 'Token address mismatch' };
  }
  return { ok: true as const, address };
}

export function validateSessionTokenAnyAddress(token: string | null) {
  if (!getSessionTokenSecret()) {
    return { ok: false as const, error: 'Server auth not configured' };
  }
  if (!token) return { ok: false as const, error: 'Missing bearer token' };
  const record = parseAndValidateStatelessSessionToken(token);
  if (!record) return { ok: false as const, error: 'Invalid or expired token' };
  if (record.expiresAt <= nowMs()) {
    return { ok: false as const, error: 'Token expired' };
  }
  return { ok: true as const, address: record.address };
}

