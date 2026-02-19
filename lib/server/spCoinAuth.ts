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
  const nonce = crypto.randomBytes(16).toString('hex');
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
  if (!record) {
    return { ok: false as const, error: 'Nonce not found or expired' };
  }
  if (record.expiresAt <= nowMs()) {
    nonceStore.delete(nonceKey(address, nonce));
    return { ok: false as const, error: 'Nonce expired' };
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message: record.message,
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return { ok: false as const, error: 'Invalid signature' };
  }

  nonceStore.delete(nonceKey(address, nonce));
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = nowMs() + SESSION_TTL_MS;
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
  const record = sessionStore.get(token);
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

