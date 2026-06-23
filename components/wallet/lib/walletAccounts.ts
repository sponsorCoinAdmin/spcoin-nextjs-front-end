'use client';

type WalletAccountsMap = Map<string, boolean>;
let walletAccountsMap: WalletAccountsMap = new Map();

export function initializeWalletAccounts(accounts: Array<{ address: string }>): void {
  walletAccountsMap = new Map(
    accounts.map((account) => [String(account.address).toLowerCase(), true]),
  );
}

export function addWalletAccount(address: string): void {
  walletAccountsMap.set(String(address).toLowerCase(), true);
}

export function removeWalletAccount(address: string): void {
  walletAccountsMap.delete(String(address).toLowerCase());
}

export function isSpCoinWalletAccount(address: string | undefined): boolean {
  if (!address) return false;
  return walletAccountsMap.has(String(address).toLowerCase());
}
