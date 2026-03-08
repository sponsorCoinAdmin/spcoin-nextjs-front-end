// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, HDNodeWallet, JsonRpcProvider, Wallet } from 'ethers';
import type { Signer } from 'ethers';
import { useExchangeContext } from '@/lib/context/hooks';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import Erc20ReadController from './components/Erc20ReadController';
import Erc20WriteController from './components/Erc20WriteController';
import SpCoinReadController from './components/SpCoinReadController';
import SpCoinWriteController from './components/SpCoinWriteController';

type ConnectionMode = 'metamask' | 'hardhat';
type Erc20WriteMethod = 'transfer' | 'approve' | 'transferFrom';
type MethodPanelMode = 'ecr20_read' | 'erc20_write' | 'spcoin_rread' | 'spcoin_write';
type Erc20ReadMethod = 'name' | 'symbol' | 'decimals' | 'totalSupply' | 'balanceOf' | 'allowance';
type SpCoinReadMethod =
  | 'getSerializedSPCoinHeader'
  | 'getSPCoinHeaderRecord'
  | 'getAccountList'
  | 'getAccountListSize'
  | 'getAccountRecipientList'
  | 'getAccountRecipientListSize'
  | 'getSerializedAccountRecord'
  | 'getAccountRecord'
  | 'getAccountRecords'
  | 'getSerializedAccountRewards'
  | 'getAccountStakingRewards'
  | 'getRewardAccounts'
  | 'getRewardTypeRecord'
  | 'getAccountRewardTransactionList'
  | 'getAccountRewardTransactionRecord'
  | 'getAccountRateRecordList'
  | 'getRateTransactionList'
  | 'getRecipientRateList'
  | 'getRecipientRateRecord'
  | 'getRecipientRateRecordList'
  | 'getRecipientRateAgentList'
  | 'getRecipientRecord'
  | 'getRecipientRecordList'
  | 'getAgentRateList'
  | 'getAgentRateRecord'
  | 'getAgentRateRecordList'
  | 'getAgentTotalRecipient'
  | 'getSerializedRateTransactionList'
  | 'getAgentRateTransactionList'
  | 'getRecipientRateTransactionList'
  | 'getAgentRecord'
  | 'getAgentRecordList'
  | 'testStakingRewards'
  | 'getStakingRewards'
  | 'getTimeMultiplier'
  | 'getAccountTimeInSecondeSinceUpdate'
  | 'getMillenniumTimeIntervalDivisor';
type SpCoinWriteMethod =
  | 'addRecipient'
  | 'addRecipients'
  | 'addAgent'
  | 'addAgents'
  | 'addAccountRecord'
  | 'addAccountRecords'
  | 'addSponsorship'
  | 'addAgentSponsorship'
  | 'addBackDatedSponsorship'
  | 'addBackDatedAgentSponsorship'
  | 'unSponsorRecipient'
  | 'deleteAccountRecord'
  | 'deleteAccountRecords'
  | 'deleteAgentRecord'
  | 'updateAccountStakingRewards'
  | 'depositSponsorStakingRewards'
  | 'depositRecipientStakingRewards'
  | 'depositAgentStakingRewards'
  | 'depositStakingRewards';
type ParamType = 'address' | 'uint' | 'string' | 'bool' | 'address_array' | 'string_array' | 'date';
type ParamDef = { label: string; placeholder: string; type: ParamType };

type HardhatAccountOption = {
  address: string;
  privateKey: string;
};

const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';
const HARDHAT_KEYS_STORAGE_KEY = 'spcoin_lab_hardhat_keys_v1';
const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_NETWORK_NAME = 'SponsorCoin HH BASE';
const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
const SPONSOR_ACCOUNT_TYPE = '0';
const RECIPIENT_ACCOUNT_TYPE = '1';
const AGENT_ACCOUNT_TYPE = '2';

const SPCOIN_LAB_ABI = [
  'function getSerializedSPCoinHeader() view returns (string)',
  'function getAccountList() view returns (address[])',
  'function getSerializedAccountRecord(address _accountKey) view returns (string)',
  'function getSerializedAccountRewards(address _accountKey) view returns (string)',
  'function getRewardAccounts(address _accountKey, uint256 _rewardType) view returns (string)',
  'function getRecipientRateList(address _sponsorKey, address _recipientKey) view returns (uint256[])',
  'function getRecipientRateAgentList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) view returns (address[])',
  'function getAgentRateList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey) view returns (uint256[])',
  'function getAgentTotalRecipient(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey) view returns (uint256)',
  'function getSerializedRateTransactionList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey) view returns (string)',
  'function getRecipientRateTransactionList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) view returns (string)',
  'function getSerializedRecipientRateList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) view returns (string)',
  'function getSerializedRecipientRecordList(address _sponsorKey, address _recipientKey) view returns (string)',
  'function serializeAgentRateRecordStr(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey) view returns (string)',
  'function testStakingRewards(uint256 lastUpdateTime, uint256 testUpdateTime, uint256 interestRate, uint256 quantity) view returns (uint256)',
  'function getStakingRewards(uint256 lastUpdateTime, uint256 interestRate, uint256 quantity) view returns (uint256)',
  'function getTimeMultiplier(uint256 _timeRateMultiplier) view returns (uint256)',
  'function getAccountTimeInSecondeSinceUpdate(uint256 _tokenLastUpdate) view returns (uint256)',
  'function getMillenniumTimeIntervalDivisor(uint256 _timeInSeconds) view returns (uint256)',
  'function addAccountRecord(address _accountKey)',
  'function addRecipient(address _recipientKey)',
  'function addAgent(address _recipientKey, uint256 _recipientRateKey, address _agentKey)',
  'function addSponsorship(address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey, string _strWholeAmount, string _strDecimalAmount)',
  'function addBackDatedSponsorship(address _recipientKey, uint256 _recipientRateKey, address _agentKey, uint256 _agentRateKey, string _strWholeAmount, string _strDecimalAmount, uint256 _transactionTimeStamp)',
  'function unSponsorRecipient(address _recipientKey)',
  'function deleteAccountRecord(address _accountKey)',
  'function updateAccountStakingRewards(address _sourceKey)',
  'function depositStakingRewards(uint256 _accountType, address _sponsorKey, address _recipientKey, uint256 _recipientRate, address _agentKey, uint256 _agentRate, uint256 _amount) returns (uint256)',
  'function transfer(address _to, uint256 _value) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',
  'function transferFrom(address _from, address _to, uint256 _value) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256)',
  'function allowance(address _owner, address _spender) view returns (uint256)',
];

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

