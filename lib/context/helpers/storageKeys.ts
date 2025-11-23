// File: @/lib/context/helpers/storageKeys.ts

// Single source of truth for localStorage keys to avoid drift.
export const EXCHANGE_CONTEXT_STORAGE_KEY = 'exchangeContext' as const;

// (Optional) central registry + types, handy if you add more keys later.
export const storageKeys = {
  exchangeContext: EXCHANGE_CONTEXT_STORAGE_KEY,
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

/** (Optional) prefix keys per user/network/env if you ever need scoping */
export const makeScopedKey = (key: StorageKey, scope?: string) =>
  scope ? `${scope}:${key}` : key;
