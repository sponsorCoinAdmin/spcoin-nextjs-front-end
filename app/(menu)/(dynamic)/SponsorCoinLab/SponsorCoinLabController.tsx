// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { BrowserProvider, JsonRpcProvider, Wallet } from 'ethers';
import type { Contract } from 'ethers';
import type { Signer } from 'ethers';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  defaultMissingImage,
  getAccountLogoURL,
  getTokenLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';
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
type LabCardId = 'network' | 'contract' | 'methods' | 'log' | 'output';
type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type ScriptStepPanelMode = MethodPanelMode;
type LabScriptParam = {
  key: string;
  value: string;
};

type LabScriptStep = {
  step: number;
  name: string;
  panel: ScriptStepPanelMode;
  method: string;
  params: LabScriptParam[];
  breakpoint?: boolean;
  network?: string;
  mode?: ConnectionMode;
  'msg.sender'?: string;
};

type LabScript = {
  id: string;
  name: string;
  'Date Created': string;
  network: string;
  steps: LabScriptStep[];
};

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
  address: string;
  privateKey?: string;
  signerKey?: string;
  name?: string;
  symbol?: string;
};

type SpCoinDeploymentFile = {
  chainId?: Record<string, Record<string, unknown>>;
};

const spCoinLabKey = 'spCoinLabKey';
const spCoinLabScriptsKey = 'spCoinLabScriptsKey';
const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_NETWORK_NAME = 'SponsorCoin HH BASE';
const HARDHAT_SCRIPT_NETWORK_LABEL = 'Hardhat Ec2-BASE';
const MISSING_LOCAL_ACCOUNT_NAME = 'Account Not Found on Local';
const MISSING_LOCAL_ACCOUNT_SYMBOL = 'MISSING';

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.45rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const actionButtonStyle =
  'h-[42px] rounded px-4 py-2 text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60';
const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';
const hiddenScrollbarClass =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

type TestAccountFileEntry =
  | string
  | {
      address?: unknown;
      privateKey?: unknown;
    };

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

type LabCardHeaderProps = {
  title: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  titleClassName?: string;
  leftSlot?: React.ReactNode;
  headerButtons?: React.ReactNode;
  secondaryRow?: React.ReactNode;
};