function splitDecimalAmount(raw: string): { whole: string; fractional: string } {
  const [wholeRaw = '0', fractionalRaw = '0'] = String(raw || '').trim().split('.');
  const whole = wholeRaw.length > 0 ? wholeRaw : '0';
  const fractional = fractionalRaw.length > 0 ? fractionalRaw : '0';
  return { whole, fractional };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pad2(value: number | string): string {
  return String(value).padStart(2, '0');
}

function formatDateTimeDisplay(datePart: string, hours: string, minutes: string, seconds: string): string {
  return `${datePart} ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function getBackdatedDate(base: Date, years: number, months: number, days: number): Date {
  const result = new Date(base);
  result.setFullYear(result.getFullYear() - years);
  result.setMonth(result.getMonth() - months);
  result.setDate(result.getDate() - days);
  return result;
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

const CALENDAR_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function calculateBackdateParts(fromDate: Date, toDate: Date): { years: number; months: number; days: number } {
  let fromYear = fromDate.getFullYear();
  let fromMonth = fromDate.getMonth() + 1;
  let fromDay = fromDate.getDate();

  const toYear = toDate.getFullYear();
  const toMonth = toDate.getMonth() + 1;
  const toDay = toDate.getDate();

  if (fromDay < toDay) {
    fromMonth -= 1;
    if (fromMonth <= 0) {
      fromMonth += 12;
      fromYear -= 1;
    }
    fromDay += new Date(fromYear, fromMonth, 0).getDate();
  }

  const days = fromDay - toDay;

  if (fromMonth < toMonth) {
    fromMonth += 12;
    fromYear -= 1;
  }

  const months = fromMonth - toMonth;
  const years = fromYear - toYear;

  return { years, months, days };
}

export default function SponsorCoinLabPage() {
  const { exchangeContext } = useExchangeContext();
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [mnemonic, setMnemonic] = useState(HARDHAT_DEFAULT_MNEMONIC);
  const [contractAddress, setContractAddress] = useState('');
  const [persistKeys] = useState(true);
  const [hardhatAccounts, setHardhatAccounts] = useState<HardhatAccountOption[]>([]);
  const [selectedHardhatIndex, setSelectedHardhatIndex] = useState(0);
  const [activeSigner, setActiveSigner] = useState<Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectedChainId, setConnectedChainId] = useState('');
  const [connectedNetworkName, setConnectedNetworkName] = useState('');
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
  const [backdatePopupParamIdx, setBackdatePopupParamIdx] = useState<number | null>(null);
  const [backdateYears, setBackdateYears] = useState('0');
  const [backdateMonths, setBackdateMonths] = useState('0');
  const [backdateDays, setBackdateDays] = useState('0');
  const [backdateHours, setBackdateHours] = useState(() => String(new Date().getHours()));
  const [backdateMinutes, setBackdateMinutes] = useState(() => String(new Date().getMinutes()));
  const [backdateSeconds, setBackdateSeconds] = useState(() => String(new Date().getSeconds()));
  const [hoverCalendarWarning, setHoverCalendarWarning] = useState('');
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [calendarViewYear, setCalendarViewYear] = useState(today.getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(today.getMonth());

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

    if (accounts.length > 0) {
      setConnectedAddress(accounts[0]);
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
  }, []);

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

    return () => {
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

  const requireContractAddress = useCallback(() => {
    const target = contractAddress.trim();
    if (!target) {
      throw new Error('Contract address is required.');
    }
    return target;
  }, [contractAddress]);

  const loadHardhatAccounts = useCallback(async () => {
    try {
      setStatus('Loading Hardhat accounts...');
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const rpcAccounts = (await provider.send('eth_accounts', [])) as string[];

      const derivedByAddress = new Map<string, string>();
      for (let i = 0; i < 20; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, path);
        derivedByAddress.set(normalizeAddress(wallet.address), wallet.privateKey);
      }

      const finalAccounts = rpcAccounts.map((addr, index) => {
        const byAddress = derivedByAddress.get(normalizeAddress(addr));
        if (byAddress) {
          return { address: addr, privateKey: byAddress };
        }
        const fallbackPath = `m/44'/60'/0'/0/${index}`;
        const fallbackWallet = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, fallbackPath);
        return { address: addr, privateKey: fallbackWallet.privateKey };
      });

      setHardhatAccounts(finalAccounts);
      setSelectedHardhatIndex(0);
      setStatus(`Loaded ${finalAccounts.length} Hardhat accounts.`);
      appendLog(`Loaded ${finalAccounts.length} Hardhat accounts from ${rpcUrl}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat account load error.';
      setStatus(`Hardhat load failed: ${message}`);
      appendLog(`Hardhat load failed: ${message}`);
    }
  }, [appendLog, mnemonic, rpcUrl]);

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
        const contract = new Contract(target, SPCOIN_LAB_ABI, signer);
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
        const contract = new Contract(target, SPCOIN_LAB_ABI, signer);
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
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Reading SponsorCoin header...');
      const result = (await contract.getSerializedSPCoinHeader()) as string;
      appendLog(`getSerializedSPCoinHeader -> ${result}`);
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
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Reading account list...');
      const list = (await contract.getAccountList()) as string[];
      appendLog(`getAccountList -> ${JSON.stringify(list)}`);
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
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Building tree dump...');
      const list = (await contract.getAccountList()) as string[];
      if (list.length === 0) {
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const first = list[0];
      const tree = (await contract.getSerializedAccountRecord(first)) as string;
      appendLog(`getSerializedAccountRecord(${first}) -> ${tree}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const activeWriteLabels = useMemo(() => {
    switch (selectedWriteMethod) {
      case 'approve':
        return {
          title: 'approve',
          addressALabel: 'Spender Address',
          addressAPlaceholder: 'approve(spender)',
          addressBLabel: '',
          addressBPlaceholder: '',
          requiresAddressB: false,
        };
      case 'transferFrom':
        return {
          title: 'transferFrom',
          addressALabel: 'From Address',
          addressAPlaceholder: 'transferFrom(from)',
          addressBLabel: 'To Address',
          addressBPlaceholder: 'transferFrom(to)',
          requiresAddressB: true,
        };
      case 'transfer':
      default:
        return {
          title: 'transfer',
          addressALabel: 'To Address',
          addressAPlaceholder: 'transfer(to)',
          addressBLabel: '',
          addressBPlaceholder: '',
          requiresAddressB: false,
        };
    }
  }, [selectedWriteMethod]);

  const activeReadLabels = useMemo(() => {
    switch (selectedReadMethod) {
      case 'balanceOf':
        return {
          title: 'balanceOf',
          addressALabel: 'Owner Address',
          addressAPlaceholder: 'balanceOf(owner)',
          addressBLabel: '',
          addressBPlaceholder: '',
          requiresAddressA: true,
          requiresAddressB: false,
        };
      case 'allowance':
        return {
          title: 'allowance',
          addressALabel: 'Owner Address',
          addressAPlaceholder: 'allowance(owner)',
          addressBLabel: 'Spender Address',
          addressBPlaceholder: 'allowance(spender)',
          requiresAddressA: true,
          requiresAddressB: true,
        };
      case 'name':
      case 'symbol':
      case 'decimals':
      case 'totalSupply':
      default:
        return {
          title: selectedReadMethod,
          addressALabel: '',
          addressAPlaceholder: '',
          addressBLabel: '',
          addressBPlaceholder: '',
          requiresAddressA: false,
          requiresAddressB: false,
        };
    }
  }, [selectedReadMethod]);

  const runSelectedWriteMethod = useCallback(async () => {
    try {
      const addressA = writeAddressA.trim();
      const addressB = writeAddressB.trim();
      const amount = writeAmountRaw.trim();
      if (!addressA) throw new Error(`${activeWriteLabels.addressALabel} is required.`);
      if (activeWriteLabels.requiresAddressB && !addressB) {
        throw new Error(`${activeWriteLabels.addressBLabel} is required.`);
      }
      if (!amount) throw new Error('Amount is required.');

      if (selectedWriteMethod === 'approve') {
        setStatus(`Submitting approve(${addressA}, ${amount})...`);
        const tx = await executeWriteConnected(
          'approve',
          (contract) => contract.approve(addressA, amount),
          selectedHardhatAccount?.address,
        );
        appendLog(`approve tx sent: ${String(tx?.hash || '(no hash)')}`);
        const receipt = await tx.wait();
        appendLog(`approve mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
        setStatus('approve complete.');
        return;
      }

      if (selectedWriteMethod === 'transferFrom') {
        setStatus(`Submitting transferFrom(${addressA}, ${addressB}, ${amount})...`);
        const tx = await executeWriteConnected(
          'transferFrom',
          (contract) => contract.transferFrom(addressA, addressB, amount),
          selectedHardhatAccount?.address,
        );
        appendLog(`transferFrom tx sent: ${String(tx?.hash || '(no hash)')}`);
        const receipt = await tx.wait();
        appendLog(`transferFrom mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
        setStatus('transferFrom complete.');
        return;
      }

      setStatus(`Submitting transfer(${addressA}, ${amount})...`);
      const tx = await executeWriteConnected(
        'transfer',
        (contract) => contract.transfer(addressA, amount),
        selectedHardhatAccount?.address,
      );
      appendLog(`transfer tx sent: ${String(tx?.hash || '(no hash)')}`);
      const receipt = await tx.wait();
      appendLog(`transfer mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      setStatus('transfer complete.');
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
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      const addressA = readAddressA.trim();
      const addressB = readAddressB.trim();

      if (activeReadLabels.requiresAddressA && !addressA) {
        throw new Error(`${activeReadLabels.addressALabel} is required.`);
      }
      if (activeReadLabels.requiresAddressB && !addressB) {
        throw new Error(`${activeReadLabels.addressBLabel} is required.`);
      }

      if (selectedReadMethod === 'name') {
        const result = (await contract.name()) as string;
        appendLog(`name() -> ${result}`);
        setStatus('name read complete.');
        return;
      }
      if (selectedReadMethod === 'symbol') {
        const result = (await contract.symbol()) as string;
        appendLog(`symbol() -> ${result}`);
        setStatus('symbol read complete.');
        return;
      }
      if (selectedReadMethod === 'decimals') {
        const result = await contract.decimals();
        appendLog(`decimals() -> ${String(result)}`);
        setStatus('decimals read complete.');
        return;
      }
      if (selectedReadMethod === 'totalSupply') {
        const result = await contract.totalSupply();
        appendLog(`totalSupply() -> ${String(result)}`);
        setStatus('totalSupply read complete.');
        return;
      }
      if (selectedReadMethod === 'balanceOf') {
        const result = await contract.balanceOf(addressA);
        appendLog(`balanceOf(${addressA}) -> ${String(result)}`);
        setStatus('balanceOf read complete.');
        return;
      }
      const result = await contract.allowance(addressA, addressB);
      appendLog(`allowance(${addressA}, ${addressB}) -> ${String(result)}`);
      setStatus('allowance read complete.');
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
  const spCoinReadMethodDefs = useMemo<
    Record<SpCoinReadMethod, { title: string; params: ParamDef[]; executable?: boolean }>
  >(
    () => ({
      getSerializedSPCoinHeader: { title: 'getSerializedSPCoinHeader', params: [] },
      getSPCoinHeaderRecord: {
        title: 'getSPCoinHeaderRecord',
        params: [{ label: 'Get Body', placeholder: 'bool getBody (true/false)', type: 'bool' }],
      },
      getAccountList: { title: 'getAccountList', params: [] },
      getAccountListSize: { title: 'getAccountListSize', params: [] },
      getAccountRecipientList: {
        title: 'getAccountRecipientList',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getAccountRecipientListSize: {
        title: 'getAccountRecipientListSize',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getSerializedAccountRecord: {
        title: 'getSerializedAccountRecord',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getAccountRecord: {
        title: 'getAccountRecord',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getAccountRecords: { title: 'getAccountRecords', params: [] },
      getSerializedAccountRewards: {
        title: 'getSerializedAccountRewards',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getAccountStakingRewards: {
        title: 'getAccountStakingRewards',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      getRewardAccounts: {
        title: 'getRewardAccounts',
        params: [
          { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
          { label: 'Reward Type', placeholder: 'uint256 _rewardType', type: 'uint' },
        ],
      },
      getRewardTypeRecord: {
        title: 'getRewardTypeRecord',
        params: [
          { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
          { label: 'Reward Type', placeholder: 'uint256 _rewardType', type: 'uint' },
          { label: 'Reward', placeholder: 'uint256 _reward', type: 'uint' },
        ],
      },
      getAccountRewardTransactionList: {
        title: 'getAccountRewardTransactionList',
        params: [
          {
            label: 'Reward Account List',
            placeholder: 'string[] _rewardAccountList (comma/newline separated)',
            type: 'string_array',
          },
        ],
      },
      getAccountRewardTransactionRecord: {
        title: 'getAccountRewardTransactionRecord',
        params: [{ label: 'Reward Record String', placeholder: 'string _rewardRecordStr', type: 'string' }],
      },
      getAccountRateRecordList: {
        title: 'getAccountRateRecordList',
        params: [{ label: 'Rate Reward List', placeholder: 'string[] rateRewardList (comma/newline separated)', type: 'string_array' }],
      },
      getRateTransactionList: {
        title: 'getRateTransactionList',
        params: [{ label: 'Reward Rate Row List', placeholder: 'string[] rewardRateRowList (comma/newline separated)', type: 'string_array' }],
      },
      getRecipientRateList: {
        title: 'getRecipientRateList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
        ],
      },
      getRecipientRateRecord: {
        title: 'getRecipientRateRecord',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
        ],
      },
      getRecipientRateRecordList: {
        title: 'getRecipientRateRecordList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
        ],
      },
      getRecipientRateAgentList: {
        title: 'getRecipientRateAgentList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
        ],
      },
      getRecipientRecord: {
        title: 'getRecipientRecord',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
        ],
      },
      getRecipientRecordList: {
        title: 'getRecipientRecordList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Account List', placeholder: 'address[] _recipientAccountList (comma/newline separated)', type: 'address_array' },
        ],
      },
      getAgentRateList: {
        title: 'getAgentRateList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
        ],
      },
      getAgentRateRecord: {
        title: 'getAgentRateRecord',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
        ],
      },
      getAgentRateRecordList: {
        title: 'getAgentRateRecordList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
        ],
      },
      getAgentTotalRecipient: {
        title: 'getAgentTotalRecipient',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
        ],
      },
      getSerializedRateTransactionList: {
        title: 'getSerializedRateTransactionList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
        ],
      },
      getAgentRateTransactionList: {
        title: 'getAgentRateTransactionList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
        ],
      },
      getRecipientRateTransactionList: {
        title: 'getRecipientRateTransactionList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
        ],
      },
      getAgentRecord: {
        title: 'getAgentRecord',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
        ],
      },
      getAgentRecordList: {
        title: 'getAgentRecordList',
        params: [
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Account List', placeholder: 'address[] _agentAccountList (comma/newline separated)', type: 'address_array' },
        ],
      },
      testStakingRewards: {
        title: 'testStakingRewards',
        params: [
          { label: 'Last Update Time', placeholder: 'uint256 lastUpdateTime', type: 'uint' },
          { label: 'Test Update Time', placeholder: 'uint256 testUpdateTime', type: 'uint' },
          { label: 'Interest Rate', placeholder: 'uint256 interestRate', type: 'uint' },
          { label: 'Quantity', placeholder: 'uint256 quantity', type: 'uint' },
        ],
      },
      getStakingRewards: {
        title: 'getStakingRewards',
        params: [
          { label: 'Last Update Time', placeholder: 'uint256 lastUpdateTime', type: 'uint' },
          { label: 'Interest Rate', placeholder: 'uint256 interestRate', type: 'uint' },
          { label: 'Quantity', placeholder: 'uint256 quantity', type: 'uint' },
        ],
      },
      getTimeMultiplier: {
        title: 'getTimeMultiplier',
        params: [{ label: 'Time Rate Multiplier', placeholder: 'uint256 _timeRateMultiplier', type: 'uint' }],
      },
      getAccountTimeInSecondeSinceUpdate: {
        title: 'getAccountTimeInSecondeSinceUpdate',
        params: [{ label: 'Token Last Update', placeholder: 'uint256 _tokenLastUpdate', type: 'uint' }],
      },
      getMillenniumTimeIntervalDivisor: {
        title: 'getMillenniumTimeIntervalDivisor',
        params: [{ label: 'Time In Seconds', placeholder: 'uint256 _timeInSeconds', type: 'uint' }],
      },
    }),
    [],
  );
  const spCoinWriteMethodDefs = useMemo<
    Record<SpCoinWriteMethod, { title: string; params: ParamDef[]; executable?: boolean }>
  >(
    () => ({
      addRecipient: {
        title: 'addRecipient',
        params: [{ label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' }],
      },
      addRecipients: {
        title: 'addRecipients',
        params: [
          { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
          {
            label: 'Recipient Account List',
            placeholder: 'address[] _recipientAccountList (comma/newline separated)',
            type: 'address_array',
          },
        ],
      },
      addAgent: {
        title: 'addAgent',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
        ],
      },
      addAgents: {
        title: 'addAgents',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Account List', placeholder: 'address[] _agentAccountList (comma/newline separated)', type: 'address_array' },
        ],
      },
      addAccountRecord: {
        title: 'addAccountRecord',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      addAccountRecords: {
        title: 'addAccountRecords',
        params: [{ label: 'Account List Keys', placeholder: 'address[] _accountListKeys (comma/newline separated)', type: 'address_array' }],
      },
      addSponsorship: {
        title: 'addSponsorship',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
          { label: 'Whole Amount', placeholder: 'string _strWholeAmount', type: 'string' },
          { label: 'Decimal Amount', placeholder: 'string _strDecimalAmount', type: 'string' },
        ],
      },
      addAgentSponsorship: {
        title: 'addAgentSponsorship',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _accountAgentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
          { label: 'Transaction Quantity', placeholder: 'number _transactionQty (e.g., 12.34)', type: 'string' },
        ],
      },
      addBackDatedSponsorship: {
        title: 'addBackDatedSponsorship',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
          { label: 'Whole Amount', placeholder: 'string _strWholeAmount', type: 'string' },
          { label: 'Decimal Amount', placeholder: 'string _strDecimalAmount', type: 'string' },
          { label: 'Transaction Back Date', placeholder: 'Select date', type: 'date' },
        ],
      },
      addBackDatedAgentSponsorship: {
        title: 'addBackDatedAgentSponsorship',
        params: [
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate Key', placeholder: 'uint256 _recipientRateKey', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _accountAgentKey', type: 'address' },
          { label: 'Agent Rate Key', placeholder: 'uint256 _agentRateKey', type: 'uint' },
          { label: 'Transaction Quantity', placeholder: 'number _transactionQty (e.g., 12.34)', type: 'string' },
          { label: 'Transaction Back Date', placeholder: 'Select date', type: 'date' },
        ],
      },
      unSponsorRecipient: {
        title: 'unSponsorRecipient',
        params: [{ label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' }],
      },
      deleteAccountRecord: {
        title: 'deleteAccountRecord',
        params: [{ label: 'Account Key', placeholder: 'address _accountKey', type: 'address' }],
      },
      deleteAccountRecords: {
        title: 'deleteAccountRecords',
        params: [{ label: 'Account List Keys', placeholder: 'address[] _accountListKeys (comma/newline separated)', type: 'address_array' }],
      },
      deleteAgentRecord: {
        title: 'deleteAgentRecord',
        executable: false,
        params: [
          { label: 'Account Key', placeholder: 'address _accountKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Account Agent Key', placeholder: 'address _accountAgentKey', type: 'address' },
        ],
      },
      updateAccountStakingRewards: {
        title: 'updateAccountStakingRewards',
        params: [{ label: 'Source Key', placeholder: 'address _sourceKey', type: 'address' }],
      },
      depositSponsorStakingRewards: {
        title: 'depositSponsorStakingRewards',
        params: [
          { label: 'Sponsor Account', placeholder: 'address _sponsorAccount', type: 'address' },
          { label: 'Recipient Account', placeholder: 'address _recipientAccount', type: 'address' },
          { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
          { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
        ],
      },
      depositRecipientStakingRewards: {
        title: 'depositRecipientStakingRewards',
        params: [
          { label: 'Sponsor Account', placeholder: 'address _sponsorAccount', type: 'address' },
          { label: 'Recipient Account', placeholder: 'address _recipientAccount', type: 'address' },
          { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
          { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
        ],
      },
      depositAgentStakingRewards: {
        title: 'depositAgentStakingRewards',
        params: [
          { label: 'Sponsor Account', placeholder: 'address _sponsorAccount', type: 'address' },
          { label: 'Recipient Account', placeholder: 'address _recipientAccount', type: 'address' },
          { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
          { label: 'Agent Account', placeholder: 'address _agentAccount', type: 'address' },
          { label: 'Agent Rate', placeholder: 'uint256 _agentRate', type: 'uint' },
          { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
        ],
      },
      depositStakingRewards: {
        title: 'depositStakingRewards',
        params: [
          { label: 'Account Type', placeholder: 'uint256 _accountType', type: 'uint' },
          { label: 'Sponsor Key', placeholder: 'address _sponsorKey', type: 'address' },
          { label: 'Recipient Key', placeholder: 'address _recipientKey', type: 'address' },
          { label: 'Recipient Rate', placeholder: 'uint256 _recipientRate', type: 'uint' },
          { label: 'Agent Key', placeholder: 'address _agentKey', type: 'address' },
          { label: 'Agent Rate', placeholder: 'uint256 _agentRate', type: 'uint' },
          { label: 'Amount', placeholder: 'uint256 _amount', type: 'uint' },
        ],
      },
    }),
    [],
  );
  const activeSpCoinReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
  const activeSpCoinWriteDef = spCoinWriteMethodDefs[selectedSpCoinWriteMethod];
  useEffect(() => {
    if (backdatePopupParamIdx === null) return;
    const def = activeSpCoinWriteDef.params[backdatePopupParamIdx];
    if (!def || def.type !== 'date') {
      setBackdatePopupParamIdx(null);
    }
  }, [activeSpCoinWriteDef.params, backdatePopupParamIdx]);
  const updateSpWriteParamAtIndex = useCallback((idx: number, value: string) => {
    setSpWriteParams((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);
  const applyBackdateBy = useCallback(
    (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx: number | null = backdatePopupParamIdx) => {
      if (targetIdx === null) return;
      const years = Number(yearsRaw || '0');
      const months = Number(monthsRaw || '0');
      const days = Number(daysRaw || '0');
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      const backdated = getBackdatedDate(base, years, months, days);
      updateSpWriteParamAtIndex(targetIdx, formatDateInput(backdated));
    },
    [backdatePopupParamIdx, updateSpWriteParamAtIndex],
  );
  const selectedBackdateDate = useMemo(() => {
    if (backdatePopupParamIdx === null) return null;
    return parseDateInput(spWriteParams[backdatePopupParamIdx] || '');
  }, [backdatePopupParamIdx, spWriteParams]);
  const isViewingCurrentMonth = useMemo(
    () => calendarViewYear === today.getFullYear() && calendarViewMonth === today.getMonth(),
    [calendarViewMonth, calendarViewYear, today],
  );
  const isViewingFutureMonth = useMemo(() => {
    if (calendarViewYear > today.getFullYear()) return true;
    if (calendarViewYear === today.getFullYear() && calendarViewMonth > today.getMonth()) return true;
    return false;
  }, [calendarViewMonth, calendarViewYear, today]);
  useEffect(() => {
    if (backdatePopupParamIdx === null) return;
    const base = selectedBackdateDate || today;
    setCalendarViewYear(base.getFullYear());
    setCalendarViewMonth(base.getMonth());
  }, [backdatePopupParamIdx, selectedBackdateDate, today]);
  useEffect(() => {
    if (!selectedBackdateDate) return;
    if (selectedBackdateDate.getTime() > today.getTime()) return;
    const diff = calculateBackdateParts(today, selectedBackdateDate);
    setBackdateYears(String(diff.years));
    setBackdateMonths(String(diff.months));
    setBackdateDays(String(diff.days));
  }, [selectedBackdateDate, today]);
  const minSelectableYear = useMemo(() => today.getFullYear() - 11, [today]);
  const maxBackdateYears = useMemo(() => Math.max(0, today.getFullYear() - 2015), [today]);
  const calendarYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = today.getFullYear(); y >= minSelectableYear; y--) years.push(y);
    return years;
  }, [minSelectableYear, today]);
  const calendarMonthOptions = useMemo(() => {
    const maxMonthIndex = calendarViewYear === today.getFullYear() ? today.getMonth() : 11;
    return CALENDAR_MONTH_LABELS.map((label, monthIndex) => ({ label, monthIndex })).filter(
      (entry) => entry.monthIndex <= maxMonthIndex,
    );
  }, [calendarViewYear, today]);
  useEffect(() => {
    if (!calendarYearOptions.includes(calendarViewYear)) {
      setCalendarViewYear(today.getFullYear());
    }
  }, [calendarViewYear, calendarYearOptions, today]);
  useEffect(() => {
    const allowed = new Set(calendarMonthOptions.map((entry) => entry.monthIndex));
    if (!allowed.has(calendarViewMonth)) {
      const fallback = calendarMonthOptions[calendarMonthOptions.length - 1];
      if (fallback) setCalendarViewMonth(fallback.monthIndex);
    }
  }, [calendarMonthOptions, calendarViewMonth]);
  const calendarDayCells = useMemo(() => {
    const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, key: `day-${day}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, key: `tail-${cells.length}` });
    }
    return cells;
  }, [calendarViewMonth, calendarViewYear]);
  const shiftCalendarMonth = useCallback(
    (delta: number) => {
      const next = new Date(calendarViewYear, calendarViewMonth + delta, 1);
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      if (next.getTime() > currentMonthStart.getTime()) return;
      setCalendarViewYear(next.getFullYear());
      setCalendarViewMonth(next.getMonth());
    },
    [calendarViewMonth, calendarViewYear, today],
  );
  const connectionModeOptions = useMemo(
    () =>
      [
        { value: 'metamask' as ConnectionMode, label: 'MetaMask' },
        { value: 'hardhat' as ConnectionMode, label: 'Hardhat Local' },
      ].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const erc20ReadOptions = useMemo(
    () =>
      (['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf', 'allowance'] as Erc20ReadMethod[]).sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );
  const erc20WriteOptions = useMemo(
    () => (['transfer', 'approve', 'transferFrom'] as Erc20WriteMethod[]).sort((a, b) => a.localeCompare(b)),
    [],
  );
  const spCoinReadOptions = useMemo(() => {
    const all = (Object.keys(spCoinReadMethodDefs) as SpCoinReadMethod[]).sort((a, b) => a.localeCompare(b));
    if (!hideUnexecutables) return all;
    return all.filter((name) => spCoinReadMethodDefs[name].executable !== false);
  }, [hideUnexecutables, spCoinReadMethodDefs]);
  const spCoinWriteOptions = useMemo(() => {
    const all = (Object.keys(spCoinWriteMethodDefs) as SpCoinWriteMethod[]).sort((a, b) => a.localeCompare(b));
    if (!hideUnexecutables) return all;
    return all.filter((name) => spCoinWriteMethodDefs[name].executable !== false);
  }, [hideUnexecutables, spCoinWriteMethodDefs]);
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
      date.setHours(Number(backdateHours || '0'), Number(backdateMinutes || '0'), Number(backdateSeconds || '0'), 0);
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
  }, [backdateHours, backdateMinutes, backdateSeconds]);
  const stringifyResult = useCallback((result: unknown) => {
    if (typeof result === 'string') return result;
    return JSON.stringify(result, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  }, []);
  const runSelectedSpCoinReadMethod = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      const args = activeSpCoinReadDef.params.map((def, idx) => coerceParamValue(spReadParams[idx], def));
      let result: unknown;

      switch (selectedSpCoinReadMethod) {
        case 'getSPCoinHeaderRecord': {
          const getBody = Boolean(args[0]);
          const header = await (contract as any).getSerializedSPCoinHeader();
          if (!getBody) {
            result = { header };
            break;
          }
          const accountList = (await (contract as any).getAccountList()) as string[];
          const body = await Promise.all(
            accountList.map(async (accountKey) => ({
              accountKey,
              serializedAccountRecord: await (contract as any).getSerializedAccountRecord(accountKey),
            })),
          );
          result = { header, body };
          break;
        }
        case 'getAccountListSize': {
          const accountList = (await (contract as any).getAccountList()) as string[];
          result = accountList.length;
          break;
        }
        case 'getAccountRecipientListSize': {
          const recipientList = (await (contract as any).getAccountRecipientList(args[0])) as string[];
          result = recipientList.length;
          break;
        }
        case 'getAccountRecord': {
          const accountKey = String(args[0]);
          const serializedAccountRecord = await (contract as any).getSerializedAccountRecord(accountKey);
          const serializedAccountRewards = await (contract as any).getSerializedAccountRewards(accountKey);
          const recipientAccountList = await (contract as any).getAccountRecipientList(accountKey);
          result = { accountKey, serializedAccountRecord, serializedAccountRewards, recipientAccountList };
          break;
        }
        case 'getAccountRecords': {
          const accountList = (await (contract as any).getAccountList()) as string[];
          result = await Promise.all(
            accountList.map(async (accountKey) => ({
              accountKey,
              serializedAccountRecord: await (contract as any).getSerializedAccountRecord(accountKey),
            })),
          );
          break;
        }
        case 'getAccountStakingRewards': {
          result = await (contract as any).getSerializedAccountRewards(args[0]);
          break;
        }
        case 'getRewardTypeRecord': {
          const rewardAccounts = await (contract as any).getRewardAccounts(args[0], args[1]);
          result = { reward: args[2], rewardAccounts };
          break;
        }
        case 'getAccountRewardTransactionList':
        case 'getAccountRewardTransactionRecord':
        case 'getAccountRateRecordList':
        case 'getRateTransactionList': {
          result = args[0];
          break;
        }
        case 'getRecipientRateRecord': {
          const serializedRecipientRateList = await (contract as any).getSerializedRecipientRateList(args[0], args[1], args[2]);
          const agentAccountList = await (contract as any).getRecipientRateAgentList(args[0], args[1], args[2]);
          const transactions = await (contract as any).getRecipientRateTransactionList(args[0], args[1], args[2]);
          result = { serializedRecipientRateList, agentAccountList, transactions };
          break;
        }
        case 'getRecipientRateRecordList': {
          const rates = (await (contract as any).getRecipientRateList(args[0], args[1])) as Array<string | bigint>;
          result = await Promise.all(
            rates.map(async (rate) => ({
              recipientRateKey: String(rate),
              serializedRecipientRateList: await (contract as any).getSerializedRecipientRateList(args[0], args[1], String(rate)),
            })),
          );
          break;
        }
        case 'getRecipientRecord': {
          const serializedRecipientRecordList = await (contract as any).getSerializedRecipientRecordList(args[0], args[1]);
          const recipientRateList = await (contract as any).getRecipientRateList(args[0], args[1]);
          result = { serializedRecipientRecordList, recipientRateList };
          break;
        }
        case 'getRecipientRecordList': {
          const sponsorKey = String(args[0]);
          const recipientAccountList = args[1] as string[];
          result = await Promise.all(
            recipientAccountList.map(async (recipientKey) => ({
              recipientKey,
              serializedRecipientRecordList: await (contract as any).getSerializedRecipientRecordList(sponsorKey, recipientKey),
            })),
          );
          break;
        }
        case 'getAgentRateRecord': {
          const serializedAgentRateRecord = await (contract as any).serializeAgentRateRecordStr(args[0], args[1], args[2], args[3], args[4]);
          const transactions = await (contract as any).getSerializedRateTransactionList(args[0], args[1], args[2], args[3], args[4]);
          result = { serializedAgentRateRecord, transactions };
          break;
        }
        case 'getAgentRateRecordList': {
          const agentRateKeys = (await (contract as any).getAgentRateList(args[0], args[1], args[2], args[3])) as Array<string | bigint>;
          result = await Promise.all(
            agentRateKeys.map(async (agentRateKey) => ({
              agentRateKey: String(agentRateKey),
              serializedAgentRateRecord: await (contract as any).serializeAgentRateRecordStr(
                args[0],
                args[1],
                args[2],
                args[3],
                String(agentRateKey),
              ),
            })),
          );
          break;
        }
        case 'getAgentRateTransactionList': {
          result = await (contract as any).getSerializedRateTransactionList(args[0], args[1], args[2], args[3], args[4]);
          break;
        }
        case 'getAgentRecord': {
          const stakedSPCoins = await (contract as any).getAgentTotalRecipient(args[0], args[1], args[2], args[3]);
          const agentRateList = await (contract as any).getAgentRateList(args[0], args[1], args[2], args[3]);
          result = { agentKey: args[3], stakedSPCoins, agentRateList };
          break;
        }
        case 'getAgentRecordList': {
          const sponsorKey = String(args[0]);
          const recipientKey = String(args[1]);
          const recipientRateKey = String(args[2]);
          const agentAccountList = args[3] as string[];
          result = await Promise.all(
            agentAccountList.map(async (agentKey) => ({
              agentKey,
              stakedSPCoins: await (contract as any).getAgentTotalRecipient(sponsorKey, recipientKey, recipientRateKey, agentKey),
              agentRateList: await (contract as any).getAgentRateList(sponsorKey, recipientKey, recipientRateKey, agentKey),
            })),
          );
          break;
        }
        default:
          result = await (contract as any)[selectedSpCoinReadMethod](...args);
          break;
      }

      const out = stringifyResult(result);
      appendLog(`${activeSpCoinReadDef.title}(${args.join(', ')}) -> ${out}`);
      setStatus(`${activeSpCoinReadDef.title} read complete.`);
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
      const args = activeSpCoinWriteDef.params.map((def, idx) => coerceParamValue(spWriteParams[idx], def));
      const submitWrite = async (
        label: string,
        writeCall: (contract: Contract) => Promise<any>,
      ) => {
        setStatus(`Submitting ${label}...`);
        const tx = await executeWriteConnected(label, writeCall, selectedHardhatAccount?.address);
        appendLog(`${label} tx sent: ${String(tx?.hash || '(no hash)')}`);
        const receipt = await tx.wait();
        appendLog(`${label} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      };

      switch (selectedSpCoinWriteMethod) {
        case 'addRecipients': {
          const recipientList = args[1] as string[];
          for (const recipientKey of recipientList) {
            await submitWrite(`addRecipient(${recipientKey})`, (contract) => (contract as any).addRecipient(recipientKey));
          }
          break;
        }
        case 'addAgents': {
          const agentList = args[2] as string[];
          for (const agentKey of agentList) {
            await submitWrite(`addAgent(${String(args[0])}, ${String(args[1])}, ${agentKey})`, (contract) =>
              (contract as any).addAgent(args[0], args[1], agentKey),
            );
          }
          break;
        }
        case 'addAccountRecords': {
          const accountList = args[0] as string[];
          for (const accountKey of accountList) {
            await submitWrite(`addAccountRecord(${accountKey})`, (contract) => (contract as any).addAccountRecord(accountKey));
          }
          break;
        }
        case 'addAgentSponsorship': {
          const amount = splitDecimalAmount(String(args[4]));
          await submitWrite(activeSpCoinWriteDef.title, (contract) =>
            (contract as any).addSponsorship(args[0], args[1], args[2], args[3], amount.whole, amount.fractional),
          );
          break;
        }
        case 'addBackDatedAgentSponsorship': {
          const amount = splitDecimalAmount(String(args[4]));
          await submitWrite(activeSpCoinWriteDef.title, (contract) =>
            (contract as any).addBackDatedSponsorship(args[0], args[1], args[2], args[3], amount.whole, amount.fractional, args[5]),
          );
          break;
        }
        case 'deleteAccountRecords': {
          const accountList = args[0] as string[];
          for (const accountKey of accountList) {
            await submitWrite(`deleteAccountRecord(${accountKey})`, (contract) => (contract as any).deleteAccountRecord(accountKey));
          }
          break;
        }
        case 'deleteAgentRecord': {
          throw new Error('deleteAgentRecord is not exposed as a callable public contract method in current ABI.');
        }
        case 'depositSponsorStakingRewards': {
          await submitWrite(activeSpCoinWriteDef.title, (contract) =>
            (contract as any).depositStakingRewards(
              SPONSOR_ACCOUNT_TYPE,
              args[0],
              args[1],
              args[2],
              args[0],
              '0',
              args[3],
            ),
          );
          break;
        }
        case 'depositRecipientStakingRewards': {
          await submitWrite(activeSpCoinWriteDef.title, (contract) =>
            (contract as any).depositStakingRewards(
              RECIPIENT_ACCOUNT_TYPE,
              args[0],
              args[1],
              args[2],
              BURN_ADDRESS,
              '0',
              args[3],
            ),
          );
          break;
        }
        case 'depositAgentStakingRewards': {
          await submitWrite(activeSpCoinWriteDef.title, (contract) =>
            (contract as any).depositStakingRewards(
              AGENT_ACCOUNT_TYPE,
              args[0],
              args[1],
              args[2],
              args[3],
              args[4],
              args[5],
            ),
          );
          break;
        }
        default:
          await submitWrite(`${activeSpCoinWriteDef.title}(${args.join(', ')})`, (contract) =>
            (contract as any)[selectedSpCoinWriteMethod](...args),
          );
          break;
      }

      setStatus(`${activeSpCoinWriteDef.title} complete.`);
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
          <article className={cardStyle}>
            <div className="mt-1 grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <h2 className="text-lg font-semibold text-[#5981F3]">Network Connection Mode</h2>
              <div className="justify-self-start md:justify-self-end">
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
              <label className="grid items-center gap-3 md:grid-cols-[auto_auto] md:justify-self-end">
                <span className="text-right text-sm font-semibold text-[#8FA8FF]">Chain Id</span>
                <input
                  type="text"
                  value={effectiveConnectedChainId || '(unknown)'}
                  readOnly
                  className={`${inputStyle} w-[9ch] min-w-[9ch] text-right`}
                />
              </label>
            </div>

            {mode === 'hardhat' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
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
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    className={`${buttonStyle} text-[#8FA8FF] focus:text-black`}
                    onClick={loadHardhatAccounts}
                  >
                    Refresh Harhat Accounts
                  </button>
                  <label htmlFor="hardhat-account-index" className="sr-only">
                    Hardhat account index
                  </label>
                  <select
                    id="hardhat-account-index"
                    className="w-[6ch] rounded-lg border border-[#334155] bg-[#0E111B] px-2 py-2 text-sm text-white"
                    value={String(selectedHardhatIndex)}
                    onChange={(e) => setSelectedHardhatIndex(Number.parseInt(e.target.value, 10) || 0)}
                    aria-label="Hardhat account index"
                    title="Hardhat account index"
                  >
                    {Array.from({ length: 20 }).map((_, idx) => (
                      <option key={`hardhat-idx-${idx}`} value={String(idx)}>
                        {idx}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedHardhatAccount?.address || ''}
                    placeholder="Selected account address"
                  />
                </label>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedHardhatAccount?.privateKey || ''}
                    placeholder="Select Hardhat account to view private key"
                  />
                </label>
              </div>
            )}
            {mode !== 'hardhat' && (
              <div className="mt-4">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={effectiveConnectedAddress || ''}
                    placeholder="Selected account address"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">SponsorCoin Contract Address</span>
                <input
                  className={inputStyle}
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="SponsorCoin contract address"
                />
              </label>
              {status !== 'Ready' && (
                <div className="text-sm text-slate-300">
                  <div className="mb-2">Status: {status}</div>
                </div>
              )}
            </div>
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
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                runSelectedSpCoinWriteMethod={runSelectedSpCoinWriteMethod}
                formatDateTimeDisplay={formatDateTimeDisplay}
                formatDateInput={formatDateInput}
                backdateHours={backdateHours}
                setBackdateHours={setBackdateHours}
                backdateMinutes={backdateMinutes}
                setBackdateMinutes={setBackdateMinutes}
                backdateSeconds={backdateSeconds}
                setBackdateSeconds={setBackdateSeconds}
                setBackdateYears={setBackdateYears}
                setBackdateMonths={setBackdateMonths}
                setBackdateDays={setBackdateDays}
                backdatePopupParamIdx={backdatePopupParamIdx}
                setBackdatePopupParamIdx={setBackdatePopupParamIdx}
                shiftCalendarMonth={shiftCalendarMonth}
                calendarMonthOptions={calendarMonthOptions}
                calendarViewMonth={calendarViewMonth}
                setCalendarViewMonth={setCalendarViewMonth}
                calendarYearOptions={calendarYearOptions}
                calendarViewYear={calendarViewYear}
                setCalendarViewYear={setCalendarViewYear}
                isViewingCurrentMonth={isViewingCurrentMonth}
                setHoverCalendarWarning={setHoverCalendarWarning}
                CALENDAR_WEEK_DAYS={CALENDAR_WEEK_DAYS}
                calendarDayCells={calendarDayCells}
                isViewingFutureMonth={isViewingFutureMonth}
                today={today}
                selectedBackdateDate={selectedBackdateDate}
                hoverCalendarWarning={hoverCalendarWarning}
                maxBackdateYears={maxBackdateYears}
                backdateYears={backdateYears}
                backdateMonths={backdateMonths}
                backdateDays={backdateDays}
                applyBackdateBy={applyBackdateBy}
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
