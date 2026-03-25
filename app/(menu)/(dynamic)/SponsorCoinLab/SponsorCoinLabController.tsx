// File: app/(menu)/(dynamic)/SponsorCoinLab/SponsorCoinLabController.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { useExchangeContext } from '@/lib/context/hooks';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';
import { hydrateAccountFromAddress, makeAccountFallback } from '@/lib/context/helpers/accountHydration';
import {
  ERC20_READ_OPTIONS,
  getErc20ReadLabels,
  type Erc20ReadMethod,
} from './methods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  getErc20WriteLabels,
  type Erc20WriteMethod,
} from './methods/erc20/write';
import {
  SPCOIN_READ_METHOD_DEFS,
  getSpCoinAdminReadOptions,
  getSpCoinCompoundReadOptions,
  getSpCoinSenderReadOptions,
  getSpCoinWorldReadOptions,
  normalizeSpCoinReadMethod,
  type SpCoinReadMethod,
} from './methods/spcoin/read';
import {
  SPCOIN_WRITE_METHOD_DEFS,
  getSpCoinAdminWriteOptions,
  getSpCoinSenderWriteOptions,
  getSpCoinTodoWriteOptions,
  getSpCoinWorldWriteOptions,
  getSpCoinWriteOptions,
  type SpCoinWriteMethod,
} from './methods/spcoin/write';
import {
  SERIALIZATION_TEST_METHOD_DEFS,
  getSerializationTestOptions,
  type SerializationTestMethod,
} from './methods/serializationTests';
import { createSpCoinLibraryAccess, createSpCoinModuleAccess, type SpCoinContractAccess } from './methods/shared';
import type { MethodDef } from './methods/shared/types';
import {
  CALENDAR_WEEK_DAYS,
  formatDateInput,
  formatDateTimeDisplay,
  parseDateInput,
  useBackdateCalendar,
} from './hooks/useBackdateCalendar';
import { useSponsorCoinLabMethods } from './hooks/useSponsorCoinLabMethods';
import { useSponsorCoinLabNetwork } from './hooks/useSponsorCoinLabNetwork';
import { useSponsorCoinLabPersistence } from './hooks/useSponsorCoinLabPersistence';
import { useSponsorCoinLabScripts } from './hooks/useSponsorCoinLabScripts';
import ContractNetworkCard from './components/ContractNetworkCard';
import DeleteStepPopup from './components/DeleteStepPopup';
import DiscardChangesPopup from './components/DiscardChangesPopup';
import MethodsPanelCard from './components/MethodsPanelCard';
import NetworkSignerCard from './components/NetworkSignerCard';
import OutputResultsCard from './components/OutputResultsCard';
import ScriptStepRow from './components/ScriptStepRow';
import ValidationPopup from './components/ValidationPopup';
import {
  type ConnectionMode,
  type LabScriptStep,
  type MethodPanelMode,
} from './scriptBuilder/types';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { STATUS, type spCoinAccount } from '@/lib/structure';

type LabCardId = 'network' | 'contract' | 'methods' | 'log' | 'output';
type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type FormattedPanelView = 'script' | 'output';
type MethodSelectionSource = 'dropdown' | 'script';
type SponsorCoinAccountRole = 'sponsor' | 'recipient' | 'agent';
type SponsorCoinManageContract = SpCoinContractAccess & {
  addSponsor?: (accountAddress: string) => Promise<unknown>;
  addRecipient?: (accountAddress: string) => Promise<unknown>;
  addAgent?: (recipientKey: string, recipientRateKey: string, accountAddress: string) => Promise<unknown>;
  deleteAccountRecord?: (accountAddress: string) => Promise<unknown>;
};
type MethodDefMap = Record<string, MethodDef>;

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.28rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const actionButtonStyle =
  'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60';
const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';
const hiddenScrollbarClass =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
const SP_COIN_LAB_STORAGE_KEY = 'spCoinLabKey';

function normalizeAddressValue(value: string) {
  const trimmed = String(value || '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
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

function buildDefaultAccountParams(
  params: Array<{ label: string }>,
  defaults: {
    sponsor: string;
    recipient: string;
    agent: string;
  },
) {
  return params.map((param) => {
    const label = String(param.label || '').toLowerCase();
    if (label === 'msg.sender') return defaults.sponsor;
    if (label.includes('sponsor')) return defaults.sponsor;
    if (label.includes('recipient') && !label.includes('rate')) return defaults.recipient;
    if (label.includes('agent') && !label.includes('rate')) return defaults.agent;
    if (label === 'account key') return defaults.sponsor;
    return '';
  });
}

function normalizeParamLabel(value: string) {
  return String(value || '').trim().toLowerCase();
}

function isDefinedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseStructuredErrorMessage(input: string): Record<string, unknown> | null {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;
  const normalizeQuotedReason = (value: string) =>
    String(value || '').replace(/execution reverted:\s*"([^"]+)"/i, 'execution reverted: $1');

  const extractQuotedValue = (label: string) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = trimmed.match(new RegExp(`${escapedLabel}=\"([^\"]*)\"`));
    return match?.[1];
  };

  const extractParenValue = (label: string) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = trimmed.match(new RegExp(`${escapedLabel}=([^,\\)]+)`));
    return match?.[1]?.trim();
  };

  const messageMatch = trimmed.match(/^([^([]+?)(?:\s+\(|$)/);
  const topLevelMessage = String(messageMatch?.[1] || '').trim();
  const action = extractQuotedValue('action');
  const data = extractQuotedValue('data');
  const reason = extractQuotedValue('reason');
  const code = extractParenValue('code');
  const version = extractParenValue('version');
  const transactionData = extractQuotedValue('transaction={ "data":');
  const transactionFrom = extractQuotedValue('"from":');
  const transactionTo = extractQuotedValue('"to":');
  const revertName = extractQuotedValue('"name":');
  const revertSignature = extractQuotedValue('"signature":');

  const revertArgsMatch = trimmed.match(/"args":\s*\[\s*"([^"]*)"\s*\]/);
  const revertArg = revertArgsMatch?.[1];

  const out: Record<string, unknown> = {};
  if (topLevelMessage && topLevelMessage !== trimmed) {
    out.message = normalizeQuotedReason(topLevelMessage);
  }
  if (reason) out.reason = reason;
  if (action) out.action = action;
  if (code) out.code = code;
  if (version) out.version = version;
  if (data) out.data = data;
  if (transactionData || transactionFrom || transactionTo) {
    out.transaction = {
      ...(transactionData ? { data: transactionData } : {}),
      ...(transactionFrom ? { from: transactionFrom } : {}),
      ...(transactionTo ? { to: transactionTo } : {}),
    };
  }
  if (revertName || revertSignature || revertArg) {
    out.revert = {
      ...(revertName ? { name: revertName } : {}),
      ...(revertSignature ? { signature: revertSignature } : {}),
      ...(revertArg ? { args: [revertArg] } : {}),
    };
  }

  return Object.keys(out).length > 0 ? out : null;
}

function formatOutputValue(value: unknown, keyPath: string[] = []): unknown {
  const parseSerializedMapString = (input: string): Record<string, unknown> | null => {
    const trimmed = input.trim();
    if (!trimmed.includes(':')) return null;

    const normalizedSeparators = trimmed
      .replace(/\\,\s*/g, '\n')
      .replace(/,\s*(?=[A-Za-z_][A-Za-z0-9_ ]*:)/g, '\n');
    const segments = normalizedSeparators
      .split(/\n+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (segments.length === 0 || !segments.every((entry) => entry.includes(':'))) return null;

    const out: Record<string, unknown> = {};
    for (const segment of segments) {
      const colonIdx = segment.indexOf(':');
      if (colonIdx <= 0) return null;
      const rawKey = segment.slice(0, colonIdx).trim();
      const rawValue = segment.slice(colonIdx + 1).trim();
      if (!rawKey) return null;

      const normalizedKey = rawKey.replace(/\s+/g, '_');
      if (!rawValue) {
        out[normalizedKey] = '';
        continue;
      }
      if (rawValue === 'true' || rawValue === 'false') {
        out[normalizedKey] = rawValue === 'true';
        continue;
      }
      if (/^0x[0-9a-fA-F]+$/.test(rawValue) && !isAddressLike(rawValue)) {
        try {
          out[normalizedKey] = {
            hex: rawValue,
            dec: formatDecimalString(BigInt(rawValue).toString()),
          };
          continue;
        } catch {
          // fall through
        }
      }
      out[normalizedKey] = formatOutputValue(rawValue, [...keyPath, normalizedKey]);
    }

    return out;
  };

  if (typeof value === 'bigint') return formatDecimalString(value.toString());
  if (Array.isArray(value)) {
    const normalizedEntries = value.map((entry) => formatOutputValue(entry, keyPath));
    const keyedEntries = normalizedEntries.length > 0 && normalizedEntries.every((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
      const record = entry as Record<string, unknown>;
      const candidateKey = record.label ?? record.key;
      return typeof candidateKey === 'string' && ('value' in record);
    });
    if (keyedEntries) {
      return Object.fromEntries(
        normalizedEntries.map((entry) => {
          const record = entry as Record<string, unknown>;
          const nextKey = String(record.label ?? record.key).trim();
          return [nextKey || 'value', record.value];
        }),
      );
    }
    return normalizedEntries;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, formatOutputValue(entry, [...keyPath, key])]),
    );
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || isAddressLike(trimmed) || isHashLike(trimmed)) return value;
    if (keyPath.includes('error') || keyPath[keyPath.length - 1] === 'message') {
      const parsedError = parseStructuredErrorMessage(trimmed);
      return parsedError ?? value;
    }
    const parsedSerializedMap = parseSerializedMapString(trimmed);
    if (parsedSerializedMap) return parsedSerializedMap;
    if (/^0x[0-9a-fA-F]+$/.test(trimmed) && !isAddressLike(trimmed)) {
      try {
        return {
          hex: trimmed,
          dec: formatDecimalString(BigInt(trimmed).toString()),
        };
      } catch {
        // fall through
      }
    }
    if (isIntegerString(trimmed)) return formatDecimalString(trimmed);
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return formatDecimalString(String(Math.trunc(value)));
  return value;
}

