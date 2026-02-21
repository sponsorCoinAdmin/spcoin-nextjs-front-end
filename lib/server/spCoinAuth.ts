// File: @/lib/server/spCoinAuth.ts
import crypto from 'crypto';
import { verifyMessage } from 'viem';

type NonceRecord = {
  address: string;
  nonce: string;
  message: string;
  expiresAt: number;
};

type SessionRecord = {
  address: string;
  token: string;
  expiresAt: number;
};

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 10 * 60 * 1000;

const nonceStore = new Map<string, NonceRecord>();
const sessionStore = new Map<string, SessionRecord>();
const SESSION_TOKEN_VERSION = 'v1';

function getSessionTokenSecret(): string {
  return (
    process.env.SPCOIN_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'spcoin-local-dev-secret-change-me'
  );
}

function signSessionTokenPayload(payload: string): string {
  return crypto
    .createHmac('sha256', getSessionTokenSecret())
    .update(payload)
    .digest('hex');
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

function pruneExpired() {
  const now = nowMs();
  for (const [k, v] of nonceStore.entries()) {
    if (v.expiresAt <= now) nonceStore.delete(k);
  }
  for (const [k, v] of sessionStore.entries()) {
    if (v.expiresAt <= now) sessionStore.delete(k);
  }
}

function nonceKey(address: string, nonce: string): string {
  return `${address.toLowerCase()}::${nonce}`;
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

export function issueNonce(rawAddress: string) {
  pruneExpired();
  if (!isAddress(rawAddress)) {
    throw new Error('Invalid address');
  }
  const address = normalizeAddress(rawAddress);
  // Prefix nonce with issued-at ms (base36) so verify can enforce TTL even if in-memory state is lost.
  const nonce = `${Date.now().toString(36)}.${crypto.randomBytes(16).toString('hex')}`;
  const message = buildAuthMessage(address, nonce);
  const expiresAt = nowMs() + NONCE_TTL_MS;
  nonceStore.set(nonceKey(address, nonce), { address, nonce, message, expiresAt });
  return { address, nonce, message, expiresAt };
}

export async function verifyNonceSignature(input: {
  address: string;
  nonce: string;
  signature: string;
}) {
  pruneExpired();
  const rawAddress = String(input.address ?? '');
  if (!isAddress(rawAddress)) return { ok: false as const, error: 'Invalid address' };
  const address = normalizeAddress(rawAddress);
  const nonce = String(input.nonce ?? '').trim();
  const signature = String(input.signature ?? '').trim();
  if (!nonce || !signature) {
    return { ok: false as const, error: 'Missing nonce or signature' };
  }

  const record = nonceStore.get(nonceKey(address, nonce));
  const issuedAtMs = parseNonceIssuedAtMs(nonce);
  if (record) {
    if (record.expiresAt <= nowMs()) {
      nonceStore.delete(nonceKey(address, nonce));
      return { ok: false as const, error: 'Nonce expired' };
    }
  } else {
    // Fallback: allow stateless verification if nonce store is unavailable (e.g. process swap/reload).
    if (!issuedAtMs || issuedAtMs + NONCE_TTL_MS <= nowMs()) {
      return { ok: false as const, error: 'Nonce not found or expired' };
    }
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message: record?.message ?? buildAuthMessage(address, nonce),
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return { ok: false as const, error: 'Invalid signature' };
  }

  nonceStore.delete(nonceKey(address, nonce));
  const expiresAt = nowMs() + SESSION_TTL_MS;
  const token = buildSessionToken(address, expiresAt);
  sessionStore.set(token, { address, token, expiresAt });
  return { ok: true as const, token, address, expiresAt };
}

export function readBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function validateSessionToken(token: string | null, rawAddress: string) {
  pruneExpired();
  if (!token) return { ok: false as const, error: 'Missing bearer token' };
  if (!isAddress(rawAddress)) return { ok: false as const, error: 'Invalid address' };
  const address = normalizeAddress(rawAddress);
  const record = sessionStore.get(token) ?? parseAndValidateStatelessSessionToken(token);
  if (!record) return { ok: false as const, error: 'Invalid or expired token' };
  if (record.expiresAt <= nowMs()) {
    sessionStore.delete(token);
    return { ok: false as const, error: 'Token expired' };
  }
  if (record.address !== address) {
    return { ok: false as const, error: 'Token address mismatch' };
  }
  return { ok: true as const, address };
}

