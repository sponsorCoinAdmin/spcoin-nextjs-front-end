'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAccount, useChainId } from 'wagmi';

import { useExchangeContext } from '@/lib/context/hooks';
import { STATUS, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import { loadHardhatWalletAccounts } from './accountSelection';
import type {
  SpCoinWalletAccount,
  SpCoinWalletSelectionRequest,
  SpCoinWalletSelectionResult,
  SpCoinWalletSession,
  SpCoinWalletSource,
} from './types';

type SpCoinWalletContextValue = {
  isOpen: boolean;
  openWallet: () => void;
  closeWallet: () => void;
  openAccountSelection: (
    request: Omit<SpCoinWalletSelectionRequest, 'requestId'> & { requestId?: string },
  ) => void;
  selectAccount: (account: SpCoinWalletAccount) => void;
  session: SpCoinWalletSession;
  walletSource: SpCoinWalletSource;
  setWalletSource: (source: SpCoinWalletSource) => void;
  hardhatAccounts: SpCoinWalletAccount[];
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  refreshHardhatAccounts: () => Promise<void>;
  selectedHardhatSignerAddress?: string;
  setSelectedHardhatSignerAddress: (address: string) => void;
  selectionRequest?: SpCoinWalletSelectionRequest;
};

const SpCoinWalletContext = createContext<SpCoinWalletContextValue | null>(null);

function makeRequestId(): string {
  return `spcoin-wallet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useInitialWalletSource(): SpCoinWalletSource {
  const { exchangeContext } = useExchangeContext();
  const appChainId = Number(exchangeContext?.network?.appChainId ?? 0);
  return appChainId === 31337 ? 'hardhat' : 'metamask';
}

export function SpCoinWalletProvider({ children }: { children: React.ReactNode }) {
  const initialWalletSource = useInitialWalletSource();
  const [isOpen, setIsOpen] = useState(false);
  const [walletSource, setWalletSource] = useState<SpCoinWalletSource>(initialWalletSource);
  const [selectionRequest, setSelectionRequest] = useState<SpCoinWalletSelectionRequest | undefined>();
  const [hardhatAccounts, setHardhatAccounts] = useState<SpCoinWalletAccount[]>([]);
  const [hardhatAccountsLoading, setHardhatAccountsLoading] = useState(false);
  const [hardhatAccountsError, setHardhatAccountsError] = useState('');
  const [selectedHardhatSignerAddress, setSelectedHardhatSignerAddressState] = useState('');

  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { address: metamaskAddress, isConnected } = useAccount();
  const walletChainId = useChainId();
  const appChainId = Number(exchangeContext?.network?.appChainId ?? 0);
  const activeAccountAddress = String(exchangeContext?.accounts?.activeAccount?.address ?? '').trim();

  const refreshHardhatAccounts = useCallback(async () => {
    setHardhatAccountsLoading(true);
    setHardhatAccountsError('');
    try {
      const accounts = await loadHardhatWalletAccounts(31337);
      setHardhatAccounts(accounts);
    } catch (error) {
      setHardhatAccountsError(
        error instanceof Error ? error.message : 'Unable to load Hardhat wallet accounts.',
      );
    } finally {
      setHardhatAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHardhatAccounts();
  }, [refreshHardhatAccounts]);

  useEffect(() => {
    if (hardhatAccounts.length === 0) return;
    const normalizedSelected = normalizeAddress(selectedHardhatSignerAddress);
    const selectedStillExists = hardhatAccounts.some(
      (account) => normalizeAddress(account.address) === normalizedSelected,
    );
    if (selectedStillExists) return;
    const fallbackAddress =
      hardhatAccounts.find(
        (account) => normalizeAddress(account.address) === normalizeAddress(activeAccountAddress),
      )?.address ?? hardhatAccounts[0]?.address ?? '';
    if (!fallbackAddress) return;
    setSelectedHardhatSignerAddressState(fallbackAddress);
  }, [activeAccountAddress, hardhatAccounts, selectedHardhatSignerAddress]);

  useEffect(() => {
    if (appChainId === 31337 && walletSource === 'metamask' && !isConnected) {
      setWalletSource('hardhat');
    }
  }, [appChainId, isConnected, walletSource]);

  const session = useMemo<SpCoinWalletSession>(() => {
    const normalizedMetaMaskAddress = normalizeAddress(String(metamaskAddress ?? ''));
    const hardhatSignerAddress = hardhatAccounts.find(
      (account) => normalizeAddress(account.address) === normalizeAddress(selectedHardhatSignerAddress),
    )?.address
      ?? hardhatAccounts.find((account) => normalizeAddress(account.address) === normalizeAddress(activeAccountAddress))
        ?.address
      ?? hardhatAccounts[0]?.address;
    const signerAddress =
      walletSource === 'metamask'
        ? normalizedMetaMaskAddress || undefined
        : hardhatSignerAddress || activeAccountAddress || undefined;

    return {
      walletSource,
      networkSource: walletSource === 'hardhat' ? 'directRpc' : isConnected ? 'metamask' : 'stored',
      appChainId,
      walletChainId: Number.isFinite(walletChainId) && walletChainId > 0 ? walletChainId : undefined,
      rpcChainId: walletSource === 'hardhat' ? 31337 : undefined,
      metamaskAuthorized: Boolean(isConnected && normalizedMetaMaskAddress),
      activeAccountAddress: activeAccountAddress || undefined,
      signerSource: walletSource === 'metamask' ? 'metamask' : 'hardhat',
      signerAddress,
      signerAvailable: Boolean(signerAddress),
    };
  }, [
    activeAccountAddress,
    appChainId,
    hardhatAccounts,
    isConnected,
    metamaskAddress,
    selectedHardhatSignerAddress,
    walletChainId,
    walletSource,
  ]);

  const openWallet = useCallback(() => {
    setSelectionRequest(undefined);
    setIsOpen(true);
  }, []);

  const closeWallet = useCallback(() => {
    setIsOpen(false);
    setSelectionRequest(undefined);
  }, []);

  const openAccountSelection = useCallback(
    (request: Omit<SpCoinWalletSelectionRequest, 'requestId'> & { requestId?: string }) => {
      const requestedSource = request.requirePrivateKeySigner ? 'hardhat' : request.preferredSource ?? walletSource;
      setWalletSource(requestedSource);
      setSelectionRequest({
        ...request,
        requestId: request.requestId ?? makeRequestId(),
      });
      setIsOpen(true);
    },
    [walletSource],
  );

  const selectAccount = useCallback(
    (account: SpCoinWalletAccount) => {
      console.log('selectAccount called in provider', {
        accountAddress: account.address,
        hasSelectionRequest: !!selectionRequest,
        isOpen: isOpen,
      });

      if (selectionRequest) {
        // Selection mode: return the selected account to the requester and close
        console.log('In selection mode - closing wallet');
        const result: SpCoinWalletSelectionResult = {
          address: account.address,
          source: account.source,
          label: account.label ?? account.name ?? account.symbol,
        };
        selectionRequest?.onSelect?.(result);
        setSelectionRequest(undefined);
        setIsOpen(false);
        return;
      }

      // Normal mode: update wallet source for hardhat accounts
      // Keep the wallet open so user can select another account if needed
      console.log('In normal mode - keeping wallet open');
      if (account.source === 'hardhat') {
        console.log('Updating hardhat wallet source');
        setWalletSource('hardhat');
        setSelectedHardhatSignerAddressState(account.address);
      }
    },
    [selectionRequest, isOpen],
  );

  const setSelectedHardhatSignerAddress = useCallback((address: string) => {
    setSelectedHardhatSignerAddressState(address);
  }, []);

  const value = useMemo<SpCoinWalletContextValue>(
    () => ({
      isOpen,
      openWallet,
      closeWallet,
      openAccountSelection,
      selectAccount,
      session,
      walletSource,
      setWalletSource,
      hardhatAccounts,
      hardhatAccountsLoading,
      hardhatAccountsError,
      refreshHardhatAccounts,
      selectedHardhatSignerAddress: session.signerSource === 'hardhat' ? session.signerAddress : undefined,
      setSelectedHardhatSignerAddress,
      selectionRequest,
    }),
    [
      closeWallet,
      hardhatAccounts,
      hardhatAccountsError,
      hardhatAccountsLoading,
      isOpen,
      openAccountSelection,
      openWallet,
      refreshHardhatAccounts,
      session.signerAddress,
      session.signerSource,
      setSelectedHardhatSignerAddress,
      selectAccount,
      selectionRequest,
      session,
      walletSource,
    ],
  );

  return <SpCoinWalletContext.Provider value={value}>{children}</SpCoinWalletContext.Provider>;
}

export function useSpCoinWallet() {
  const ctx = useContext(SpCoinWalletContext);
  if (!ctx) throw new Error('useSpCoinWallet must be used within SpCoinWalletProvider');
  return ctx;
}