function formatOutputDisplayValue(value: unknown) {
  const normalizeEnvelope = (input: unknown): unknown => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const out = { ...(input as Record<string, unknown>) };
    if (typeof out.error === 'string') {
      out.error = {
        message: out.error,
      };
    }
    return out;
  };

  const normalized = formatOutputValue(normalizeEnvelope(value));
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
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const [, setSettings] = useSettings();
  const useLocalSpCoinAccessPackage =
    exchangeContext?.settings?.spCoinAccessManager?.source !== 'node';
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [contractAddress, setContractAddress] = useState('');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin SandBox] Ready']);
  const [formattedOutputDisplay, setFormattedOutputDisplay] = useState('(no output yet)');
  const [treeOutputDisplay, setTreeOutputDisplay] = useState('(no tree yet)');
  const [outputPanelMode, setOutputPanelMode] = useState<OutputPanelMode>('formatted');
  const [formattedPanelView, setFormattedPanelView] = useState<FormattedPanelView>('script');
  const [formattedJsonViewEnabled, setFormattedJsonViewEnabled] = useState(true);
  const [isScriptDebugRunning, setIsScriptDebugRunning] = useState(false);
  const [writeTraceEnabled, setWriteTraceEnabled] = useState(false);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [validationPopupFields, setValidationPopupFields] = useState<string[]>([]);
  const [validationPopupMessage, setValidationPopupMessage] = useState(
    'Fill in the following fields before executing the method:',
  );
  const [validationPopupTitle, setValidationPopupTitle] = useState('Missing Required Fields');
  const [validationPopupConfirmLabel, setValidationPopupConfirmLabel] = useState('');
  const [validationPopupCancelLabel, setValidationPopupCancelLabel] = useState('Close');
  const validationPopupConfirmRef = useRef<(() => void | Promise<void>) | null>(null);
  const [isDiscardChangesPopupOpen, setIsDiscardChangesPopupOpen] = useState(false);
  const discardChangesConfirmRef = useRef<(() => void | Promise<void>) | null>(null);
  const previousContractAddressRef = useRef('');
  const [isRemovingContractFromApp, setIsRemovingContractFromApp] = useState(false);
  const [removedContractAddresses, setRemovedContractAddresses] = useState<string[]>([]);
  const spCoinOwnerSyncRef = useRef({
    contractKey: '',
    requestId: 0,
  });

  const [selectedWriteMethod, setSelectedWriteMethod] = useState<Erc20WriteMethod>('transfer');
  const [writeAddressA, setWriteAddressA] = useState('');
  const [writeAddressB, setWriteAddressB] = useState('');
  const [writeAmountRaw, setWriteAmountRaw] = useState('');
  const [methodPanelMode, setMethodPanelMode] = useState<MethodPanelMode>('ecr20_read');
  const [isSpCoinTodoMode, setIsSpCoinTodoMode] = useState(false);
  const [selectedReadMethod, setSelectedReadMethod] = useState<Erc20ReadMethod>('name');
  const [readAddressA, setReadAddressA] = useState('');
  const [readAddressB, setReadAddressB] = useState('');
  const [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod] =
    useState<SpCoinReadMethod>('getSPCoinHeaderRecord');
  const [selectedSpCoinWriteMethod, setSelectedSpCoinWriteMethod] =
    useState<SpCoinWriteMethod>('addRecipient');
  const [selectedSerializationTestMethod, setSelectedSerializationTestMethod] =
    useState<SerializationTestMethod>('external_getSerializedSPCoinHeader');
  const [selectedSponsorCoinAccountRole, setSelectedSponsorCoinAccountRole] =
    useState<SponsorCoinAccountRole>('sponsor');
  const [defaultSponsorKey, setDefaultSponsorKeyState] = useState('');
  const [defaultRecipientKey, setDefaultRecipientKeyState] = useState('');
  const [defaultAgentKey, setDefaultAgentKeyState] = useState('');
  const [managedRoleAccountAddress, setManagedRoleAccountAddress] = useState('');
  const [managedRecipientKey, setManagedRecipientKey] = useState('');
  const [managedRecipientRateKey, setManagedRecipientRateKey] = useState('');
  const [managedRecipientRateKeyOptions, setManagedRecipientRateKeyOptions] = useState<string[]>([]);
  const [managedRecipientRateKeyHelpText, setManagedRecipientRateKeyHelpText] = useState('');
  const [sponsorCoinAccountManagementStatus, setSponsorCoinAccountManagementStatus] = useState('');
  const [spReadParams, setSpReadParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [spWriteParams, setSpWriteParams] = useState<string[]>(Array.from({ length: 7 }, () => ''));
  const [serializationTestParams, setSerializationTestParams] = useState<string[]>(
    Array.from({ length: 7 }, () => ''),
  );
  const [methodSelectionSource, setMethodSelectionSource] = useState<MethodSelectionSource>('dropdown');
  const [editingScriptStepNumber, setEditingScriptStepNumber] = useState<number | null>(null);
  const accountSyncRequestRef = useRef({
    sponsor: 0,
    recipient: 0,
    agent: 0,
  });

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);
  const sponsorAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.sponsorAccount?.address ?? ''),
  );
  const recipientAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.recipientAccount?.address ?? ''),
  );
  const agentAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.agentAccount?.address ?? ''),
  );
  const activeAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.activeAccount?.address ?? ''),
  );
  const spCoinOwnerAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.spCoinOwnerAccount?.address ?? ''),
  );
  const sellTokenAmountRaw =
    typeof exchangeContext?.tradeData?.sellTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.sellTokenContract.amount.toString()
      : '';
  const buyTokenAmountRaw =
    typeof exchangeContext?.tradeData?.buyTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.buyTokenContract.amount.toString()
      : '';
  const previewTokenAmountRaw =
    typeof exchangeContext?.tradeData?.previewTokenContract?.amount === 'bigint'
      ? exchangeContext.tradeData.previewTokenContract.amount.toString()
      : '';
  const syncRoleAccountToExchangeContext = useCallback(
    (role: SponsorCoinAccountRole, nextValue: string) => {
      const normalized = normalizeAddressValue(nextValue);
      const currentAccount =
        role === 'sponsor'
          ? exchangeContext?.accounts?.sponsorAccount
          : role === 'recipient'
          ? exchangeContext?.accounts?.recipientAccount
          : exchangeContext?.accounts?.agentAccount;
      const currentAddress = normalizeAddressValue(String(currentAccount?.address ?? ''));
      if (normalized === currentAddress) return;

      const accountField =
        role === 'sponsor'
          ? 'sponsorAccount'
          : role === 'recipient'
          ? 'recipientAccount'
          : 'agentAccount';

      if (!normalized) {
        setExchangeContext(
          (prev) => {
            if (!prev.accounts?.[accountField]) return prev;
            return {
              ...prev,
              accounts: {
                ...prev.accounts,
                [accountField]: undefined,
              },
            };
          },
          `SponsorCoinLab:${role}:clearAccount`,
        );
        return;
      }

      if (!isAddressLike(normalized)) return;

      const requestId = ++accountSyncRequestRef.current[role];
      const preservedBalance =
        currentAddress === normalized && typeof currentAccount?.balance === 'bigint'
          ? currentAccount.balance
          : undefined;

      void (async () => {
        let nextAccount: spCoinAccount;
        try {
          nextAccount = await hydrateAccountFromAddress(normalized as Address, {
            balance: preservedBalance,
          });
        } catch {
          nextAccount = makeAccountFallback(
            normalized as Address,
            STATUS.MESSAGE_ERROR,
            `Account ${normalized} metadata could not be loaded`,
            preservedBalance,
          );
        }

        if (accountSyncRequestRef.current[role] !== requestId) return;

        setExchangeContext(
          (prev) => {
            const prevAccount = prev.accounts?.[accountField];
            const prevAddress = normalizeAddressValue(String(prevAccount?.address ?? ''));
            if (
              prevAddress === normalized &&
              prevAccount?.name === nextAccount.name &&
              prevAccount?.symbol === nextAccount.symbol &&
              prevAccount?.logoURL === nextAccount.logoURL &&
              prevAccount?.description === nextAccount.description &&
              prevAccount?.website === nextAccount.website &&
              prevAccount?.type === nextAccount.type &&
              prevAccount?.status === nextAccount.status &&
              prevAccount?.balance === nextAccount.balance
            ) {
              return prev;
            }
            return {
              ...prev,
              accounts: {
                ...prev.accounts,
                [accountField]: nextAccount,
              },
            };
          },
          `SponsorCoinLab:${role}:setAccount`,
        );
      })();
    },
    [
      exchangeContext?.accounts?.agentAccount,
      exchangeContext?.accounts?.recipientAccount,
      exchangeContext?.accounts?.sponsorAccount,
      setExchangeContext,
    ],
  );
  const setDefaultSponsorKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultSponsorKeyState(normalized);
      syncRoleAccountToExchangeContext('sponsor', normalized);
    },
    [syncRoleAccountToExchangeContext],
  );
  const setDefaultRecipientKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultRecipientKeyState(normalized);
      syncRoleAccountToExchangeContext('recipient', normalized);
    },
    [syncRoleAccountToExchangeContext],
  );
  const setDefaultAgentKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultAgentKeyState(normalized);
      syncRoleAccountToExchangeContext('agent', normalized);
    },
    [syncRoleAccountToExchangeContext],
  );
  useEffect(() => {
    if (defaultSponsorKey !== sponsorAccountAddress) {
      setDefaultSponsorKeyState(sponsorAccountAddress);
    }
  }, [defaultSponsorKey, sponsorAccountAddress]);
  useEffect(() => {
    if (defaultRecipientKey !== recipientAccountAddress) {
      setDefaultRecipientKeyState(recipientAccountAddress);
    }
  }, [defaultRecipientKey, recipientAccountAddress]);
  useEffect(() => {
    if (defaultAgentKey !== agentAccountAddress) {
      setDefaultAgentKeyState(agentAccountAddress);
    }
  }, [defaultAgentKey, agentAccountAddress]);
  const buildScriptEditorParamValues = useCallback(
    (
      params: Array<{ label: string }>,
      contractMeta?: {
        version?: string;
        inflationRate?: number;
        recipientRateRange?: [number, number];
        agentRateRange?: [number, number];
      },
    ) => {
      const currentMeta = exchangeContext?.settings?.spCoinContract;
      const resolvedMeta = {
        version:
          contractMeta?.version ?? (String(currentMeta?.version ?? '').trim() || undefined),
        inflationRate:
          contractMeta?.inflationRate ??
          (isDefinedNumber(currentMeta?.inflationRate) ? currentMeta.inflationRate : undefined),
        recipientRateRange:
          contractMeta?.recipientRateRange ??
          (Array.isArray(currentMeta?.recipientRateRange) &&
          isDefinedNumber(currentMeta.recipientRateRange[0]) &&
          isDefinedNumber(currentMeta.recipientRateRange[1])
            ? currentMeta.recipientRateRange
            : undefined),
        agentRateRange:
          contractMeta?.agentRateRange ??
          (Array.isArray(currentMeta?.agentRateRange) &&
          isDefinedNumber(currentMeta.agentRateRange[0]) &&
          isDefinedNumber(currentMeta.agentRateRange[1])
            ? currentMeta.agentRateRange
            : undefined),
      };
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;

      return params.map((param) => {
        const label = normalizeParamLabel(param.label);
        if (label === 'msg.sender') return senderAddress;
        if (label === 'sponsor key' || label === 'sponsor account') return sponsorAccountAddress;
        if (label === 'recipient key' || label === 'recipient account') return recipientAccountAddress;
        if (label === 'agent key' || label === 'agent account' || label === 'account agent key') {
          return agentAccountAddress;
        }
        if (label === 'account key' || label === 'source key') {
          return sponsorAccountAddress || activeAccountAddress;
        }
        if (label === 'new version') return resolvedMeta.version ?? '';
        if (label === 'new inflation rate') {
          return resolvedMeta.inflationRate !== undefined ? String(resolvedMeta.inflationRate) : '';
        }
        if (label === 'new lower recipient rate') {
          return resolvedMeta.recipientRateRange ? String(resolvedMeta.recipientRateRange[0]) : '';
        }
        if (label === 'new upper recipient rate') {
          return resolvedMeta.recipientRateRange ? String(resolvedMeta.recipientRateRange[1]) : '';
        }
        if (label === 'new lower agent rate') {
          return resolvedMeta.agentRateRange ? String(resolvedMeta.agentRateRange[0]) : '';
        }
        if (label === 'new upper agent rate') {
          return resolvedMeta.agentRateRange ? String(resolvedMeta.agentRateRange[1]) : '';
        }
        return '';
      });
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      defaultSponsorKey,
      exchangeContext?.settings?.spCoinContract,
      recipientAccountAddress,
      sponsorAccountAddress,
    ],
  );
  const buildErc20ReadEditorDefaults = useCallback(
    (labels: { addressALabel: string; addressBLabel: string }) => {
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      const resolveByLabel = (label: string) => {
        const normalized = normalizeParamLabel(label);
        if (normalized === 'owner address' || normalized === 'from address') return senderAddress;
        if (normalized === 'to address' || normalized === 'recipient address' || normalized === 'recipient key') {
          return recipientAccountAddress;
        }
        if (normalized === 'spender address') return agentAccountAddress;
        return '';
      };
      return {
        addressA: resolveByLabel(labels.addressALabel),
        addressB: resolveByLabel(labels.addressBLabel),
      };
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      defaultSponsorKey,
      recipientAccountAddress,
      sponsorAccountAddress,
    ],
  );
  const buildErc20WriteEditorDefaults = useCallback(
    (labels: { addressALabel: string; addressBLabel: string }) => {
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      const resolveByLabel = (label: string) => {
        const normalized = normalizeParamLabel(label);
        if (normalized === 'from address' || normalized === 'owner address') return senderAddress;
        if (normalized === 'to address' || normalized === 'recipient address' || normalized === 'recipient key') {
          return recipientAccountAddress;
        }
        if (normalized === 'spender address') return agentAccountAddress;
        return '';
      };
      const amountValue = sellTokenAmountRaw || buyTokenAmountRaw || previewTokenAmountRaw;
      return {
        senderAddress,
        addressA: resolveByLabel(labels.addressALabel),
        addressB: resolveByLabel(labels.addressBLabel),
        amount: amountValue,
      };
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      buyTokenAmountRaw,
      defaultSponsorKey,
      previewTokenAmountRaw,
      recipientAccountAddress,
      sellTokenAmountRaw,
      sponsorAccountAddress,
    ],
  );
  const syncEditorAddressFieldToExchangeContext = useCallback(
    (label: string, value: string) => {
      const normalizedLabel = normalizeParamLabel(label);
      if (
        normalizedLabel === 'owner address' ||
        normalizedLabel === 'from address' ||
        normalizedLabel === 'sponsor key' ||
        normalizedLabel === 'sponsor account'
      ) {
        syncRoleAccountToExchangeContext('sponsor', value);
        return;
      }
      if (
        normalizedLabel === 'to address' ||
        normalizedLabel === 'recipient address' ||
        normalizedLabel === 'recipient key' ||
        normalizedLabel === 'recipient account'
      ) {
        syncRoleAccountToExchangeContext('recipient', value);
        return;
      }
      if (
        normalizedLabel === 'spender address' ||
        normalizedLabel === 'agent key' ||
        normalizedLabel === 'agent account' ||
        normalizedLabel === 'account agent key'
      ) {
        syncRoleAccountToExchangeContext('agent', value);
      }
    },
    [syncRoleAccountToExchangeContext],
  );
  const syncEditorAmountToExchangeContext = useCallback(
    (value: string) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        setExchangeContext(
          (prev) => {
            const next = structuredClone(prev);
            if (next.tradeData.sellTokenContract?.amount !== undefined) {
              next.tradeData.sellTokenContract.amount = undefined;
              return next;
            }
            if (next.tradeData.buyTokenContract?.amount !== undefined) {
              next.tradeData.buyTokenContract.amount = undefined;
              return next;
            }
            if (next.tradeData.previewTokenContract?.amount !== undefined) {
              next.tradeData.previewTokenContract.amount = undefined;
              return next;
            }
            return prev;
          },
          'SponsorCoinLab:editorAmount:clear',
        );
        return;
      }
      if (!isIntegerString(trimmed)) return;
      const nextAmount = BigInt(trimmed);
      setExchangeContext(
        (prev) => {
          const next = structuredClone(prev);
          if (next.tradeData.sellTokenContract) {
            if (next.tradeData.sellTokenContract.amount === nextAmount) return prev;
            next.tradeData.sellTokenContract.amount = nextAmount;
            return next;
          }
          if (next.tradeData.buyTokenContract) {
            if (next.tradeData.buyTokenContract.amount === nextAmount) return prev;
            next.tradeData.buyTokenContract.amount = nextAmount;
            return next;
          }
          if (next.tradeData.previewTokenContract) {
            if (next.tradeData.previewTokenContract.amount === nextAmount) return prev;
            next.tradeData.previewTokenContract.amount = nextAmount;
            return next;
          }
          return prev;
        },
        'SponsorCoinLab:editorAmount:set',
      );
    },
    [setExchangeContext],
  );

  useEffect(() => {
    const previous = normalizeAddressValue(previousContractAddressRef.current);
    const current = normalizeAddressValue(contractAddress);
    previousContractAddressRef.current = contractAddress;
    if (!previous || !current || previous === current) return;
    setFormattedOutputDisplay('(no output yet)');
    setTreeOutputDisplay('(no tree yet)');
    setOutputPanelMode('formatted');
    setStatus('Ready');
    appendLog('Active SponsorCoin contract changed; cleared prior test output results.');
  }, [appendLog, contractAddress]);
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
  const clearValidationPopup = useCallback(() => {
    setValidationPopupFields([]);
    setValidationPopupTitle('Missing Required Fields');
    setValidationPopupMessage('Fill in the following fields before executing the method:');
    setValidationPopupConfirmLabel('');
    setValidationPopupCancelLabel('Close');
    validationPopupConfirmRef.current = null;
  }, []);
  const showValidationPopup = useCallback(
    (
      fieldIds: string[],
      labels: string[],
      message?: string,
      options?: {
        title?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        onConfirm?: () => void | Promise<void>;
      },
    ) => {
      setInvalidFieldIds(fieldIds);
      setValidationPopupFields(labels);
      setValidationPopupTitle(options?.title || 'Missing Required Fields');
      setValidationPopupMessage(message || 'Fill in the following fields before executing the method:');
      setValidationPopupConfirmLabel(options?.confirmLabel || '');
      setValidationPopupCancelLabel(options?.cancelLabel || 'Close');
      validationPopupConfirmRef.current = options?.onConfirm || null;
      if (typeof window !== 'undefined' && fieldIds[0]) {
        window.setTimeout(() => {
          const target = document.querySelector(`[data-field-id="${fieldIds[0]}"]`) as
            | HTMLInputElement
            | HTMLSelectElement
            | null;
          target?.focus();
        }, 0);
      }
    },
    [],
  );

  const {
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
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    showHardhatConnectionInputs,
    setShowHardhatConnectionInputs,
    selectedHardhatAccount,
    effectiveConnectedAddress,
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
    accountActionLabelClassName,
    adjustSponsorCoinVersion,
    canIncrementSponsorCoinVersion,
    canDecrementSponsorCoinVersion,
    connectHardhatBaseFromNetworkLabel,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
  } = useSponsorCoinLabNetwork({
    exchangeContext,
    useLocalSpCoinAccessPackage,
    mode,
    rpcUrl,
    excludedDeploymentAddresses: removedContractAddresses,
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
  });
  useEffect(() => {
    const contractKey = normalizeAddressValue(
      String(selectedSponsorCoinVersionEntry?.address || contractAddress || ''),
    );
    if (!contractKey) {
      spCoinOwnerSyncRef.current.contractKey = '';
      return;
    }
    if (spCoinOwnerSyncRef.current.contractKey === contractKey) return;

    const ownerAddress = normalizeAddressValue(displayedSignerAccountAddress);
    if (!ownerAddress || !isAddressLike(ownerAddress)) return;

    const requestId = ++spCoinOwnerSyncRef.current.requestId;
    const preservedBalance =
      spCoinOwnerAccountAddress === ownerAddress &&
      typeof exchangeContext?.accounts?.spCoinOwnerAccount?.balance === 'bigint'
        ? exchangeContext.accounts.spCoinOwnerAccount.balance
        : undefined;

    void (async () => {
      let nextAccount: spCoinAccount;
      try {
        nextAccount = await hydrateAccountFromAddress(ownerAddress as Address, {
          balance: preservedBalance,
        });
      } catch {
        nextAccount = makeAccountFallback(
          ownerAddress as Address,
          STATUS.MESSAGE_ERROR,
          `Account ${ownerAddress} metadata could not be loaded`,
          preservedBalance,
        );
      }

      if (spCoinOwnerSyncRef.current.requestId !== requestId) return;

      setExchangeContext(
        (prev) => {
          const prevAccount = prev.accounts?.spCoinOwnerAccount;
          const prevAddress = normalizeAddressValue(String(prevAccount?.address ?? ''));
          if (
            prevAddress === ownerAddress &&
            prevAccount?.name === nextAccount.name &&
            prevAccount?.symbol === nextAccount.symbol &&
            prevAccount?.logoURL === nextAccount.logoURL &&
            prevAccount?.description === nextAccount.description &&
            prevAccount?.website === nextAccount.website &&
            prevAccount?.type === nextAccount.type &&
            prevAccount?.status === nextAccount.status &&
            prevAccount?.balance === nextAccount.balance
          ) {
            return prev;
          }

          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              spCoinOwnerAccount: nextAccount,
            },
          };
        },
        'SponsorCoinLab:setSpCoinOwnerAccount',
      );

      spCoinOwnerSyncRef.current.contractKey = contractKey;
    })();
  }, [
    contractAddress,
    displayedSignerAccountAddress,
    exchangeContext?.accounts?.spCoinOwnerAccount?.balance,
    selectedSponsorCoinVersion,
    selectedSponsorCoinVersionEntry?.address,
    selectedSponsorCoinVersionEntry?.id,
    setExchangeContext,
    spCoinOwnerAccountAddress,
  ]);
  const displayedSpCoinOwnerAddress = selectedSponsorCoinVersionEntry
    ? spCoinOwnerAccountAddress || displayedSignerAccountAddress
    : displayedSignerAccountAddress;
  const displayedSpCoinOwnerMetadata = useMemo(() => {
    const ownerAccount = exchangeContext?.accounts?.spCoinOwnerAccount;
    if (
      ownerAccount &&
      normalizeAddressValue(String(ownerAccount.address ?? '')) ===
        normalizeAddressValue(displayedSpCoinOwnerAddress)
    ) {
      return {
        logoURL: ownerAccount.logoURL,
        name: ownerAccount.name,
        symbol: ownerAccount.symbol,
      };
    }
    return displayedSignerAccountMetadata;
  }, [
    displayedSignerAccountMetadata,
    displayedSpCoinOwnerAddress,
    exchangeContext?.accounts?.spCoinOwnerAccount,
  ]);
  const resolveScriptEditorContractMetadata = useCallback(
    async (
      params: Array<{ label: string }>,
    ): Promise<{
      version?: string;
      inflationRate?: number;
      recipientRateRange?: [number, number];
      agentRateRange?: [number, number];
    }> => {
      const labels = new Set(params.map((param) => normalizeParamLabel(param.label)));
      const currentMeta = exchangeContext?.settings?.spCoinContract;
      const needsVersion = labels.has('new version') && !String(currentMeta?.version ?? '').trim();
      const needsInflationRate =
        labels.has('new inflation rate') && !isDefinedNumber(currentMeta?.inflationRate);
      const needsLowerRecipient =
        labels.has('new lower recipient rate') &&
        !isDefinedNumber(currentMeta?.recipientRateRange?.[0]);
      const needsUpperRecipient =
        labels.has('new upper recipient rate') &&
        !isDefinedNumber(currentMeta?.recipientRateRange?.[1]);
      const needsLowerAgent =
        labels.has('new lower agent rate') && !isDefinedNumber(currentMeta?.agentRateRange?.[0]);
      const needsUpperAgent =
        labels.has('new upper agent rate') && !isDefinedNumber(currentMeta?.agentRateRange?.[1]);

      if (
        !needsVersion &&
        !needsInflationRate &&
        !needsLowerRecipient &&
        !needsUpperRecipient &&
        !needsLowerAgent &&
        !needsUpperAgent
      ) {
        return {};
      }

      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      const contract = access.contract as Record<string, unknown>;
      const read = (access.read ?? {}) as Record<string, unknown>;

      const callNoArgs = async (...names: string[]) => {
        for (const name of names) {
          const contractFn = contract[name];
          if (typeof contractFn === 'function') {
            try {
              return await (contractFn as () => Promise<unknown>)();
            } catch {
              // Try the next candidate.
            }
          }
          const readFn = read[name];
          if (typeof readFn === 'function') {
            try {
              return await (readFn as () => Promise<unknown>)();
            } catch {
              // Try the next candidate.
            }
          }
        }
        return undefined;
      };

      const nextMeta: {
        version?: string;
        inflationRate?: number;
        recipientRateRange?: [number, number];
        agentRateRange?: [number, number];
      } = {};

      if (needsVersion) {
        const version = await callNoArgs('getVersion', 'version');
        const normalized = String(version ?? '').trim();
        if (normalized) nextMeta.version = normalized;
      }

      if (needsInflationRate) {
        const inflationRate = await callNoArgs('getInflationRate', 'annualInflation');
        const normalized = Number(inflationRate);
        if (Number.isFinite(normalized)) nextMeta.inflationRate = normalized;
      }

      if (needsLowerRecipient || needsUpperRecipient) {
        const lower = needsLowerRecipient
          ? Number(await callNoArgs('getLowerRecipientRate'))
          : Number(currentMeta?.recipientRateRange?.[0]);
        const upper = needsUpperRecipient
          ? Number(await callNoArgs('getUpperRecipientRate'))
          : Number(currentMeta?.recipientRateRange?.[1]);
        if (Number.isFinite(lower) && Number.isFinite(upper)) {
          nextMeta.recipientRateRange = [lower, upper];
        }
      }

      if (needsLowerAgent || needsUpperAgent) {
        const lower = needsLowerAgent
          ? Number(await callNoArgs('getLowerAgentRate'))
          : Number(currentMeta?.agentRateRange?.[0]);
        const upper = needsUpperAgent
          ? Number(await callNoArgs('getUpperAgentRate'))
          : Number(currentMeta?.agentRateRange?.[1]);
        if (Number.isFinite(lower) && Number.isFinite(upper)) {
          nextMeta.agentRateRange = [lower, upper];
        }
      }

      if (
        nextMeta.version !== undefined ||
        nextMeta.inflationRate !== undefined ||
        nextMeta.recipientRateRange !== undefined ||
        nextMeta.agentRateRange !== undefined
      ) {
        setSettings((prev) => {
          const prevContract = prev?.spCoinContract;
          return {
            ...prev,
            spCoinContract: {
              version: nextMeta.version ?? String(prevContract?.version ?? '').trim(),
              name: String(prevContract?.name ?? '').trim(),
              symbol: String(prevContract?.symbol ?? '').trim(),
              decimals: Number(prevContract?.decimals ?? 0),
              totalSypply: String(prevContract?.totalSypply ?? '').trim(),
              inflationRate:
                nextMeta.inflationRate ??
                (isDefinedNumber(prevContract?.inflationRate) ? prevContract.inflationRate : 0),
              recipientRateRange:
                nextMeta.recipientRateRange ??
                (Array.isArray(prevContract?.recipientRateRange)
                  ? prevContract.recipientRateRange
                  : [0, 0]),
              agentRateRange:
                nextMeta.agentRateRange ??
                (Array.isArray(prevContract?.agentRateRange) ? prevContract.agentRateRange : [0, 0]),
            },
          };
        });
      }

      return nextMeta;
    },
    [ensureReadRunner, exchangeContext?.settings?.spCoinContract, requireContractAddress, setSettings],
  );
  const handleRemoveContractFromApp = useCallback(async () => {
    const activeAddress = String(contractAddress || '').trim();
    const activeChainId = Number(chainIdDisplayValue || 0);
    const activeName = String(selectedSponsorCoinVersionEntry?.name || '').trim() || 'Sponsor Coin';
    const activeSymbol = String(selectedVersionSymbol || '').trim() || 'SPCOIN';
    const fallbackChoice = sponsorCoinVersionChoices.find(
      (entry) => String(entry.address || '').trim().toLowerCase() !== activeAddress.toLowerCase(),
    );

    if (!/^0[xX][a-fA-F0-9]{40}$/.test(activeAddress)) {
      setStatus('Select a valid SponsorCoin contract before removing it from the app.');
      appendLog('Remove From App aborted: invalid contract address.');
      return;
    }
    if (!Number.isFinite(activeChainId) || activeChainId <= 0) {
      setStatus('Unable to determine the active network chain id for removal.');
      appendLog('Remove From App aborted: invalid active chain id.');
      return;
    }

    setIsRemovingContractFromApp(true);
    setStatus(`Removing ${activeName} ${activeSymbol} from app...`);
    appendLog(`Remove From App started for ${activeName} ${activeSymbol} (${activeAddress}).`);
    if (fallbackChoice) {
      setSelectedSponsorCoinVersion(fallbackChoice.id);
      setContractAddress(fallbackChoice.address);
      appendLog(
        `Switched active SponsorCoin contract to ${String(fallbackChoice.name || fallbackChoice.version || fallbackChoice.address)} before removal.`,
      );
    } else {
      setSelectedSponsorCoinVersion('');
      setContractAddress('');
    }

    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDeployment',
          deploymentPublicKey: activeAddress,
          deploymentChainId: activeChainId,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(String(data.message || 'Failed to remove SponsorCoin app entry.'));
      }

      appendLog(String(data.message || `Removed ${activeName} ${activeSymbol} from app.`));
      setRemovedContractAddresses((prev) =>
        prev.some((entry) => entry.toLowerCase() === activeAddress.toLowerCase()) ? prev : [...prev, activeAddress],
      );
      setStatus(`${activeName} ${activeSymbol} removed from app.`);
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(SP_COIN_LAB_STORAGE_KEY);
          const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          window.localStorage.setItem(
            SP_COIN_LAB_STORAGE_KEY,
            JSON.stringify({
              ...saved,
              contractAddress: fallbackChoice?.address || '',
              selectedSponsorCoinVersion: fallbackChoice?.id || '',
            }),
          );
        } catch {
          // Ignore transient localStorage write failures.
        }
      }
      setIsRemovingContractFromApp(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown removal failure.';
      setStatus(`Remove From App failed: ${message}`);
      appendLog(`Remove From App failed: ${message}`);
      setIsRemovingContractFromApp(false);
    }
  }, [
    appendLog,
    chainIdDisplayValue,
    contractAddress,
    removedContractAddresses,
    selectedSponsorCoinVersionEntry?.name,
    sponsorCoinVersionChoices,
    setSelectedSponsorCoinVersion,
    selectedVersionSymbol,
    setContractAddress,
  ]);

  const requestRemoveContractFromApp = useCallback(() => {
    const activeName = String(selectedSponsorCoinVersionEntry?.name || '').trim() || 'Sponsor Coin';
    const activeSymbol = String(selectedVersionSymbol || '').trim() || 'SPCOIN';
    const activeAddress = String(contractAddress || '').trim();

    showValidationPopup(
      [],
      [],
      `This will remove ${activeAddress} from the deployment map, remove matching token-list entries for the active network, and delete the contract asset directory from the app.`,
      {
        title: `Remove ${activeName} ${activeSymbol} From App`,
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        onConfirm: () => void handleRemoveContractFromApp(),
      },
    );
  }, [
    contractAddress,
    handleRemoveContractFromApp,
    selectedSponsorCoinVersionEntry?.name,
    selectedVersionSymbol,
    showValidationPopup,
  ]);
  const activeWriteLabels = useMemo(() => getErc20WriteLabels(selectedWriteMethod), [selectedWriteMethod]);
  const activeReadLabels = useMemo(() => getErc20ReadLabels(selectedReadMethod), [selectedReadMethod]);
  const spCoinReadMethodDefs = SPCOIN_READ_METHOD_DEFS;
  const spCoinWriteMethodDefs = SPCOIN_WRITE_METHOD_DEFS;
  const serializationTestMethodDefs = SERIALIZATION_TEST_METHOD_DEFS;
  const activeSpCoinReadDef = spCoinReadMethodDefs[selectedSpCoinReadMethod];
  const activeSpCoinWriteDef =
    spCoinWriteMethodDefs[selectedSpCoinWriteMethod] ?? spCoinWriteMethodDefs[getSpCoinWriteOptions(false)[0]];
  const serializationTestOptions = getSerializationTestOptions();
  const activeSerializationTestDef =
    serializationTestMethodDefs[selectedSerializationTestMethod] ??
    serializationTestMethodDefs[serializationTestOptions[0]];
  const updateSpWriteParamAtIndex = useCallback((idx: number, value: string) => {
    setSpWriteParams((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);
  const backdateCalendar = useBackdateCalendar({
    activeWriteParams: activeSpCoinWriteDef?.params || [],
    spWriteParams,
    updateSpWriteParamAtIndex,
  });
  const {
    erc20WriteMissingEntries,
    erc20ReadMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
    canRunErc20WriteMethod,
    canRunErc20ReadMethod,
    canRunSpCoinReadMethod,
    canRunSpCoinWriteMethod,
    canRunSerializationTestMethod,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    treeAccountOptions,
    selectedTreeAccount,
    setSelectedTreeAccount,
    treeAccountRefreshToken,
    requestRefreshSelectedTreeAccount,
    runHeaderRead,
    runAccountListRead,
    runTreeAccountsRead,
    runTreeDump,
    runSelectedWriteMethod,
    runSelectedReadMethod,
    runSelectedSpCoinReadMethod,
    runSelectedSpCoinWriteMethod,
    runSelectedSerializationTestMethod,
    runScriptStep,
  } = useSponsorCoinLabMethods({
    activeContractAddress: contractAddress,
    mode,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    activeReadLabels,
    activeWriteLabels,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    spReadParams,
    spWriteParams,
    serializationTestParams,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    serializationTestMethodDefs,
    activeSpCoinReadDef,
    activeSpCoinWriteDef,
    activeSerializationTestDef,
    selectedHardhatAddress:
      mode === 'hardhat'
        ? selectedWriteSenderAccount?.address || selectedWriteSenderAddress || selectedHardhatAccount?.address
        : undefined,
    effectiveConnectedAddress,
    useLocalSpCoinAccessPackage,
    appendLog,
    appendWriteTrace,
    setStatus,
    setFormattedOutputDisplay,
    setTreeOutputDisplay,
    setOutputPanelMode,
    showValidationPopup,
    requireContractAddress,
    ensureReadRunner,
    executeWriteConnected,
    normalizeAddressValue,
    parseListParam,
    parseDateInput,
    backdateHours: backdateCalendar.backdateHours,
    backdateMinutes: backdateCalendar.backdateMinutes,
    backdateSeconds: backdateCalendar.backdateSeconds,
    buildMethodCallEntry,
    formatOutputDisplayValue,
    recipientRateRange:
      Array.isArray(exchangeContext?.settings?.spCoinContract?.recipientRateRange) &&
      isDefinedNumber(exchangeContext.settings.spCoinContract.recipientRateRange[0]) &&
      isDefinedNumber(exchangeContext.settings.spCoinContract.recipientRateRange[1])
        ? exchangeContext.settings.spCoinContract.recipientRateRange
        : undefined,
    agentRateRange:
      Array.isArray(exchangeContext?.settings?.spCoinContract?.agentRateRange) &&
      isDefinedNumber(exchangeContext.settings.spCoinContract.agentRateRange[0]) &&
      isDefinedNumber(exchangeContext.settings.spCoinContract.agentRateRange[1])
        ? exchangeContext.settings.spCoinContract.agentRateRange
        : undefined,
  });

  useEffect(() => {
    let active = true;
    const chainId = Number((exchangeContext as any)?.network?.chainId || 0);
    const activeContractAddress = String(contractAddress || '').trim();
    const selectedEntry = selectedSponsorCoinVersionEntry;
    const selectedVersion = String(
      selectedEntry?.version || selectedSponsorCoinVersion || '',
    ).trim();

    if (!selectedEntry && !selectedVersion && !activeContractAddress) return;

    setSettings((prev) => ({
      ...prev,
      spCoinContract: {
        version: selectedVersion,
        name: String(selectedEntry?.name || (selectedVersion ? `Sponsor Coin V${selectedVersion}` : '')).trim(),
        symbol: String(selectedEntry?.symbol || (selectedVersion ? `SPCOIN_V${selectedVersion}` : '')).trim(),
        decimals: Number(prev?.spCoinContract?.decimals ?? 18),
        totalSypply: String(prev?.spCoinContract?.totalSypply ?? '').trim(),
        inflationRate: Number(prev?.spCoinContract?.inflationRate ?? 0),
        recipientRateRange: Array.isArray(prev?.spCoinContract?.recipientRateRange)
          ? prev.spCoinContract.recipientRateRange
          : [0, 0],
        agentRateRange: Array.isArray(prev?.spCoinContract?.agentRateRange)
          ? prev.spCoinContract.agentRateRange
          : [0, 0],
      },
    }));

    const hydrate = async () => {
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(activeContractAddress)) return;
      if (!Number.isFinite(chainId) || chainId <= 0) return;
      try {
        const params = new URLSearchParams({
          deploymentPublicKey: activeContractAddress,
          deploymentChainId: String(chainId),
          includeMetadata: 'true',
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
        const data = (await response.json()) as {
          ok?: boolean;
          spCoinMetaData?: {
            version: string;
            name: string;
            symbol: string;
            decimals: number;
            totalSypply: string;
            inflationRate: number;
            recipientRateRange: [number, number];
            agentRateRange: [number, number];
          };
        };
        if (!active || !response.ok || !data.ok || !data.spCoinMetaData) return;
        setSettings((prev) => ({
          ...prev,
          spCoinContract: {
            version: String(data.spCoinMetaData?.version ?? '').trim(),
            name: String(data.spCoinMetaData?.name ?? '').trim(),
            symbol: String(data.spCoinMetaData?.symbol ?? '').trim(),
            decimals: Number(data.spCoinMetaData?.decimals ?? 0),
            totalSypply: String(data.spCoinMetaData?.totalSypply ?? '').trim(),
            inflationRate: Number(data.spCoinMetaData?.inflationRate ?? 0),
            recipientRateRange: Array.isArray(data.spCoinMetaData?.recipientRateRange)
              ? data.spCoinMetaData.recipientRateRange
              : [0, 0],
            agentRateRange: Array.isArray(data.spCoinMetaData?.agentRateRange)
              ? data.spCoinMetaData.agentRateRange
              : [0, 0],
          },
        }));
      } catch {
        // Keep the seeded SponsorCoinLab values when metadata fetch fails.
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [
    contractAddress,
    exchangeContext,
    selectedSponsorCoinVersion,
    selectedSponsorCoinVersionEntry,
    setSettings,
  ]);

  const {
    scripts,
    setScripts,
    selectedScriptId,
    setSelectedScriptId,
    selectedScript,
    scriptNameInput,
    setScriptNameInput,
    isScriptOptionsOpen,
    setIsScriptOptionsOpen,
    isNewScriptHovered,
    setIsNewScriptHovered,
    isDeleteScriptHovered,
    setIsDeleteScriptHovered,
    newScriptHoverTone,
    setNewScriptHoverTone,
    deleteScriptHoverTone,
    setDeleteScriptHoverTone,
    scriptNameValidation,
    deleteScriptValidation,
    selectedScriptStepNumber,
    setSelectedScriptStepNumber,
    expandedScriptStepIds,
    isDeleteStepPopupOpen,
    setIsDeleteStepPopupOpen,
    selectedScriptStep,
    getStepSender,
    getStepParamEntries,
    loadScriptStep,
    toggleScriptStepExpanded,
    moveSelectedScriptStep,
    requestDeleteSelectedScriptStep,
    confirmDeleteSelectedScriptStep,
    toggleScriptStepBreakpoint,
    createNewScript,
    duplicateSelectedScript,
    clearSelectedScript,
    handleDeleteScriptClick,
    hasEditingScriptChanges,
    addCurrentMethodToScript,
  } = useSponsorCoinLabScripts({
    activeNetworkName,
    mode,
    methodPanelMode,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    activeReadLabels,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    activeWriteLabels,
    selectedSpCoinReadMethod,
    spReadParams,
    activeSpCoinReadDef,
    spCoinReadMethodDefs,
    selectedSpCoinWriteMethod,
    spWriteParams,
    activeSpCoinWriteDef,
    spCoinWriteMethodDefs,
    selectedSerializationTestMethod,
    serializationTestParams,
    activeSerializationTestDef,
    serializationTestMethodDefs,
    editingScriptStepNumber,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
    showValidationPopup,
    setStatus,
    setOutputPanelMode,
    setFormattedOutputDisplay,
    setMode,
    setMethodPanelMode,
    setSelectedReadMethod,
    setReadAddressA,
    setReadAddressB,
    setSelectedWriteMethod,
    setSelectedWriteSenderAddress,
    setWriteAddressA,
    setWriteAddressB,
    setWriteAmountRaw,
    setSelectedSpCoinReadMethod,
    setSpReadParams,
    setSelectedSpCoinWriteMethod,
    setSpWriteParams,
    setSelectedSerializationTestMethod,
    setSerializationTestParams,
  });
  const editorSnapshot = JSON.stringify({
    methodPanelMode,
    methodSelectionSource,
    editingScriptStepNumber,
    selectedReadMethod,
    readAddressA,
    readAddressB,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
    selectedSpCoinReadMethod,
    spReadParams,
    selectedSpCoinWriteMethod,
    spWriteParams,
    selectedSerializationTestMethod,
    serializationTestParams,
  });
  const editorBaselineRef = useRef<string | null>(null);
  const shouldResetEditorBaselineRef = useRef(true);
  const dropdownHydrationKeyRef = useRef<string>('');
  const queueEditorBaselineReset = useCallback(() => {
    shouldResetEditorBaselineRef.current = true;
  }, []);
  useEffect(() => {
    if (!shouldResetEditorBaselineRef.current && editorBaselineRef.current !== null) return;
    editorBaselineRef.current = editorSnapshot;
    shouldResetEditorBaselineRef.current = false;
  }, [editorSnapshot]);
  const hasUnsavedEditorChanges = useCallback(() => {
    if (editorBaselineRef.current === null) return false;
    return editorBaselineRef.current !== editorSnapshot;
  }, [editorSnapshot]);
  const clearDiscardChangesPopup = useCallback(() => {
    setIsDiscardChangesPopupOpen(false);
    discardChangesConfirmRef.current = null;
  }, []);
  const runWithDiscardPrompt = useCallback(
    (action: () => void | Promise<void>) => {
      if (methodSelectionSource === 'script' && editingScriptStepNumber !== null && !hasEditingScriptChanges) {
        queueEditorBaselineReset();
        void action();
        return;
      }
      if (!hasUnsavedEditorChanges()) {
        queueEditorBaselineReset();
        void action();
        return;
      }
      discardChangesConfirmRef.current = () => {
        queueEditorBaselineReset();
        void action();
      };
      setIsDiscardChangesPopupOpen(true);
    },
    [editingScriptStepNumber, hasEditingScriptChanges, hasUnsavedEditorChanges, methodSelectionSource, queueEditorBaselineReset],
  );
  useSponsorCoinLabPersistence({
    scripts,
    setScripts,
    selectedScriptId,
    setSelectedScriptId,
    mode,
    setMode,
    rpcUrl,
    setRpcUrl,
    contractAddress,
    setContractAddress,
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    selectedHardhatIndex,
    setSelectedHardhatIndex,
    connectedAddress,
    connectedChainId,
    connectedNetworkName,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    status,
    setStatus,
    logs,
    setLogs,
    formattedOutputDisplay,
    setFormattedOutputDisplay,
    outputPanelMode,
    setOutputPanelMode,
    formattedPanelView,
    setFormattedPanelView,
    formattedJsonViewEnabled,
    setFormattedJsonViewEnabled,
    writeTraceEnabled,
    setWriteTraceEnabled,
    treeOutputDisplay,
    setTreeOutputDisplay,
    selectedWriteMethod,
    setSelectedWriteMethod,
    writeAddressA,
    setWriteAddressA,
    writeAddressB,
    setWriteAddressB,
    writeAmountRaw,
    setWriteAmountRaw,
    methodPanelMode,
    setMethodPanelMode,
    selectedReadMethod,
    setSelectedReadMethod,
    readAddressA,
    setReadAddressA,
    readAddressB,
    setReadAddressB,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    selectedSponsorCoinAccountRole,
    setSelectedSponsorCoinAccountRole,
    managedRoleAccountAddress,
    setManagedRoleAccountAddress,
    managedRecipientKey,
    setManagedRecipientKey,
    managedRecipientRateKey,
    setManagedRecipientRateKey,
    sponsorCoinAccountManagementStatus,
    setSponsorCoinAccountManagementStatus,
    spReadParams,
    setSpReadParams,
    spWriteParams,
    setSpWriteParams,
    serializationTestParams,
    setSerializationTestParams,
    normalizeAddressValue,
    backdateCalendar,
  });
  const selectedScriptDisplay = selectedScript ? formatOutputDisplayValue(selectedScript) : '(no script selected)';
  const previousScriptDisplayRef = useRef<string | null>(null);
  const previousFormattedOutputDisplayRef = useRef<string | null>(null);
  useEffect(() => {
    if (previousScriptDisplayRef.current === null) {
      previousScriptDisplayRef.current = selectedScriptDisplay;
      return;
    }
    if (previousScriptDisplayRef.current === selectedScriptDisplay) return;
    previousScriptDisplayRef.current = selectedScriptDisplay;
    setOutputPanelMode('formatted');
    setFormattedPanelView('script');
  }, [selectedScriptDisplay]);
  useEffect(() => {
    if (previousFormattedOutputDisplayRef.current === null) {
      previousFormattedOutputDisplayRef.current = formattedOutputDisplay;
      return;
    }
    if (previousFormattedOutputDisplayRef.current === formattedOutputDisplay) return;
    previousFormattedOutputDisplayRef.current = formattedOutputDisplay;
    setOutputPanelMode('formatted');
    setFormattedPanelView('output');
  }, [formattedOutputDisplay]);
  const erc20ReadOptions = ERC20_READ_OPTIONS;
  const erc20WriteOptions = ERC20_WRITE_OPTIONS;
  const spCoinWorldReadOptions = getSpCoinWorldReadOptions(false);
  const spCoinSenderReadOptions = getSpCoinSenderReadOptions(false);
  const spCoinAdminReadOptions = getSpCoinAdminReadOptions(false);
  const spCoinCompoundReadOptions = getSpCoinCompoundReadOptions(false);
  const spCoinAllReadOptions = [
    ...spCoinWorldReadOptions,
    ...spCoinSenderReadOptions,
    ...spCoinAdminReadOptions,
    ...spCoinCompoundReadOptions,
  ];
  const spCoinWorldWriteOptions = getSpCoinWorldWriteOptions(false);
  const spCoinSenderWriteOptions = getSpCoinSenderWriteOptions(false);
  const spCoinAdminWriteOptions = getSpCoinAdminWriteOptions(false);
  const spCoinTodoWriteOptions = getSpCoinTodoWriteOptions(false);
  const spCoinWriteOptions = getSpCoinWriteOptions(false);
  const activeMethodPanelTab = methodPanelMode === 'spcoin_write' && isSpCoinTodoMode ? 'todos' : methodPanelMode;
  useEffect(() => {
    if (methodPanelMode !== 'spcoin_write' || !isSpCoinTodoMode) return;
    if (spCoinTodoWriteOptions.includes(selectedSpCoinWriteMethod)) return;
    if (spCoinTodoWriteOptions[0]) {
      setSelectedSpCoinWriteMethod(spCoinTodoWriteOptions[0]);
    }
  }, [isSpCoinTodoMode, methodPanelMode, selectedSpCoinWriteMethod, spCoinTodoWriteOptions]);
  useEffect(() => {
    if (methodPanelMode !== 'spcoin_write' || isSpCoinTodoMode) return;
    if (!spCoinTodoWriteOptions.includes(selectedSpCoinWriteMethod)) return;
    const nextStandardMethod =
      spCoinSenderWriteOptions[0] || spCoinWorldWriteOptions[0] || spCoinAdminWriteOptions[0] || '';
    if (nextStandardMethod) {
      setSelectedSpCoinWriteMethod(nextStandardMethod);
    }
  }, [
    isSpCoinTodoMode,
    methodPanelMode,
    selectedSpCoinWriteMethod,
    spCoinAdminWriteOptions,
    spCoinSenderWriteOptions,
    spCoinTodoWriteOptions,
    spCoinWorldWriteOptions,
  ]);
  const sponsorCoinAccountManagementValidation = useMemo(() => {
    const accountAddress = normalizeAddressValue(managedRoleAccountAddress);
    if (!accountAddress) return { tone: 'neutral' as const, message: '' };
    if (!isAddressLike(accountAddress)) {
      return { tone: 'invalid' as const, message: 'Invalid account address.' };
    }
    if (selectedSponsorCoinAccountRole !== 'agent') {
      return { tone: 'valid' as const, message: 'Ready' };
    }

    const recipientKey = normalizeAddressValue(managedRecipientKey);
    if (!recipientKey) return { tone: 'neutral' as const, message: 'Recipient Key required.' };
    if (!isAddressLike(recipientKey)) {
      return { tone: 'invalid' as const, message: 'Invalid recipient address.' };
    }
    if (!String(managedRecipientRateKey || '').trim()) {
      return { tone: 'neutral' as const, message: 'Recipient Rate Key required.' };
    }
    if (!isIntegerString(managedRecipientRateKey)) {
      return { tone: 'invalid' as const, message: 'Recipient Rate Key must be an integer.' };
    }
    return { tone: 'valid' as const, message: 'Ready' };
  }, [managedRecipientKey, managedRecipientRateKey, managedRoleAccountAddress, selectedSponsorCoinAccountRole]);

  useEffect(() => {
    let cancelled = false;

    const loadManagedRecipientRateKeyOptions = async () => {
      if (selectedSponsorCoinAccountRole !== 'agent') {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('');
        }
        return;
      }

      const sponsorKey = normalizeAddressValue(selectedWriteSenderAccount?.address || selectedWriteSenderAddress || effectiveConnectedAddress);
      const recipientKey = normalizeAddressValue(managedRecipientKey);
      if (!isAddressLike(sponsorKey) || !isAddressLike(recipientKey)) {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('Select msg.sender and Recipient first to load Recipient Rate Keys.');
        }
        return;
      }

      try {
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(target, runner);
        const rates = (await (access.contract as SpCoinContractAccess).getRecipientRateList?.(sponsorKey, recipientKey)) ?? [];
        if (!cancelled) {
          const nextOptions = rates.map((value) => String(value));
          setManagedRecipientRateKeyOptions(nextOptions);
          setManagedRecipientRateKeyHelpText(
            nextOptions.length > 0
              ? 'Select a Recipient Rate Key from the contract list.'
              : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
          );
        }
      } catch {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('Unable to load Recipient Rate Keys from the active contract.');
        }
      }
    };

    void loadManagedRecipientRateKeyOptions();
    return () => {
      cancelled = true;
    };
  }, [
    effectiveConnectedAddress,
    ensureReadRunner,
    managedRecipientKey,
    requireContractAddress,
    selectedSponsorCoinAccountRole,
    selectedWriteSenderAccount?.address,
    selectedWriteSenderAddress,
    useLocalSpCoinAccessPackage,
  ]);

  const handleSponsorCoinAccountAction = useCallback(
    async (action: 'add' | 'delete') => {
      if (sponsorCoinAccountManagementValidation.tone !== 'valid') {
        setSponsorCoinAccountManagementStatus(sponsorCoinAccountManagementValidation.message);
        return;
      }

      const accountAddress = normalizeAddressValue(managedRoleAccountAddress);
      const recipientKey = normalizeAddressValue(managedRecipientKey);
      const recipientRateKey = String(managedRecipientRateKey || '').trim();
      const hardhatSenderAddress = selectedWriteSenderAccount?.address || selectedWriteSenderAddress;
      const accessSource = useLocalSpCoinAccessPackage ? 'local' : 'node_modules';
      const label = `${action}:${selectedSponsorCoinAccountRole}:${accountAddress}`;

      try {
        const tx = await executeWriteConnected(
          label,
          async (contract, signer) => {
            const access = createSpCoinModuleAccess(contract, signer, accessSource);
            const baseContract = access.contract as SponsorCoinManageContract;
            const connectedContract = (typeof baseContract.connect === 'function'
              ? (baseContract.connect(signer) as SponsorCoinManageContract)
              : baseContract) as SponsorCoinManageContract;

            if (action === 'add') {
              if (selectedSponsorCoinAccountRole === 'sponsor') {
                if (typeof connectedContract.addSponsor !== 'function') {
                  throw new Error('addSponsor is not available on the current SpCoin contract access path.');
                }
                return connectedContract.addSponsor(accountAddress);
              }
              if (selectedSponsorCoinAccountRole === 'recipient') {
                if (typeof connectedContract.addRecipient !== 'function') {
                  throw new Error('addRecipient is not available on the current SpCoin contract access path.');
                }
                return connectedContract.addRecipient(accountAddress);
              }
              if (typeof connectedContract.addAgent !== 'function') {
                throw new Error('addAgent is not available on the current SpCoin contract access path.');
              }
              return connectedContract.addAgent(recipientKey, recipientRateKey, accountAddress);
            }

            if (typeof connectedContract.deleteAccountRecord !== 'function') {
              throw new Error('deleteAccountRecord is not available on the current SpCoin contract access path.');
            }
            return connectedContract.deleteAccountRecord(accountAddress);
          },
          hardhatSenderAddress,
        );

        if (!tx || typeof tx.wait !== 'function') {
          throw new Error(`${label} did not return a transaction response.`);
        }
        const receipt = await tx.wait();
        appendLog(
          `${action} ${selectedSponsorCoinAccountRole} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`,
        );
        setSponsorCoinAccountManagementStatus(
          `${action === 'add' ? 'Added' : 'Deleted'} ${selectedSponsorCoinAccountRole} ${accountAddress}.`,
        );
        setManagedRoleAccountAddress('');
        if (selectedSponsorCoinAccountRole === 'agent') {
          setManagedRecipientKey('');
          setManagedRecipientRateKey('');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to ${action} ${selectedSponsorCoinAccountRole}.`;
        setSponsorCoinAccountManagementStatus(message);
        appendLog(`${action} ${selectedSponsorCoinAccountRole} failed: ${message}`);
      }
    },
    [
      appendLog,
      executeWriteConnected,
      managedRecipientKey,
      managedRecipientRateKey,
      managedRoleAccountAddress,
      selectedSponsorCoinAccountRole,
      selectedWriteSenderAccount?.address,
      selectedWriteSenderAddress,
      sponsorCoinAccountManagementValidation.message,
      sponsorCoinAccountManagementValidation.tone,
      useLocalSpCoinAccessPackage,
    ],
  );
  useEffect(() => {
    if (spCoinReadMethodDefs[selectedSpCoinReadMethod].executable === false && spCoinAllReadOptions.length > 0) {
      setSelectedSpCoinReadMethod(spCoinAllReadOptions[0]);
    }
  }, [selectedSpCoinReadMethod, spCoinReadMethodDefs, spCoinAllReadOptions]);
  useEffect(() => {
    if (!spCoinWriteMethodDefs[selectedSpCoinWriteMethod] && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
      return;
    }
    if (spCoinWriteMethodDefs[selectedSpCoinWriteMethod].executable === false && spCoinWriteOptions.length > 0) {
      setSelectedSpCoinWriteMethod(spCoinWriteOptions[0]);
    }
  }, [selectedSpCoinWriteMethod, spCoinWriteMethodDefs, spCoinWriteOptions]);
  useEffect(() => {
    if (!serializationTestMethodDefs[selectedSerializationTestMethod] && serializationTestOptions.length > 0) {
      setSelectedSerializationTestMethod(serializationTestOptions[0]);
      return;
    }
    if (
      serializationTestMethodDefs[selectedSerializationTestMethod]?.executable === false &&
      serializationTestOptions.length > 0
    ) {
      setSelectedSerializationTestMethod(serializationTestOptions[0]);
    }
  }, [
    selectedSerializationTestMethod,
    serializationTestMethodDefs,
    serializationTestOptions,
    setSelectedSerializationTestMethod,
  ]);
  const methodPanelTitle =
    methodSelectionSource === 'script' && editingScriptStepNumber !== null
      ? `Edit Test Method ${editingScriptStepNumber}`
      : 'New Test Method';
  const currentMethodDisplayName = (() => {
    switch (methodPanelMode) {
      case 'ecr20_read':
        return activeReadLabels.title;
      case 'erc20_write':
        return activeWriteLabels.title;
      case 'spcoin_rread':
        return activeSpCoinReadDef.title;
      case 'spcoin_write':
        return activeSpCoinWriteDef.title;
      case 'serialization_tests':
        return activeSerializationTestDef.title;
      default:
        return 'method';
    }
  })();
  const isEditingScriptMethod = methodSelectionSource === 'script' && editingScriptStepNumber !== null;
  const discardChangesMessage = (() => {
    const activeStepNumber = editingScriptStepNumber ?? selectedScriptStepNumber;
    return activeStepNumber !== null
      ? `Discard unsaved changes to Step ${activeStepNumber} (${currentMethodDisplayName}) or return?`
      : `Discard unsaved changes to ${currentMethodDisplayName} or return?`;
  })();
  const isUpdateBlockedByNoChanges = isEditingScriptMethod && !hasEditingScriptChanges;
  const hasEditorScriptSelected = Boolean(String(selectedScriptId || '').trim());
  const addToScriptButtonLabel = isEditingScriptMethod ? `Update Script Step ${editingScriptStepNumber}` : 'Add To Script';
  const [expandedCard, setExpandedCard] = useState<LabCardId | null>(null);
  const [scriptStepExecutionErrors, setScriptStepExecutionErrors] = useState<Record<number, boolean>>({});
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
  const scriptDebugStopRef = useRef(false);
  const [sharedMethodsRowHeight, setSharedMethodsRowHeight] = useState<number | null>(null);
  const [isDesktopSharedLayout, setIsDesktopSharedLayout] = useState(false);

  const editScriptStepFromBuilder = useCallback(
    (step: LabScriptStep) => {
      queueEditorBaselineReset();
      setMethodSelectionSource('script');
      setEditingScriptStepNumber(step.step);
      loadScriptStep(step);
    },
    [loadScriptStep, queueEditorBaselineReset],
  );
  const resetToDropdownSelection = useCallback(() => {
    setMethodSelectionSource('dropdown');
    setEditingScriptStepNumber(null);
    setSelectedScriptStepNumber(null);
  }, [setSelectedScriptStepNumber]);
  const focusScriptStep = useCallback(
    (step: LabScriptStep) => {
      setSelectedScriptStepNumber(step.step);
    },
    [setSelectedScriptStepNumber],
  );
  const selectDropdownMethodPanelMode = useCallback(
    (value: MethodPanelMode) => {
      if (methodPanelMode === value) return;
      runWithDiscardPrompt(() => {
        setIsSpCoinTodoMode(false);
        resetToDropdownSelection();
        setMethodPanelMode(value);
      });
    },
    [methodPanelMode, resetToDropdownSelection, runWithDiscardPrompt, setMethodPanelMode],
  );
  const selectMethodPanelTab = useCallback(
    (value: MethodPanelMode | 'todos') => {
      if (value === 'todos') {
        if (activeMethodPanelTab === 'todos') return;
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setIsSpCoinTodoMode(true);
          setMethodPanelMode('spcoin_write');
        });
        return;
      }
      if (value === 'spcoin_write') {
        if (activeMethodPanelTab === 'spcoin_write') return;
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('spcoin_write');
        });
        return;
      }
      selectDropdownMethodPanelMode(value);
    },
    [activeMethodPanelTab, resetToDropdownSelection, runWithDiscardPrompt, selectDropdownMethodPanelMode],
  );
  const selectDropdownReadMethod = useCallback(
    (value: Erc20ReadMethod) => {
      if (selectedReadMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedReadMethod(value);
      });
    },
    [resetToDropdownSelection, runWithDiscardPrompt, selectedReadMethod, setSelectedReadMethod],
  );
  const selectDropdownWriteMethod = useCallback(
    (value: Erc20WriteMethod) => {
      if (selectedWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedWriteMethod(value);
      });
    },
    [resetToDropdownSelection, runWithDiscardPrompt, selectedWriteMethod, setSelectedWriteMethod],
  );
  const selectDropdownSpCoinReadMethod = useCallback(
    (value: SpCoinReadMethod) => {
      if (selectedSpCoinReadMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSpCoinReadMethod(normalizeSpCoinReadMethod(value));
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = spCoinReadMethodDefs[value];
        if (!nextDef) return;
        setSpReadParams(
          buildDefaultAccountParams(nextDef.params, {
            sponsor: defaultSponsorKey,
            recipient: defaultRecipientKey,
            agent: defaultAgentKey,
          }),
        );
      });
    },
    [
      defaultAgentKey,
      defaultRecipientKey,
      defaultSponsorKey,
      editingScriptStepNumber,
      methodSelectionSource,
      resetToDropdownSelection,
      runWithDiscardPrompt,
      selectedSpCoinReadMethod,
      setSelectedSpCoinReadMethod,
      setSpReadParams,
      spCoinReadMethodDefs,
    ],
  );
  const selectDropdownSpCoinWriteMethod = useCallback(
    (value: SpCoinWriteMethod) => {
      if (selectedSpCoinWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSpCoinWriteMethod(value);
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = spCoinWriteMethodDefs[value];
        if (!nextDef) return;
        if (defaultSponsorKey) {
          setSelectedWriteSenderAddress(defaultSponsorKey);
        }
        setSpWriteParams(
          buildDefaultAccountParams(nextDef.params, {
            sponsor: defaultSponsorKey,
            recipient: defaultRecipientKey,
            agent: defaultAgentKey,
          }),
        );
      });
    },
    [
      defaultAgentKey,
      defaultRecipientKey,
      defaultSponsorKey,
      editingScriptStepNumber,
      methodSelectionSource,
      resetToDropdownSelection,
      runWithDiscardPrompt,
      selectedSpCoinWriteMethod,
      setSelectedSpCoinWriteMethod,
      setSelectedWriteSenderAddress,
      setSpWriteParams,
      spCoinWriteMethodDefs,
    ],
  );
  const selectDropdownSerializationTestMethod = useCallback(
    (value: SerializationTestMethod) => {
      if (selectedSerializationTestMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSerializationTestMethod(value);
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = serializationTestMethodDefs[value];
        if (!nextDef) return;
        setSerializationTestParams(
          buildDefaultAccountParams(nextDef.params, {
            sponsor: defaultSponsorKey,
            recipient: defaultRecipientKey,
            agent: defaultAgentKey,
          }),
        );
      });
    },
    [
      defaultAgentKey,
      defaultRecipientKey,
      defaultSponsorKey,
      editingScriptStepNumber,
      methodSelectionSource,
      resetToDropdownSelection,
      runWithDiscardPrompt,
      selectedSerializationTestMethod,
      serializationTestMethodDefs,
      setSerializationTestParams,
      setSelectedSerializationTestMethod,
    ],
  );
  const handleAddCurrentMethodToScript = useCallback(() => {
    const savedStepNumber = addCurrentMethodToScript();
    if (!savedStepNumber) return;
    setMethodSelectionSource('script');
    setEditingScriptStepNumber(savedStepNumber);
    setSelectedScriptStepNumber(savedStepNumber);
    queueEditorBaselineReset();
  }, [addCurrentMethodToScript, queueEditorBaselineReset, setSelectedScriptStepNumber]);
  useEffect(() => {
    if (methodSelectionSource !== 'dropdown' || editingScriptStepNumber !== null) return;
    const hydrationKey = JSON.stringify({
      methodPanelMode,
      selectedReadMethod,
      selectedWriteMethod,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      selectedSerializationTestMethod,
      methodSelectionSource,
      editingScriptStepNumber,
    });
    if (dropdownHydrationKeyRef.current === hydrationKey) return;
    dropdownHydrationKeyRef.current = hydrationKey;
    let cancelled = false;

    const hydrateEditorFromExchangeContext = async () => {
      queueEditorBaselineReset();
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      if (methodPanelMode === 'ecr20_read') {
        const nextDefaults = buildErc20ReadEditorDefaults(activeReadLabels);
        setReadAddressA((prev) => (prev === nextDefaults.addressA ? prev : nextDefaults.addressA));
        setReadAddressB((prev) => (prev === nextDefaults.addressB ? prev : nextDefaults.addressB));
        return;
      }

      if (methodPanelMode === 'erc20_write') {
        const nextDefaults = buildErc20WriteEditorDefaults(activeWriteLabels);
        if (nextDefaults.senderAddress) {
          setSelectedWriteSenderAddress((prev) =>
            prev === nextDefaults.senderAddress ? prev : nextDefaults.senderAddress,
          );
        }
        setWriteAddressA((prev) => (prev === nextDefaults.addressA ? prev : nextDefaults.addressA));
        setWriteAddressB((prev) => (prev === nextDefaults.addressB ? prev : nextDefaults.addressB));
        setWriteAmountRaw((prev) => {
          if (String(prev || '').trim()) return prev;
          return nextDefaults.amount || prev;
        });
        return;
      }

      if (methodPanelMode === 'spcoin_rread') {
        setSpReadParams(buildScriptEditorParamValues(activeSpCoinReadDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSpCoinReadDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSpReadParams(buildScriptEditorParamValues(activeSpCoinReadDef.params, nextMeta));
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
        return;
      }

      if (methodPanelMode === 'spcoin_write') {
        if (senderAddress) {
          setSelectedWriteSenderAddress(senderAddress);
        }
        setSpWriteParams(buildScriptEditorParamValues(activeSpCoinWriteDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSpCoinWriteDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSpWriteParams(buildScriptEditorParamValues(activeSpCoinWriteDef.params, nextMeta));
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
        return;
      }

      if (methodPanelMode === 'serialization_tests') {
        setSerializationTestParams(buildScriptEditorParamValues(activeSerializationTestDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSerializationTestDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSerializationTestParams(
              buildScriptEditorParamValues(activeSerializationTestDef.params, nextMeta),
            );
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
      }
    };

    void hydrateEditorFromExchangeContext();
    return () => {
      cancelled = true;
    };
  }, [
    activeReadLabels,
    activeSerializationTestDef.params,
    activeSpCoinReadDef.params,
    activeSpCoinWriteDef.params,
    activeWriteLabels,
    activeAccountAddress,
    buildErc20ReadEditorDefaults,
    buildErc20WriteEditorDefaults,
    buildScriptEditorParamValues,
    defaultSponsorKey,
    editingScriptStepNumber,
    methodPanelMode,
    methodSelectionSource,
    queueEditorBaselineReset,
    resolveScriptEditorContractMetadata,
    selectedReadMethod,
    selectedSerializationTestMethod,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedWriteMethod,
    setReadAddressA,
    setReadAddressB,
    setSerializationTestParams,
    setSelectedWriteSenderAddress,
    setSpReadParams,
    setSpWriteParams,
    setWriteAddressA,
    setWriteAddressB,
    setWriteAmountRaw,
    sponsorAccountAddress,
  ]);
  useEffect(() => {
    if (methodPanelMode !== 'ecr20_read') return;
    syncEditorAddressFieldToExchangeContext(activeReadLabels.addressALabel, readAddressA);
  }, [
    activeReadLabels.addressALabel,
    methodPanelMode,
    readAddressA,
    syncEditorAddressFieldToExchangeContext,
  ]);
  useEffect(() => {
    if (methodPanelMode !== 'ecr20_read') return;
    syncEditorAddressFieldToExchangeContext(activeReadLabels.addressBLabel, readAddressB);
  }, [
    activeReadLabels.addressBLabel,
    methodPanelMode,
    readAddressB,
    syncEditorAddressFieldToExchangeContext,
  ]);
  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncRoleAccountToExchangeContext('sponsor', selectedWriteSenderAddress);
  }, [methodPanelMode, selectedWriteSenderAddress, syncRoleAccountToExchangeContext]);
  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAddressFieldToExchangeContext(activeWriteLabels.addressALabel, writeAddressA);
  }, [
    activeWriteLabels.addressALabel,
    methodPanelMode,
    syncEditorAddressFieldToExchangeContext,
    writeAddressA,
  ]);
  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAddressFieldToExchangeContext(activeWriteLabels.addressBLabel, writeAddressB);
  }, [
    activeWriteLabels.addressBLabel,
    methodPanelMode,
    syncEditorAddressFieldToExchangeContext,
    writeAddressB,
  ]);
  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAmountToExchangeContext(writeAmountRaw);
  }, [methodPanelMode, syncEditorAmountToExchangeContext, writeAmountRaw]);
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
  const runScriptDebugSequence = useCallback(
    async (options: {
      startIndex: number;
      emptyScriptStatus: string;
      initialOutput: string;
      loadFirstStepIntoEditor?: boolean;
      stopAfterCurrentStep?: boolean;
    }) => {
      if (!selectedScript || selectedScript.steps.length === 0) {
        setStatus(options.emptyScriptStatus);
        return;
      }

      const { startIndex, initialOutput, loadFirstStepIntoEditor = false, stopAfterCurrentStep = false } = options;
      const activeStep = selectedScript.steps[startIndex];
      if (!activeStep) {
        setStatus('Unable to resolve the requested script step.');
        return;
      }

      scriptDebugStopRef.current = false;
      if (initialOutput === '(no output yet)') {
        setFormattedOutputDisplay(initialOutput);
      }
      setIsScriptDebugRunning(true);

      let accumulatedOutput = initialOutput;
      try {
        for (let idx = startIndex; idx < selectedScript.steps.length; idx += 1) {
          const step = selectedScript.steps[idx];
          focusScriptStep(step);
          if (loadFirstStepIntoEditor && idx === startIndex) {
            loadScriptStep(step);
          }

          const result = await runScriptStep(step, { formattedOutputBase: accumulatedOutput });
          setScriptStepExecutionErrors((prev) => {
            const nextHasError = !result.success;
            if (prev[step.step] === nextHasError) return prev;
            return {
              ...prev,
              [step.step]: nextHasError,
            };
          });
          accumulatedOutput = result.formattedOutput;
          if (!result.success) return;

          if (scriptDebugStopRef.current) {
            setStatus(`Stopped ${selectedScript.name} at step ${step.step}.`);
            return;
          }

          const nextStep = selectedScript.steps[idx + 1];
          if (!nextStep) {
            setSelectedScriptStepNumber(null);
            setStatus(`Completed ${selectedScript.name}.`);
            return;
          }

          if (stopAfterCurrentStep) {
            focusScriptStep(nextStep);
            setStatus(`Completed step ${step.step}. Ready for step ${nextStep.step}.`);
            return;
          }

          if (nextStep.breakpoint) {
            focusScriptStep(nextStep);
            setStatus(`Paused at breakpoint before step ${nextStep.step}.`);
            return;
          }
        }
      } finally {
        setIsScriptDebugRunning(false);
      }
    },
    [focusScriptStep, loadScriptStep, runScriptStep, selectedScript],
  );
  useEffect(() => {
    setScriptStepExecutionErrors({});
  }, [selectedScript?.id]);
  const restartScriptAtStart = useCallback(async () => {
    scriptDebugStopRef.current = true;
    setIsScriptDebugRunning(false);
    await runScriptDebugSequence({
      startIndex: 0,
      emptyScriptStatus: 'Selected script has no steps to restart.',
      initialOutput: '(no output yet)',
    });
  }, [runScriptDebugSequence]);
  const runSelectedScriptStep = useCallback(async () => {
    if (!selectedScript || selectedScript.steps.length === 0 || selectedScriptStepNumber === null) {
      setStatus('Select a script step to run.');
      return;
    }

    const selectedIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
    if (selectedIndex < 0) {
      setStatus('Unable to resolve the selected script step.');
      return;
    }

    await runScriptDebugSequence({
      startIndex: selectedIndex,
      emptyScriptStatus: 'Select a script step to run.',
      initialOutput: '(no output yet)',
      loadFirstStepIntoEditor: true,
      stopAfterCurrentStep: true,
    });
  }, [runScriptDebugSequence, selectedScript, selectedScriptStepNumber, setStatus]);
  const runRemainingScriptSteps = useCallback(async () => {
    const selectedIndex = selectedScript?.steps.findIndex((step) => step.step === selectedScriptStepNumber) ?? -1;
    await runScriptDebugSequence({
      startIndex: selectedIndex >= 0 ? selectedIndex : 0,
      emptyScriptStatus: 'Selected script has no steps to run.',
      initialOutput: formattedOutputDisplay,
    });
  }, [formattedOutputDisplay, runScriptDebugSequence, selectedScript?.steps, selectedScriptStepNumber]);
  const selectScriptStep = useCallback(
    (step: LabScriptStep) => {
      if (selectedScriptStep?.step === step.step) {
        resetToDropdownSelection();
        return;
      }
      setOutputPanelMode('formatted');
      setFormattedPanelView('script');
      focusScriptStep(step);
    },
    [focusScriptStep, resetToDropdownSelection, selectedScriptStep?.step],
  );
  const handleConfirmDeleteSelectedScriptStep = useCallback(() => {
    confirmDeleteSelectedScriptStep();
    setEditingScriptStepNumber(null);
    setMethodSelectionSource('dropdown');
  }, [confirmDeleteSelectedScriptStep]);
  const renderScriptStepRow = useCallback(
    (step: LabScriptStep) => {
      const isExpanded = Boolean(expandedScriptStepIds[String(step.step)]);
      const isSelected = selectedScriptStep?.step === step.step;
      const isEditingStep = isEditingScriptMethod && editingScriptStepNumber === step.step;
      return (
        <ScriptStepRow
          key={`step-${step.step}`}
          step={step}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isEditingStep={isEditingStep}
          hasExecutionError={Boolean(scriptStepExecutionErrors[step.step])}
          getStepSender={getStepSender}
          getStepParamEntries={getStepParamEntries}
          selectScriptStep={selectScriptStep}
          editScriptStep={editScriptStepFromBuilder}
          toggleScriptStepExpanded={toggleScriptStepExpanded}
          toggleScriptStepBreakpoint={toggleScriptStepBreakpoint}
        />
      );
    },
    [
      editingScriptStepNumber,
      expandedScriptStepIds,
      editScriptStepFromBuilder,
      getStepParamEntries,
      getStepSender,
      isEditingScriptMethod,
      scriptStepExecutionErrors,
      selectedScriptStep?.step,
      selectScriptStep,
      toggleScriptStepBreakpoint,
      toggleScriptStepExpanded,
    ],
  );
  useEffect(() => {
    if (editingScriptStepNumber === null) return;
    const editedStepStillExists = Boolean(selectedScript?.steps.some((step) => step.step === editingScriptStepNumber));
    if (editedStepStillExists) return;
    setEditingScriptStepNumber(null);
    setMethodSelectionSource('dropdown');
  }, [editingScriptStepNumber, selectedScript?.steps]);
  const highlightedFormattedOutputLines = useMemo(() => {
    if (
      outputPanelMode !== 'formatted' ||
      formattedPanelView !== 'script' ||
      selectedScriptStepNumber === null
    ) {
      return null;
    }
    const lines = String(selectedScriptDisplay || '').split('\n');
    const selectedStepText = String(selectedScriptStepNumber);
    const targetLineIndex = lines.findIndex((line) => {
      const match = line.match(/"step"\s*:\s*"?([^",]+)"?/);
      return Boolean(match?.[1] && match[1] === selectedStepText);
    });
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
  }, [formattedPanelView, outputPanelMode, selectedScriptDisplay, selectedScriptStepNumber]);
  const highlightedFormattedResultLines = useMemo(() => {
    if (
      outputPanelMode !== 'formatted' ||
      formattedPanelView !== 'output' ||
      selectedScriptStepNumber === null
    ) {
      return null;
    }

    const blocks = String(formattedOutputDisplay || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (blocks.length === 0) return null;

    const targetBlockIndex =
      selectedScriptStepNumber > 0 && selectedScriptStepNumber <= blocks.length
        ? selectedScriptStepNumber - 1
        : blocks.length - 1;

    return blocks.flatMap((block, blockIndex) => {
      const lines = block.split('\n');
      const mapped = lines.map((line) => ({
        line,
        active: blockIndex === targetBlockIndex,
      }));
      return blockIndex < blocks.length - 1 ? [...mapped, { line: '', active: false }] : mapped;
    });
  }, [formattedOutputDisplay, formattedPanelView, outputPanelMode, selectedScriptStepNumber]);

  return (
    <main className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col">
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin SandBox</h2>
          <div className="flex items-center justify-self-end gap-2">
            <CloseButton
              id="sponsorCoinSandboxBackButton"
              closeCallback={() => {
                if (typeof window !== 'undefined') window.history.back();
              }}
              title="Go Back"
              ariaLabel="Go Back"
              className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
            />
          </div>
        </div>

        <section className={`grid grid-cols-1 gap-6 ${expandedCard ? '' : 'xl:grid-cols-2'}`}>
          {showCard('network') && (
          <NetworkSignerCard
            className={getCardClassName('network', expandedCard ? '' : 'xl:col-start-2 xl:row-start-1')}
            isExpanded={expandedCard === 'network'}
            onToggleExpand={() => toggleExpandedCard('network')}
            inputStyle={inputStyle}
            details={{
              showSignerAccountDetails,
              setShowSignerAccountDetails,
              displayedSignerAccountAddress: displayedSpCoinOwnerAddress,
              selectedWriteSenderAddress,
              setSelectedWriteSenderAddress,
              writeSenderDisplayValue,
              displayedSignerAccountMetadata: displayedSpCoinOwnerMetadata,
              mode,
              selectedVersionSignerKey,
            }}
            accountManagement={{
              accountActionLabelClassName,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedSponsorCoinAccountRole,
              setSelectedSponsorCoinAccountRole,
              defaultSponsorKey,
              setDefaultSponsorKey,
              defaultRecipientKey,
              setDefaultRecipientKey,
              defaultAgentKey,
              setDefaultAgentKey,
              managedRoleAccountAddress,
              setManagedRoleAccountAddress,
              managedRecipientKey,
              setManagedRecipientKey,
              managedRecipientRateKey,
              setManagedRecipientRateKey,
              managedRecipientRateKeyOptions,
              managedRecipientRateKeyHelpText,
              sponsorCoinAccountManagementValidation,
              sponsorCoinAccountManagementStatus,
              onExecuteAccountAction: handleSponsorCoinAccountAction,
            }}
          />
          )}

          {showCard('contract') && (
          <ContractNetworkCard
            className={getCardClassName('contract', expandedCard ? '' : 'xl:col-start-1 xl:row-start-1')}
            isExpanded={expandedCard === 'contract'}
            onToggleExpand={() => toggleExpandedCard('contract')}
            inputStyle={inputStyle}
            logo={{
              selectedSponsorCoinLogoURL,
              selectedSponsorCoinVersionEntry,
            }}
            version={{
              selectedSponsorCoinVersion,
              setSelectedSponsorCoinVersion,
              sponsorCoinVersionChoices,
              canIncrementSponsorCoinVersion,
              canDecrementSponsorCoinVersion,
              adjustSponsorCoinVersion,
              selectedVersionSignerKey,
              displayedVersionHardhatAccountIndex,
              selectedVersionSymbolWidthCh,
              selectedVersionSymbol,
            }}
            contract={{
              contractAddress,
              selectedSponsorCoinVersionEntry,
              isRemovingFromApp: isRemovingContractFromApp,
              onRemoveFromApp: requestRemoveContractFromApp,
            }}
            network={{
              mode,
              setMode,
              shouldPromptHardhatBaseConnect,
              connectHardhatBaseFromNetworkLabel,
              activeNetworkName,
              chainIdDisplayValue,
              chainIdDisplayWidthCh,
              showHardhatConnectionInputs,
              setShowHardhatConnectionInputs,
              cogSrc: cog_png,
              rpcUrl,
              setRpcUrl,
              effectiveConnectedAddress,
            }}
          />
          )}
          {showCard('methods') && (
          <MethodsPanelCard
            articleClassName={`${getCardClassName('methods', expandedCard ? '' : 'xl:col-start-1 xl:row-start-2')} self-start`}
            methodsCardRef={methodsCardRef}
            isExpanded={expandedCard === 'methods'}
            onToggleExpand={() => toggleExpandedCard('methods')}
            methodPanelTitle={methodPanelTitle}
            methodPanelMode={methodPanelMode}
            activeMethodPanelTab={activeMethodPanelTab}
            selectMethodPanelTab={selectMethodPanelTab}
            scriptBuilderProps={{
              actionButtonStyle,
              hiddenScrollbarClass,
              scripts,
              selectedScript,
              selectedScriptStepNumber,
              scriptNameInput,
              setScriptNameInput,
              selectedScriptId,
              setSelectedScriptId,
              isScriptOptionsOpen,
              setIsScriptOptionsOpen,
              isNewScriptHovered,
              setIsNewScriptHovered,
              isDeleteScriptHovered,
              setIsDeleteScriptHovered,
              newScriptHoverTone,
              setNewScriptHoverTone,
              deleteScriptHoverTone,
              setDeleteScriptHoverTone,
              scriptNameValidation,
              deleteScriptValidation,
              createNewScript,
              duplicateSelectedScript,
              clearSelectedScript,
              handleDeleteScriptClick,
              restartScriptAtStart,
              runSelectedScriptStep,
              runRemainingScriptSteps,
              isScriptDebugRunning,
              moveSelectedScriptStep,
              requestDeleteSelectedScriptStep,
              renderScriptStepRow,
            }}
            erc20ReadProps={{
              invalidFieldIds,
              clearInvalidField,
              selectedReadMethod,
              hardhatAccounts,
              hardhatAccountMetadata,
              erc20ReadOptions,
              setSelectedReadMethod: (value) => selectDropdownReadMethod(value as Erc20ReadMethod),
              activeReadLabels,
              readAddressA,
              setReadAddressA,
              readAddressB,
              setReadAddressB,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedReadMethod: canRunErc20ReadMethod,
              canAddCurrentMethodToScript: hasEditorScriptSelected && canRunErc20ReadMethod,
              hasEditorScriptSelected,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: erc20ReadMissingEntries.map((entry) => entry.id),
              runSelectedReadMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            erc20WriteProps={{
              invalidFieldIds,
              clearInvalidField,
              mode,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedWriteSenderAddress: selectedWriteSenderAccount?.address || selectedWriteSenderAddress,
              setSelectedWriteSenderAddress,
              writeSenderDisplayValue,
              writeSenderPrivateKeyDisplay,
              showWriteSenderPrivateKey,
              toggleShowWriteSenderPrivateKey: () => setShowWriteSenderPrivateKey((prev) => !prev),
              selectedWriteMethod,
              erc20WriteOptions,
              setSelectedWriteMethod: (value) => selectDropdownWriteMethod(value as Erc20WriteMethod),
              activeWriteLabels,
              writeAddressA,
              setWriteAddressA,
              writeAddressB,
              setWriteAddressB,
              writeAmountRaw,
              setWriteAmountRaw,
              inputStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedWriteMethod: canRunErc20WriteMethod,
              canAddCurrentMethodToScript: hasEditorScriptSelected && canRunErc20WriteMethod,
              hasEditorScriptSelected,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: erc20WriteMissingEntries.map((entry) => entry.id),
              runSelectedWriteMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            spCoinReadProps={{
              invalidFieldIds,
              clearInvalidField,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedSpCoinReadMethod,
              setSelectedSpCoinReadMethod: (value) => selectDropdownSpCoinReadMethod(value as SpCoinReadMethod),
              spCoinWorldReadOptions,
              spCoinSenderReadOptions,
              spCoinAdminReadOptions,
              spCoinCompoundReadOptions,
              spCoinReadMethodDefs: spCoinReadMethodDefs as MethodDefMap,
              activeSpCoinReadDef: activeSpCoinReadDef,
              spReadParams,
              setSpReadParams,
              inputStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedSpCoinReadMethod: canRunSpCoinReadMethod,
              canAddCurrentMethodToScript: hasEditorScriptSelected && canRunSpCoinReadMethod,
              hasEditorScriptSelected,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: spCoinReadMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinReadMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
            spCoinWriteProps={{
              invalidFieldIds,
              clearInvalidField,
              mode,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedWriteSenderAddress: selectedWriteSenderAccount?.address || selectedWriteSenderAddress,
              setSelectedWriteSenderAddress,
              writeSenderDisplayValue,
              writeSenderPrivateKeyDisplay,
              showWriteSenderPrivateKey,
              toggleShowWriteSenderPrivateKey: () => setShowWriteSenderPrivateKey((prev) => !prev),
              recipientRateKeyOptions,
              agentRateKeyOptions,
              recipientRateKeyHelpText,
              agentRateKeyHelpText,
              recipientRateRange:
                Array.isArray(exchangeContext?.settings?.spCoinContract?.recipientRateRange) &&
                isDefinedNumber(exchangeContext.settings.spCoinContract.recipientRateRange[0]) &&
                isDefinedNumber(exchangeContext.settings.spCoinContract.recipientRateRange[1])
                  ? exchangeContext.settings.spCoinContract.recipientRateRange
                  : undefined,
              agentRateRange:
                Array.isArray(exchangeContext?.settings?.spCoinContract?.agentRateRange) &&
                isDefinedNumber(exchangeContext.settings.spCoinContract.agentRateRange[0]) &&
                isDefinedNumber(exchangeContext.settings.spCoinContract.agentRateRange[1])
                  ? exchangeContext.settings.spCoinContract.agentRateRange
                  : undefined,
              selectedSpCoinWriteMethod,
              setSelectedSpCoinWriteMethod: (value) => selectDropdownSpCoinWriteMethod(value as SpCoinWriteMethod),
              spCoinWorldWriteOptions: isSpCoinTodoMode ? [] : spCoinWorldWriteOptions,
              spCoinSenderWriteOptions: isSpCoinTodoMode ? [] : spCoinSenderWriteOptions,
              spCoinAdminWriteOptions: isSpCoinTodoMode ? [] : spCoinAdminWriteOptions,
              spCoinTodoWriteOptions: isSpCoinTodoMode ? spCoinTodoWriteOptions : [],
              spCoinWriteMethodDefs: spCoinWriteMethodDefs as MethodDefMap,
              activeSpCoinWriteDef: activeSpCoinWriteDef,
              spWriteParams,
              updateSpWriteParamAtIndex,
              onOpenBackdatePicker: backdateCalendar.openBackdatePickerAt,
              inputStyle,
              buttonStyle,
              writeTraceEnabled,
              toggleWriteTrace: () => setWriteTraceEnabled((prev) => !prev),
              canRunSelectedSpCoinWriteMethod: canRunSpCoinWriteMethod,
              canAddCurrentMethodToScript: hasEditorScriptSelected && canRunSpCoinWriteMethod,
              hasEditorScriptSelected,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: spCoinWriteMissingEntries.map((entry) => entry.id),
              runSelectedSpCoinWriteMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
              formatDateTimeDisplay,
              formatDateInput,
              backdateHours: backdateCalendar.backdateHours,
              setBackdateHours: backdateCalendar.setBackdateHours,
              backdateMinutes: backdateCalendar.backdateMinutes,
              setBackdateMinutes: backdateCalendar.setBackdateMinutes,
              backdateSeconds: backdateCalendar.backdateSeconds,
              setBackdateSeconds: backdateCalendar.setBackdateSeconds,
              setBackdateYears: backdateCalendar.setBackdateYears,
              setBackdateMonths: backdateCalendar.setBackdateMonths,
              setBackdateDays: backdateCalendar.setBackdateDays,
              backdatePopupParamIdx: backdateCalendar.backdatePopupParamIdx,
              setBackdatePopupParamIdx: backdateCalendar.setBackdatePopupParamIdx,
              shiftCalendarMonth: backdateCalendar.shiftCalendarMonth,
              calendarMonthOptions: backdateCalendar.calendarMonthOptions,
              calendarViewMonth: backdateCalendar.calendarViewMonth,
              setCalendarViewMonth: backdateCalendar.setCalendarViewMonth,
              calendarYearOptions: backdateCalendar.calendarYearOptions,
              calendarViewYear: backdateCalendar.calendarViewYear,
              setCalendarViewYear: backdateCalendar.setCalendarViewYear,
              isViewingCurrentMonth: backdateCalendar.isViewingCurrentMonth,
              setHoverCalendarWarning: backdateCalendar.setHoverCalendarWarning,
              CALENDAR_WEEK_DAYS,
              calendarDayCells: backdateCalendar.calendarDayCells,
              isViewingFutureMonth: backdateCalendar.isViewingFutureMonth,
              today: backdateCalendar.today,
              selectedBackdateDate: backdateCalendar.selectedBackdateDate,
              hoverCalendarWarning: backdateCalendar.hoverCalendarWarning,
              maxBackdateYears: backdateCalendar.maxBackdateYears,
              backdateYears: backdateCalendar.backdateYears,
              backdateMonths: backdateCalendar.backdateMonths,
              backdateDays: backdateCalendar.backdateDays,
              applyBackdateBy: backdateCalendar.applyBackdateBy,
            }}
            serializationTestProps={{
              invalidFieldIds,
              clearInvalidField,
              hardhatAccounts,
              hardhatAccountMetadata,
              selectedSerializationTestMethod,
              setSelectedSerializationTestMethod: (value) =>
                selectDropdownSerializationTestMethod(value as SerializationTestMethod),
              serializationTestOptions,
              serializationTestMethodDefs: serializationTestMethodDefs as MethodDefMap,
              activeSerializationTestDef: activeSerializationTestDef,
              serializationTestParams,
              setSerializationTestParams,
              inputStyle,
              canRunSelectedSerializationTestMethod: canRunSerializationTestMethod,
              canAddCurrentMethodToScript: hasEditorScriptSelected && canRunSerializationTestMethod,
              hasEditorScriptSelected,
              isAddToScriptBlockedByNoChanges: isUpdateBlockedByNoChanges,
              addToScriptButtonLabel,
              missingFieldIds: serializationTestMissingEntries.map((entry) => entry.id),
              runSelectedSerializationTestMethod,
              addCurrentMethodToScript: handleAddCurrentMethodToScript,
            }}
          />
          )}
          {showCard('output') && (
          <OutputResultsCard
            className={`${getCardClassName('output', expandedCard ? '' : 'xl:col-start-2 xl:row-start-2')} min-h-0 self-start overflow-hidden`}
            style={!expandedCard && isDesktopSharedLayout && sharedMethodsRowHeight ? { height: `${sharedMethodsRowHeight}px` } : undefined}
            isExpanded={expandedCard === 'output'}
            onToggleExpand={() => toggleExpandedCard('output')}
            inputStyle={inputStyle}
            controls={{
              outputPanelMode,
              setOutputPanelMode,
              buttonStyle,
              copyTextToClipboard,
              setLogs,
              setStatus,
              setTreeOutputDisplay,
              setFormattedOutputDisplay,
              formattedPanelView,
              setFormattedPanelView,
              formattedJsonViewEnabled,
              setFormattedJsonViewEnabled,
            }}
              content={{
                logs,
                treeOutputDisplay,
                status,
                formattedOutputDisplay,
                scriptDisplay: selectedScriptDisplay,
                selectedScriptStepNumber,
                selectedScriptStepHasMissingRequiredParams: Boolean(selectedScriptStep?.hasMissingRequiredParams),
                selectedScriptStepHasExecutionError: Boolean(
                  selectedScriptStep && scriptStepExecutionErrors[selectedScriptStep.step],
                ),
                highlightedFormattedOutputLines:
                  formattedPanelView === 'script'
                    ? highlightedFormattedOutputLines
                  : highlightedFormattedResultLines,
              hiddenScrollbarClass,
            }}
            treeActions={{
              runHeaderRead,
              runAccountListRead,
              runTreeAccountsRead,
              runTreeDump,
              treeAccountOptions,
              selectedTreeAccount,
              setSelectedTreeAccount,
              treeAccountRefreshToken,
              requestRefreshSelectedTreeAccount,
            }}
          />
          )}
        </section>
      </section>
      <ValidationPopup
        fields={validationPopupFields}
        title={validationPopupTitle}
        message={validationPopupMessage}
        buttonStyle={buttonStyle}
        confirmLabel={validationPopupConfirmLabel}
        cancelLabel={validationPopupCancelLabel}
        onClose={clearValidationPopup}
        onConfirm={
          validationPopupConfirmRef.current
            ? () => {
                const confirmAction = validationPopupConfirmRef.current;
                clearValidationPopup();
                void confirmAction?.();
              }
            : undefined
        }
      />
      <DeleteStepPopup
        isOpen={isDeleteStepPopupOpen && !!selectedScriptStep}
        stepName={selectedScriptStep?.name || ''}
        buttonStyle={buttonStyle}
        onCancel={() => setIsDeleteStepPopupOpen(false)}
        onConfirm={handleConfirmDeleteSelectedScriptStep}
      />
      <DiscardChangesPopup
        isOpen={isDiscardChangesPopupOpen}
        message={discardChangesMessage}
        onCancel={clearDiscardChangesPopup}
        onConfirm={() => {
          const confirmAction = discardChangesConfirmRef.current;
          clearDiscardChangesPopup();
          void confirmAction?.();
        }}
      />
    </main>
  );
}