function LabCardHeader({
  title,
  isExpanded,
  onToggleExpand,
  titleClassName = 'text-lg font-semibold text-[#5981F3]',
  leftSlot,
  headerButtons,
  secondaryRow,
}: LabCardHeaderProps) {
  return (
    <div
      onDoubleClick={onToggleExpand}
      title={isExpanded ? 'Double-click to return to shared view' : 'Double-click to expand'}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b border-[#2B3A67] pb-[0.32rem]">
        <div className="flex min-h-10 items-center">{leftSlot}</div>
        <div className="min-w-0 justify-self-center text-center">
          <div className={`${titleClassName} text-center`}>{title}</div>
        </div>
        <div
          className="flex shrink-0 items-center justify-self-end gap-2"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {headerButtons}
          <button
            type="button"
            onClick={onToggleExpand}
            className="relative -right-[9px] -top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
            title={isExpanded ? 'Return to shared view' : 'Expand this card'}
            aria-label={isExpanded ? 'Return to shared view' : 'Expand this card'}
          >
            {isExpanded ? 'x' : '+'}
          </button>
        </div>
      </div>
      {secondaryRow ? <div className="mt-3">{secondaryRow}</div> : null}
    </div>
  );
}

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAddressValue(value: string) {
  const trimmed = String(value || '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
}

function formatScriptCreatedDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day}-${year}, ${hours}:${minutes}:${seconds}`;
}

function inferScriptCreatedDate(script: Pick<LabScript, 'id'> & Partial<Record<'Date Created', unknown>>) {
  const existing = String(script['Date Created'] || '').trim();
  if (existing) return existing;

  const timestampMatch = /^script-(\d+)-/.exec(String(script.id || '').trim());
  const parsedTimestamp = timestampMatch ? Number(timestampMatch[1]) : Number.NaN;
  return Number.isFinite(parsedTimestamp) ? formatScriptCreatedDate(parsedTimestamp) : formatScriptCreatedDate(new Date());
}

function parseListParam(raw: string): string[] {
  return String(raw || '')
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isIntegerString(value: string) {
  return /^-?\d+$/.test(String(value || '').trim());
}

function isAddressLike(value: string) {
  return /^0[xX][0-9a-fA-F]{40}$/.test(String(value || '').trim());
}

function isHashLike(value: string) {
  return /^0[xX][0-9a-fA-F]{64,}$/.test(String(value || '').trim());
}

function formatDecimalString(value: string) {
  const trimmed = String(value || '').trim();
  if (!isIntegerString(trimmed)) return trimmed;
  const negative = trimmed.startsWith('-');
  const digits = negative ? trimmed.slice(1) : trimmed;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

function formatOutputValue(value: unknown): unknown {
  if (typeof value === 'bigint') return formatDecimalString(value.toString());
  if (Array.isArray(value)) return value.map((entry) => formatOutputValue(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, formatOutputValue(entry)]),
    );
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || isAddressLike(trimmed) || isHashLike(trimmed)) return value;
    if (isIntegerString(trimmed)) return formatDecimalString(trimmed);
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return formatDecimalString(String(Math.trunc(value)));
  return value;
}

function buildDefaultScriptName(index: number) {
  return `Script ${index}`;
}

function formatOutputDisplayValue(value: unknown) {
  const normalized = formatOutputValue(value);
  if (typeof normalized === 'string') return normalized;
  return JSON.stringify(normalized, null, 2);
}

function buildMethodCallEntry(
  method: string,
  params?: Array<{ label: string; value: unknown }>,
) {
  return {
    method,
    parameters: (params || []).map((entry) => ({
      label: entry.label,
      value: entry.value,
    })),
  };
}

export default function SponsorCoinLabPage() {
  const { exchangeContext } = useExchangeContext();
  const useLocalSpCoinAccessPackage =
    exchangeContext?.settings?.spCoinAccessManager?.useLocalPackage !== false;
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [contractAddress, setContractAddress] = useState('');
  const [selectedSponsorCoinVersion, setSelectedSponsorCoinVersion] = useState('');
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
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin SandBox] Ready']);
  const [formattedOutputDisplay, setFormattedOutputDisplay] = useState('(no output yet)');
  const [treeOutputDisplay, setTreeOutputDisplay] = useState('(no tree yet)');
  const [outputPanelMode, setOutputPanelMode] = useState<OutputPanelMode>('formatted');
  const [scripts, setScripts] = useState<LabScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [scriptNameInput, setScriptNameInput] = useState('');
  const [isScriptOptionsOpen, setIsScriptOptionsOpen] = useState(false);
  const [isNewScriptHovered, setIsNewScriptHovered] = useState(false);
  const [isDeleteScriptHovered, setIsDeleteScriptHovered] = useState(false);
  const [newScriptHoverTone, setNewScriptHoverTone] = useState<'neutral' | 'invalid' | 'valid'>('neutral');
  const [deleteScriptHoverTone, setDeleteScriptHoverTone] = useState<'invalid' | 'valid'>('invalid');
  const [writeTraceEnabled, setWriteTraceEnabled] = useState(false);
  const [recipientRateKeyOptions, setRecipientRateKeyOptions] = useState<string[]>([]);
  const [agentRateKeyOptions, setAgentRateKeyOptions] = useState<string[]>([]);
  const [recipientRateKeyHelpText, setRecipientRateKeyHelpText] = useState('');
  const [agentRateKeyHelpText, setAgentRateKeyHelpText] = useState('');
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [validationPopupFields, setValidationPopupFields] = useState<string[]>([]);

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
  const [spReadParams, setSpReadParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spWriteParams, setSpWriteParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spCoinLabHydrated, setSpCoinLabHydrated] = useState(false);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);
  const copyTextToClipboard = useCallback(
    async (label: string, value: string) => {
      try {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
          throw new Error('Clipboard API unavailable.');
        }
        await navigator.clipboard.writeText(value);
        setStatus(`${label} copied to clipboard.`);
        appendLog(`${label} copied to clipboard.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown clipboard error.';
        setStatus(`${label} copy failed: ${message}`);
        appendLog(`${label} copy failed: ${message}`);
      }
    },
    [appendLog],
  );
  const appendWriteTrace = useCallback(
    (line: string) => {
      if (!writeTraceEnabled) return;
      appendLog(`[TRACE] ${line}`);
    },
    [appendLog, writeTraceEnabled],
  );
  const clearInvalidField = useCallback((fieldId: string) => {
    if (!fieldId) return;
    setInvalidFieldIds((prev) => prev.filter((entry) => entry !== fieldId));
  }, []);
  const showValidationPopup = useCallback((fieldIds: string[], labels: string[]) => {
    setInvalidFieldIds(fieldIds);
    setValidationPopupFields(labels);
    if (typeof window !== 'undefined' && fieldIds[0]) {
      window.setTimeout(() => {
        const target = document.querySelector(`[data-field-id="${fieldIds[0]}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | null;
        target?.focus();
      }, 0);
    }
  }, []);

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
    if (!address) {
      setAddAccountExistsOnLocal(null);
      return;
    }
    if (!isAddressLike(address)) {
      setAddAccountExistsOnLocal(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`/api/spCoin/accounts/${address}`, {
          cache: 'no-store',
        });
        if (cancelled) return;
        setAddAccountExistsOnLocal(response.ok);
      } catch {
        if (cancelled) return;
        setAddAccountExistsOnLocal(false);
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
  const addAccountValidation = useMemo(() => {
    const address = String(addAccountInput || '').trim();
    if (!address) {
      return { tone: 'neutral' as const, message: '' };
    }
    if (!isAddressLike(address)) {
      return { tone: 'invalid' as const, message: 'Invalid account address.' };
    }
    if (addAccountExistsOnLocal === null) {
      return { tone: 'neutral' as const, message: 'Checking local account record...' };
    }
    if (!addAccountExistsOnLocal) {
      return { tone: 'invalid' as const, message: 'Account not found' };
    }
    if (addAccountAlreadyListed) {
      return { tone: 'invalid' as const, message: 'Duplicate Account' };
    }
    return { tone: 'valid' as const, message: 'Selectable' };
  }, [addAccountAlreadyListed, addAccountExistsOnLocal, addAccountInput]);
  const deleteAccountValidation = useMemo(() => {
    const address = String(deleteAccountInput || '').trim();
    if (!address) {
      return { tone: 'neutral' as const, message: '' };
    }
    if (!isAddressLike(address)) {
      return { tone: 'invalid' as const, message: 'Invalid account address.' };
    }
    if (!deleteAccountExistsInList) {
      return { tone: 'invalid' as const, message: 'Account not found in testAccounts.json' };
    }
    return { tone: 'valid' as const, message: 'Selectable' };
  }, [deleteAccountExistsInList, deleteAccountInput]);
  const accountActionLabelClassName = useCallback((tone: 'neutral' | 'invalid' | 'valid') => {
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
  const contextNetworkName = useMemo(() => {
    return String((exchangeContext as any)?.network?.name || '').trim();
  }, [exchangeContext]);
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
  const selectedSignerAccountMetadata = useMemo(() => {
    const address = String(selectedHardhatAccount?.address || '').trim().toLowerCase();
    return hardhatAccountMetadata[address];
  }, [hardhatAccountMetadata, selectedHardhatAccount?.address]);
  const displayedSignerAccountAddress = useMemo(() => {
    return mode === 'hardhat' ? selectedHardhatAccount?.address || '' : effectiveConnectedAddress || '';
  }, [effectiveConnectedAddress, mode, selectedHardhatAccount?.address]);
  const displayedSignerAccountMetadata = useMemo(() => {
    const key = normalizeAddress(displayedSignerAccountAddress);
    return hardhatAccountMetadata[key] ?? selectedSignerAccountMetadata;
  }, [displayedSignerAccountAddress, hardhatAccountMetadata, selectedSignerAccountMetadata]);
  const selectedVersionSymbol = String(selectedSponsorCoinVersionEntry?.symbol || '');
  const selectedSponsorCoinLogoURL = useMemo(() => {
    const address = String(selectedSponsorCoinVersionEntry?.address || '').trim();
    if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) return '';
    return getTokenLogoURL({ chainId: HARDHAT_CHAIN_ID_DEC, address });
  }, [selectedSponsorCoinVersionEntry]);
  const selectedVersionSymbolWidthCh = Math.max(4, selectedVersionSymbol.length + 1);
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
  }, [methodPanelMode, selectedWriteMethod, selectedSpCoinWriteMethod, selectedReadMethod, selectedSpCoinReadMethod]);

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
    if (mode !== 'metamask') return;
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
  }, [appendWriteTrace, contextAddress, mode]);

  useEffect(() => {
    if (mode !== 'metamask') return;
    // Clear any stale hardhat signer/account immediately when switching modes.
    setConnectedAddress('');
    setActiveSigner(null);
  }, [mode]);

  useEffect(() => {
    setActiveSigner(null);
    setConnectedAddress('');
  }, [useLocalSpCoinAccessPackage]);

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
    appendWriteTrace(`connectSigner invoked; mode=${mode}`);
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
      appendWriteTrace(`connectSigner returning MetaMask signer ${address}`);
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
    appendWriteTrace(`connectSigner returning Hardhat signer ${address}`);
    return wallet;
  }, [appendLog, appendWriteTrace, mode, rpcUrl, selectedHardhatAccount]);

  const ensureReadRunner = useCallback(async () => {
    if (mode === 'hardhat') {
      appendWriteTrace('ensureReadRunner using Hardhat JsonRpcProvider');
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      return provider;
    }
    appendWriteTrace('ensureReadRunner using MetaMask BrowserProvider');
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
  }, [appendWriteTrace, mode, rpcUrl]);

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
      appendWriteTrace(`executeHHConnected start; desired=${account.address}`);

      const tryWithSigner = async (signer: Signer) => {
        const signerAddress = await signer.getAddress();
        appendWriteTrace(`executeHHConnected using signer=${signerAddress}`);
        const contract = createSpCoinContract(target, signer);
        return writeCall(contract, signer);
      };

      appendWriteTrace('executeHHConnected creating fresh hardhat wallet signer');
      const signer = new Wallet(account.privateKey, provider);
      const signerAddress = await signer.getAddress();
      setActiveSigner(signer);
      setConnectedAddress(signerAddress);
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      return await tryWithSigner(signer);
    },
    [appendWriteTrace, requireContractAddress, resolveHardhatAccount, rpcUrl],
  );

  const executeMetaMaskConnected = useCallback(
    async (writeCall: (contract: Contract, signer: Signer) => Promise<any>) => {
      appendWriteTrace('executeMetaMaskConnected invoked');
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
        appendWriteTrace(`executeMetaMaskConnected reconnect branch; reason=${String((error as any)?.message || error)}`);
        const signer = await connectSigner();
        return await runWithSigner(signer);
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
      appendWriteTrace(`executeWriteConnected label=${label}; mode=${mode}; accountKey=${String(accountKey || '')}`);
      if (mode === 'hardhat') return executeHHConnected(accountKey, writeCall);
      appendLog(`${label}: using MetaMask signer flow.`);
      return executeMetaMaskConnected(writeCall);
    },
    [appendLog, appendWriteTrace, executeHHConnected, executeMetaMaskConnected, mode],
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
  }, [appendLog, appendWriteTrace, rpcUrl, shouldPromptHardhatBaseConnect, syncMetaMaskState]);

  const runHeaderRead = useCallback(async () => {
    const call = buildMethodCallEntry('getSerializedSPCoinHeader');
    try {
      setFormattedOutputDisplay('(no output yet)');
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Reading SponsorCoin header...');
      const result = (await (access.contract as any).getSerializedSPCoinHeader()) as string;
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result }));
      appendLog(`spCoinReadMethods/getSerializedSPCoinHeader -> ${result}`);
      setStatus('Header read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown header read error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`Header read failed: ${message}`);
      appendLog(`Header read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runAccountListRead = useCallback(async () => {
    const call = buildMethodCallEntry('getAccountList');
    try {
      setFormattedOutputDisplay('(no output yet)');
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Reading account list...');
      const list = (await (access.read as any).getAccountList()) as string[];
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result: list }));
      appendLog(`spCoinReadMethods/getAccountList -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`Account list read failed: ${message}`);
      appendLog(`Account list read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runTreeDump = useCallback(async () => {
    const listCall = buildMethodCallEntry('getAccountList');
    try {
      setTreeOutputDisplay('(no tree yet)');
      setOutputPanelMode('tree');
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      setStatus('Building tree dump...');
      const list = (await (access.read as any).getAccountList()) as string[];
      if (list.length === 0) {
        setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, result: [] }));
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const first = list[0];
      const tree = await (access.read as any).getAccountRecord(first);
      setTreeOutputDisplay(
        formatOutputDisplayValue({
          call: buildMethodCallEntry('getAccountRecord', [{ label: 'Account', value: first }]),
          result: tree,
        }),
      );
      appendLog(`spCoinReadMethods/getAccountRecord(${first}) -> ${JSON.stringify(tree)}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setTreeOutputDisplay(formatOutputDisplayValue({ call: listCall, error: message }));
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const activeWriteLabels = useMemo(() => getErc20WriteLabels(selectedWriteMethod), [selectedWriteMethod]);

  const activeReadLabels = useMemo(() => getErc20ReadLabels(selectedReadMethod), [selectedReadMethod]);
  const erc20WriteMissingEntries = useMemo(() => {
    const missingEntries: Array<{ id: string; label: string }> = [];
    if (mode === 'hardhat' && !String(selectedWriteSenderAddress || '').trim()) {
      missingEntries.push({ id: 'erc20-write-sender', label: 'msg.sender' });
    }
    if (!String(writeAddressA || '').trim()) {
      missingEntries.push({ id: 'erc20-write-address-a', label: activeWriteLabels.addressALabel });
    }
    if (activeWriteLabels.requiresAddressB && !String(writeAddressB || '').trim()) {
      missingEntries.push({ id: 'erc20-write-address-b', label: activeWriteLabels.addressBLabel });
    }
    if (!String(writeAmountRaw || '').trim()) {
      missingEntries.push({ id: 'erc20-write-amount', label: 'Amount' });
    }
    return missingEntries;
  }, [
    activeWriteLabels.addressALabel,
    activeWriteLabels.addressBLabel,
    activeWriteLabels.requiresAddressB,
    mode,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);
  const erc20ReadMissingEntries = useMemo(() => {
    const missingEntries: Array<{ id: string; label: string }> = [];
    if (activeReadLabels.requiresAddressA && !String(readAddressA || '').trim()) {
      missingEntries.push({ id: 'erc20-read-address-a', label: activeReadLabels.addressALabel });
    }
    if (activeReadLabels.requiresAddressB && !String(readAddressB || '').trim()) {
      missingEntries.push({ id: 'erc20-read-address-b', label: activeReadLabels.addressBLabel });
    }
    return missingEntries;
  }, [
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    readAddressA,
    readAddressB,
  ]);

  const runSelectedWriteMethod = useCallback(async () => {
    if (erc20WriteMissingEntries.length > 0) {
      showValidationPopup(
        erc20WriteMissingEntries.map((entry) => entry.id),
        erc20WriteMissingEntries.map((entry) => entry.label),
      );
      return;
    }
    const call = buildMethodCallEntry(selectedWriteMethod, [
      ...(mode === 'hardhat' || effectiveConnectedAddress
        ? [
            {
              label: 'msg.sender',
              value:
                mode === 'hardhat'
                  ? selectedWriteSenderAccount?.address ||
                    selectedWriteSenderAddress ||
                    selectedHardhatAccount?.address ||
                    ''
                  : effectiveConnectedAddress,
            },
          ]
        : []),
      { label: activeWriteLabels.addressALabel, value: writeAddressA },
      ...(activeWriteLabels.requiresAddressB
        ? [{ label: activeWriteLabels.addressBLabel, value: writeAddressB }]
        : []),
      { label: 'Amount', value: writeAmountRaw },
    ]);
    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runErc20WriteMethod({
        selectedWriteMethod,
        activeWriteLabels,
        writeAddressA,
        writeAddressB,
        writeAmountRaw,
        selectedHardhatAddress:
          mode === 'hardhat'
            ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || selectedHardhatAccount?.address
            : effectiveConnectedAddress,
        executeWriteConnected,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown write method error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`${activeWriteLabels.title} failed: ${message}`);
      appendLog(`${activeWriteLabels.title} failed: ${message}`);
    }
  }, [
    activeWriteLabels.title,
    appendLog,
    erc20WriteMissingEntries,
    executeWriteConnected,
    effectiveConnectedAddress,
    mode,
    selectedHardhatAccount?.address,
    selectedWriteSenderAccount?.address,
    selectedWriteSenderAddress,
    selectedWriteMethod,
    showValidationPopup,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  const runSelectedReadMethod = useCallback(async () => {
    if (erc20ReadMissingEntries.length > 0) {
      showValidationPopup(
        erc20ReadMissingEntries.map((entry) => entry.id),
        erc20ReadMissingEntries.map((entry) => entry.label),
      );
      return;
    }
    const call = buildMethodCallEntry(selectedReadMethod, [
      ...(activeReadLabels.requiresAddressA
        ? [{ label: activeReadLabels.addressALabel, value: readAddressA }]
        : []),
      ...(activeReadLabels.requiresAddressB
        ? [{ label: activeReadLabels.addressBLabel, value: readAddressB }]
        : []),
    ]);
    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runErc20ReadMethod({
        selectedReadMethod,
        activeReadLabels,
        readAddressA,
        readAddressB,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown read method error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`${activeReadLabels.title} failed: ${message}`);
      appendLog(`${activeReadLabels.title} failed: ${message}`);
    }
  }, [
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.title,
    appendLog,
    erc20ReadMissingEntries,
    ensureReadRunner,
    readAddressA,
    readAddressB,
    requireContractAddress,
    selectedReadMethod,
    showValidationPopup,
  ]);
  const spCoinReadMethodDefs = SPCOIN_READ_METHOD_DEFS;
  const spCoinWriteMethodDefs = SPCOIN_WRITE_METHOD_DEFS;
  const activeSpCoinReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
  const activeSpCoinWriteDef = spCoinWriteMethodDefs[selectedSpCoinWriteMethod];
  const spCoinReadMissingEntries = useMemo(
    () =>
      activeSpCoinReadDef.params
        .map((param, idx) => ({
          id: `spcoin-read-param-${idx}`,
          label: param.label,
          value: String(spReadParams[idx] || '').trim(),
        }))
        .filter((entry) => !entry.value)
        .map(({ id, label }) => ({ id, label })),
    [activeSpCoinReadDef.params, spReadParams],
  );
  const spCoinWriteMissingEntries = useMemo(() => {
    const missingEntries: Array<{ id: string; label: string }> = [];
    if (mode === 'hardhat' && !String(selectedWriteSenderAddress || '').trim()) {
      missingEntries.push({ id: 'spcoin-write-sender', label: 'msg.sender' });
    }
    activeSpCoinWriteDef.params.forEach((param, idx) => {
      if (param.type === 'date') return;
      if (String(spWriteParams[idx] || '').trim()) return;
      missingEntries.push({ id: `spcoin-write-param-${idx}`, label: param.label });
    });
    return missingEntries;
  }, [activeSpCoinWriteDef.params, mode, selectedWriteSenderAddress, spWriteParams]);
  const canRunErc20WriteMethod = erc20WriteMissingEntries.length === 0;
  const canRunErc20ReadMethod = erc20ReadMissingEntries.length === 0;
  const canRunSpCoinReadMethod = spCoinReadMissingEntries.length === 0;
  const canRunSpCoinWriteMethod = spCoinWriteMissingEntries.length === 0;
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
    let cancelled = false;

    const loadRateKeyOptions = async () => {
      if (methodPanelMode !== 'spcoin_write') {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setAgentRateKeyOptions([]);
          setRecipientRateKeyHelpText('');
          setAgentRateKeyHelpText('');
        }
        return;
      }

      const findValue = (labels: string[]) => {
        const idx = activeSpCoinWriteDef.params.findIndex((param) => labels.includes(param.label));
        return idx >= 0 ? String(spWriteParams[idx] || '').trim() : '';
      };
      const hasRecipientRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Recipient Rate Key', 'Recipient Rate'].includes(param.label),
      );
      const hasAgentRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Agent Rate Key', 'Agent Rate'].includes(param.label),
      );
      const sponsorKey =
        findValue(['Sponsor Key', 'Sponsor Account']) || String(selectedWriteSenderAddress || '').trim();
      const recipientKey = findValue(['Recipient Key', 'Recipient Account']);
      const recipientRateKey = findValue(['Recipient Rate Key', 'Recipient Rate']);
      const agentKey = findValue(['Agent Key', 'Agent Account']);

      const isAddress = (value: string) => /^0[xX][0-9a-fA-F]{40}$/.test(value);
      if (!hasRecipientRateField || !isAddress(sponsorKey) || !isAddress(recipientKey)) {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setRecipientRateKeyHelpText(
            hasRecipientRateField
              ? 'Select msg.sender/Sponsor and Recipient first to load Recipient Rate Keys.'
              : '',
          );
        }
      } else {
        try {
          const target = requireContractAddress();
          const runner = await ensureReadRunner();
          const access = createSpCoinLibraryAccess(target, runner);
          const rates = (await (access.contract as any).getRecipientRateList(sponsorKey, recipientKey)) as Array<
            string | bigint
          >;
          if (!cancelled) {
            setRecipientRateKeyOptions(rates.map((value) => String(value)));
            setRecipientRateKeyHelpText(
              rates.length > 0 ? 'Select a Recipient Rate Key from the contract list.' : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
            );
          }
        } catch {
          if (!cancelled) {
            setRecipientRateKeyOptions([]);
            setRecipientRateKeyHelpText('Unable to load Recipient Rate Keys from the active contract.');
          }
        }
      }

      if (
        !hasAgentRateField ||
        !isAddress(sponsorKey) ||
        !isAddress(recipientKey) ||
        !recipientRateKey ||
        !isAddress(agentKey)
      ) {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText(
            hasAgentRateField
              ? 'Select Sponsor, Recipient, Recipient Rate, and Agent first to load Agent Rate Keys.'
              : '',
          );
        }
        return;
      }

      try {
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(target, runner);
        const rates = (await (access.contract as any).getAgentRateList(
          sponsorKey,
          recipientKey,
          recipientRateKey,
          agentKey,
        )) as Array<string | bigint>;
        if (!cancelled) {
          setAgentRateKeyOptions(rates.map((value) => String(value)));
          setAgentRateKeyHelpText(
            rates.length > 0 ? 'Select an Agent Rate Key from the contract list.' : 'No Agent Rate Keys found for this sponsor/recipient/agent combination.',
          );
        }
      } catch {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText('Unable to load Agent Rate Keys from the active contract.');
        }
      }
    };

    void loadRateKeyOptions();
    return () => {
      cancelled = true;
    };
  }, [
    activeSpCoinWriteDef.params,
    ensureReadRunner,
    methodPanelMode,
    requireContractAddress,
    selectedWriteSenderAddress,
    spWriteParams,
  ]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawScripts = window.localStorage.getItem(spCoinLabScriptsKey);
      if (rawScripts) {
        const savedScripts = JSON.parse(rawScripts) as { scripts?: LabScript[]; selectedScriptId?: string };
        const nextScripts = Array.isArray(savedScripts?.scripts) ? savedScripts.scripts : [];
        setScripts(nextScripts);
        if (typeof savedScripts?.selectedScriptId === 'string') {
          setSelectedScriptId(savedScripts.selectedScriptId);
        } else if (nextScripts[0]?.id) {
          setSelectedScriptId(nextScripts[0].id);
        }
      }
      const raw = window.localStorage.getItem(spCoinLabKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, any>;
        if (saved.mode === 'metamask' || saved.mode === 'hardhat') setMode(saved.mode);
        if (typeof saved.rpcUrl === 'string') setRpcUrl(saved.rpcUrl);
        if (typeof saved.contractAddress === 'string') setContractAddress(saved.contractAddress);
        if (typeof saved.selectedHardhatIndex === 'number') setSelectedHardhatIndex(saved.selectedHardhatIndex);
        if (typeof saved.selectedWriteSenderAddress === 'string') {
          setSelectedWriteSenderAddress(normalizeAddressValue(saved.selectedWriteSenderAddress));
        }
        if (typeof saved.selectedWriteMethod === 'string') setSelectedWriteMethod(saved.selectedWriteMethod as Erc20WriteMethod);
        if (typeof saved.writeAddressA === 'string') setWriteAddressA(normalizeAddressValue(saved.writeAddressA));
        if (typeof saved.writeAddressB === 'string') setWriteAddressB(normalizeAddressValue(saved.writeAddressB));
        if (typeof saved.writeAmountRaw === 'string') setWriteAmountRaw(saved.writeAmountRaw);
        if (typeof saved.methodPanelMode === 'string') setMethodPanelMode(saved.methodPanelMode as MethodPanelMode);
        if (typeof saved.selectedReadMethod === 'string') setSelectedReadMethod(saved.selectedReadMethod as Erc20ReadMethod);
        if (typeof saved.readAddressA === 'string') setReadAddressA(normalizeAddressValue(saved.readAddressA));
        if (typeof saved.readAddressB === 'string') setReadAddressB(normalizeAddressValue(saved.readAddressB));
        if (typeof saved.selectedSpCoinReadMethod === 'string') {
          setSelectedSpCoinReadMethod(saved.selectedSpCoinReadMethod as SpCoinReadMethod);
        }
        if (typeof saved.selectedSpCoinWriteMethod === 'string') {
          setSelectedSpCoinWriteMethod(saved.selectedSpCoinWriteMethod as SpCoinWriteMethod);
        }
        if (Array.isArray(saved.spReadParams)) {
          setSpReadParams(saved.spReadParams.map((v) => normalizeAddressValue(String(v ?? ''))));
        }
        if (Array.isArray(saved.spWriteParams)) {
          setSpWriteParams(saved.spWriteParams.map((v) => normalizeAddressValue(String(v ?? ''))));
        }
        if (typeof saved.status === 'string') setStatus(saved.status);
        if (Array.isArray(saved.logs)) setLogs(saved.logs.map((v) => String(v ?? '')));
        if (typeof saved.formattedOutputDisplay === 'string') {
          setFormattedOutputDisplay(saved.formattedOutputDisplay);
        }
        if (typeof saved.treeOutputDisplay === 'string') {
          setTreeOutputDisplay(saved.treeOutputDisplay);
        }
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
    window.localStorage.setItem(
      spCoinLabScriptsKey,
      JSON.stringify({
        scripts,
        selectedScriptId,
      }),
    );
  }, [scripts, selectedScriptId, spCoinLabHydrated]);
  useEffect(() => {
    const nextSelectedScript = scripts.find((script) => script.id === selectedScriptId);
    if (!nextSelectedScript) return;
    setFormattedOutputDisplay(JSON.stringify(nextSelectedScript, null, 2));
  }, [scripts, selectedScriptId]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!spCoinLabHydrated) return;
    const payload = {
      mode,
      rpcUrl,
      contractAddress,
      selectedHardhatIndex,
      connectedAddress,
      connectedChainId,
      connectedNetworkName,
      selectedWriteSenderAddress,
      status,
      logs,
      formattedOutputDisplay,
      treeOutputDisplay,
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
    contractAddress,
    selectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    selectedWriteSenderAddress,
    status,
    logs,
    formattedOutputDisplay,
    treeOutputDisplay,
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
  const erc20ReadOptions = ERC20_READ_OPTIONS;
  const erc20WriteOptions = ERC20_WRITE_OPTIONS;
  const spCoinReadOptions = useMemo(() => {
    return getSpCoinReadOptions(false);
  }, []);
  const spCoinWriteOptions = useMemo(() => {
    return getSpCoinWriteOptions(false);
  }, []);
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
    if (def.type === 'address') {
      const normalized = normalizeAddressValue(value);
      if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
        throw new Error(`${def.label} must be a valid address.`);
      }
      return normalized;
    }
    if (def.type === 'address_array' || def.type === 'string_array') return parseListParam(value);
    return value;
  }, [backdateCalendar.backdateHours, backdateCalendar.backdateMinutes, backdateCalendar.backdateSeconds]);
  const stringifyResult = useCallback((result: unknown) => {
    if (typeof result === 'string') return result;
    return JSON.stringify(result, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  }, []);
  const runSelectedSpCoinReadMethod = useCallback(async () => {
    if (spCoinReadMissingEntries.length > 0) {
      showValidationPopup(
        spCoinReadMissingEntries.map((entry) => entry.id),
        spCoinReadMissingEntries.map((entry) => entry.label),
      );
      return;
    }
    const call = buildMethodCallEntry(
      selectedSpCoinReadMethod,
      activeSpCoinReadDef.params.map((param, idx) => ({
        label: param.label,
        value: spReadParams[idx] || '',
      })),
    );
    try {
      setFormattedOutputDisplay('(no output yet)');
      const result = await runSpCoinReadMethod({
        selectedMethod: selectedSpCoinReadMethod,
        spReadParams,
        coerceParamValue,
        stringifyResult,
        requireContractAddress,
        ensureReadRunner,
        appendLog,
        setStatus,
      });
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin read error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`${activeSpCoinReadDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinReadDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinReadDef.title,
    appendLog,
    coerceParamValue,
    ensureReadRunner,
    requireContractAddress,
    selectedSpCoinReadMethod,
    showValidationPopup,
    spCoinReadMissingEntries,
    spReadParams,
    stringifyResult,
  ]);
  const runSelectedSpCoinWriteMethod = useCallback(async () => {
    if (spCoinWriteMissingEntries.length > 0) {
      showValidationPopup(
        spCoinWriteMissingEntries.map((entry) => entry.id),
        spCoinWriteMissingEntries.map((entry) => entry.label),
      );
      return;
    }
    const call = buildMethodCallEntry(selectedSpCoinWriteMethod, [
      ...(mode === 'hardhat' || effectiveConnectedAddress
        ? [
            {
              label: 'msg.sender',
              value:
                mode === 'hardhat'
                  ? selectedWriteSenderAccount?.address ||
                    selectedWriteSenderAddress ||
                    selectedHardhatAccount?.address ||
                    ''
                  : effectiveConnectedAddress,
            },
          ]
        : []),
      ...activeSpCoinWriteDef.params.map((param, idx) => ({
        label: param.label,
        value: spWriteParams[idx] || '',
      })),
    ]);
    try {
      setFormattedOutputDisplay('(no output yet)');
      appendWriteTrace(
        `runSelectedSpCoinWriteMethod start; mode=${mode}; source=${useLocalSpCoinAccessPackage ? 'local' : 'node_modules'}; method=${selectedSpCoinWriteMethod}`,
      );
      const result = await runSpCoinWriteMethod({
        selectedMethod: selectedSpCoinWriteMethod,
        spWriteParams,
        coerceParamValue,
        executeWriteConnected,
        selectedHardhatAddress:
          mode === 'hardhat'
            ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || selectedHardhatAccount?.address
            : effectiveConnectedAddress,
        appendLog,
        appendWriteTrace,
        spCoinAccessSource: useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        setStatus,
      });
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SpCoin write error.';
      setFormattedOutputDisplay(formatOutputDisplayValue({ call, error: message }));
      setStatus(`${activeSpCoinWriteDef.title} failed: ${message}`);
      appendLog(`${activeSpCoinWriteDef.title} failed: ${message}`);
    }
  }, [
    activeSpCoinWriteDef.title,
    appendLog,
    coerceParamValue,
    executeWriteConnected,
    effectiveConnectedAddress,
    mode,
    spCoinWriteMissingEntries,
    useLocalSpCoinAccessPackage,
    selectedHardhatAccount?.address,
    selectedWriteSenderAccount?.address,
    selectedWriteSenderAddress,
    selectedSpCoinWriteMethod,
    showValidationPopup,
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
  const [expandedCard, setExpandedCard] = useState<LabCardId | null>(null);
  const toggleExpandedCard = useCallback((cardId: LabCardId) => {
    setExpandedCard((current) => (current === cardId ? null : cardId));
  }, []);
  const showCard = useCallback(
    (cardId: LabCardId) => expandedCard === null || expandedCard === cardId,
    [expandedCard],
  );
  const getCardClassName = useCallback(
    (cardId: LabCardId, placement = '') =>
      `${cardStyle} flex flex-col ${expandedCard === cardId ? 'min-h-[calc(100dvh-10rem)]' : ''} ${placement}`.trim(),
    [expandedCard],
  );
  const methodsCardRef = useRef<HTMLElement | null>(null);
  const [sharedMethodsRowHeight, setSharedMethodsRowHeight] = useState<number | null>(null);
  const [isDesktopSharedLayout, setIsDesktopSharedLayout] = useState(false);
  const selectedScript = useMemo(
    () => scripts.find((script) => script.id === selectedScriptId) || null,
    [scripts, selectedScriptId],
  );
  const scriptNameMatch = useMemo(() => {
    const name = String(scriptNameInput || '').trim();
    if (!name) return null;
    return scripts.find((script) => script.name.trim() === name) || null;
  }, [scriptNameInput, scripts]);
  const scriptNameValidation = useMemo(() => {
    const name = String(scriptNameInput || '').trim();
    if (!name) {
      return { tone: 'neutral' as const, message: 'Enter a script name.' };
    }
    if (scriptNameMatch) {
      return { tone: 'invalid' as const, message: 'Script Name Exists' };
    }
    return { tone: 'valid' as const, message: 'Valid script name' };
  }, [scriptNameInput, scriptNameMatch]);
  const deleteScriptValidation = useMemo(() => {
    if (!scriptNameMatch) {
      return { tone: 'invalid' as const, message: 'Script Not Found' };
    }
    return { tone: 'valid' as const, message: `Delete ${scriptNameMatch.name}` };
  }, [scriptNameMatch]);
  const visibleScriptOptions = useMemo(() => scripts, [scripts]);
  useEffect(() => {
    if (selectedScript) {
      setScriptNameInput(selectedScript.name);
      return;
    }
    setScriptNameInput(buildDefaultScriptName(scripts.length + 1));
  }, [scripts.length, selectedScript]);
  const [selectedScriptStepNumber, setSelectedScriptStepNumber] = useState<number | null>(null);
  const [expandedScriptStepIds, setExpandedScriptStepIds] = useState<Record<string, boolean>>({});
  const [isDeleteStepPopupOpen, setIsDeleteStepPopupOpen] = useState(false);
  const selectedScriptStep = useMemo(
    () => selectedScript?.steps.find((step) => step.step === selectedScriptStepNumber) || null,
    [selectedScript, selectedScriptStepNumber],
  );

  useEffect(() => {
    const updateViewportMode = () => setIsDesktopSharedLayout(window.innerWidth >= 1280);

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  useEffect(() => {
    if (!isDesktopSharedLayout || expandedCard !== null) {
      setSharedMethodsRowHeight(null);
      return;
    }

    const node = methodsCardRef.current;
    if (!node) return;

    const updateHeight = () => setSharedMethodsRowHeight(Math.ceil(node.getBoundingClientRect().height));

    updateHeight();

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [expandedCard, isDesktopSharedLayout]);

  const getStepNetwork = useCallback(
    (step: LabScriptStep): string =>
      String(step.network || '').trim() ||
      ((step.mode || '') === 'hardhat' ? HARDHAT_SCRIPT_NETWORK_LABEL : activeNetworkName || 'MetaMask'),
    [activeNetworkName],
  );
  const getScriptNetwork = useCallback(
    (script: LabScript): string =>
      String(script.network || '').trim() ||
      (Array.isArray(script.steps) && script.steps[0] ? getStepNetwork(script.steps[0]) : activeNetworkName || 'MetaMask'),
    [activeNetworkName, getStepNetwork],
  );
  const getStepMode = useCallback(
    (step: LabScriptStep, scriptNetwork?: string): ConnectionMode =>
      String(scriptNetwork || '').trim() === HARDHAT_SCRIPT_NETWORK_LABEL ||
      getStepNetwork(step) === HARDHAT_SCRIPT_NETWORK_LABEL ||
      step.mode === 'hardhat'
        ? 'hardhat'
        : 'metamask',
    [getStepNetwork],
  );
  const getStepSender = useCallback((step: LabScriptStep): string => {
    const directSender = String(step['msg.sender'] || '').trim();
    if (directSender) return directSender;

    if (
      Array.isArray(step.params) &&
      step.params.every(
        (param) =>
          param &&
          typeof param === 'object' &&
          'key' in param &&
          'value' in param &&
          typeof (param as { key?: unknown }).key === 'string',
      )
    ) {
      const match = (step.params as LabScriptParam[]).find((param) => param.key === 'msg.sender');
      return String(match?.value || '').trim();
    }

    const legacyValues = Array.isArray(step.params) ? (step.params as unknown[]).map((value) => String(value || '')) : [];
    if (step.panel === 'erc20_write' && legacyValues.length >= 4) return legacyValues[0] || '';
    return '';
  }, []);
  const getStepParamEntries = useCallback(
    (step: LabScriptStep): LabScriptParam[] => {
      if (
        Array.isArray(step.params) &&
        step.params.every(
          (param) =>
            param &&
            typeof param === 'object' &&
            'key' in param &&
            'value' in param &&
            typeof (param as { key?: unknown }).key === 'string',
        )
      ) {
        return (step.params as LabScriptParam[])
          .map((param) => ({
            key: String(param.key || ''),
            value: String(param.value || ''),
          }))
          .filter((param) => param.key !== 'msg.sender' && param.value.trim().length > 0);
      }

      const legacyValues = Array.isArray(step.params) ? (step.params as unknown[]).map((value) => String(value || '')) : [];

      if (step.panel === 'ecr20_read') {
        const labels = getErc20ReadLabels(step.method as Erc20ReadMethod);
        const keys = [labels.addressALabel, labels.addressBLabel].filter(Boolean);
        return legacyValues
          .map((value, idx) => ({ key: keys[idx] || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      if (step.panel === 'erc20_write') {
        const labels = getErc20WriteLabels(step.method as Erc20WriteMethod);
        const hasLegacySender = legacyValues.length >= 4;
        const entries: LabScriptParam[] = [];
        entries.push({ key: labels.addressALabel, value: legacyValues[hasLegacySender ? 1 : 0] || '' });
        if (labels.requiresAddressB) {
          entries.push({ key: labels.addressBLabel, value: legacyValues[hasLegacySender ? 2 : 1] || '' });
        }
        entries.push({ key: 'Amount', value: legacyValues[hasLegacySender ? 3 : labels.requiresAddressB ? 2 : 1] || '' });
        return entries.filter((param) => param.value.trim().length > 0);
      }

      if (step.panel === 'spcoin_rread') {
        const def = spCoinReadMethodDefs[step.method as SpCoinReadMethod];
        return legacyValues
          .map((value, idx) => ({ key: def?.params[idx]?.label || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      const writeDef = spCoinWriteMethodDefs[step.method as SpCoinWriteMethod];
      return [
        ...legacyValues.map((value, idx) => ({ key: writeDef?.params[idx]?.label || `param${idx + 1}`, value })),
      ].filter((param) => param.value.trim().length > 0);
    },
    [spCoinReadMethodDefs, spCoinWriteMethodDefs],
  );
  const normalizeScriptStep = useCallback(
    (step: LabScriptStep, index: number): LabScriptStep => ({
      step: index + 1,
      name: step.name,
      panel: step.panel,
      method: step.method,
      'msg.sender': getStepSender(step) || undefined,
      params: getStepParamEntries(step),
    }),
    [getStepParamEntries, getStepSender],
  );
  const normalizeScript = useCallback(
    (script: LabScript): LabScript => {
      const normalizedSteps = Array.isArray(script.steps)
        ? script.steps.map((step, idx) => normalizeScriptStep(step, idx))
        : [];
      return {
        id: String(script.id || '').trim(),
        name: String(script.name || '').trim(),
        'Date Created': inferScriptCreatedDate(script),
        network: getScriptNetwork(script),
        steps: normalizedSteps,
      };
    },
    [getScriptNetwork, normalizeScriptStep],
  );
  useEffect(() => {
    setScripts((prev) => {
      let changed = false;
      const next = prev.map((script) => {
        const normalizedScript = normalizeScript(script);
        if (JSON.stringify(normalizedScript) !== JSON.stringify(script)) {
          changed = true;
          return normalizedScript;
        }
        return script;
      });
      return changed ? next : prev;
    });
  }, [normalizeScript]);
  const loadScriptStep = useCallback((step: LabScriptStep) => {
    const paramEntries = getStepParamEntries(step);
    const stepSender = getStepSender(step);
    const findParamValue = (keys: string[]) => {
      const match = paramEntries.find((param) => keys.includes(param.key));
      return String(match?.value || '');
    };
    setSelectedScriptStepNumber(step.step);
    setMode(getStepMode(step, selectedScript?.network));
    setMethodPanelMode(step.panel);

    if (step.panel === 'ecr20_read') {
      setSelectedReadMethod(step.method as Erc20ReadMethod);
      const labels = getErc20ReadLabels(step.method as Erc20ReadMethod);
      setReadAddressA(findParamValue([labels.addressALabel]));
      setReadAddressB(findParamValue([labels.addressBLabel]));
      return;
    }

    if (step.panel === 'erc20_write') {
      const labels = getErc20WriteLabels(step.method as Erc20WriteMethod);
      setSelectedWriteMethod(step.method as Erc20WriteMethod);
      setSelectedWriteSenderAddress(stepSender);
      setWriteAddressA(findParamValue([labels.addressALabel]));
      setWriteAddressB(findParamValue([labels.addressBLabel]));
      setWriteAmountRaw(findParamValue(['Amount']));
      return;
    }

    if (step.panel === 'spcoin_rread') {
      setSelectedSpCoinReadMethod(step.method as SpCoinReadMethod);
      const def = spCoinReadMethodDefs[step.method as SpCoinReadMethod];
      setSpReadParams(
        Array.from({ length: 7 }, (_, idx) => findParamValue([def?.params[idx]?.label || `param${idx + 1}`])),
      );
      return;
    }

    setSelectedSpCoinWriteMethod(step.method as SpCoinWriteMethod);
    setSelectedWriteSenderAddress(stepSender);
    const def = spCoinWriteMethodDefs[step.method as SpCoinWriteMethod];
    setSpWriteParams(
      Array.from({ length: 7 }, (_, idx) => findParamValue([def?.params[idx]?.label || `param${idx + 1}`])),
    );
  }, [getStepMode, getStepParamEntries, getStepSender, selectedScript?.network, spCoinReadMethodDefs, spCoinWriteMethodDefs]);
  const toggleScriptStepExpanded = useCallback((stepNumber: number) => {
    const key = String(stepNumber);
    setExpandedScriptStepIds((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const runActiveMethod = useCallback(async () => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        await runSelectedReadMethod();
        return;
      case 'erc20_write':
        await runSelectedWriteMethod();
        return;
      case 'spcoin_rread':
        await runSelectedSpCoinReadMethod();
        return;
      case 'spcoin_write':
        await runSelectedSpCoinWriteMethod();
        return;
      default:
        return;
    }
  }, [
    methodPanelMode,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runSelectedWriteMethod,
  ]);
  const goToAdjacentScriptStep = useCallback(
    (direction: -1 | 1) => {
      if (!selectedScript || selectedScript.steps.length === 0) return;
      const currentIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = startIndex + direction;
      const nextStep = selectedScript.steps[nextIndex];
      if (!nextStep) return;
      loadScriptStep(nextStep);
    },
    [loadScriptStep, selectedScript, selectedScriptStepNumber],
  );
  const moveSelectedScriptStep = useCallback(
    (direction: -1 | 1) => {
      if (!selectedScriptId || !selectedScript || selectedScriptStepNumber === null) return;
      const currentIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
      if (currentIndex < 0) return;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= selectedScript.steps.length) return;

      setScripts((prev) =>
        prev.map((script) => {
          if (script.id !== selectedScriptId) return script;
          const nextSteps = [...script.steps];
          [nextSteps[currentIndex], nextSteps[targetIndex]] = [nextSteps[targetIndex], nextSteps[currentIndex]];
          return {
            ...script,
            steps: nextSteps.map((step, idx) => ({
              ...step,
              step: idx + 1,
            })),
          };
        }),
      );
      setExpandedScriptStepIds((prev) => {
        const reorderedSteps = [...selectedScript.steps];
        [reorderedSteps[currentIndex], reorderedSteps[targetIndex]] = [reorderedSteps[targetIndex], reorderedSteps[currentIndex]];
        const nextExpanded: Record<string, boolean> = {};
        reorderedSteps.forEach((step, idx) => {
          nextExpanded[String(idx + 1)] = Boolean(prev[String(step.step)]);
        });
        return nextExpanded;
      });
      setSelectedScriptStepNumber(targetIndex + 1);
    },
    [selectedScriptId, selectedScript, selectedScriptStepNumber],
  );
  const deleteSelectedScriptStep = useCallback(() => {
    if (!selectedScriptId || selectedScriptStepNumber === null) return;
    setScripts((prev) =>
      prev.map((script) => {
        if (script.id !== selectedScriptId) return script;
        const remainingSteps = script.steps
          .filter((step) => step.step !== selectedScriptStepNumber)
          .map((step, idx) => ({
            ...step,
            step: idx + 1,
          }));
        return {
          ...script,
          steps: remainingSteps,
        };
      }),
    );
    setExpandedScriptStepIds((prev) => {
      const currentSteps = Array.isArray(selectedScript?.steps) ? selectedScript.steps : [];
      const remainingSteps = currentSteps.filter((step) => step.step !== selectedScriptStepNumber);
      const nextExpanded: Record<string, boolean> = {};
      remainingSteps.forEach((step, idx) => {
        nextExpanded[String(idx + 1)] = Boolean(prev[String(step.step)]);
      });
      return nextExpanded;
    });
    setSelectedScriptStepNumber((prev) => {
      if (!prev) return null;
      const remainingCount = Math.max((selectedScript?.steps.length || 0) - 1, 0);
      if (remainingCount === 0) return null;
      return Math.min(prev, remainingCount);
    });
  }, [selectedScript?.steps, selectedScriptId, selectedScriptStepNumber]);
  const requestDeleteSelectedScriptStep = useCallback(() => {
    if (selectedScriptStepNumber === null) return;
    setIsDeleteStepPopupOpen(true);
  }, [selectedScriptStepNumber]);
  const confirmDeleteSelectedScriptStep = useCallback(() => {
    deleteSelectedScriptStep();
    setIsDeleteStepPopupOpen(false);
  }, [deleteSelectedScriptStep]);
  const toggleScriptStepBreakpoint = useCallback(
    (stepNumber: number) => {
      if (!selectedScriptId) return;
      setScripts((prev) =>
        prev.map((script) =>
          script.id === selectedScriptId
            ? {
                ...script,
                steps: script.steps.map((step) =>
                  step.step === stepNumber
                    ? {
                        ...step,
                        breakpoint: !step.breakpoint,
                      }
                    : step,
                ),
              }
            : script,
        ),
      );
    },
    [selectedScriptId],
  );
  const renderScriptStepRow = useCallback(
    (step: LabScriptStep) => {
      const isExpanded = Boolean(expandedScriptStepIds[String(step.step)]);
      const isSelected = selectedScriptStep?.step === step.step;
      return (
        <div key={`step-${step.step}`} className="m-0 flex flex-col p-0 font-mono leading-tight">
          <div className="grid w-full grid-cols-[calc(1.05em+3px)_minmax(0,1fr)] items-center gap-x-[2px] px-0 py-0 text-left text-sm">
            <button
              type="button"
              onClick={() => toggleScriptStepBreakpoint(step.step)}
              className={`col-start-1 ml-[3px] inline-flex h-[1em] w-[1.05em] shrink-0 items-center justify-center self-center border-0 bg-transparent p-0 leading-none ${
                step.breakpoint ? 'opacity-100' : 'opacity-0'
              }`}
              title={step.breakpoint ? `Remove breakpoint from ${step.method}` : `Add breakpoint to ${step.method}`}
            >
              <span className="block h-[0.62em] w-[0.62em] rounded-full bg-[#F87171]" />
            </button>
            <div className="col-start-2 inline-flex min-w-0 items-center">
              <button
                type="button"
                onClick={() => toggleScriptStepExpanded(step.step)}
                className={`shrink-0 ${isExpanded ? 'text-green-400' : 'text-red-400'}`}
                title={isExpanded ? `Collapse ${step.method}` : `Expand ${step.method}`}
              >
                {isExpanded ? '[+]' : '[-]'}
              </button>
              <button
                type="button"
                onClick={() => loadScriptStep(step)}
                className={`min-w-0 text-left ${isSelected ? 'text-green-400 underline underline-offset-2' : 'text-slate-200'}`}
                title={`Load ${step.method}`}
              >
                {step.method}
              </button>
            </div>
          </div>
          {isExpanded ? (
            <div className="mt-1 space-y-1 whitespace-nowrap pl-[28px] text-xs text-slate-200">
              {getStepSender(step) ? <div>{`msg.sender: ${getStepSender(step)};`}</div> : null}
              {getStepParamEntries(step).length > 0 ? (
                getStepParamEntries(step).map((param, idx) => (
                  <div key={`step-${step.step}-param-${idx}`}>
                    {`${param.key}: ${param.value};`}
                  </div>
                ))
              ) : (
                <div>(no params)</div>
              )}
            </div>
          ) : null}
        </div>
      );
    },
    [
      expandedScriptStepIds,
      getStepParamEntries,
      getStepSender,
      loadScriptStep,
      selectedScriptStep?.step,
      toggleScriptStepBreakpoint,
      toggleScriptStepExpanded,
    ],
  );
  const highlightedFormattedOutputLines = useMemo(() => {
    if (outputPanelMode !== 'formatted' || selectedScriptStepNumber === null) return null;
    const lines = String(formattedOutputDisplay || '').split('\n');
    const targetLineIndex = lines.findIndex((line) => line.includes(`"step": ${selectedScriptStepNumber}`));
    if (targetLineIndex < 0) return null;

    let startIndex = targetLineIndex;
    if (targetLineIndex > 0 && lines[targetLineIndex - 1].trim().startsWith('{')) {
      startIndex = targetLineIndex - 1;
    }

    let depth = 0;
    let endIndex = targetLineIndex;
    for (let idx = startIndex; idx < lines.length; idx += 1) {
      const line = lines[idx];
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      endIndex = idx;
      if (idx > startIndex && depth <= 0) break;
    }

    return lines.map((line, idx) => ({
      line,
      active: idx >= startIndex && idx <= endIndex,
    }));
  }, [formattedOutputDisplay, outputPanelMode, selectedScriptStepNumber]);
  useEffect(() => {
    if (!selectedScript) {
      setSelectedScriptStepNumber(null);
      return;
    }
    if (selectedScript.steps.some((step) => step.step === selectedScriptStepNumber)) return;
    setSelectedScriptStepNumber(selectedScript.steps[0]?.step ?? null);
  }, [selectedScript, selectedScriptStepNumber]);
  const createNewScript = useCallback(() => {
    if (scriptNameValidation.tone !== 'valid') {
      setStatus(scriptNameValidation.message);
      return;
    }
    const nextIndex = scripts.length + 1;
    const nextId = `script-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextName = String(scriptNameInput || '').trim() || buildDefaultScriptName(nextIndex);
    const nextScript: LabScript = {
      id: nextId,
      name: nextName,
      'Date Created': formatScriptCreatedDate(new Date()),
      network: mode === 'hardhat' ? HARDHAT_SCRIPT_NETWORK_LABEL : activeNetworkName || 'MetaMask',
      steps: [],
    };
    setScripts((prev) => [...prev, nextScript]);
    setSelectedScriptId(nextId);
    setFormattedOutputDisplay(JSON.stringify(nextScript, null, 2));
    setOutputPanelMode('formatted');
    setStatus(`Created ${nextScript.name}.`);
  }, [activeNetworkName, mode, scriptNameInput, scriptNameValidation.message, scriptNameValidation.tone, scripts.length]);
  const deleteSelectedScript = useCallback((targetScriptId: string) => {
    if (!targetScriptId) return;
    setScripts((prev) => {
      const remaining = prev.filter((script) => script.id !== targetScriptId);
      const canKeepSelected =
        selectedScriptId && selectedScriptId !== targetScriptId && remaining.some((script) => script.id === selectedScriptId);
      const nextSelectedId = canKeepSelected ? selectedScriptId : remaining[0]?.id || '';
      setSelectedScriptId(nextSelectedId);
      setFormattedOutputDisplay(
        nextSelectedId
          ? JSON.stringify(remaining.find((script) => script.id === nextSelectedId) || { scripts: [] }, null, 2)
          : JSON.stringify({ scripts: [] }, null, 2),
      );
      return remaining;
    });
    setOutputPanelMode('formatted');
    setStatus('Deleted selected script.');
  }, [selectedScriptId]);
  const handleDeleteScriptClick = useCallback(() => {
    if (deleteScriptValidation.tone !== 'valid') {
      setStatus(deleteScriptValidation.message);
      return;
    }
    deleteSelectedScript(scriptNameMatch?.id || '');
  }, [deleteScriptValidation.message, deleteScriptValidation.tone, deleteSelectedScript, scriptNameMatch?.id]);
  const addCurrentMethodToScript = useCallback(() => {
    if (!selectedScriptId) {
      setStatus('Select or create a script first.');
      setOutputPanelMode('raw_status');
      return;
    }

    const activeMissingEntries =
      methodPanelMode === 'ecr20_read'
        ? erc20ReadMissingEntries
        : methodPanelMode === 'erc20_write'
        ? erc20WriteMissingEntries
        : methodPanelMode === 'spcoin_rread'
        ? spCoinReadMissingEntries
        : spCoinWriteMissingEntries;
    if (activeMissingEntries.length > 0) {
      showValidationPopup(
        activeMissingEntries.map((entry) => entry.id),
        activeMissingEntries.map((entry) => entry.label),
      );
      return;
    }

    let method = '';
    let params: LabScriptParam[] = [];
    let name = '';

    switch (methodPanelMode) {
      case 'ecr20_read':
        method = selectedReadMethod;
        params = [
          activeReadLabels.requiresAddressA
            ? { key: activeReadLabels.addressALabel, value: String(readAddressA || '').trim() }
            : null,
          activeReadLabels.requiresAddressB
            ? { key: activeReadLabels.addressBLabel, value: String(readAddressB || '').trim() }
            : null,
        ].filter((value): value is LabScriptParam => value !== null && value.value.length > 0);
        name = activeReadLabels.title;
        break;
      case 'erc20_write':
        method = selectedWriteMethod;
        params = [
          { key: activeWriteLabels.addressALabel, value: String(writeAddressA || '').trim() },
          ...(activeWriteLabels.requiresAddressB
            ? [{ key: activeWriteLabels.addressBLabel, value: String(writeAddressB || '').trim() }]
            : []),
          { key: 'Amount', value: String(writeAmountRaw || '').trim() },
        ].filter((param) => param.value.length > 0);
        name = activeWriteLabels.title;
        break;
      case 'spcoin_rread':
        method = selectedSpCoinReadMethod;
        params = spReadParams
          .slice(0, activeSpCoinReadDef.params.length)
          .map((value, idx) => ({
            key: activeSpCoinReadDef.params[idx]?.label || `param${idx + 1}`,
            value: String(value || '').trim(),
          }))
          .filter((param) => param.value.length > 0);
        name = activeSpCoinReadDef.title;
        break;
      case 'spcoin_write':
        method = selectedSpCoinWriteMethod;
        params = [
          ...spWriteParams
            .slice(0, activeSpCoinWriteDef.params.length)
            .map((value, idx) => ({
              key: activeSpCoinWriteDef.params[idx]?.label || `param${idx + 1}`,
              value: String(value || '').trim(),
            })),
        ].filter((param) => param.value.length > 0);
        name = activeSpCoinWriteDef.title;
        break;
      default:
        break;
    }

    if (!method) {
      setStatus('No active method is available to add.');
      setOutputPanelMode('raw_status');
      return;
    }

    const nextStep: LabScriptStep = {
      step: 0,
      name,
      panel: methodPanelMode,
      method,
      'msg.sender':
        methodPanelMode === 'erc20_write' || methodPanelMode === 'spcoin_write'
          ? String(selectedWriteSenderAddress || '').trim() || undefined
          : undefined,
      params,
    };

    setScripts((prev) =>
      prev.map((script) =>
        script.id === selectedScriptId
          ? (() => {
              const currentSteps = Array.isArray(script.steps) ? script.steps : [];
              const activeIndex =
                selectedScriptStepNumber === null
                  ? currentSteps.length - 1
                  : currentSteps.findIndex((step) => step.step === selectedScriptStepNumber);
              const insertIndex = activeIndex >= 0 ? activeIndex + 1 : currentSteps.length;
              const insertedSteps = [
                ...currentSteps.slice(0, insertIndex),
                nextStep,
                ...currentSteps.slice(insertIndex),
              ].map((step, idx) => ({
                ...step,
                step: idx + 1,
              }));
              return {
                ...script,
                network: String(script.network || '').trim()
                  ? script.network
                  : mode === 'hardhat'
                  ? HARDHAT_SCRIPT_NETWORK_LABEL
                  : activeNetworkName || 'MetaMask',
                steps: insertedSteps,
              };
            })()
          : script,
      ),
    );
    const insertedStepNumber =
      selectedScriptStepNumber !== null && Array.isArray(selectedScript?.steps)
        ? (() => {
            const activeIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
            return (activeIndex >= 0 ? activeIndex : selectedScript.steps.length - 1) + 2;
          })()
        : (selectedScript?.steps.length || 0) + 1;
    setSelectedScriptStepNumber(insertedStepNumber);
    setExpandedScriptStepIds((prev) => {
      const currentSteps = Array.isArray(selectedScript?.steps) ? selectedScript.steps : [];
      const activeIndex =
        selectedScriptStepNumber === null
          ? currentSteps.length - 1
          : currentSteps.findIndex((step) => step.step === selectedScriptStepNumber);
      const insertIndex = activeIndex >= 0 ? activeIndex + 1 : currentSteps.length;
      const nextExpanded: Record<string, boolean> = {};
      currentSteps.forEach((step, idx) => {
        const nextStepNumber = idx < insertIndex ? idx + 1 : idx + 2;
        nextExpanded[String(nextStepNumber)] = Boolean(prev[String(step.step)]);
      });
      nextExpanded[String(insertIndex + 1)] = false;
      return nextExpanded;
    });
    setOutputPanelMode('formatted');
    setStatus(`Added ${name} to the selected script.`);
  }, [
    activeNetworkName,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    activeReadLabels.title,
    activeSpCoinReadDef.params.length,
    activeSpCoinReadDef.title,
    activeSpCoinWriteDef.params.length,
    activeSpCoinWriteDef.title,
    activeWriteLabels.requiresAddressB,
    activeWriteLabels.title,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    methodPanelMode,
    mode,
    readAddressA,
    readAddressB,
    selectedReadMethod,
    selectedScript?.steps.length,
    selectedScriptId,
    selectedScriptStepNumber,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    showValidationPopup,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    spReadParams,
    spWriteParams,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  return (
    <main className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin SandBox</h2>

        <section className={`grid grid-cols-1 gap-6 ${expandedCard ? '' : 'xl:grid-cols-2'}`}>
          {showCard('network') && (
          <article className={getCardClassName('network', expandedCard ? '' : 'xl:col-start-2 xl:row-start-1')}>
            <LabCardHeader
              title="Active Sponsor Coin Signer Account"
              isExpanded={expandedCard === 'network'}
              onToggleExpand={() => toggleExpandedCard('network')}
            />

            <div className="mt-4">
              <div className="grid grid-cols-1 gap-3">
                <div
                  className={`grid grid-cols-1 gap-3${
                    showSignerAccountDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
                  }`}
                >
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => setShowSignerAccountDetails((prev) => !prev)}
                      className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                      title="Toggle signer account details"
                    >
                      Public Account Key
                    </button>
                    <input
                      className={inputStyle}
                      readOnly
                      value={displayedSignerAccountAddress}
                      placeholder="Selected account address"
                    />
                  </label>
                  {showSignerAccountDetails && (
                    <>
                      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                        <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                        <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                            {displayedSignerAccountMetadata?.logoURL ? (
                              <Image
                                src={displayedSignerAccountMetadata.logoURL}
                                alt={displayedSignerAccountMetadata?.name || 'Selected signer account'}
                                width={40}
                                height={40}
                                className="h-full w-full object-contain"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">No logo</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-white">
                              {displayedSignerAccountMetadata?.name || 'Unnamed account'}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {displayedSignerAccountMetadata?.symbol || 'No symbol'}
                            </div>
                          </div>
                        </div>
                      </div>
                      {mode === 'hardhat' ? (
                        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                          <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                          <input
                            className={inputStyle}
                            readOnly
                            value={selectedVersionSignerKey}
                            placeholder="Signer key for selected deployed version"
                          />
                        </label>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="border-t border-[#2B3A67] pt-3">
                    <h3 className="text-center text-lg font-semibold text-[#5981F3]">Test Wallet Account Management</h3>
                  </div>
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => void addSignerAccount()}
                      className={`w-fit text-left text-sm font-semibold transition-colors ${accountActionLabelClassName(addAccountValidation.tone)}`}
                      title={addAccountValidation.message}
                    >
                      Add Account
                    </button>
                    <input
                      className={inputStyle}
                      value={addAccountInput}
                      onChange={(e) => setAddAccountInput(e.target.value)}
                      placeholder="Enter an account address to add"
                    />
                  </div>
                  {addAccountValidation.message ? (
                    <div className={`text-xs ${addAccountValidation.tone === 'valid' ? 'text-green-300' : addAccountValidation.tone === 'invalid' ? 'text-red-300' : 'text-slate-400'}`}>
                      {addAccountValidation.message}
                    </div>
                  ) : null}
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => void deleteSignerAccount()}
                      className={`w-fit text-left text-sm font-semibold transition-colors ${accountActionLabelClassName(deleteAccountValidation.tone)}`}
                      title={deleteAccountValidation.message}
                    >
                      Delete Account
                    </button>
                    <input
                      className={inputStyle}
                      value={deleteAccountInput}
                      onChange={(e) => setDeleteAccountInput(e.target.value)}
                      placeholder="Enter an account address to delete"
                    />
                  </div>
                  {deleteAccountValidation.message ? (
                    <div className={`text-xs ${deleteAccountValidation.tone === 'valid' ? 'text-green-300' : deleteAccountValidation.tone === 'invalid' ? 'text-red-300' : 'text-slate-400'}`}>
                      {deleteAccountValidation.message}
                    </div>
                  ) : null}
                  {signerAccountStatus ? (
                    <div>
                      <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status:</span>
                      <div className="break-all rounded-lg border border-[#31416F] bg-[#0B1220] px-3 py-2 text-sm text-slate-300">
                        {signerAccountStatus}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
          )}

          {showCard('contract') && (
          <article className={getCardClassName('contract', expandedCard ? '' : 'xl:col-start-1 xl:row-start-1')}>
            <LabCardHeader
              title="Active Sponsor Coin Contract"
              isExpanded={expandedCard === 'contract'}
              onToggleExpand={() => toggleExpandedCard('contract')}
              leftSlot={
                <div className="relative -left-[9px] -top-[10px] flex h-[33px] w-[33px] items-center justify-center overflow-hidden rounded-xl bg-[#0E111B]">
                  {selectedSponsorCoinLogoURL ? (
                    <Image
                      src={selectedSponsorCoinLogoURL}
                      alt={String(selectedSponsorCoinVersionEntry?.name || 'Sponsor Coin')}
                      width={33}
                      height={33}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
              }
            />
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
              <div className="border-t border-[#2B3A67] pt-5">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-lg font-semibold text-[#5981F3]">Network Controller</h2>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
                    <label className="flex items-center gap-2 text-[#8FA8FF]">
                      <input
                        type="radio"
                        name="sponsorcoin-lab-network-mode"
                        value="hardhat"
                        checked={mode === 'hardhat'}
                        onChange={() => setMode('hardhat')}
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                      />
                      <span>Hardhat Ec2-BASE</span>
                    </label>
                    <label className="flex items-center gap-2 text-[#8FA8FF]">
                      <input
                        type="radio"
                        name="sponsorcoin-lab-network-mode"
                        value="metamask"
                        checked={mode === 'metamask'}
                        onChange={() => setMode('metamask')}
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                      />
                      <span>MetaMask</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
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
                    <button
                      type="button"
                      onClick={() => setShowHardhatConnectionInputs((prev) => !prev)}
                      className="-mt-[10px] inline-flex items-center justify-center bg-transparent p-0"
                      aria-label="Toggle Hardhat connection settings"
                      title="Toggle Hardhat connection settings"
                    >
                      <Image
                        src={cog_png}
                        alt="Toggle Hardhat connection settings"
                        className="h-6 w-6 cursor-pointer object-contain transition duration-300 hover:rotate-[360deg]"
                      />
                    </button>
                  </label>
                </div>
                {mode === 'hardhat' && showHardhatConnectionInputs ? (
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
                  </div>
                ) : null}
                {mode !== 'hardhat' ? (
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
                ) : null}
              </div>
              {mode !== 'hardhat' && (
                <p className="text-sm text-slate-300">
                  Hardhat-specific deployment metadata is shown read-only while Network Connection Mode is not set to Hardhat Ec2-BASE.
                </p>
              )}
            </div>
          </article>
          )}

          {showCard('methods') && (
          <article
            ref={methodsCardRef}
            className={`${getCardClassName('methods', expandedCard ? '' : 'xl:col-start-1 xl:row-start-2')} self-start`}
          >
            <LabCardHeader
              title="Script Test Editor"
              isExpanded={expandedCard === 'methods'}
              onToggleExpand={() => toggleExpandedCard('methods')}
            />
            <div className="mt-4 grid grid-cols-1 gap-4">
              <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
                <h3 className="text-center text-lg font-semibold text-[#5981F3]">Script Builder/Debugger</h3>
                <div className="mt-4 grid grid-cols-[140px_minmax(0,1fr)_140px] items-center gap-3">
                  <button
                    type="button"
                    className={`w-[140px] ${actionButtonStyle} ${
                      (isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'valid'
                        ? 'hover:bg-green-400'
                        : (isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'invalid'
                        ? 'hover:bg-red-600 hover:text-white'
                        : ''
                    }`}
                    onClick={createNewScript}
                    onMouseEnter={() => {
                      setNewScriptHoverTone(scriptNameValidation.tone);
                      setIsNewScriptHovered(true);
                    }}
                    onMouseLeave={() => setIsNewScriptHovered(false)}
                    aria-disabled={scriptNameValidation.tone !== 'valid'}
                    title={scriptNameValidation.message}
                  >
                    {(isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'invalid' &&
                    isNewScriptHovered
                      ? 'Name Exists'
                      : 'New Script'}
                  </button>
                  <div className="relative min-w-0">
                    <input
                      className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
                      value={scriptNameInput}
                      onFocus={() => setIsScriptOptionsOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setIsScriptOptionsOpen(false), 100);
                      }}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setScriptNameInput(nextValue);
                        const matchingScript = scripts.find((script) => script.name === nextValue);
                        if (matchingScript) {
                          setSelectedScriptId(matchingScript.id);
                        }
                      }}
                      aria-label="Script selector"
                      title="Script selector"
                      placeholder={scripts.length === 0 ? 'Script 1' : 'Select or name a script'}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsScriptOptionsOpen((prev) => !prev);
                      }}
                      className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-lg text-[#8FA8FF] transition-colors hover:text-white"
                      title="Show scripts"
                      aria-label="Show scripts"
                    >
                      v
                    </button>
                    {isScriptOptionsOpen && visibleScriptOptions.length > 0 ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#334155] bg-[#0E111B] shadow-lg">
                        {visibleScriptOptions.map((script) => (
                          <button
                            key={script.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedScriptId(script.id);
                              setScriptNameInput(script.name);
                              setIsScriptOptionsOpen(false);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#1E293B]"
                            title={script.name}
                          >
                            {script.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={`w-[140px] ${actionButtonStyle} ${
                      (isDeleteScriptHovered ? deleteScriptHoverTone : deleteScriptValidation.tone) === 'invalid'
                        ? 'hover:bg-red-600 hover:text-white'
                        : ''
                    }`}
                    onClick={handleDeleteScriptClick}
                    onMouseEnter={() => {
                      setDeleteScriptHoverTone(deleteScriptValidation.tone);
                      setIsDeleteScriptHovered(true);
                    }}
                    onMouseLeave={() => setIsDeleteScriptHovered(false)}
                    aria-disabled={deleteScriptValidation.tone !== 'valid'}
                    title={deleteScriptValidation.message}
                  >
                    {(isDeleteScriptHovered ? deleteScriptHoverTone : deleteScriptValidation.tone) === 'invalid' &&
                    isDeleteScriptHovered
                      ? 'Not Found'
                      : 'Delete Script'}
                  </button>
                </div>
                <div className="mt-4 flex h-56 flex-col rounded-lg border border-[#31416F] bg-[#0E111B] px-3 pb-3 pt-1.5 text-sm text-slate-200">
                  <div className="flex items-center justify-end gap-[0.05rem]">
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-green-400 transition-colors hover:bg-[#1E293B] hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-70"
                      title="Run Script"
                      onClick={() => void runActiveMethod()}
                    >
                      <Image
                        src="/assets/miscellaneous/run.png"
                        alt="Run Script"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        style={{ filter: 'brightness(0) saturate(100%) invert(71%) sepia(39%) saturate(640%) hue-rotate(73deg) brightness(93%) contrast(90%)' }}
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                      title="Run to Next Step"
                      onClick={() => goToAdjacentScriptStep(1)}
                      disabled={!selectedScript || (selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber) >= selectedScript.steps.length - 1 && selectedScript.steps.length > 0)}
                    >
                      <Image
                        src="/assets/miscellaneous/next.png"
                        alt="Run to Next Step"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                      title="Move to Previous Step"
                      onClick={() => goToAdjacentScriptStep(-1)}
                      disabled={!selectedScript || selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber) <= 0}
                    >
                      <Image
                        src="/assets/miscellaneous/back.png"
                        alt="Move to Previous Step"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        style={{ filter: 'brightness(0) saturate(100%) invert(76%) sepia(44%) saturate(633%) hue-rotate(357deg) brightness(95%) contrast(88%)' }}
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-slate-200 transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70"
                      title="Run Remaining Scrept"
                      disabled
                    >
                      <Image
                        src="/assets/miscellaneous/continue.png"
                        alt="Run Remaining Scrept"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        style={{ filter: 'brightness(0) saturate(100%) invert(71%) sepia(39%) saturate(640%) hue-rotate(73deg) brightness(93%) contrast(90%)' }}
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                      title="Move Step Up"
                      onClick={() => moveSelectedScriptStep(-1)}
                      disabled={!selectedScript || selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber) <= 0}
                    >
                      <Image
                        src="/assets/miscellaneous/up.png"
                        alt="Move Step Up"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        style={{ filter: 'brightness(0) saturate(100%) invert(57%) sepia(58%) saturate(2412%) hue-rotate(200deg) brightness(98%) contrast(96%)' }}
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                      title="Move Step Down"
                      onClick={() => moveSelectedScriptStep(1)}
                      disabled={!selectedScript || (selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber) >= selectedScript.steps.length - 1 && selectedScript.steps.length > 0)}
                    >
                      <Image
                        src="/assets/miscellaneous/down.png"
                        alt="Move Step Down"
                        width={21}
                        height={21}
                        className="block h-[21px] w-[21px]"
                        style={{ filter: 'brightness(0) saturate(100%) invert(57%) sepia(58%) saturate(2412%) hue-rotate(200deg) brightness(98%) contrast(96%)' }}
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-red-400 transition-colors hover:bg-[#1E293B] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Delete Step"
                      onClick={requestDeleteSelectedScriptStep}
                      disabled={selectedScriptStepNumber === null}
                    >
                      <span className="block text-[21px] leading-none">✖</span>
                    </button>
                  </div>
                  <div className={`min-h-0 flex-1 overflow-auto pt-1 ${hiddenScrollbarClass}`}>
                    {!selectedScript ? (
                      <div className="text-slate-400">(no script selected)</div>
                    ) : selectedScript.steps.length === 0 ? (
                      <div className="text-slate-400">(script has no steps yet)</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1">
                        {selectedScript.steps.map((step) => renderScriptStepRow(step))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
                <h3 className="text-center text-lg font-semibold text-[#5981F3]">Active Test Method</h3>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#5981F3]">{methodPanelTitle}</h2>
                  <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-200">
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
                invalidFieldIds={invalidFieldIds}
                clearInvalidField={clearInvalidField}
                selectedReadMethod={selectedReadMethod}
                hardhatAccounts={hardhatAccounts}
                hardhatAccountMetadata={hardhatAccountMetadata}
                erc20ReadOptions={erc20ReadOptions}
                setSelectedReadMethod={(value) => setSelectedReadMethod(value as Erc20ReadMethod)}
                activeReadLabels={activeReadLabels}
                readAddressA={readAddressA}
                setReadAddressA={setReadAddressA}
                readAddressB={readAddressB}
                setReadAddressB={setReadAddressB}
                buttonStyle={buttonStyle}
                writeTraceEnabled={writeTraceEnabled}
                toggleWriteTrace={() => setWriteTraceEnabled((prev) => !prev)}
                canRunSelectedReadMethod={canRunErc20ReadMethod}
                canAddCurrentMethodToScript={canRunErc20ReadMethod}
                missingFieldIds={erc20ReadMissingEntries.map((entry) => entry.id)}
                runSelectedReadMethod={runSelectedReadMethod}
                addCurrentMethodToScript={addCurrentMethodToScript}
              />
            )}

            {methodPanelMode === 'erc20_write' && (
              <Erc20WriteController
                invalidFieldIds={invalidFieldIds}
                clearInvalidField={clearInvalidField}
                mode={mode}
                hardhatAccounts={hardhatAccounts}
                hardhatAccountMetadata={hardhatAccountMetadata}
                selectedWriteSenderAddress={selectedWriteSenderAccount?.address || selectedWriteSenderAddress}
                setSelectedWriteSenderAddress={setSelectedWriteSenderAddress}
                writeSenderDisplayValue={writeSenderDisplayValue}
                writeSenderPrivateKeyDisplay={writeSenderPrivateKeyDisplay}
                showWriteSenderPrivateKey={showWriteSenderPrivateKey}
                toggleShowWriteSenderPrivateKey={() => setShowWriteSenderPrivateKey((prev) => !prev)}
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
                writeTraceEnabled={writeTraceEnabled}
                toggleWriteTrace={() => setWriteTraceEnabled((prev) => !prev)}
                canRunSelectedWriteMethod={canRunErc20WriteMethod}
                canAddCurrentMethodToScript={canRunErc20WriteMethod}
                missingFieldIds={erc20WriteMissingEntries.map((entry) => entry.id)}
                runSelectedWriteMethod={runSelectedWriteMethod}
                addCurrentMethodToScript={addCurrentMethodToScript}
              />
            )}

            {methodPanelMode === 'spcoin_rread' && (
              <SpCoinReadController
                invalidFieldIds={invalidFieldIds}
                clearInvalidField={clearInvalidField}
                hardhatAccounts={hardhatAccounts}
                hardhatAccountMetadata={hardhatAccountMetadata}
                selectedSpCoinReadMethod={selectedSpCoinReadMethod}
                setSelectedSpCoinReadMethod={(value) => setSelectedSpCoinReadMethod(value as SpCoinReadMethod)}
                spCoinReadOptions={spCoinReadOptions}
                spCoinReadMethodDefs={spCoinReadMethodDefs as Record<string, { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean }>}
                activeSpCoinReadDef={activeSpCoinReadDef as { title: string; params: { label: string; placeholder: string; type?: string }[]; executable?: boolean }}
                spReadParams={spReadParams}
                setSpReadParams={setSpReadParams}
                inputStyle={inputStyle}
                buttonStyle={buttonStyle}
                writeTraceEnabled={writeTraceEnabled}
                toggleWriteTrace={() => setWriteTraceEnabled((prev) => !prev)}
                canRunSelectedSpCoinReadMethod={canRunSpCoinReadMethod}
                canAddCurrentMethodToScript={canRunSpCoinReadMethod}
                missingFieldIds={spCoinReadMissingEntries.map((entry) => entry.id)}
                runSelectedSpCoinReadMethod={runSelectedSpCoinReadMethod}
                addCurrentMethodToScript={addCurrentMethodToScript}
              />
            )}

            {methodPanelMode === 'spcoin_write' && (
              <SpCoinWriteController
                invalidFieldIds={invalidFieldIds}
                clearInvalidField={clearInvalidField}
                mode={mode}
                hardhatAccounts={hardhatAccounts}
                hardhatAccountMetadata={hardhatAccountMetadata}
                selectedWriteSenderAddress={selectedWriteSenderAccount?.address || selectedWriteSenderAddress}
                setSelectedWriteSenderAddress={setSelectedWriteSenderAddress}
                writeSenderDisplayValue={writeSenderDisplayValue}
                writeSenderPrivateKeyDisplay={writeSenderPrivateKeyDisplay}
                showWriteSenderPrivateKey={showWriteSenderPrivateKey}
                toggleShowWriteSenderPrivateKey={() => setShowWriteSenderPrivateKey((prev) => !prev)}
                recipientRateKeyOptions={recipientRateKeyOptions}
                agentRateKeyOptions={agentRateKeyOptions}
                recipientRateKeyHelpText={recipientRateKeyHelpText}
                agentRateKeyHelpText={agentRateKeyHelpText}
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
                writeTraceEnabled={writeTraceEnabled}
                toggleWriteTrace={() => setWriteTraceEnabled((prev) => !prev)}
                canRunSelectedSpCoinWriteMethod={canRunSpCoinWriteMethod}
                canAddCurrentMethodToScript={canRunSpCoinWriteMethod}
                missingFieldIds={spCoinWriteMissingEntries.map((entry) => entry.id)}
                runSelectedSpCoinWriteMethod={runSelectedSpCoinWriteMethod}
                addCurrentMethodToScript={addCurrentMethodToScript}
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
              </section>
            </div>
          </article>
          )}

          {showCard('output') && (
          <article
            className={`${getCardClassName('output', expandedCard ? '' : 'xl:col-start-2 xl:row-start-2')} min-h-0 self-start overflow-hidden`}
            style={!expandedCard && isDesktopSharedLayout && sharedMethodsRowHeight ? { height: `${sharedMethodsRowHeight}px` } : undefined}
          >
            <LabCardHeader
              title="Test Output Results"
              isExpanded={expandedCard === 'output'}
              onToggleExpand={() => toggleExpandedCard('output')}
              secondaryRow={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="output-panel-mode"
                        value="execution"
                        checked={outputPanelMode === 'execution'}
                        onChange={(e) => setOutputPanelMode(e.target.value as OutputPanelMode)}
                      />
                      <span>Execution</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="output-panel-mode"
                        value="formatted"
                        checked={outputPanelMode === 'formatted'}
                        onChange={(e) => setOutputPanelMode(e.target.value as OutputPanelMode)}
                      />
                      <span>Formatted</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="output-panel-mode"
                        value="tree"
                        checked={outputPanelMode === 'tree'}
                        onChange={(e) => setOutputPanelMode(e.target.value as OutputPanelMode)}
                      />
                      <span>Tree</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="output-panel-mode"
                        value="raw_status"
                        checked={outputPanelMode === 'raw_status'}
                        onChange={(e) => setOutputPanelMode(e.target.value as OutputPanelMode)}
                      />
                      <span>Raw Status</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap justify-start gap-3 sm:justify-end">
                  <button
                    type="button"
                    className={buttonStyle}
                    onClick={() =>
                      void copyTextToClipboard(
                        outputPanelMode === 'execution'
                          ? 'Execution Log'
                          : outputPanelMode === 'tree'
                          ? 'Tree'
                          : outputPanelMode === 'raw_status'
                          ? 'Raw Status'
                          : 'Formatted Output Display',
                        outputPanelMode === 'execution'
                          ? logs.join('\n')
                          : outputPanelMode === 'tree'
                          ? treeOutputDisplay
                          : outputPanelMode === 'raw_status'
                          ? status
                          : formattedOutputDisplay,
                      )
                    }
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    type="button"
                    className={buttonStyle}
                    onClick={() => {
                      if (outputPanelMode === 'execution') {
                        setLogs([]);
                        return;
                      }
                      if (outputPanelMode === 'tree') {
                        setTreeOutputDisplay('(no tree yet)');
                        return;
                      }
                      if (outputPanelMode === 'formatted') {
                        setFormattedOutputDisplay('(no output yet)');
                      }
                    }}
                  >
                    {outputPanelMode === 'execution'
                      ? 'Clear Log'
                      : outputPanelMode === 'formatted' || outputPanelMode === 'tree'
                      ? 'Clear'
                      : 'Copy Only'}
                  </button>
                </div>
                </div>
              }
            />
            <div className="mt-4 min-h-0 flex flex-1 flex-col overflow-hidden">
              {outputPanelMode === 'tree' ? (
                <>
                  <p className="text-sm text-slate-200">
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
                </>
              ) : null}
              <pre className={`mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-[#334155] bg-[#0B1220] p-3 text-xs text-slate-200 ${hiddenScrollbarClass}`}>
                {outputPanelMode === 'formatted' && highlightedFormattedOutputLines
                  ? highlightedFormattedOutputLines.map(({ line, active }, idx) => (
                      <span key={`formatted-line-${idx}`} className={active ? 'text-green-400' : undefined}>
                        {line}
                        {'\n'}
                      </span>
                    ))
                  : outputPanelMode === 'execution'
                  ? logs.join('\n')
                  : outputPanelMode === 'tree'
                  ? treeOutputDisplay
                  : outputPanelMode === 'raw_status'
                  ? status
                  : formattedOutputDisplay}
              </pre>
            </div>
          </article>
          )}
        </section>
      </section>
      {validationPopupFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-lg font-semibold text-red-400">Missing Required Fields</h3>
            <p className="mt-2 text-sm text-slate-200">Fill in the following fields before executing the method:</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-100">
              {validationPopupFields.map((label) => (
                <li key={`missing-${label}`}>{label}</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className={buttonStyle}
                onClick={() => setValidationPopupFields([])}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteStepPopupOpen && selectedScriptStep ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-lg font-semibold text-red-400">Delete Method</h3>
            <p className="mt-2 text-sm text-slate-200">
              Deleting method <span className="font-semibold text-slate-100">{selectedScriptStep.name}</span>
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className={buttonStyle}
                onClick={() => setIsDeleteStepPopupOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-500 bg-red-950 px-3 py-[0.45rem] text-sm text-red-200 transition-colors hover:bg-red-600 hover:text-white"
                onClick={confirmDeleteSelectedScriptStep}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
