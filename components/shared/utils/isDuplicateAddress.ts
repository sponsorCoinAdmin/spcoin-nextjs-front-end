// File: components/shared/utils/addressUtils.ts

/**
 * Case-insensitive check for whether two Ethereum addresses are equal.
 */
export const isDuplicateAddress = (a?: string, b?: string): boolean =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();
