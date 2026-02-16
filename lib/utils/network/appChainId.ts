// File: @/lib/utils/network/appChainId.ts

import { DEFAULT_CHAIN_ID, normalizeChainId } from './chains';

export const isValidChainId = (id: unknown): id is number =>
  typeof id === 'number' && Number.isFinite(id) && id > 0;

export const toChainIdString = (id: unknown): string =>
  isValidChainId(id) ? String(id) : '';

export const resolveAppChainId = (
  input: unknown,
  fallback?: number,
): number | undefined => {
  if (isValidChainId(input)) return input;

  const normalized = normalizeChainId(input, 0);
  if (isValidChainId(normalized)) return normalized;

  if (isValidChainId(fallback)) return fallback;
  return undefined;
};

type EffectiveChainIdInput = {
  appChainId?: unknown;
  walletChainId?: unknown;
  contextChainId?: unknown;
  fallbackChainId?: unknown;
};

export const getEffectiveChainId = ({
  appChainId,
  walletChainId,
  contextChainId,
  fallbackChainId,
}: EffectiveChainIdInput): number =>
  resolveAppChainId(appChainId) ??
  resolveAppChainId(walletChainId) ??
  resolveAppChainId(contextChainId) ??
  resolveAppChainId(fallbackChainId, DEFAULT_CHAIN_ID) ??
  DEFAULT_CHAIN_ID;

