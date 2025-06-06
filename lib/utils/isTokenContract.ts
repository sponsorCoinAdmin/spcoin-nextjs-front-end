import { TokenContract } from '@/lib/structure';

/**
 * Type guard to determine if an object is a valid TokenContract.
 * Used to differentiate between TokenContract and WalletAccount.
 */
export function isValidTokenContract(token: any): token is TokenContract {
  return (
    token &&
    typeof token.amount !== 'undefined' &&
    typeof token.balance !== 'undefined' &&
    typeof token.totalSupply !== 'undefined'
  );
}
