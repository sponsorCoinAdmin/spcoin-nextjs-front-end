// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { BrowserProvider, JsonRpcProvider, Wallet } from 'ethers';
import type { Contract } from 'ethers';
import type { Signer } from 'ethers';
import { useExchangeContext } from '@/lib/context/hooks';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import type { ParamDef } from './methods/shared/types';
import {
  ERC20_READ_OPTIONS,
  getErc20ReadLabels,
  runErc20ReadMethod,
  type Erc20ReadMethod,
} from './methods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  getErc20WriteLabels,
  runErc20WriteMethod,
  type Erc20WriteMethod,
} from './methods/erc20/write';
import {
  SPCOIN_READ_METHOD_DEFS,
  getSpCoinReadOptions,
  runSpCoinReadMethod,
  type SpCoinReadMethod,
} from './methods/spcoin/read';
import {
  SPCOIN_WRITE_METHOD_DEFS,
  getSpCoinWriteOptions,
  runSpCoinWriteMethod,
  type SpCoinWriteMethod,
} from './methods/spcoin/write';
import {
  CALENDAR_WEEK_DAYS,
  formatDateInput,
  formatDateTimeDisplay,
  parseDateInput,
  useBackdateCalendar,
} from './hooks/useBackdateCalendar';
import { createSpCoinContract, createSpCoinLibraryAccess } from './methods/shared';
import Erc20ReadController from './components/Erc20ReadController';
import Erc20WriteController from './components/Erc20WriteController';
import SpCoinReadController from './components/SpCoinReadController';
import SpCoinWriteController from './components/SpCoinWriteController';
import spCoinDeploymentMapRaw from '@/resources/data/networks/spCoinDeployment.json';
import cog_png from '@/public/assets/miscellaneous/cog.png';

type ConnectionMode = 'metamask' | 'hardhat';
type MethodPanelMode = 'ecr20_read' | 'erc20_write' | 'spcoin_rread' | 'spcoin_write';

type HardhatAccountOption = {
  address: string;
  privateKey: string;
};

type SponsorCoinVersionChoice = {
  id: string;
  version: string;
  address: string;
  privateKey?: string;
  signerKey?: string;
  name?: string;
  symbol?: string;
};

type SpCoinDeploymentFile = {
  chainId?: Record<string, Record<string, unknown>>;
};

const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';
const HARDHAT_KEYS_STORAGE_KEY = 'spcoin_lab_hardhat_keys_v1';
const spCoinLabKey = 'spCoinLabKey';
const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_NETWORK_NAME = 'SponsorCoin HH BASE';

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.45rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

