import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, JsonRpcProvider, Wallet } from 'ethers';
import type { Contract, Signer } from 'ethers';
import {
  defaultMissingImage,
  getAccountLogoURL,
  getTokenLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import spCoinDeploymentMapRaw from '@/resources/data/networks/spCoinDeployment.json';
import { createSpCoinContract } from '../jsonMethods/shared';
import type { ConnectionMode, MethodPanelMode } from '../scriptBuilder/types';
import type { Erc20ReadMethod } from '../jsonMethods/erc20/read';
import type { Erc20WriteMethod } from '../jsonMethods/erc20/write';
import type { SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import type { SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import { useSponsorCoinLabActiveContract } from './useSponsorCoinLabActiveContract';

type HardhatAccountOption = {
  address: string;
  privateKey?: string;
};

type HardhatAccountMetadata = {
  name?: string;
  symbol?: string;
  logoURL: string;
};

type SponsorCoinVersionChoice = {
  id: string;
  version: string;
  chainId: number;
  address: string;
  privateKey?: string;
  signerKey?: string;
  deployer?: string;
  name?: string;
  symbol?: string;
};

type SpCoinDeploymentFile = {
  chainId?: Record<string, Record<string, unknown>>;
};

type TestAccountFileEntry =
  | string
  | {
      address?: unknown;
      privateKey?: unknown;
    };

type ValidationTone = 'neutral' | 'invalid' | 'valid';

type ValidationState = {
  tone: ValidationTone;
  message: string;
};

type Params = {
  exchangeContext: any;
  useLocalSpCoinAccessPackage: boolean;
  mode: ConnectionMode;
  rpcUrl: string;
  excludedDeploymentAddresses?: string[];
  setContractAddress: (value: string) => void;
  contractAddress: string;
  appendLog: (line: string) => void;
  appendWriteTrace: (line: string) => void;
  setStatus: (value: string) => void;
  setInvalidFieldIds: (value: string[]) => void;
  setValidationPopupFields: (value: string[]) => void;
  methodPanelMode: MethodPanelMode;
  selectedWriteMethod: Erc20WriteMethod;
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  selectedReadMethod: Erc20ReadMethod;
  selectedSpCoinReadMethod: SpCoinReadMethod;
};

const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_NETWORK_NAME = 'HardHat';
const MISSING_LOCAL_ACCOUNT_NAME = 'Account Not Found on Local';
const MISSING_LOCAL_ACCOUNT_SYMBOL = 'MISSING';

function buildHardhatAccountMetadata(
  account: Record<string, unknown> | null | undefined,
  fallbackLogoURL: string,
): HardhatAccountMetadata {
  const next: HardhatAccountMetadata = {
    logoURL: fallbackLogoURL,
  };

  const name = String(account?.name || '').trim();
  const symbol = String(account?.symbol || '').trim();
  const logoURL = String(account?.logoURL || '').trim();

  if (name) next.name = name;
  if (symbol) next.symbol = symbol;
  if (logoURL) next.logoURL = logoURL;

  if (!account) {
    next.name = MISSING_LOCAL_ACCOUNT_NAME;
    next.symbol = MISSING_LOCAL_ACCOUNT_SYMBOL;
    next.logoURL = fallbackLogoURL;
  }

  return next;
}

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

function isAddressLike(value: string) {
  return /^0[xX][0-9a-fA-F]{40}$/.test(String(value || '').trim());
}

function createHardhatRpcUnavailableError(contextLabel: string, rpcUrl: string, detail?: string) {
  return new Error(
    `Hardhat RPC request failed during ${contextLabel} at ${String(rpcUrl || '').trim()}${
      detail ? ` (${detail})` : ''
    }. Hardhat mode requires the selected private-key signer and does not allow MetaMask fallback.`,
  );
}

export function useSponsorCoinLabNetwork({
  exchangeContext,
  useLocalSpCoinAccessPackage,
  mode,
  rpcUrl,
  excludedDeploymentAddresses = [],
  setContractAddress,
  contractAddress,
  appendLog,
  appendWriteTrace,
  setStatus,
  setInvalidFieldIds,
  setValidationPopupFields,
  methodPanelMode,
  selectedWriteMethod,
  selectedSpCoinWriteMethod,
  selectedReadMethod,
  selectedSpCoinReadMethod,
}: Params) {
  const trimmedRpcUrl = useMemo(() => String(rpcUrl || '').trim(), [rpcUrl]);
  const hardhatProvider = useMemo(() => {
    if (!trimmedRpcUrl) return null;
    return new JsonRpcProvider(trimmedRpcUrl);
  }, [trimmedRpcUrl]);
  const [hardhatAccounts, setHardhatAccounts] = useState<HardhatAccountOption[]>([]);
  const [selectedHardhatIndex, setSelectedHardhatIndex] = useState(0);
  const [selectedWriteSenderAddress, setSelectedWriteSenderAddress] = useState('');
  const [showWriteSenderPrivateKey, setShowWriteSenderPrivateKey] = useState(false);
  const [showSignerAccountDetails, setShowSignerAccountDetails] = useState(false);
  const [hardhatAccountMetadata, setHardhatAccountMetadata] = useState<
    Record<string, HardhatAccountMetadata>
  >({});
  const [addAccountInput, setAddAccountInput] = useState('');
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [addAccountExistsOnLocal, setAddAccountExistsOnLocal] = useState<boolean | null>(null);
  const [signerAccountStatus, setSignerAccountStatus] = useState('');
  const [activeSigner, setActiveSigner] = useState<Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectedChainId, setConnectedChainId] = useState('');
  const [connectedNetworkName, setConnectedNetworkName] = useState('');
  const [showHardhatConnectionInputs, setShowHardhatConnectionInputs] = useState(false);

  const loadHardhatAccountsFromNetworkFile = useCallback(async () => {
    try {
      const chainIdText = String(HARDHAT_CHAIN_ID_DEC);
      const response = await fetch(`/assets/spCoinLab/networks/${chainIdText}/testAccounts.json`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Unable to load testAccounts.json for chain ${chainIdText}.`);
      }

      const rawEntries = (await response.json()) as TestAccountFileEntry[];
      if (!Array.isArray(rawEntries)) {
        throw new Error('testAccounts.json must be an array.');
      }

      const normalizedEntries = rawEntries
        .map((entry) => {
          if (typeof entry === 'string') {
            const address = String(entry || '').trim();
            return address ? { address } : null;
          }

          const address = String(entry?.address || '').trim();
          const privateKey = String(entry?.privateKey || '').trim();
          if (!address) return null;
          return {
            address,
            ...(privateKey ? { privateKey } : {}),
          } satisfies HardhatAccountOption;
        })
        .filter((entry): entry is HardhatAccountOption => !!entry);

      const metadataRows = await Promise.all(
        normalizedEntries.map(async (entry) => {
          const normalizedKey = normalizeAddress(entry.address);
          const folder = normalizeAddressForAssets(entry.address);
          const accountLogoURL = folder ? getAccountLogoURL(entry.address) : defaultMissingImage;

          if (!folder) {
            return [normalizedKey, buildHardhatAccountMetadata(null, defaultMissingImage)] as const;
          }

          try {
            const accountResponse = await fetch(`/assets/accounts/${folder}/account.json`, {
              cache: 'no-store',
            });
            if (!accountResponse.ok) {
              return [normalizedKey, buildHardhatAccountMetadata(null, defaultMissingImage)] as const;
            }

            const accountData = (await accountResponse.json()) as Record<string, unknown>;
            return [
              normalizedKey,
              buildHardhatAccountMetadata(accountData, accountLogoURL),
            ] as const;
          } catch {
            return [normalizedKey, buildHardhatAccountMetadata(null, defaultMissingImage)] as const;
          }
        }),
      );

      setHardhatAccounts(normalizedEntries);
      setHardhatAccountMetadata(Object.fromEntries(metadataRows));
      setSelectedHardhatIndex((prev) =>
        normalizedEntries.length === 0 ? 0 : Math.min(Math.max(prev, 0), normalizedEntries.length - 1),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat account load error.';
      setHardhatAccounts([]);
      setHardhatAccountMetadata({});
      setSelectedHardhatIndex(0);
      appendLog(`Hardhat test account load failed: ${message}`);
    }
  }, [appendLog]);

  useEffect(() => {
    void loadHardhatAccountsFromNetworkFile();
    return undefined;
  }, [loadHardhatAccountsFromNetworkFile]);

  useEffect(() => {
    const address = String(addAccountInput || '').trim();
    if (!address || !isAddressLike(address)) {
      setAddAccountExistsOnLocal(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`/api/spCoin/accounts/${address}`, {
          cache: 'no-store',
        });
        if (!cancelled) {
          setAddAccountExistsOnLocal(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAddAccountExistsOnLocal(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [addAccountInput]);

  const addAccountNormalizedInput = useMemo(
    () => normalizeAddress(String(addAccountInput || '')),
    [addAccountInput],
  );
  const deleteAccountNormalizedInput = useMemo(
    () => normalizeAddress(String(deleteAccountInput || '')),
    [deleteAccountInput],
  );
  const addAccountAlreadyListed = useMemo(
    () =>
      !!addAccountNormalizedInput &&
      hardhatAccounts.some((entry) => normalizeAddress(entry.address) === addAccountNormalizedInput),
    [addAccountNormalizedInput, hardhatAccounts],
  );
  const deleteAccountExistsInList = useMemo(
    () =>
      !!deleteAccountNormalizedInput &&
      hardhatAccounts.some((entry) => normalizeAddress(entry.address) === deleteAccountNormalizedInput),
    [deleteAccountNormalizedInput, hardhatAccounts],
  );
  const addAccountValidation = useMemo<ValidationState>(() => {
    const address = String(addAccountInput || '').trim();
    if (!address) return { tone: 'neutral', message: '' };
    if (!isAddressLike(address)) return { tone: 'invalid', message: 'Invalid account address.' };
    if (addAccountExistsOnLocal === null) return { tone: 'neutral', message: 'Checking local account record...' };
    if (!addAccountExistsOnLocal) return { tone: 'invalid', message: 'Account not found' };
    if (addAccountAlreadyListed) return { tone: 'invalid', message: 'Duplicate Account' };
    return { tone: 'valid', message: 'Selectable' };
  }, [addAccountAlreadyListed, addAccountExistsOnLocal, addAccountInput]);
  const deleteAccountValidation = useMemo<ValidationState>(() => {
    const address = String(deleteAccountInput || '').trim();
    if (!address) return { tone: 'neutral', message: '' };
    if (!isAddressLike(address)) return { tone: 'invalid', message: 'Invalid account address.' };
    if (!deleteAccountExistsInList) return { tone: 'invalid', message: 'Account not found in testAccounts.json' };
    return { tone: 'valid', message: 'Selectable' };
  }, [deleteAccountExistsInList, deleteAccountInput]);
  const accountActionLabelClassName = useCallback((tone: ValidationTone) => {
    if (tone === 'valid') return 'text-green-400 hover:text-green-300';
    if (tone === 'invalid') return 'text-red-400 hover:text-red-300';
    return 'text-[#8FA8FF] hover:text-white';
  }, []);

  const addSignerAccount = useCallback(async () => {
    if (addAccountValidation.tone !== 'valid') {
      setSignerAccountStatus(addAccountValidation.message);
      return;
    }

    const address = String(addAccountInput || '').trim();
    try {
      const response = await fetch(`/api/spCoin/lab/networks/${HARDHAT_CHAIN_ID_DEC}/testAccounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setSignerAccountStatus(String(payload.error || payload.details || 'Failed to add account.'));
        return;
      }

      setSignerAccountStatus(String(payload.status || 'Account added.'));
      setAddAccountInput('');
      setAddAccountExistsOnLocal(null);
      await loadHardhatAccountsFromNetworkFile();
    } catch (error) {
      setSignerAccountStatus(error instanceof Error ? error.message : 'Failed to add account.');
    }
  }, [addAccountInput, addAccountValidation, loadHardhatAccountsFromNetworkFile]);

  const deleteSignerAccount = useCallback(async () => {
    if (deleteAccountValidation.tone !== 'valid') {
      setSignerAccountStatus(deleteAccountValidation.message);
      return;
    }

    const address = String(deleteAccountInput || '').trim();
    try {
      const response = await fetch(`/api/spCoin/lab/networks/${HARDHAT_CHAIN_ID_DEC}/testAccounts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setSignerAccountStatus(String(payload.error || payload.details || 'Failed to delete account.'));
        return;
      }

      setSignerAccountStatus(String(payload.status || 'Account deleted.'));
      setDeleteAccountInput('');
      await loadHardhatAccountsFromNetworkFile();
    } catch (error) {
      setSignerAccountStatus(error instanceof Error ? error.message : 'Failed to delete account.');
    }
  }, [deleteAccountInput, deleteAccountValidation, loadHardhatAccountsFromNetworkFile]);

  const selectedHardhatAccount = useMemo(
    () => hardhatAccounts[selectedHardhatIndex],
    [hardhatAccounts, selectedHardhatIndex],
  );
  const contextAddress = useMemo(() => {
    const active = exchangeContext?.accounts?.activeAccount as { address?: string } | undefined;
    return String(active?.address || '').trim();
  }, [exchangeContext?.accounts?.activeAccount]);
  const contextChainId = useMemo(() => {
    const raw = Number(exchangeContext?.network?.chainId);
    return Number.isFinite(raw) && raw > 0 ? String(raw) : '';
  }, [exchangeContext?.network?.chainId]);
  const contextNetworkName = useMemo(
    () => String(exchangeContext?.network?.name || '').trim(),
    [exchangeContext?.network?.name],
  );
  const effectiveConnectedAddress = useMemo(() => {
    if (mode === 'hardhat') return connectedAddress;
    return connectedAddress || contextAddress;
  }, [connectedAddress, contextAddress, mode]);
  const effectiveConnectedChainId = useMemo(() => {
    if (mode === 'hardhat') return connectedChainId || '31337';
    return connectedChainId || contextChainId;
  }, [connectedChainId, contextChainId, mode]);
  const activeNetworkName = useMemo(() => {
    if (mode === 'hardhat') return HARDHAT_NETWORK_NAME;
    if (connectedNetworkName) return connectedNetworkName;
    const chainIdNum = Number(effectiveConnectedChainId);
    if (Number.isFinite(chainIdNum) && chainIdNum > 0) {
      const known = getBlockChainName(chainIdNum);
      if (known) return known;
    }
    if (contextNetworkName) return contextNetworkName;
    return '(unknown)';
  }, [connectedNetworkName, contextNetworkName, effectiveConnectedChainId, mode]);
  const shouldPromptHardhatBaseConnect =
    mode === 'metamask' && String(effectiveConnectedChainId || '') !== String(HARDHAT_CHAIN_ID_DEC);
  const chainIdDisplayValue = effectiveConnectedChainId || '(unknown)';
  const chainIdDisplayWidthCh = Math.max(4, String(chainIdDisplayValue).length + 3);

  const spCoinDeploymentMap = useMemo(
    () => (spCoinDeploymentMapRaw as SpCoinDeploymentFile) ?? {},
    [],
  );
  const sponsorCoinVersionChoices = useMemo(() => {
    const excludedAddressSet = new Set(
      excludedDeploymentAddresses.map((entry) => normalizeAddress(String(entry || ''))).filter(Boolean),
    );
    const rows: SponsorCoinVersionChoice[] = [];

    const pushVersionNode = (
      chainIdNum: number,
      version: string,
      byAddress: unknown,
      wrapperPrivateKey?: string,
    ) => {
      if (!byAddress || typeof byAddress !== 'object') return;
      const firstAddress = Object.keys(byAddress as Record<string, unknown>).find((addr) =>
        /^0[xX][0-9a-fA-F]{40}$/.test(addr),
      );
      if (!firstAddress) return;
      const firstEntry = (byAddress as Record<string, any>)[firstAddress] ?? {};
      const firstEntryPrivateKey = String(firstEntry?.privateKey || '').trim();
      const firstEntrySignerKey = String(firstEntry?.signerKey || '').trim();
      const privateKey =
        firstEntryPrivateKey ||
        wrapperPrivateKey ||
        (/^0x[0-9a-fA-F]{64}$/.test(firstEntrySignerKey) ? firstEntrySignerKey : '') ||
        undefined;

      rows.push({
        id: [String(chainIdNum), String(version || '').trim(), firstEntrySignerKey || wrapperPrivateKey || '', firstAddress]
          .map((part) => String(part || '').trim().toLowerCase())
          .join('::'),
        version,
        chainId: chainIdNum,
        address: `0x${firstAddress.slice(2).toLowerCase()}`,
        privateKey,
        signerKey: firstEntrySignerKey || undefined,
        deployer: String(firstEntry?.deployer || '').trim() || undefined,
        name: String(firstEntry?.name || '').trim() || undefined,
        symbol: String(firstEntry?.symbol || '').trim() || undefined,
      });
    };

    for (const [chainKey, chainNode] of Object.entries(spCoinDeploymentMap.chainId ?? {})) {
      const chainIdNum = Number(chainKey);
      if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) continue;
      if (!chainNode || typeof chainNode !== 'object') continue;

      for (const [nodeKey, nodeValue] of Object.entries(chainNode as Record<string, unknown>)) {
        const trimmedKey = String(nodeKey || '').trim();
        if (!nodeValue || typeof nodeValue !== 'object') continue;

        if (/^0x[a-fA-F0-9]{64}$/.test(trimmedKey)) {
          for (const [version, byAddress] of Object.entries(nodeValue as Record<string, unknown>)) {
            pushVersionNode(chainIdNum, version, byAddress, trimmedKey);
          }
          continue;
        }

        pushVersionNode(chainIdNum, trimmedKey, nodeValue);
      }
    }

    return rows.filter((entry) => !excludedAddressSet.has(normalizeAddress(entry.address)));
  }, [excludedDeploymentAddresses, spCoinDeploymentMap]);
  const {
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    selectedSponsorCoinVersionEntry,
    adjustSponsorCoinVersion,
    canIncrementSponsorCoinVersion,
    canDecrementSponsorCoinVersion,
    requireContractAddress,
    selectedVersionSignerKey,
    selectedVersionSymbol,
    selectedVersionSymbolWidthCh,
  } = useSponsorCoinLabActiveContract({
    contractAddress,
    setContractAddress,
    sponsorCoinVersionChoices,
  });
  const displayedVersionHardhatAccountIndex = useMemo(() => {
    if (mode !== 'hardhat') return -1;
    if (hardhatAccounts.length === 0) return -1;
    const selectedEntry = selectedSponsorCoinVersionEntry ?? sponsorCoinVersionChoices[0];
    if (!selectedEntry) return 0;
    const signerPrivateKey = String(selectedEntry.privateKey || '').trim().toLowerCase();
    if (!signerPrivateKey) return 0;
    const idx = hardhatAccounts.findIndex(
      (entry) => String(entry.privateKey || '').trim().toLowerCase() === signerPrivateKey,
    );
    return idx >= 0 ? idx : 0;
  }, [hardhatAccounts, mode, selectedSponsorCoinVersionEntry, sponsorCoinVersionChoices]);
  const selectedSignerAccountMetadata = useMemo(() => {
    const address = String(selectedHardhatAccount?.address || '').trim().toLowerCase();
    return hardhatAccountMetadata[address];
  }, [hardhatAccountMetadata, selectedHardhatAccount?.address]);
  const displayedSignerAccountAddress = useMemo(
    () => (mode === 'hardhat' ? selectedHardhatAccount?.address || '' : effectiveConnectedAddress || ''),
    [effectiveConnectedAddress, mode, selectedHardhatAccount?.address],
  );
  const displayedSignerAccountMetadata = useMemo(() => {
    const key = normalizeAddress(displayedSignerAccountAddress);
    return hardhatAccountMetadata[key] ?? selectedSignerAccountMetadata;
  }, [displayedSignerAccountAddress, hardhatAccountMetadata, selectedSignerAccountMetadata]);
  const selectedSponsorCoinLogoURL = useMemo(() => {
    const address = String(selectedSponsorCoinVersionEntry?.address || '').trim();
    if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) return '';
    const chainId = Number(selectedSponsorCoinVersionEntry?.chainId || HARDHAT_CHAIN_ID_DEC);
    return getTokenLogoURL({ chainId: Number.isFinite(chainId) && chainId > 0 ? chainId : HARDHAT_CHAIN_ID_DEC, address });
  }, [selectedSponsorCoinVersionEntry]);
  const selectedWriteSenderAccount = useMemo(() => {
    const key = normalizeAddress(selectedWriteSenderAddress);
    if (!key) return undefined;
    return hardhatAccounts.find((entry) => normalizeAddress(entry.address) === key);
  }, [hardhatAccounts, selectedWriteSenderAddress]);
  const writeSenderDisplayValue =
    mode === 'hardhat'
      ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || ''
      : effectiveConnectedAddress || '';
  const writeSenderPrivateKeyDisplay =
    mode === 'hardhat' ? String(selectedWriteSenderAccount?.privateKey || '').trim() : '';

  useEffect(() => {
    setShowWriteSenderPrivateKey(false);
    setInvalidFieldIds([]);
    setValidationPopupFields([]);
  }, [
    methodPanelMode,
    selectedWriteMethod,
    selectedSpCoinWriteMethod,
    selectedReadMethod,
    selectedSpCoinReadMethod,
    setInvalidFieldIds,
    setValidationPopupFields,
  ]);

  useEffect(() => {
    if (mode !== 'hardhat' || displayedVersionHardhatAccountIndex < 0) return;
    if (selectedHardhatIndex !== displayedVersionHardhatAccountIndex) {
      setSelectedHardhatIndex(displayedVersionHardhatAccountIndex);
    }
    const account = hardhatAccounts[displayedVersionHardhatAccountIndex];
    if (account && normalizeAddress(connectedAddress) !== normalizeAddress(account.address)) {
      setConnectedAddress(account.address);
    }
  }, [
    connectedAddress,
    displayedVersionHardhatAccountIndex,
    hardhatAccounts,
    mode,
    selectedHardhatIndex,
  ]);

  useEffect(() => {
    if (mode !== 'hardhat') {
      if (selectedWriteSenderAddress !== effectiveConnectedAddress) {
        setSelectedWriteSenderAddress(effectiveConnectedAddress);
      }
      return;
    }
    if (hardhatAccounts.length === 0) {
      if (selectedWriteSenderAddress) setSelectedWriteSenderAddress('');
      return;
    }
    const existing = hardhatAccounts.find(
      (entry) => normalizeAddress(entry.address) === normalizeAddress(selectedWriteSenderAddress),
    );
    if (existing) return;
    const fallback = selectedHardhatAccount?.address || hardhatAccounts[0]?.address || '';
    if (fallback && normalizeAddress(fallback) !== normalizeAddress(selectedWriteSenderAddress)) {
      setSelectedWriteSenderAddress(fallback);
    }
  }, [
    effectiveConnectedAddress,
    hardhatAccounts,
    mode,
    selectedHardhatAccount?.address,
    selectedWriteSenderAddress,
  ]);

  const syncMetaMaskState = useCallback(async () => {
    if (mode !== 'metamask' || typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const provider = new BrowserProvider(ethereum);
    const accounts = (await provider.send('eth_accounts', [])) as string[];
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
    const fallbackName = String((network as any)?.name || '').trim();

    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(knownName || fallbackName || '(unknown)');

    const selectedAddressRaw = String((ethereum as any)?.selectedAddress || '').trim();
    const selectedAddress =
      /^0[xX][0-9a-fA-F]{40}$/.test(selectedAddressRaw) ? selectedAddressRaw : '';
    const nextAccount = accounts.length > 0 ? accounts[0] : selectedAddress || contextAddress;

    if (nextAccount) {
      setConnectedAddress(nextAccount);
      try {
        const signer = await provider.getSigner();
        setActiveSigner(signer);
      } catch {
        setActiveSigner(null);
      }
      return;
    }

    setConnectedAddress('');
    setActiveSigner(null);
  }, [contextAddress, mode]);

  useEffect(() => {
    if (mode !== 'metamask') return;
    setConnectedAddress('');
    setActiveSigner(null);
  }, [mode]);

  useEffect(() => {
    setActiveSigner(null);
    setConnectedAddress('');
  }, [useLocalSpCoinAccessPackage]);

  const syncHardhatState = useCallback(async () => {
    if (mode !== 'hardhat' || !hardhatProvider) return;

    try {
      const network = await hardhatProvider.getNetwork();
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat sync error.';
      appendLog(`Hardhat state sync failed: ${message}`);
    }
  }, [appendLog, hardhatProvider, mode]);

  const reconcileHardhatSelection = useCallback(
    (accounts: HardhatAccountOption[], publicAccountHint?: string, preferredIndex?: number) => {
      if (!Array.isArray(accounts) || accounts.length === 0) return;
      const hint = normalizeAddress(publicAccountHint || connectedAddress || '');
      const matchIdx = hint
        ? accounts.findIndex((entry) => normalizeAddress(entry.address) === hint)
        : -1;
      const preferred =
        Number.isInteger(preferredIndex) &&
        Number(preferredIndex) >= 0 &&
        Number(preferredIndex) < accounts.length
          ? Number(preferredIndex)
          : Number.isInteger(selectedHardhatIndex) &&
              selectedHardhatIndex >= 0 &&
              selectedHardhatIndex < accounts.length
            ? selectedHardhatIndex
            : -1;
      const nextIdx = preferred >= 0 ? preferred : matchIdx >= 0 ? matchIdx : 0;
      const nextAccount = accounts[nextIdx];
      if (!nextAccount) return;
      if (selectedHardhatIndex !== nextIdx) setSelectedHardhatIndex(nextIdx);
      if (normalizeAddress(connectedAddress) !== normalizeAddress(nextAccount.address)) {
        setConnectedAddress(nextAccount.address);
      }
    },
    [connectedAddress, selectedHardhatIndex],
  );

  useEffect(() => {
    if (mode !== 'metamask' || typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    void syncMetaMaskState();

    const onChainChanged = (chainHex: string) => {
      const parsed = Number.parseInt(String(chainHex || '').trim(), 16);
      if (Number.isFinite(parsed) && parsed > 0) {
        setConnectedChainId(String(parsed));
        const known = getBlockChainName(parsed);
        if (known) setConnectedNetworkName(known);
      }
      void syncMetaMaskState();
    };

    const onAccountsChanged = (accounts: string[]) => {
      const next = Array.isArray(accounts) && accounts.length > 0 ? String(accounts[0]) : '';
      setConnectedAddress(next);
      void syncMetaMaskState();
    };

    if (typeof ethereum.on === 'function') {
      ethereum.on('chainChanged', onChainChanged);
      ethereum.on('accountsChanged', onAccountsChanged);
    }

    const onWindowFocus = () => {
      void syncMetaMaskState();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncMetaMaskState();
      }
    };
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const pollId = window.setInterval(() => {
      void syncMetaMaskState();
    }, 1500);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('chainChanged', onChainChanged);
        ethereum.removeListener('accountsChanged', onAccountsChanged);
      }
    };
  }, [mode, syncMetaMaskState]);

  useEffect(() => {
    if (mode !== 'hardhat') return;
    void syncHardhatState();
  }, [mode, selectedHardhatIndex, syncHardhatState]);

  useEffect(() => {
    if (mode !== 'hardhat' || hardhatAccounts.length === 0) return;
    reconcileHardhatSelection(hardhatAccounts, connectedAddress, selectedHardhatIndex);
  }, [connectedAddress, hardhatAccounts, mode, reconcileHardhatSelection, selectedHardhatIndex]);

  const executeConnected = useCallback(
    async <T,>(
      contextLabel: string,
      handlers: {
        metamask: () => Promise<T>;
        hardhat: () => Promise<T>;
      },
    ): Promise<T> => {
      appendWriteTrace(`executeConnected context=${contextLabel}; mode=${mode}`);
      switch (mode) {
        case 'metamask':
          return handlers.metamask();
        case 'hardhat':
          return handlers.hardhat();
        default:
          throw new Error(`Unsupported connector mode: ${String(mode)}`);
      }
    },
    [appendWriteTrace, mode],
  );

  const connectMetaMaskSigner = useCallback(async (): Promise<Signer> => {
    appendWriteTrace('connectMetaMaskSigner invoked');
    if (!window.ethereum) {
      throw new Error('MetaMask provider not found.');
    }
    const provider = new BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);

    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
    } catch (switchError: any) {
      const code = Number(switchError?.code ?? switchError?.error?.code ?? 0);
      if (code !== 4902) throw switchError;
      await provider.send('wallet_addEthereumChain', [
        {
          chainId: HARDHAT_CHAIN_ID_HEX,
          chainName: HARDHAT_NETWORK_NAME,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: [rpcUrl.trim()],
        },
      ]);
      await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
    const fallbackName = String((network as any)?.name || '').trim();

    setActiveSigner(signer);
    setConnectedAddress(address);
    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(knownName || fallbackName || '(unknown)');
    setStatus(`Connected via MetaMask: ${address}`);
    appendLog(`Connected MetaMask signer ${address} on chain ${String(network.chainId)}.`);
    appendWriteTrace(`connectMetaMaskSigner returning signer ${address}`);
    return signer;
  }, [appendLog, appendWriteTrace, rpcUrl, setStatus]);

  const connectHardhatSigner = useCallback(async (): Promise<Signer> => {
    appendWriteTrace('connectHardhatSigner invoked');
    if (!selectedHardhatAccount?.address || !selectedHardhatAccount.privateKey) {
      throw new Error('Select a Hardhat account with a private key.');
    }

    try {
      if (!hardhatProvider) {
        throw new Error('Hardhat RPC URL is empty.');
      }
      const signer = new Wallet(selectedHardhatAccount.privateKey, hardhatProvider);
      const network = await hardhatProvider.getNetwork();
      const address = await signer.getAddress();

      setActiveSigner(signer);
      setConnectedAddress(address);
      setConnectedChainId(String(network.chainId));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      setStatus(`Connected via Hardhat signer: ${address}`);
      appendLog(`Connected Hardhat signer ${address} on chain ${String(network.chainId)}.`);
      appendWriteTrace(`connectHardhatSigner returning signer ${address}`);
      return signer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLog(`Hardhat signer connection failed via ${trimmedRpcUrl}: ${message}`);
      throw createHardhatRpcUnavailableError('connectSigner', rpcUrl);
    }
  }, [appendLog, appendWriteTrace, hardhatProvider, rpcUrl, selectedHardhatAccount, setStatus, trimmedRpcUrl]);

  const connectSigner = useCallback(async (): Promise<Signer> => {
    appendWriteTrace(`connectSigner invoked; mode=${mode}`);
    return executeConnected('connectSigner', {
      metamask: connectMetaMaskSigner,
      hardhat: connectHardhatSigner,
    });
  }, [appendWriteTrace, connectHardhatSigner, connectMetaMaskSigner, executeConnected, mode]);

  const ensureMetaMaskReadRunner = useCallback(async () => {
    appendWriteTrace('ensureMetaMaskReadRunner using BrowserProvider');
    if (!window.ethereum) {
      throw new Error('MetaMask provider not found.');
    }
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
    const fallbackName = String((network as any)?.name || '').trim();
    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(knownName || fallbackName || '(unknown)');
    return provider;
  }, [appendWriteTrace]);

  const ensureHardhatReadRunner = useCallback(async () => {
    appendWriteTrace('ensureHardhatReadRunner using JsonRpcProvider');
    const attemptReadRunner = async () => {
      if (!hardhatProvider) {
        throw new Error('Hardhat RPC URL is empty.');
      }
      const network = await hardhatProvider.getNetwork();
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      return hardhatProvider;
    };
    try {
      return await attemptReadRunner();
    } catch (error) {
      const firstMessage = error instanceof Error ? error.message : String(error);
      appendLog(`Hardhat read runner failed via ${trimmedRpcUrl}: ${firstMessage}`);
      appendWriteTrace(`ensureHardhatReadRunner retrying after failure=${firstMessage}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        return await attemptReadRunner();
      } catch (retryError) {
        const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
        appendLog(`Hardhat read runner retry failed via ${trimmedRpcUrl}: ${retryMessage}`);
        throw createHardhatRpcUnavailableError('read runner', rpcUrl, retryMessage);
      }
    }
  }, [appendLog, appendWriteTrace, hardhatProvider, rpcUrl, trimmedRpcUrl]);

  const ensureReadRunner = useCallback(async (): Promise<any> => {
    return executeConnected<any>('ensureReadRunner', {
      metamask: ensureMetaMaskReadRunner,
      hardhat: ensureHardhatReadRunner,
    });
  }, [ensureHardhatReadRunner, ensureMetaMaskReadRunner, executeConnected]);

  const isConnectionRetryableError = useCallback((error: unknown): boolean => {
    const message = String((error as any)?.message || '').toLowerCase();
    if (!message) return true;
    return (
      message.includes('missing signer') ||
      message.includes('missing provider') ||
      message.includes('connect') ||
      message.includes('not connected') ||
      message.includes('network') ||
      message.includes('account') ||
      message.includes('unauthorized') ||
      message.includes('unknown account')
    );
  }, []);

  const resolveHardhatAccount = useCallback(
    (accountKey?: string) => {
      const key = normalizeAddress(accountKey || '');
      if (!key) return selectedHardhatAccount;
      return hardhatAccounts.find((entry) => normalizeAddress(entry.address) === key) ?? selectedHardhatAccount;
    },
    [hardhatAccounts, selectedHardhatAccount],
  );

  const executeHardhatConnected = useCallback(
    async (
      label: string,
      accountKey: string | undefined,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
    ) => {
      const target = requireContractAddress();
      const account = resolveHardhatAccount(accountKey);
      if (!account?.address || !account.privateKey) {
        throw new Error('Select a Hardhat account with a private key.');
      }

      appendWriteTrace(`executeHardhatConnected start; label=${label}; desired=${account.address}`);
      let stage = 'connect provider';
      try {
        if (!hardhatProvider) {
          throw new Error('Hardhat RPC URL is empty.');
        }
        stage = 'load network';
        const network = await hardhatProvider.getNetwork();
        stage = 'create signer';
        const signer = new Wallet(account.privateKey, hardhatProvider);
        stage = 'resolve signer address';
        const signerAddress = await signer.getAddress();
        if (normalizeAddress(signerAddress) !== normalizeAddress(account.address)) {
          throw new Error(
            `Contract call reverted during ${label}. Selected signer ${account.address} does not match connected signer ${signerAddress}.`,
          );
        }
        appendWriteTrace(`executeHardhatConnected using signer=${signerAddress}`);
        setActiveSigner(signer);
        setConnectedAddress(signerAddress);
        setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
        setConnectedNetworkName(HARDHAT_NETWORK_NAME);
        stage = 'create contract';
        const contract = createSpCoinContract(target, signer);
        stage = `run ${label}`;
        return writeCall(contract, signer);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendLog(`Hardhat write transport failed via ${trimmedRpcUrl} during ${stage}: ${message}`);
        if (message.includes('Selected signer') && message.includes('does not match connected signer')) {
          throw error;
        }
        throw createHardhatRpcUnavailableError(label, rpcUrl, `${stage}: ${message}`);
      }
    },
    [appendLog, appendWriteTrace, hardhatProvider, requireContractAddress, resolveHardhatAccount, rpcUrl, trimmedRpcUrl],
  );

  const executeMetaMaskConnected = useCallback(
    async (label: string, writeCall: (contract: Contract, signer: Signer) => Promise<any>) => {
      appendWriteTrace(`executeMetaMaskConnected invoked; label=${label}`);
      const target = requireContractAddress();
      const runWithSigner = async (signer: Signer) => {
        const signerAddress = await signer.getAddress();
        appendWriteTrace(`executeMetaMaskConnected using signer=${signerAddress}`);
        const contract = createSpCoinContract(target, signer);
        return writeCall(contract, signer);
      };

      try {
        if (!activeSigner) throw new Error('Missing signer.');
        return await runWithSigner(activeSigner);
      } catch (error) {
        if (!isConnectionRetryableError(error)) throw error;
        appendLog('MetaMask reconnect requested; retrying write.');
        appendWriteTrace(
          `executeMetaMaskConnected reconnect branch; reason=${String((error as any)?.message || error)}`,
        );
        const signer = await connectSigner();
        return runWithSigner(signer);
      }
    },
    [activeSigner, appendLog, appendWriteTrace, connectSigner, isConnectionRetryableError, requireContractAddress],
  );

  const executeWriteConnected = useCallback(
    async (
      label: string,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
      accountKey?: string,
    ) => {
      return executeConnected(`executeWriteConnected:${label}`, {
        hardhat: () => executeHardhatConnected(label, accountKey, writeCall),
        metamask: async () => {
          appendLog(`${label}: using MetaMask signer flow.`);
          return executeMetaMaskConnected(label, writeCall);
        },
      });
    },
    [appendLog, executeConnected, executeHardhatConnected, executeMetaMaskConnected],
  );

  const connectHardhatBaseFromNetworkLabel = useCallback(async () => {
    appendWriteTrace(`connectHardhatBaseFromNetworkLabel invoked; shouldPrompt=${shouldPromptHardhatBaseConnect}`);
    if (!shouldPromptHardhatBaseConnect) return;
    if (!window.ethereum) {
      setStatus('MetaMask provider not found.');
      appendLog('MetaMask provider not found.');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      } catch (switchError: any) {
        const code = Number(switchError?.code ?? switchError?.error?.code ?? 0);
        if (code !== 4902) throw switchError;
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: HARDHAT_CHAIN_ID_HEX,
            chainName: HARDHAT_NETWORK_NAME,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [rpcUrl.trim()],
          },
        ]);
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      }
      await syncMetaMaskState();
      setStatus(`Switched MetaMask to ${HARDHAT_NETWORK_NAME}.`);
      appendLog(`Switched MetaMask to ${HARDHAT_NETWORK_NAME} from Connected Network label.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MetaMask switch error.';
      setStatus(`Switch failed: ${message}`);
      appendLog(`Switch to ${HARDHAT_NETWORK_NAME} failed: ${message}`);
    }
  }, [appendLog, appendWriteTrace, rpcUrl, setStatus, shouldPromptHardhatBaseConnect, syncMetaMaskState]);

  return {
    HARDHAT_CHAIN_ID_DEC,
    HARDHAT_NETWORK_NAME,
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    hardhatAccounts,
    selectedHardhatIndex,
    setSelectedHardhatIndex,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    showWriteSenderPrivateKey,
    setShowWriteSenderPrivateKey,
    showSignerAccountDetails,
    setShowSignerAccountDetails,
    hardhatAccountMetadata,
    addAccountInput,
    setAddAccountInput,
    deleteAccountInput,
    setDeleteAccountInput,
    signerAccountStatus,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    showHardhatConnectionInputs,
    setShowHardhatConnectionInputs,
    selectedHardhatAccount,
    effectiveConnectedAddress,
    effectiveConnectedChainId,
    activeNetworkName,
    shouldPromptHardhatBaseConnect,
    chainIdDisplayValue,
    chainIdDisplayWidthCh,
    sponsorCoinVersionChoices,
    selectedSponsorCoinVersionEntry,
    displayedVersionHardhatAccountIndex,
    selectedVersionSignerKey,
    displayedSignerAccountAddress,
    displayedSignerAccountMetadata,
    selectedVersionSymbol,
    selectedSponsorCoinLogoURL,
    selectedVersionSymbolWidthCh,
    selectedWriteSenderAccount,
    writeSenderDisplayValue,
    writeSenderPrivateKeyDisplay,
    addAccountValidation,
    deleteAccountValidation,
    accountActionLabelClassName,
    addSignerAccount,
    deleteSignerAccount,
    adjustSponsorCoinVersion,
    canIncrementSponsorCoinVersion,
    canDecrementSponsorCoinVersion,
    connectHardhatBaseFromNetworkLabel,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
  };
}
