import type { TokenContract } from '@/lib/structure';

/**
 * Type guard to determine if an object is a valid TokenContract.
 * Used to differentiate between TokenContract and spCoinAccount.
 */
export function isValidTokenContract(token: unknown): token is TokenContract {
  if (!token || typeof token !== 'object') return false;
  const candidate = token as {
    amount?: unknown;
    balance?: unknown;
    totalSupply?: unknown;
  };
  return (
    typeof candidate.amount !== 'undefined' &&
    typeof candidate.balance !== 'undefined' &&
    typeof candidate.totalSupply !== 'undefined'
  );
}