function parseListParam(raw: string): string[] {
  return String(raw || '')
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function SponsorCoinLabPage() {
  const { exchangeContext } = useExchangeContext();
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [mnemonic, setMnemonic] = useState(HARDHAT_DEFAULT_MNEMONIC);
  const [contractAddress, setContractAddress] = useState('');
  const [selectedSponsorCoinVersion, setSelectedSponsorCoinVersion] = useState('');
  const [persistKeys] = useState(true);
  const [hardhatAccounts, setHardhatAccounts] = useState<HardhatAccountOption[]>([]);
  const [selectedHardhatIndex, setSelectedHardhatIndex] = useState(0);
  const [activeSigner, setActiveSigner] = useState<Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectedChainId, setConnectedChainId] = useState('');
  const [connectedNetworkName, setConnectedNetworkName] = useState('');
  const [showHardhatConnectionInputs, setShowHardhatConnectionInputs] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin Lab] Ready']);

  const [selectedWriteMethod, setSelectedWriteMethod] = useState<Erc20WriteMethod>('transfer');
  const [writeAddressA, setWriteAddressA] = useState('');
  const [writeAddressB, setWriteAddressB] = useState('');
  const [writeAmountRaw, setWriteAmountRaw] = useState('');
  const [methodPanelMode, setMethodPanelMode] = useState<MethodPanelMode>('ecr20_read');
  const [selectedReadMethod, setSelectedReadMethod] = useState<Erc20ReadMethod>('name');
  const [readAddressA, setReadAddressA] = useState('');
  const [readAddressB, setReadAddressB] = useState('');
  const [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod] =
    useState<SpCoinReadMethod>('getSerializedSPCoinHeader');
  const [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod] =
    useState<SpCoinWriteMethod>('addRecipient');
  const [hideUnexecutables, setHideUnexecutables] = useState(false);
  const [spReadParams, setSpReadParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spWriteParams, setSpWriteParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spCoinLabHydrated, setSpCoinLabHydrated] = useState(false);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(HARDHAT_KEYS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HardhatAccountOption[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setHardhatAccounts(parsed);
        setSelectedHardhatIndex(0);
      }
    } catch {
      // Ignore bad local cache.
    }
  }, []);

  useEffect(() => {
    if (!persistKeys) return;
    if (typeof window === 'undefined') return;
    if (hardhatAccounts.length === 0) return;
    window.localStorage.setItem(HARDHAT_KEYS_STORAGE_KEY, JSON.stringify(hardhatAccounts));
  }, [hardhatAccounts, persistKeys]);

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
  const contextNetworkName = useMemo(() => {
    return String((exchangeContext as any)?.network?.name || '').trim();
  }, [exchangeContext]);
  const effectiveConnectedAddress = connectedAddress || contextAddress;
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
    const chainIdNum = Number(effectiveConnectedChainId);
    if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) {
      return [] as SponsorCoinVersionChoice[];
    }

    const chainNode = spCoinDeploymentMap.chainId?.[String(chainIdNum)] ?? {};
    const rows: SponsorCoinVersionChoice[] = [];

    const pushVersionNode = (
      version: string,
      byAddress: unknown,
      wrapperPrivateKey?: string,
    ) => {
      if (!byAddress || typeof byAddress !== 'object') return;
      const firstAddress = Object.keys(byAddress as Record<string, unknown>).find((addr) =>
        /^0[xX][0-9a-fA-F]{40}$/.test(addr),
      );
      if (!firstAddress) return;
      const firstEntry = (byAddress as any)?.[firstAddress] ?? {};
      const firstEntryPrivateKey = String((firstEntry as any)?.privateKey || '').trim();
      const firstEntrySignerKey = String((firstEntry as any)?.signerKey || '').trim();
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
        address: `0x${firstAddress.slice(2).toLowerCase()}`,
        privateKey,
        signerKey: firstEntrySignerKey || undefined,
        name: String(firstEntry?.name || '').trim() || undefined,
        symbol: String(firstEntry?.symbol || '').trim() || undefined,
      });
    };

    for (const [nodeKey, nodeValue] of Object.entries(chainNode)) {
      const trimmedKey = String(nodeKey || '').trim();
      if (!nodeValue || typeof nodeValue !== 'object') continue;

      if (/^0x[a-fA-F0-9]{64}$/.test(trimmedKey)) {
        const wrapperPrivateKey = trimmedKey;
        for (const [version, byAddress] of Object.entries(nodeValue as Record<string, unknown>)) {
          pushVersionNode(version, byAddress, wrapperPrivateKey);
        }
        continue;
      }

      pushVersionNode(trimmedKey, nodeValue);
    }

    return rows;
  }, [effectiveConnectedChainId, spCoinDeploymentMap]);

  const selectedSponsorCoinVersionEntry = useMemo(
    () =>
      sponsorCoinVersionChoices.find((entry) => entry.id === selectedSponsorCoinVersion) ??
      sponsorCoinVersionChoices[0],
    [selectedSponsorCoinVersion, sponsorCoinVersionChoices],
  );

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

  const selectedVersionSignerKey = useMemo(() => {
    return String(selectedSponsorCoinVersionEntry?.privateKey || '').trim();
  }, [selectedSponsorCoinVersionEntry]);
  const selectedVersionSymbol = String(selectedSponsorCoinVersionEntry?.symbol || '');
  const selectedVersionSymbolWidthCh = Math.max(4, selectedVersionSymbol.length + 1);

  useEffect(() => {
    if (sponsorCoinVersionChoices.length === 0) return;

    const existing =
      sponsorCoinVersionChoices.find((entry) => entry.id === selectedSponsorCoinVersion) ??
      sponsorCoinVersionChoices[0];

    if (existing.id !== selectedSponsorCoinVersion) {
      setSelectedSponsorCoinVersion(existing.id);
    }
    if (normalizeAddress(contractAddress) !== normalizeAddress(existing.address)) {
      setContractAddress(existing.address);
    }
  }, [contractAddress, selectedSponsorCoinVersion, sponsorCoinVersionChoices]);

  useEffect(() => {
    if (!selectedSponsorCoinVersion) return;
    const picked = sponsorCoinVersionChoices.find((entry) => entry.id === selectedSponsorCoinVersion);
    if (!picked) return;
    if (normalizeAddress(contractAddress) !== normalizeAddress(picked.address)) {
      setContractAddress(picked.address);
    }
  }, [contractAddress, selectedSponsorCoinVersion, sponsorCoinVersionChoices]);

  useEffect(() => {
    if (mode !== 'hardhat') return;
    if (displayedVersionHardhatAccountIndex < 0) return;
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

  const adjustSponsorCoinVersion = useCallback(
    (direction: 1 | -1) => {
      if (sponsorCoinVersionChoices.length === 0) return;
      const currentIdx = sponsorCoinVersionChoices.findIndex(
        (entry) => entry.id === selectedSponsorCoinVersion,
      );
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = Math.max(
        0,
        Math.min(sponsorCoinVersionChoices.length - 1, baseIdx + direction),
      );
      const next = sponsorCoinVersionChoices[nextIdx];
      if (!next) return;
      setSelectedSponsorCoinVersion(next.id);
    },
    [selectedSponsorCoinVersion, sponsorCoinVersionChoices],
  );

  const selectedSponsorCoinVersionIndex = useMemo(() => {
    if (sponsorCoinVersionChoices.length === 0) return -1;
    const idx = sponsorCoinVersionChoices.findIndex(
      (entry) => entry.id === selectedSponsorCoinVersion,
    );
    return idx >= 0 ? idx : 0;
  }, [selectedSponsorCoinVersion, sponsorCoinVersionChoices]);

  const canIncrementSponsorCoinVersion =
    selectedSponsorCoinVersionIndex >= 0 &&
    selectedSponsorCoinVersionIndex < sponsorCoinVersionChoices.length - 1;
  const canDecrementSponsorCoinVersion = selectedSponsorCoinVersionIndex > 0;

  const syncMetaMaskState = useCallback(async () => {
    if (typeof window === 'undefined') return;
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
  }, [contextAddress]);

  useEffect(() => {
    if (mode !== 'metamask') return;
    // Clear any stale hardhat signer/account immediately when switching modes.
    setConnectedAddress('');
    setActiveSigner(null);
  }, [mode]);

  const syncHardhatState = useCallback(async () => {
    if (mode !== 'hardhat') return;
    if (!rpcUrl.trim()) return;

    try {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();

      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat sync error.';
      appendLog(`Hardhat state sync failed: ${message}`);
    }
  }, [appendLog, mode, rpcUrl]);

  const reconcileHardhatSelection = useCallback(
    (
      accounts: HardhatAccountOption[],
      publicAccountHint?: string,
      preferredIndex?: number,
    ) => {
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
      if (selectedHardhatIndex !== nextIdx) {
        setSelectedHardhatIndex(nextIdx);
      }
      if (normalizeAddress(connectedAddress) !== normalizeAddress(nextAccount.address)) {
        setConnectedAddress(nextAccount.address);
      }
    },
    [connectedAddress, selectedHardhatIndex],
  );

  useEffect(() => {
    if (mode !== 'metamask') return;
    if (typeof window === 'undefined') return;
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

    // Safety net for wallets/extensions that occasionally miss accountsChanged events.
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
    if (mode !== 'hardhat') return;
    if (hardhatAccounts.length === 0) return;
    reconcileHardhatSelection(hardhatAccounts, connectedAddress, selectedHardhatIndex);
  }, [hardhatAccounts, mode, reconcileHardhatSelection]);

  const requireContractAddress = useCallback(() => {
    const target = contractAddress.trim();
    if (!target) {
      throw new Error('Contract address is required.');
    }
    return target;
  }, [contractAddress]);

  const connectSigner = useCallback(async (): Promise<Signer> => {
    if (mode === 'metamask') {
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
      return signer;
    }

    if (!selectedHardhatAccount?.address || !selectedHardhatAccount.privateKey) {
      throw new Error('Select a Hardhat account with a private key.');
    }

    const provider = new JsonRpcProvider(rpcUrl.trim());
    const wallet = new Wallet(selectedHardhatAccount.privateKey, provider);
    const network = await provider.getNetwork();
    const address = await wallet.getAddress();

    setActiveSigner(wallet);
    setConnectedAddress(address);
    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(HARDHAT_NETWORK_NAME);
    setStatus(`Connected via Hardhat signer: ${address}`);
    appendLog(`Connected Hardhat signer ${address} on chain ${String(network.chainId)}.`);
    return wallet;
  }, [appendLog, mode, rpcUrl, selectedHardhatAccount]);

  const ensureReadRunner = useCallback(async () => {
    if (mode === 'hardhat') {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      return provider;
    }
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
  }, [mode, rpcUrl]);

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

  const executeHHConnected = useCallback(
    async (
      accountKey: string | undefined,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
    ) => {
      const target = requireContractAddress();
      const account = resolveHardhatAccount(accountKey);
      if (!account?.address || !account.privateKey) {
        throw new Error('Select a Hardhat account with a private key.');
      }

      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      const desired = normalizeAddress(account.address);

      const tryWithSigner = async (signer: Signer) => {
        const contract = createSpCoinContract(target, signer);
        return writeCall(contract, signer);
      };

      try {
        if (!activeSigner) throw new Error('Missing signer.');
        const activeAddress = normalizeAddress(await activeSigner.getAddress());
        if (activeAddress !== desired) throw new Error('Signer account mismatch.');
        return await tryWithSigner(activeSigner);
      } catch (error) {
        if (!isConnectionRetryableError(error)) throw error;
        appendLog(`HH reconnect for ${account.address}; retrying write.`);
        const signer = new Wallet(account.privateKey, provider);
        const signerAddress = await signer.getAddress();
        setActiveSigner(signer);
        setConnectedAddress(signerAddress);
        setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
        setConnectedNetworkName(HARDHAT_NETWORK_NAME);
        return await tryWithSigner(signer);
      }
    },
    [activeSigner, appendLog, isConnectionRetryableError, requireContractAddress, resolveHardhatAccount, rpcUrl],
  );

  const executeMetaMaskConnected = useCallback(
    async (writeCall: (contract: Contract, signer: Signer) => Promise<any>) => {
      const target = requireContractAddress();
      const runWithSigner = async (signer: Signer) => {
        const contract = createSpCoinContract(target, signer);
        return writeCall(contract, signer);
      };
      try {
        if (!activeSigner) throw new Error('Missing signer.');
        return await runWithSigner(activeSigner);
      } catch (error) {
        if (!isConnectionRetryableError(error)) throw error;
        appendLog('MetaMask reconnect requested; retrying write.');
        const signer = await connectSigner();
        return await runWithSigner(signer);
      }
    },
    [activeSigner, appendLog, connectSigner, isConnectionRetryableError, requireContractAddress],
  );

  const executeWriteConnected = useCallback(
    async (
      label: string,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
      accountKey?: string,
    ) => {
      if (mode === 'hardhat') return executeHHConnected(accountKey, writeCall);
      appendLog(`${label}: using MetaMask signer flow.`);
      return executeMetaMaskConnected(writeCall);
    },
    [appendLog, executeHHConnected, executeMetaMaskConnected, mode],
  );

  const connectHardhatBaseFromNetworkLabel = useCallback(async () => {
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
  }, [appendLog, rpcUrl, shouldPromptHardhatBaseConnect, syncMetaMaskState]);

  const runHeaderRead = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Reading SponsorCoin header...');
      const result = (await (access.contract as any).getSerializedSPCoinHeader()) as string;
      appendLog(`spCoinReadMethods/getSerializedSPCoinHeader -> ${result}`);
      setStatus('Header read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown header read error.';
      setStatus(`Header read failed: ${message}`);
      appendLog(`Header read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runAccountListRead = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Reading account list...');
      const list = (await (access.read as any).getAccountList()) as string[];
      appendLog(`spCoinReadMethods/getAccountList -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setStatus(`Account list read failed: ${message}`);
      appendLog(`Account list read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runTreeDump = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Building tree dump...');
      const list = (await (access.read as any).getAccountList()) as string[];
      if (list.length === 0) {
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const first = list[0];
      const tree = await (access.read as any).getAccountRecord(first);
      appendLog(`spCoinReadMethods/getAccountRecord(${first}) -> ${JSON.stringify(tree)}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const activeWriteLabels = useMemo(() => getErc20WriteLabels(selectedWriteMethod), [selectedWriteMethod]);

  const activeReadLabels = useMemo(() => getErc20ReadLabels(selectedReadMethod), [selectedReadMethod]);

  const runSelectedWriteMethod = useCallback(async () => {
    try {
      await runErc20WriteMethod({
        selectedWriteMethod,
        activeWriteLabels,
        writeAddressA,
        writeAddressB,
        writeAmountRaw,
        selectedHardhatAddress: selectedHardhatAccount?.address,
        executeWriteConnected,
        appendLog,
        setStatus,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown write method error.';
      setStatus(`${activeWriteLabels.title} failed: ${message}`);
      appendLog(`${activeWriteLabels.title} failed: ${message}`);
    }
  }, [
    activeWriteLabels.addressALabel,
    activeWriteLabels.addressBLabel,
    activeWriteLabels.requiresAddressB,
    activeWriteLabels.title,
    appendLog,
    executeWriteConnected,
    selectedHardhatAccount?.address,
    selectedWriteMethod,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  const runSelectedReadMethod = useCallback(async () => {
    try {
      await runErc20ReadMethod({
        selectedReadMethod,
        activeReadLabels,
        readAddressA,
        readAddressB,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown read method error.';
      setStatus(`${activeReadLabels.title} failed: ${message}`);
      appendLog(`${activeReadLabels.title} failed: ${message}`);
    }
  }, [
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    activeReadLabels.title,
    appendLog,
    ensureReadRunner,
    readAddressA,
    readAddressB,
    requireContractAddress,
    selectedReadMethod,
  ]);
  const spCoinReadMethodDefs = SPCOIN_READ_METHOD_DEFS;
  const spCoinWriteMethodDefs = SPCOIN_WRITE_METHOD_DEFS;
  const activeSpCoinReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
  const activeSpCoinWriteDef = spCoinWriteMethodDefs[selectedSpCoinWriteMethod];
  const updateSpWriteParamAtIndex = useCallback((idx: number, value: string) => {
    setSpWriteParams((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);
  const backdateCalendar = useBackdateCalendar({
    activeWriteParams: activeSpCoinWriteDef.params,
    spWriteParams,
    updateSpWriteParamAtIndex,
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(spCoinLabKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, any>;
        if (saved.mode === 'metamask' || saved.mode === 'hardhat') setMode(saved.mode);
        if (typeof saved.rpcUrl === 'string') setRpcUrl(saved.rpcUrl);
        if (typeof saved.mnemonic === 'string') setMnemonic(saved.mnemonic);
        if (typeof saved.contractAddress === 'string') setContractAddress(saved.contractAddress);
        if (typeof saved.selectedHardhatIndex === 'number') setSelectedHardhatIndex(saved.selectedHardhatIndex);
        if (Array.isArray(saved.hardhatAccounts)) setHardhatAccounts(saved.hardhatAccounts);
        if (typeof saved.selectedWriteMethod === 'string') setSelectedWriteMethod(saved.selectedWriteMethod as Erc20WriteMethod);
        if (typeof saved.writeAddressA === 'string') setWriteAddressA(saved.writeAddressA);
        if (typeof saved.writeAddressB === 'string') setWriteAddressB(saved.writeAddressB);
        if (typeof saved.writeAmountRaw === 'string') setWriteAmountRaw(saved.writeAmountRaw);
        if (typeof saved.methodPanelMode === 'string') setMethodPanelMode(saved.methodPanelMode as MethodPanelMode);
        if (typeof saved.selectedReadMethod === 'string') setSelectedReadMethod(saved.selectedReadMethod as Erc20ReadMethod);
        if (typeof saved.readAddressA === 'string') setReadAddressA(saved.readAddressA);
        if (typeof saved.readAddressB === 'string') setReadAddressB(saved.readAddressB);
        if (typeof saved.selectedSpCoinReadMethod === 'string') {
          setSelectedSpCoinReadMethod(saved.selectedSpCoinReadMethod as SpCoinReadMethod);
        }
        if (typeof saved.selectedSpCoinWriteMethod === 'string') {
          setSelectedSpCoinWriteMethod(saved.selectedSpCoinWriteMethod as SpCoinWriteMethod);
        }
        if (typeof saved.hideUnexecutables === 'boolean') setHideUnexecutables(saved.hideUnexecutables);
        if (Array.isArray(saved.spReadParams)) setSpReadParams(saved.spReadParams.map((v) => String(v ?? '')));
        if (Array.isArray(saved.spWriteParams)) setSpWriteParams(saved.spWriteParams.map((v) => String(v ?? '')));
        if (typeof saved.status === 'string') setStatus(saved.status);
        if (Array.isArray(saved.logs)) setLogs(saved.logs.map((v) => String(v ?? '')));
        if (typeof saved.backdatePopupParamIdx === 'number' || saved.backdatePopupParamIdx === null) {
          backdateCalendar.setBackdatePopupParamIdx(saved.backdatePopupParamIdx);
        }
        if (typeof saved.backdateYears === 'string') backdateCalendar.setBackdateYears(saved.backdateYears);
        if (typeof saved.backdateMonths === 'string') backdateCalendar.setBackdateMonths(saved.backdateMonths);
        if (typeof saved.backdateDays === 'string') backdateCalendar.setBackdateDays(saved.backdateDays);
        if (typeof saved.backdateHours === 'string') backdateCalendar.setBackdateHours(saved.backdateHours);
        if (typeof saved.backdateMinutes === 'string') backdateCalendar.setBackdateMinutes(saved.backdateMinutes);
        if (typeof saved.backdateSeconds === 'string') backdateCalendar.setBackdateSeconds(saved.backdateSeconds);
        if (typeof saved.hoverCalendarWarning === 'string') backdateCalendar.setHoverCalendarWarning(saved.hoverCalendarWarning);
        if (typeof saved.calendarViewYear === 'number') backdateCalendar.setCalendarViewYear(saved.calendarViewYear);
        if (typeof saved.calendarViewMonth === 'number') backdateCalendar.setCalendarViewMonth(saved.calendarViewMonth);
      }
    } catch {
      // Ignore malformed SponsorCoinLab localStorage payload.
    } finally {
      setSpCoinLabHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!spCoinLabHydrated) return;
    const payload = {
      mode,
      rpcUrl,
      mnemonic,
      contractAddress,
      hardhatAccounts,
      selectedHardhatIndex,
      connectedAddress,
      connectedChainId,
      connectedNetworkName,
      status,
      logs,
      selectedWriteMethod,
      writeAddressA,
      writeAddressB,
      writeAmountRaw,
      methodPanelMode,
      selectedReadMethod,
      readAddressA,
      readAddressB,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      hideUnexecutables,
      spReadParams,
      spWriteParams,
      backdatePopupParamIdx: backdateCalendar.backdatePopupParamIdx,
      backdateYears: backdateCalendar.backdateYears,
      backdateMonths: backdateCalendar.backdateMonths,
      backdateDays: backdateCalendar.backdateDays,
      backdateHours: backdateCalendar.backdateHours,
      backdateMinutes: backdateCalendar.backdateMinutes,
      backdateSeconds: backdateCalendar.backdateSeconds,
      hoverCalendarWarning: backdateCalendar.hoverCalendarWarning,
      calendarViewYear: backdateCalendar.calendarViewYear,
      calendarViewMonth: backdateCalendar.calendarViewMonth,
    };
    window.localStorage.setItem(spCoinLabKey, JSON.stringify(payload));
  }, [
    spCoinLabHydrated,
    mode,
    rpcUrl,
    mnemonic,
    contractAddress,
    hardhatAccounts,
    selectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    status,
    logs,
    selectedWriteMethod,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    hideUnexecutables,
    spReadParams,
    spWriteParams,
    backdateCalendar.backdatePopupParamIdx,
    backdateCalendar.backdateYears,
    backdateCalendar.backdateMonths,
    backdateCalendar.backdateDays,
    backdateCalendar.backdateHours,
    backdateCalendar.backdateMinutes,
    backdateCalendar.backdateSeconds,
    backdateCalendar.hoverCalendarWarning,
    backdateCalendar.calendarViewYear,
    backdateCalendar.calendarViewMonth,
  ]);
  const connectionModeOptions = useMemo(
    () =>
      [
        { value: 'metamask' as ConnectionMode, label: 'MetaMask' },
        { value: 'hardhat' as ConnectionMode, label: 'Hardhat Local' },
      ].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const erc20ReadOptions = ERC20_READ_OPTIONS;
  const erc20WriteOptions = ERC20_WRITE_OPTIONS;
  const spCoinReadOptions = useMemo(() => {
    return getSpCoinReadOptions(hideUnexecutables);
  }, [hideUnexecutables]);
  const spCoinWriteOptions = useMemo(() => {
    return getSpCoinWriteOptions(hideUnexecutables);
  }, [hideUnexecutables]);
  useEffect(() => {
    if (spCoinReadMethodDefs[selectedSpCoinReadMethod].executable === false && spCoinReadOptions.length > 0) {
      setSelectedSpCoinReadMethod(spCoinReadOptions[0]);
    }
  }, [selectedSpCoinReadMethod, spCoinReadMethodDefs, spCoinReadOptions]);
  useEffect(() => {
    if (spCoinWriteMethodDefs[selectedSpCoinWriteMethod].executable === false && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
    }
  }, [selectedSpCoinWriteMethod, spCoinWriteMethodDefs, spCoinWriteOptions]);
  const coerceParamValue = useCallback((raw: string, def: ParamDef) => {
    const value = String(raw || '').trim();
    if (def.type === 'date') {
      if (!value) {
        const now = new Date();
        return String(Math.trunc(now.getTime() / 1000));
      }
      const date = parseDateInput(value);
      if (!date) throw new Error(`${def.label} must be a valid date.`);
      date.setHours(
        Number(backdateCalendar.backdateHours || '0'),
        Number(backdateCalendar.backdateMinutes || '0'),
        Number(backdateCalendar.backdateSeconds || '0'),
        0,
      );
      const ms = date.getTime();
      if (!Number.isFinite(ms)) throw new Error(`${def.label} must be a valid date.`);
      return String(Math.trunc(ms / 1000));
    }
    if (!value) throw new Error(`${def.label} is required.`);
    if (def.type === 'bool') {
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      throw new Error(`${def.label} must be true/false or 1/0.`);
    }
    if (def.type === 'address_array' || def.type === 'string_array') return parseListParam(value);
    return value;
  }, [backdateCalendar.backdateHours, backdateCalendar.backdateMinutes, backdateCalendar.backdateSeconds]);
  const stringifyResult = useCallback((result: unknown) => {
    if (typeof result === 'string') return result;
    return JSON.stringify(result, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  }, []);
  const runSelectedSpCoinReadMethod = useCallback(async () => {
    try {
      await runSpCoinReadMethod({
        selectedMethod: selectedSpCoinReadMethod,
        spReadParams,
        coerceParamValue,
        stringifyResult,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin read error.';
      setStatus(`${activeSpCoinReadDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinReadDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinReadDef.params,
    activeSpCoinReadDef.title,
    appendLog,
    coerceParamValue,
    ensureReadRunner,
    requireContractAddress,
    selectedSpCoinReadMethod,
    spReadParams,
    stringifyResult,
  ]);
  const runSelectedSpCoinWriteMethod = useCallback(async () => {
    try {
      await runSpCoinWriteMethod({
        selectedMethod: selectedSpCoinWriteMethod,
        spWriteParams,
        coerceParamValue,
        executeWriteConnected,
        selectedHardhatAddress: selectedHardhatAccount?.address,
        appendLog,
        setStatus,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin write error.';
      setStatus(`${activeSpCoinWriteDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinWriteDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinWriteDef.params,
    activeSpCoinWriteDef.title,
    appendLog,
    coerceParamValue,
    executeWriteConnected,
    selectedHardhatAccount?.address,
    selectedSpCoinWriteMethod,
    spWriteParams,
  ]);
  const methodPanelTitle = useMemo(() => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        return 'ECR20 Read';
      case 'erc20_write':
        return 'ERC20 Write';
      case 'spcoin_rread':
        return 'Spcoin Read';
      case 'spcoin_write':
        return 'SpCoin Write';
      default:
        return 'Method Tests';
    }
  }, [methodPanelMode]);

  return (
    <main className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin Lab</h2>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className={`${cardStyle} relative`}>
            <button
              type="button"
              onClick={() => setShowHardhatConnectionInputs((prev) => !prev)}
              className="absolute right-[5px] top-[5px] inline-flex items-center justify-center bg-transparent p-0"
              aria-label="Toggle Hardhat connection settings"
              title="Toggle Hardhat connection settings"
            >
              <Image
                src={cog_png}
                alt="Toggle Hardhat connection settings"
                className="h-5 w-5 cursor-pointer object-contain transition duration-300 hover:rotate-[360deg]"
              />
            </button>
            <div className="mt-1 grid items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <h2 className="text-lg font-semibold text-[#5981F3]">Network Connection Mode</h2>
              <div className="justify-self-start md:justify-self-end md:self-start">
                <div className="flex items-center gap-2">
                  <label htmlFor="network-connection-mode" className="sr-only">
                    Network connection mode
                  </label>
                  <select
                    id="network-connection-mode"
                    className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ConnectionMode)}
                    aria-label="Network connection mode"
                    title="Network connection mode"
                  >
                    {connectionModeOptions.map((entry) => (
                      <option key={`mode-${entry.value}`} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <span
                className={`text-sm font-semibold ${
                  shouldPromptHardhatBaseConnect ? 'cursor-pointer text-[#F59E0B] hover:text-[#FACC15]' : 'text-[#8FA8FF]'
                }`}
                title={shouldPromptHardhatBaseConnect ? 'connect "Hardhat Base"' : undefined}
                onClick={shouldPromptHardhatBaseConnect ? () => void connectHardhatBaseFromNetworkLabel() : undefined}
              >
                Connected Network
              </span>
              <input
                type="text"
                value={activeNetworkName}
                readOnly
                className={inputStyle}
                aria-label="Connected network"
                title="Connected network"
              />
              <label className="flex items-center justify-self-end gap-2">
                <span className="text-sm font-semibold text-[#8FA8FF]">Chain Id</span>
                <input
                  type="text"
                  value={chainIdDisplayValue}
                  readOnly
                  className="rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                  style={{ width: `${chainIdDisplayWidthCh}ch` }}
                />
              </label>
            </div>

            {mode === 'hardhat' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {showHardhatConnectionInputs && (
                  <>
                    <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                      <span className="text-sm font-semibold text-[#8FA8FF]">Hardhat RPC URL</span>
                      <input
                        className={inputStyle}
                        value={rpcUrl}
                        onChange={(e) => setRpcUrl(e.target.value)}
                        placeholder="Hardhat RPC URL"
                      />
                    </label>
                    <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                      <span className="text-sm font-semibold text-[#8FA8FF]">Hard Hat Seed Phrase</span>
                      <input
                        className={inputStyle}
                        value={mnemonic}
                        onChange={(e) => setMnemonic(e.target.value)}
                        placeholder="Hardhat mnemonic"
                      />
                    </label>
                  </>
                )}
              </div>
            )}
            {mode !== 'hardhat' && (
              <div className="mt-4">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    disabled
                    value={effectiveConnectedAddress || ''}
                    placeholder="Selected account address"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              {status !== 'Ready' && (
                <div className="text-sm text-slate-300">
                  <div className="mb-2">Status: {status}</div>
                </div>
              )}
            </div>
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Active Hardhat Account</h2>
            {mode === 'hardhat' ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">HardHat Public Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedHardhatAccount?.address || ''}
                    placeholder="Selected account address"
                  />
                </label>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">HardHat Private Key</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedVersionSignerKey}
                    placeholder="Signer key for selected deployed version"
                  />
                </label>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-300">
                Switch Network Connection Mode to Hardhat Local to configure HardHat account connection.
              </p>
            )}
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Active Sponsor Coin Contract</h2>
            {mode === 'hardhat' ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="flex w-full flex-wrap items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 text-sm font-semibold text-[#8FA8FF]">SponsorCoin Version</span>
                    <div className="flex min-w-0 flex-1 items-stretch">
                      <select
                        className="w-full min-w-0 rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-2 text-sm text-white outline-none transition-colors focus:border-[#8FA8FF]"
                        value={selectedSponsorCoinVersion}
                        onChange={(e) => setSelectedSponsorCoinVersion(e.target.value)}
                        aria-label="SponsorCoin Version (Hardhat row)"
                        title="SponsorCoin Version"
                      >
                        {sponsorCoinVersionChoices.length === 0 && (
                          <option value="">(no deployment map entries)</option>
                        )}
                        {sponsorCoinVersionChoices.map((entry) => (
                          <option key={`spcoin-version-row-${entry.id}`} value={entry.id}>
                            {entry.version}
                          </option>
                        ))}
                      </select>
                      <div className="flex w-[38px] flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            if (canIncrementSponsorCoinVersion) adjustSponsorCoinVersion(1);
                          }}
                          className={`h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                            canIncrementSponsorCoinVersion
                              ? 'cursor-pointer hover:bg-green-500'
                              : 'cursor-not-allowed hover:bg-red-500'
                          }`}
                          title="Increment SponsorCoin Version"
                          aria-disabled={!canIncrementSponsorCoinVersion}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (canDecrementSponsorCoinVersion) adjustSponsorCoinVersion(-1);
                          }}
                          className={`h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-sm font-bold leading-none text-[#8FA8FF] transition-colors hover:text-black ${
                            canDecrementSponsorCoinVersion
                              ? 'cursor-pointer hover:bg-green-500'
                              : 'cursor-not-allowed hover:bg-red-500'
                          }`}
                          title="Decrement SponsorCoin Version"
                          aria-disabled={!canDecrementSponsorCoinVersion}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="px-1 text-sm font-semibold text-[#8FA8FF]">Deployed on HH Account</span>
                  <label htmlFor="hardhat-account-index" className="sr-only">
                    Hardhat account index
                  </label>
                  <input
                    id="hardhat-account-index"
                    className="w-[6ch] rounded-lg border border-[#334155] bg-[#0E111B] px-2 py-2 text-center text-sm text-white"
                    value={
                      !selectedVersionSignerKey
                        ? '?'
                        : displayedVersionHardhatAccountIndex >= 0
                        ? String(displayedVersionHardhatAccountIndex)
                        : ''
                    }
                    readOnly
                    aria-label="Hardhat account index"
                    title="Hardhat account index"
                  />
                </div>
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Token Name:</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={String(selectedSponsorCoinVersionEntry?.name || '')}
                    placeholder="Selected deployed SponsorCoin name"
                  />
                  <div className="flex items-center justify-self-end gap-2">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Symbol</span>
                    <input
                      className="rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                      style={{ width: `${selectedVersionSymbolWidthCh}ch` }}
                      readOnly
                      value={selectedVersionSymbol}
                      placeholder="symbol"
                    />
                  </div>
                </div>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">SponsorCoin Contract Address</span>
                  <input
                    className={inputStyle}
                    value={contractAddress}
                    readOnly
                    placeholder="SponsorCoin contract address"
                  />
                </label>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-300">
                Switch Network Connection Mode to Hardhat Local to view active Sponsor Coin contract data.
              </p>
            )}
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Read / Tree Dump Tests</h2>
            <p className="mt-2 text-sm text-slate-200">
              Read methods are no-fee calls. Tree dump uses the first account from `getAccountList`.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={buttonStyle} onClick={runHeaderRead}>
                Run Header Read
              </button>
              <button type="button" className={buttonStyle} onClick={runAccountListRead}>
                Run Account List Read
              </button>
              <button type="button" className={buttonStyle} onClick={runTreeDump}>
                Dump First Account Tree
              </button>
            </div>
          </article>

          <article className={cardStyle}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#5981F3]">{methodPanelTitle}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="method-panel-mode"
                    value="ecr20_read"
                    checked={methodPanelMode === 'ecr20_read'}
                    onChange={(e) => setMethodPanelMode(e.target.value as MethodPanelMode)}
                  />
                  <span>ECR20 Read</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="method-panel-mode"
                    value="erc20_write"
                    checked={methodPanelMode === 'erc20_write'}
                    onChange={(e) => setMethodPanelMode(e.target.value as MethodPanelMode)}
                  />
                  <span>ERC20 Write</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="method-panel-mode"
                    value="spcoin_rread"
                    checked={methodPanelMode === 'spcoin_rread'}
                    onChange={(e) => setMethodPanelMode(e.target.value as MethodPanelMode)}
                  />
                  <span>Spcoin Read</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="method-panel-mode"
                    value="spcoin_write"
                    checked={methodPanelMode === 'spcoin_write'}
                    onChange={(e) => setMethodPanelMode(e.target.value as MethodPanelMode)}
                  />
                  <span>SpCoin Write</span>
                </label>
              </div>
            </div>

            {methodPanelMode === 'ecr20_read' && (
              <Erc20ReadController
                selectedReadMethod={selectedReadMethod}
                erc20ReadOptions={erc20ReadOptions}
                setSelectedReadMethod={(value) => setSelectedReadMethod(value as Erc20ReadMethod)}
                activeReadLabels={activeReadLabels}
                readAddressA={readAddressA}
                setReadAddressA={setReadAddressA}
                readAddressB={readAddressB}
                setReadAddressB={setReadAddressB}
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                runSelectedReadMethod={runSelectedReadMethod}
              />
            )}

            {methodPanelMode === 'erc20_write' && (
              <Erc20WriteController
                selectedWriteMethod={selectedWriteMethod}
                erc20WriteOptions={erc20WriteOptions}
                setSelectedWriteMethod={(value) => setSelectedWriteMethod(value as Erc20WriteMethod)}
                activeWriteLabels={activeWriteLabels}
                writeAddressA={writeAddressA}
                setWriteAddressA={setWriteAddressA}
                writeAddressB={writeAddressB}
                setWriteAddressB={setWriteAddressB}
                writeAmountRaw={writeAmountRaw}
                setWriteAmountRaw={setWriteAmountRaw}
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                runSelectedWriteMethod={runSelectedWriteMethod}
              />
            )}

            {methodPanelMode === 'spcoin_rread' && (
              <SpCoinReadController
                hideUnexecutables={hideUnexecutables}
                setHideUnexecutables={setHideUnexecutables}
                selectedSpCoinReadMethod={selectedSpCoinReadMethod}
                setSelectedSpCoinReadMethod={(value) => setSelectedSpCoinReadMethod(value as SpCoinReadMethod)}
                spCoinReadOptions={spCoinReadOptions}
                spCoinReadMethodDefs={spCoinReadMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string }[]; executable?: boolean }>}
                activeSpCoinReadDef={activeSpCoinReadDef as { title: string; params: { label: string; placeholder: string }[]; executable?: boolean }}
                spReadParams={spReadParams}
                setSpReadParams={setSpReadParams}
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                runSelectedSpCoinReadMethod={runSelectedSpCoinReadMethod}
              />
            )}

            {methodPanelMode === 'spcoin_write' && (
              <SpCoinWriteController
                hideUnexecutables={hideUnexecutables}
                setHideUnexecutables={setHideUnexecutables}
                selectedSpCoinWriteMethod={selectedSpCoinWriteMethod}
                setSelectedSpCoinWriteMethod={(value) => setSelectedSpCoinWriteMethod(value as SpCoinWriteMethod)}
                spCoinWriteOptions={spCoinWriteOptions}
                spCoinWriteMethodDefs={spCoinWriteMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string; type: string }[]; executable?: boolean }>}
                activeSpCoinWriteDef={activeSpCoinWriteDef as { title: string; params: { label: string; placeholder: string; type: string }[]; executable?: boolean }}
                spWriteParams={spWriteParams}
                updateSpWriteParamAtIndex={updateSpWriteParamAtIndex}
                onOpenBackdatePicker={backdateCalendar.openBackdatePickerAt}
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                runSelectedSpCoinWriteMethod={runSelectedSpCoinWriteMethod}
                formatDateTimeDisplay={formatDateTimeDisplay}
                formatDateInput={formatDateInput}
                backdateHours={backdateCalendar.backdateHours}
                setBackdateHours={backdateCalendar.setBackdateHours}
                backdateMinutes={backdateCalendar.backdateMinutes}
                setBackdateMinutes={backdateCalendar.setBackdateMinutes}
                backdateSeconds={backdateCalendar.backdateSeconds}
                setBackdateSeconds={backdateCalendar.setBackdateSeconds}
                setBackdateYears={backdateCalendar.setBackdateYears}
                setBackdateMonths={backdateCalendar.setBackdateMonths}
                setBackdateDays={backdateCalendar.setBackdateDays}
                backdatePopupParamIdx={backdateCalendar.backdatePopupParamIdx}
                setBackdatePopupParamIdx={backdateCalendar.setBackdatePopupParamIdx}
                shiftCalendarMonth={backdateCalendar.shiftCalendarMonth}
                calendarMonthOptions={backdateCalendar.calendarMonthOptions}
                calendarViewMonth={backdateCalendar.calendarViewMonth}
                setCalendarViewMonth={backdateCalendar.setCalendarViewMonth}
                calendarYearOptions={backdateCalendar.calendarYearOptions}
                calendarViewYear={backdateCalendar.calendarViewYear}
                setCalendarViewYear={backdateCalendar.setCalendarViewYear}
                isViewingCurrentMonth={backdateCalendar.isViewingCurrentMonth}
                setHoverCalendarWarning={backdateCalendar.setHoverCalendarWarning}
                CALENDAR_WEEK_DAYS={CALENDAR_WEEK_DAYS}
                calendarDayCells={backdateCalendar.calendarDayCells}
                isViewingFutureMonth={backdateCalendar.isViewingFutureMonth}
                today={backdateCalendar.today}
                selectedBackdateDate={backdateCalendar.selectedBackdateDate}
                hoverCalendarWarning={backdateCalendar.hoverCalendarWarning}
                maxBackdateYears={backdateCalendar.maxBackdateYears}
                backdateYears={backdateCalendar.backdateYears}
                backdateMonths={backdateCalendar.backdateMonths}
                backdateDays={backdateCalendar.backdateDays}
                applyBackdateBy={backdateCalendar.applyBackdateBy}
              />
            )}
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Execution Log</h2>
            <pre className="mt-4 h-72 overflow-auto rounded-lg border border-[#334155] bg-[#0B1220] p-3 text-xs text-slate-200">
              {logs.join('\n')}
            </pre>
          </article>
        </section>
      </section>
    </main>
  );
}
