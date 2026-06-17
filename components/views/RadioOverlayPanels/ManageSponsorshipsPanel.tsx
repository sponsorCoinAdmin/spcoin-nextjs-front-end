// File: components/views/RadioOverlayPanels/ManageSponsorshipsPanel.tsx
'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// import { ChevronDown, ChevronUp } from 'lucide-react';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useSellTokenContract } from '@/lib/context/hooks';
import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { resolveSpCoinAccountRoles } from '@/lib/spCoinLab/accountRoles';

import { msTableTw } from './msTableTw';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORSHIPS === 'true';
const debugLog = createDebugLogger('ManageSponsorshipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = { onClose?: () => void };

// ✅ fixed left column width ONLY (others flex)
const COL_0_WIDTH = '105px';

// ✅ Rewards modes supported by this panel
type RewardsMode =
  | SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS
  | SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS
  | SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS
  | SP_COIN_DISPLAY.PENDING_AGENT_REWARDS;

type ToDoMode = 'claimRewards' | 'claimAllSponsorshipRewards' | 'unstakeAllSponsorships';
type RewardRoleName = 'Sponsor' | 'Recipient' | 'Agent';
type RewardAction = 'estimate' | 'claim';

type RoleRewardState = {
  amount?: string;
  loading?: boolean;
  action?: RewardAction;
  error?: string;
  trace?: string;
};

const REWARD_ROLES = ['Sponsor', 'Recipient', 'Agent'] as const satisfies readonly RewardRoleName[];

const REWARD_ROLE_CONFIG: Record<RewardRoleName, {
  accountType: AccountType;
  estimateMethod: string;
  claimMethod: string;
  pendingKey: string;
  roleFlag: string;
}> = {
  Sponsor: {
    accountType: AccountType.SPONSOR,
    estimateMethod: 'estimateOffChainSponsorRewards',
    claimMethod: 'claimOnChainSponsorRewards',
    pendingKey: 'pendingSponsorRewards',
    roleFlag: 'isSponsor',
  },
  Recipient: {
    accountType: AccountType.RECIPIENT,
    estimateMethod: 'estimateOffChainRecipientRewards',
    claimMethod: 'claimOnChainRecipientRewards',
    pendingKey: 'pendingRecipientRewards',
    roleFlag: 'isRecipient',
  },
  Agent: {
    accountType: AccountType.AGENT,
    estimateMethod: 'estimateOffChainAgentRewards',
    claimMethod: 'claimOnChainAgentRewards',
    pendingKey: 'pendingAgentRewards',
    roleFlag: 'isAgent',
  },
};

const TOTAL_REWARD_CONFIG = {
  estimateMethod: 'estimateOffChainTotalRewards',
  claimMethod: 'claimOnChainTotalRewards',
} as const;

type ManageSponsorshipsTrace = {
  phase: string;
  at: string;
  isActive: boolean;
  appChainId?: number;
  chainId?: number;
  networkName: string;
  networkSymbol: string;
  readMode: 'hardhat' | 'metamask';
  accessSource: 'local' | 'node_modules';
  rpcUrl: string;
  sellTokenAddr: string;
  activeContractAddr: string;
  activeAccountAddr: string;
  httpStatus?: number;
  ok?: boolean;
  firstSuccess?: boolean;
  errorMessage?: string;
  resultKeys?: string[];
  totalSpCoinsKeys?: string[];
  rawBalanceOf?: string;
  rawStakedBalance?: string;
  decimals?: number;
  decimalsSource?: string;
  tradingAmountDisplay?: string;
  stakedAmountDisplay?: string;
};

function readRecordValue(value: unknown, path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function normalizeDecimalString(value: unknown): string {
  if (value == null) return '0';
  if (typeof value === 'string') return value.trim() || '0';
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value).trim() || '0';
  return '0';
}

function formatIntegerTokenAmount(rawValue: string, decimals: number): string {
  const negative = rawValue.startsWith('-');
  const digits = negative ? rawValue.slice(1) : rawValue;
  const padded = digits.padStart(decimals + 1, '0');
  const whole = decimals > 0 ? padded.slice(0, padded.length - decimals) : padded;
  const fraction = decimals > 0 ? padded.slice(padded.length - decimals).replace(/0+$/, '') : '';
  const formatted = fraction ? `${whole}.${fraction}` : whole || '0';
  return negative ? `-${formatted}` : formatted;
}

function formatAccountRecordAmount(rawValue: unknown, decimals: number): string {
  const normalized = normalizeDecimalString(rawValue).replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return '0.0';
  if (/^-?\d+$/.test(normalized)) return formatIntegerTokenAmount(normalized, decimals);
  return normalized;
}

function addDecimalDisplayAmounts(values: unknown[]): string {
  const normalizedValues = values
    .map((value) => normalizeDecimalString(value).replace(/,/g, '').trim())
    .filter((value) => /^\d+(?:\.\d+)?$/.test(value));
  if (normalizedValues.length === 0) return '0.0';

  const scale = Math.max(
    0,
    ...normalizedValues.map((value) => value.split('.')[1]?.length ?? 0),
  );
  const total = normalizedValues.reduce((sum, value) => {
    const [whole, fraction = ''] = value.split('.');
    return sum + BigInt(`${whole}${fraction.padEnd(scale, '0')}`);
  }, 0n);

  if (scale === 0) return total.toString();
  const digits = total.toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, -scale) || '0';
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

function toRawRewardBigInt(value: unknown): bigint {
  const normalized = normalizeDecimalString(value).replace(/,/g, '').trim();
  if (!/^-?\d+$/.test(normalized)) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

function getPendingRewardsTotalFromRecord(record: unknown): unknown {
  const pendingTotalRewards = readRecordValue(record, ['pendingTotalRewards']);
  const explicitTotal =
    readRecordValue(pendingTotalRewards, ['total']) ??
    readRecordValue(pendingTotalRewards, ['pendingTotalRewards']) ??
    readRecordValue(pendingTotalRewards, ['pendingRewards']) ??
    readRecordValue(pendingTotalRewards, ['totalRewards']) ??
    readRecordValue(record, ['total']) ??
    readRecordValue(record, ['pendingTotalRewards']) ??
    readRecordValue(record, ['pendingRewards']) ??
    readRecordValue(record, ['totalRewards']);
  const componentTotal =
    toRawRewardBigInt(readRecordValue(record, ['pendingSponsorRewards'])) +
    toRawRewardBigInt(readRecordValue(record, ['pendingRecipientRewards'])) +
    toRawRewardBigInt(readRecordValue(record, ['pendingAgentRewards']));
  return componentTotal > 0n ? componentTotal.toString() : explicitTotal;
}

function objectKeys(value: unknown): string[] {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value as Record<string, unknown>)
    : [];
}

function isTruthyRecordFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes';
}

function getAccountRoleAvailable(record: unknown, role: RewardRoleName): boolean {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  const account = record as Record<string, unknown>;
  if (resolveSpCoinAccountRoles(account).includes(role)) return true;
  const roleConfig = REWARD_ROLE_CONFIG[role];
  if (isTruthyRecordFlag(account[roleConfig.roleFlag])) return true;
  const roleText = String(account.role ?? account.roles ?? '').trim();
  return new RegExp(`\\b${role}\\b`, 'i').test(roleText);
}

function getRewardResultAmount(result: unknown, role: RewardRoleName): unknown {
  if (typeof result === 'string' || typeof result === 'number' || typeof result === 'bigint') return result;
  const roleConfig = REWARD_ROLE_CONFIG[role];
  return (
    readRecordValue(result, [roleConfig.pendingKey]) ??
    readRecordValue(result, ['pendingTotalRewards']) ??
    readRecordValue(result, ['pendingRewards']) ??
    readRecordValue(result, ['claimedAmount']) ??
    readRecordValue(result, ['meta', 'rewardCalculation', roleConfig.pendingKey])
  );
}

function getTotalRewardResultRoleAmount(result: unknown, role: RewardRoleName): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return undefined;
  const roleConfig = REWARD_ROLE_CONFIG[role];
  return (
    readRecordValue(result, [roleConfig.pendingKey]) ??
    readRecordValue(result, ['pendingTotalRewards', roleConfig.pendingKey]) ??
    readRecordValue(result, ['pendingRewards', roleConfig.pendingKey]) ??
    readRecordValue(result, ['meta', 'rewardCalculation', roleConfig.pendingKey])
  );
}

function getTotalRewardResultAmount(result: unknown): unknown {
  if (typeof result === 'string' || typeof result === 'number' || typeof result === 'bigint') return result;
  return (
    getPendingRewardsTotalFromRecord(result) ??
    readRecordValue(result, ['claimedAmount']) ??
    readRecordValue(result, ['meta', 'rewardCalculation', 'pendingTotalRewards', 'total']) ??
    readRecordValue(result, ['meta', 'rewardCalculation', 'pendingTotalRewards'])
  );
}

function getAccountRecordPendingReward(record: unknown, role: RewardRoleName): unknown {
  const roleConfig = REWARD_ROLE_CONFIG[role];
  return (
    readRecordValue(record, ['totalSpCoins', 'pendingRewards', roleConfig.pendingKey]) ??
    readRecordValue(record, ['pendingRewards', roleConfig.pendingKey]) ??
    readRecordValue(record, [roleConfig.pendingKey])
  );
}

function getAccountRecordTotalPendingReward(record: unknown): unknown {
  const pendingTotalRewards =
    readRecordValue(record, ['totalSpCoins', 'pendingRewards', 'pendingTotalRewards']) ??
    readRecordValue(record, ['pendingRewards', 'pendingTotalRewards']) ??
    readRecordValue(record, ['pendingTotalRewards']);
  const totalSpCoinsPendingRewards = readRecordValue(record, ['totalSpCoins', 'pendingRewards']);
  const componentTotal =
    toRawRewardBigInt(readRecordValue(totalSpCoinsPendingRewards, ['pendingSponsorRewards'])) +
    toRawRewardBigInt(readRecordValue(totalSpCoinsPendingRewards, ['pendingRecipientRewards'])) +
    toRawRewardBigInt(readRecordValue(totalSpCoinsPendingRewards, ['pendingAgentRewards']));
  return (
    (componentTotal > 0n ? componentTotal.toString() : undefined) ??
    readRecordValue(pendingTotalRewards, ['total']) ??
    readRecordValue(pendingTotalRewards, ['pendingTotalRewards']) ??
    readRecordValue(pendingTotalRewards, ['pendingRewards']) ??
    readRecordValue(pendingTotalRewards, ['totalRewards']) ??
    readRecordValue(record, ['totalSpCoins', 'pendingRewards', 'pendingRewards']) ??
    readRecordValue(record, ['pendingRewards', 'pendingRewards']) ??
    readRecordValue(record, ['pendingRewards']) ??
    '0'
  );
}

function exposeManageSponsorshipsTrace(trace: ManageSponsorshipsTrace) {
  if (typeof window === 'undefined') return;
  (window as typeof window & { __manageSponsorshipsTrace?: ManageSponsorshipsTrace }).__manageSponsorshipsTrace = trace;
  // eslint-disable-next-line no-console
  console.info('[ManageSponsorshipsPanel:getAccountRecord]', trace);
}

function getPersistedSponsorCoinLabAddress(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem('spCoinLabKey');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { contractAddress?: string };
    const nextAddress = String(parsed?.contractAddress ?? '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(nextAddress) ? nextAddress : '';
  } catch {
    return '';
  }
}

function getPersistedSpCoinAccessAddress(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem('spCoinAccess');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as {
      deployedContractAddress?: string;
      deploymentPublicKey?: string;
    };
    const nextAddress = String(parsed?.deployedContractAddress ?? parsed?.deploymentPublicKey ?? '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(nextAddress) ? nextAddress : '';
  } catch {
    return '';
  }
}

function normalizeContractAddressCandidate(value: unknown): string {
  const nextAddress = String(value ?? '').trim();
  return /^0x[a-fA-F0-9]{40}$/.test(nextAddress) ? nextAddress : '';
}

function getTraceObjectKeys(value: unknown): string {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value as Record<string, unknown>).join(',')
    : 'none';
}

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  const ctx = useContext(ExchangeContextState);
  const activeAccount = ctx?.exchangeContext?.accounts?.activeAccount;
  const [sellTokenContract] = useSellTokenContract();
  const [accountRecord, setAccountRecord] = useState<unknown>(undefined);
  const [accountRecordLoading, setAccountRecordLoading] = useState(false);
  const [accountRecordTrace, setAccountRecordTrace] = useState<ManageSponsorshipsTrace | null>(null);
  const [accountRecordRefreshNonce, setAccountRecordRefreshNonce] = useState(0);
  const [totalReward, setTotalReward] = useState<RoleRewardState>({});
  const [traceEnabled, setTraceEnabled] = useState(true);
  const [roleRewards, setRoleRewards] = useState<Record<RewardRoleName, RoleRewardState>>({
    Sponsor: {},
    Recipient: {},
    Agent: {},
  });
  const autoTotalRewardEstimateKeyRef = useRef('');
  const autoRoleRewardEstimateKeyRef = useRef('');
  const totalRewardRequestInFlightRef = useRef(false);

  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const pendingVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

  const { openPanel, closePanel } = usePanelTree();

  const defaultAddr = useMemo(() => String(activeAccount?.address ?? ''), [activeAccount?.address]);
  const activeAccountAddr = String(activeAccount?.address ?? '').trim();
  const sellTokenAddr = String(sellTokenContract?.address ?? '').trim();
  const persistedLabContractAddr = getPersistedSponsorCoinLabAddress();
  const persistedAccessContractAddr = getPersistedSpCoinAccessAddress();
  const selectedTokenContractAddr = normalizeContractAddressCandidate(sellTokenAddr);
  const activeContractAddr = selectedTokenContractAddr || persistedLabContractAddr || persistedAccessContractAddr;
  const appChainId = Number(ctx?.exchangeContext?.network?.appChainId ?? 0);
  const chainId = Number(ctx?.exchangeContext?.network?.chainId ?? 0);
  const networkName = String(ctx?.exchangeContext?.network?.name ?? '').trim();
  const networkSymbol = String(ctx?.exchangeContext?.network?.symbol ?? '').trim();
  const rpcUrl = String(ctx?.exchangeContext?.network?.rpcUrl ?? '').trim();
  const accessSource =
    ctx?.exchangeContext?.settings?.spCoinAccessManager?.source === 'node'
      ? 'node_modules'
      : 'local';
  const isHardhatNetwork =
    appChainId === 31337 ||
    chainId === 31337 ||
    networkSymbol.toUpperCase() === 'HH_BASE' ||
    /hardhat|hh_base/i.test(`${networkName} ${networkSymbol}`);
  const readMode = isHardhatNetwork ? 'hardhat' : 'metamask';
  const sellTokenDecimals = sellTokenContract?.decimals;
  const settingsDecimals = ctx?.exchangeContext?.settings?.spCoinContract?.decimals;
  const selectedTokenDecimals =
    selectedTokenContractAddr && Number.isInteger(sellTokenDecimals) && Number(sellTokenDecimals) >= 0
      ? Number(sellTokenDecimals)
      : undefined;
  const activeContractDecimals = selectedTokenDecimals != null
    ? selectedTokenDecimals
    : Number.isInteger(settingsDecimals) && Number(settingsDecimals) >= 0
      ? Number(settingsDecimals)
      : Number.isInteger(sellTokenDecimals) && Number(sellTokenDecimals) >= 0
      ? Number(sellTokenDecimals)
      : 18;
  const activeContractDecimalsSource =
    selectedTokenDecimals != null
      ? 'selectedTokenContract.decimals'
      : Number.isInteger(settingsDecimals) && Number(settingsDecimals) >= 0
      ? 'settings.spCoinContract.decimals'
      : Number.isInteger(sellTokenDecimals) && Number(sellTokenDecimals) >= 0
        ? 'sellTokenContract.decimals'
        : 'default:18';

  const buildTrace = useCallback(
    (phase: string, overrides: Partial<ManageSponsorshipsTrace> = {}): ManageSponsorshipsTrace => ({
      phase,
      at: new Date().toISOString(),
      isActive,
      appChainId,
      chainId,
      networkName,
      networkSymbol,
      readMode,
      accessSource,
      rpcUrl,
      sellTokenAddr,
      activeContractAddr,
      activeAccountAddr,
      decimals: activeContractDecimals,
      decimalsSource: activeContractDecimalsSource,
      ...overrides,
    }),
    [
      accessSource,
      activeAccountAddr,
      appChainId,
      chainId,
      isActive,
      networkName,
      networkSymbol,
      readMode,
      rpcUrl,
      sellTokenAddr,
      activeContractAddr,
      activeContractDecimals,
      activeContractDecimalsSource,
    ],
  );

  const recordTrace = useCallback(
    (phase: string, overrides: Partial<ManageSponsorshipsTrace> = {}) => {
      const trace = buildTrace(phase, overrides);
      setAccountRecordTrace(trace);
      exposeManageSponsorshipsTrace(trace);
    },
    [buildTrace],
  );

  useEffect(() => {
    if (!isActive || !activeContractAddr || !activeAccountAddr) {
      setAccountRecord(undefined);
      setAccountRecordLoading(false);
      setTotalReward({});
      setRoleRewards({ Sponsor: {}, Recipient: {}, Agent: {} });
      recordTrace('skip', {
        errorMessage: !isActive
          ? 'panel not active'
          : !activeContractAddr
            ? 'missing active contract address'
            : 'missing active account address',
      });
      return;
    }

    let cancelled = false;

    const loadAccountRecord = async () => {
      setAccountRecordLoading(true);
      setTotalReward({});
      setRoleRewards({ Sponsor: {}, Recipient: {}, Agent: {} });
      try {
        recordTrace('request');
        const response = await fetch('/api/spCoin/run-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: activeContractAddr,
            rpcUrl,
            spCoinAccessSource: accessSource,
            cacheMode: 'default',
            useCache: true,
            traceCache: traceEnabled,
            script: {
              id: `manage-sponsorships-getAccountRecord-${Date.now()}`,
              name: 'getAccountRecord',
              network: readMode,
              steps: [
                {
                  step: 1,
                  name: 'getAccountRecord',
                  panel: 'spcoin_rread',
                  method: 'getAccountRecord',
                  mode: readMode,
                  params: [{ key: 'Account Key', value: activeAccountAddr }],
                },
              ],
            },
          }),
        });

        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          results?: Array<{
            success?: boolean;
            payload?: {
              result?: unknown;
              error?: { message?: unknown };
            };
          }>;
        };

        if (!response.ok) {
          recordTrace('http-error', {
            httpStatus: response.status,
            ok: response.ok,
            errorMessage: payload?.message ?? `Unable to load getAccountRecord (${response.status})`,
          });
          throw new Error(payload?.message ?? `Unable to load getAccountRecord (${response.status})`);
        }

        const firstResult = Array.isArray(payload?.results) ? payload.results[0] : undefined;
        if (!firstResult?.success) {
          recordTrace('step-error', {
            httpStatus: response.status,
            ok: response.ok,
            firstSuccess: firstResult?.success,
            errorMessage: String(firstResult?.payload?.error?.message ?? 'Unable to load getAccountRecord.'),
          });
          throw new Error(String(firstResult?.payload?.error?.message ?? 'Unable to load getAccountRecord.'));
        }

        const result = firstResult?.payload?.result;
        const totalSpCoins = readRecordValue(result, ['totalSpCoins']);
        const rawBalanceOf =
          readRecordValue(result, ['totalSpCoins', 'balanceOf']) ??
          readRecordValue(result, ['accountBalance']) ??
          readRecordValue(result, ['balanceOf']);
        const rawStakedBalance =
          readRecordValue(result, ['totalSpCoins', 'stakedBalance']) ??
          readRecordValue(result, ['stakedAccountSPCoins']) ??
          readRecordValue(result, ['stakedBalance']);
        const nextTradingAmount = formatAccountRecordAmount(rawBalanceOf, activeContractDecimals);
        const nextStakedAmount = formatAccountRecordAmount(rawStakedBalance, activeContractDecimals);

        recordTrace('success', {
          httpStatus: response.status,
          ok: response.ok,
          firstSuccess: firstResult?.success,
          resultKeys: objectKeys(result),
          totalSpCoinsKeys: objectKeys(totalSpCoins),
          rawBalanceOf: normalizeDecimalString(rawBalanceOf),
          rawStakedBalance: normalizeDecimalString(rawStakedBalance),
          tradingAmountDisplay: nextTradingAmount,
          stakedAmountDisplay: nextStakedAmount,
        });

        if (!cancelled) {
          setAccountRecord(result);
          setTotalReward({
            amount: formatAccountRecordAmount(getAccountRecordTotalPendingReward(result), activeContractDecimals),
          });
          setRoleRewards({
            Sponsor: {
              amount: formatAccountRecordAmount(getAccountRecordPendingReward(result, 'Sponsor'), activeContractDecimals),
            },
            Recipient: {
              amount: formatAccountRecordAmount(getAccountRecordPendingReward(result, 'Recipient'), activeContractDecimals),
            },
            Agent: {
              amount: formatAccountRecordAmount(getAccountRecordPendingReward(result, 'Agent'), activeContractDecimals),
            },
          });
        }
      } catch (error) {
        debugLog.warn?.('loadAccountRecord failed', error);
        recordTrace('catch', {
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) {
          setAccountRecord(undefined);
        }
      } finally {
        if (!cancelled) {
          setAccountRecordLoading(false);
        }
      }
    };

    void loadAccountRecord();

    return () => {
      cancelled = true;
    };
  }, [
    accessSource,
    activeAccountAddr,
    activeContractAddr,
    activeContractDecimals,
    accountRecordRefreshNonce,
    isActive,
    readMode,
    recordTrace,
    rpcUrl,
    traceEnabled,
  ]);

  const tradingAmountDisplay = useMemo(() => {
    if (!activeContractAddr || !activeAccountAddr) return '0.0';
    if (accountRecordLoading) return '...';

    const rawBalance =
      readRecordValue(accountRecord, ['totalSpCoins', 'balanceOf']) ??
      readRecordValue(accountRecord, ['accountBalance']) ??
      readRecordValue(accountRecord, ['balanceOf']);
    return formatAccountRecordAmount(rawBalance, activeContractDecimals);
  }, [accountRecord, accountRecordLoading, activeAccountAddr, activeContractAddr, activeContractDecimals]);

  const stakedAmountDisplay = useMemo(() => {
    if (!activeContractAddr || !activeAccountAddr) return '0.0';
    if (accountRecordLoading) return '...';

    const rawStaked =
      readRecordValue(accountRecord, ['totalSpCoins', 'stakedBalance']) ??
      readRecordValue(accountRecord, ['stakedAccountSPCoins']) ??
      readRecordValue(accountRecord, ['stakedBalance']);
    return formatAccountRecordAmount(rawStaked, activeContractDecimals);
  }, [accountRecord, accountRecordLoading, activeAccountAddr, activeContractAddr, activeContractDecimals]);

  const runRewardScript = useCallback(
    async (method: string, action: RewardAction): Promise<unknown> => {
      const response = await fetch('/api/spCoin/run-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: activeContractAddr,
          rpcUrl,
          spCoinAccessSource: accessSource,
          cacheMode: action === 'estimate' ? 'default' : 'forceRefresh',
          useCache: action === 'estimate',
          traceCache: traceEnabled,
          script: {
            id: `manage-sponsorships-${method}-${Date.now()}`,
            name: method,
            network: readMode,
            steps: [
              {
                step: 1,
                name: method,
                panel: action === 'estimate' ? 'spcoin_rread' : 'spcoin_write',
                method,
                mode: readMode,
                params: [{ key: 'Account Key', value: activeAccountAddr }],
              },
            ],
          },
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        results?: Array<{
          success?: boolean;
          payload?: {
            result?: unknown;
            error?: { message?: unknown };
          };
        }>;
      };

      const firstResult = Array.isArray(payload?.results) ? payload.results[0] : undefined;
      if (!response.ok || !firstResult?.success) {
        throw new Error(
          String(
            firstResult?.payload?.error?.message ??
            payload?.message ??
            `${method} failed.`,
          ),
        );
      }

      return firstResult.payload?.result;
    },
    [accessSource, activeAccountAddr, activeContractAddr, readMode, rpcUrl, traceEnabled],
  );

  const runTotalRewardAction = useCallback(
    async (action: RewardAction) => {
      if (!activeContractAddr || !activeAccountAddr) return;
      if (totalRewardRequestInFlightRef.current) return;
      totalRewardRequestInFlightRef.current = true;

      const method = action === 'estimate' ? TOTAL_REWARD_CONFIG.estimateMethod : TOTAL_REWARD_CONFIG.claimMethod;
      setTotalReward((current) => ({ ...current, loading: true, action, error: undefined }));

      try {
        const result = await runRewardScript(method, action);
        const rawAmount = getTotalRewardResultAmount(result);
        setTotalReward({
          amount: formatAccountRecordAmount(rawAmount, activeContractDecimals),
          loading: false,
          action: undefined,
          error: undefined,
          trace: [
            `action=${action}`,
            `method=${method}`,
            `resultKeys=${getTraceObjectKeys(result)}`,
            `pendingTotalRewardsKeys=${getTraceObjectKeys(readRecordValue(result, ['pendingTotalRewards']))}`,
            `pendingSponsorRewards=${normalizeDecimalString(readRecordValue(result, ['pendingSponsorRewards']))}`,
            `pendingRecipientRewards=${normalizeDecimalString(readRecordValue(result, ['pendingRecipientRewards']))}`,
            `pendingAgentRewards=${normalizeDecimalString(readRecordValue(result, ['pendingAgentRewards']))}`,
            `rawAmount=${normalizeDecimalString(rawAmount)}`,
          ].join('; '),
        });
        if (action === 'estimate') {
          setRoleRewards((current) => {
            const next = { ...current };
            for (const role of REWARD_ROLES) {
              if (!getAccountRoleAvailable(accountRecord, role)) continue;
              next[role] = {
                ...next[role],
                amount: formatAccountRecordAmount(getTotalRewardResultRoleAmount(result, role), activeContractDecimals),
                loading: false,
                error: undefined,
              };
            }
            return next;
          });
        }

        if (action === 'claim') {
          setAccountRecordRefreshNonce((value) => value + 1);
        }
      } catch (error) {
        setTotalReward((current) => ({
          ...current,
          loading: false,
          action: undefined,
          error: error instanceof Error ? error.message : String(error),
        }));
      } finally {
        totalRewardRequestInFlightRef.current = false;
      }
    },
    [
      activeAccountAddr,
      activeContractAddr,
      activeContractDecimals,
      accountRecord,
      runRewardScript,
    ],
  );

  const runRewardAction = useCallback(
    async (role: RewardRoleName, action: RewardAction) => {
      if (!activeContractAddr || !activeAccountAddr) return;
      if (!getAccountRoleAvailable(accountRecord, role)) return;

      const roleConfig = REWARD_ROLE_CONFIG[role];
      const method = action === 'estimate' ? roleConfig.estimateMethod : roleConfig.claimMethod;
      setRoleRewards((current) => ({
        ...current,
        [role]: { ...current[role], loading: true, action, error: undefined },
      }));

      try {
        const result = await runRewardScript(method, action);
        const rawAmount = action === 'estimate' ? getRewardResultAmount(result, role) : 0;
        setRoleRewards((current) => ({
          ...current,
          [role]: {
            amount: formatAccountRecordAmount(rawAmount, activeContractDecimals),
            loading: false,
            action: undefined,
            error: undefined,
          },
        }));

        if (action === 'claim') {
          setAccountRecordRefreshNonce((value) => value + 1);
        }
      } catch (error) {
        setRoleRewards((current) => ({
          ...current,
          [role]: {
            ...current[role],
            loading: false,
            action: undefined,
            error: error instanceof Error ? error.message : String(error),
          },
        }));
      }
    },
    [
      activeAccountAddr,
      activeContractAddr,
      activeContractDecimals,
      accountRecord,
      runRewardScript,
    ],
  );

  const runAvailableRoleRewardEstimates = useCallback(async () => {
    for (const role of REWARD_ROLES) {
      if (!getAccountRoleAvailable(accountRecord, role)) continue;
      await runRewardAction(role, 'estimate');
    }
  }, [accountRecord, runRewardAction]);

  useEffect(() => {
    if (isActive) return;
    autoTotalRewardEstimateKeyRef.current = '';
    autoRoleRewardEstimateKeyRef.current = '';
  }, [isActive]);

  useEffect(() => {
    if (!isActive || pendingVisible || !activeContractAddr || !activeAccountAddr || accountRecordLoading) return;

    const nextKey = [
      'total',
      activeContractAddr.toLowerCase(),
      activeAccountAddr.toLowerCase(),
      accountRecordRefreshNonce,
    ].join(':');
    if (autoTotalRewardEstimateKeyRef.current === nextKey) return;

    autoTotalRewardEstimateKeyRef.current = nextKey;
    void runTotalRewardAction('estimate');
  }, [
    accountRecordLoading,
    accountRecordRefreshNonce,
    activeAccountAddr,
    activeContractAddr,
    isActive,
    pendingVisible,
    runTotalRewardAction,
  ]);

  useEffect(() => {
    if (!isActive || !pendingVisible || !activeContractAddr || !activeAccountAddr || accountRecordLoading || !accountRecord) return;

    const nextKey = [
      'roles',
      activeContractAddr.toLowerCase(),
      activeAccountAddr.toLowerCase(),
      accountRecordRefreshNonce,
    ].join(':');
    if (autoRoleRewardEstimateKeyRef.current === nextKey) return;

    autoRoleRewardEstimateKeyRef.current = nextKey;
    void runTotalRewardAction('estimate');
  }, [
    accountRecord,
    accountRecordLoading,
    accountRecordRefreshNonce,
    activeAccountAddr,
    activeContractAddr,
    isActive,
    pendingVisible,
    runTotalRewardAction,
  ]);

  const rewardRows = useMemo(() => (
    REWARD_ROLES.map((role) => {
      const available = getAccountRoleAvailable(accountRecord, role);
      const state = roleRewards[role] ?? {};
      const seededAmount = formatAccountRecordAmount(getAccountRecordPendingReward(accountRecord, role), activeContractDecimals);
      return {
        role,
        available,
        amount: available ? (state.loading ? state.amount ?? seededAmount : state.amount ?? seededAmount) : 'N/A',
        loading: state.loading === true,
        error: state.error,
      };
    })
  ), [accountRecord, activeContractDecimals, roleRewards]);

  const pendingTotalAmountDisplay = useMemo(() => {
    if (!activeContractAddr || !activeAccountAddr) return '0.0';
    const seededAmount = formatAccountRecordAmount(getAccountRecordTotalPendingReward(accountRecord), activeContractDecimals);
    const currentAmount = totalReward.amount ?? seededAmount;
    if (accountRecordLoading) return currentAmount !== '0.0' ? currentAmount : '...';
    if (totalReward.loading) return currentAmount;
    if (totalReward.error) return currentAmount !== '0.0' ? currentAmount : 'Error';
    return currentAmount;
  }, [
    accountRecord,
    accountRecordLoading,
    activeAccountAddr,
    activeContractAddr,
    activeContractDecimals,
    totalReward.amount,
    totalReward.error,
    totalReward.loading,
  ]);

  const totalCoinsDisplay = useMemo(() => {
    const visibleRewardAmounts = pendingVisible
      ? rewardRows.map((row) => row.amount)
      : [pendingTotalAmountDisplay];
    const hasLoadingAmount = [
      tradingAmountDisplay,
      stakedAmountDisplay,
      ...visibleRewardAmounts,
    ].some((value) => value === '...');
    if (hasLoadingAmount) return '...';
    return addDecimalDisplayAmounts([
      tradingAmountDisplay,
      stakedAmountDisplay,
      ...visibleRewardAmounts,
    ]);
  }, [
    pendingTotalAmountDisplay,
    pendingVisible,
    rewardRows,
    stakedAmountDisplay,
    tradingAmountDisplay,
  ]);

  useEffect(() => {
    debugLog.log?.('[render]', {
      isActive,
      hasActive: !!activeAccount,
      activeAddress: activeAccount?.address,
      defaultAddr,
      pendingVisible,
    });
  }, [isActive, activeAccount, defaultAddr, pendingVisible]);

  // ───────────────────────── ToDo overlay (inlined; replaces deleted hook) ─────────────────────────
  const [showToDo, setShowToDo] = useState(false);
  const todoModeRef = useRef<ToDoMode>('claimRewards');
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  const unstakeAllSponsorships = useCallback(() => {
    todoModeRef.current = 'unstakeAllSponsorships';
    accountTypeRef.current = AccountType.SPONSOR;
    setShowToDo(true);
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const connectedAddr = connected ? String((connected as any)?.address ?? '') : '(none connected)';

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'unstakeAllSponsorships') {
      alert(`ToDo: (Not Yet Implemented)\nUnstake All Sponsorships:\nFor account: ${connectedAddr}`);
      return;
    }

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'claimAllSponsorshipRewards') {
      alert(`ToDo: (Not Yet Implemented)\nClaim all Sponsorship Rewards\nFor Account: ${connectedAddr}`);
      return;
    }

    // Default: Claim Rewards
    const sel = String(accountTypeRef.current);
    const what = sel === 'ALL' ? sel : `${sel}(s)`;
    // eslint-disable-next-line no-alert
    alert(`ToDo: (Not Yet Implemented)\nClaim: ${what} Rewards\nFor account: ${connectedAddr}`);
  }, [ctx]);

  const openOverlay = useCallback(
    (id: SP_COIN_DISPLAY) => {
      debugLog.log?.('openOverlay', { target: SP_COIN_DISPLAY[id] });
      openPanel(id, `ManageSponsorshipsPanel:openOverlay(target=${SP_COIN_DISPLAY[id]}#${String(id)})`);
    },
    [openPanel],
  );

  /**
   * ✅ Rewards mode switching (inlined; replaces rewardsTreeActions.openRewardsModeWithPanels)
   * Opens ACCOUNT_LIST_REWARDS_PANEL, then opens the selected rewards subpanel
   * while closing the others so only one mode is active.
   */
  const openRewardsMode = useCallback(
    (mode: RewardsMode) => {
      debugLog.log?.('openRewardsMode', { mode: SP_COIN_DISPLAY[mode] });

      const reasonPrefix = 'ManageSponsorshipsPanel:openRewardsMode';
      const reason = (msg: string) => `${reasonPrefix}:${msg}`;

      // 1) Ensure the rewards "parent" panel is open
      openPanel(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL, reason('open(ACCOUNT_LIST_REWARDS_PANEL)'));

      // 2) Close all reward sub-panels first (so only one mode is active)
      const allModes: RewardsMode[] = [
        SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS,
        SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS,
        SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS,
        SP_COIN_DISPLAY.PENDING_AGENT_REWARDS,
      ];

      for (const m of allModes) {
        if (m !== mode) {
          closePanel(m, reason(`close(${SP_COIN_DISPLAY[m]})`));
        }
      }

      // 3) Open the selected mode
      openPanel(mode, reason(`open(${SP_COIN_DISPLAY[mode]})`));

      // 4) If choosing a pending mode, ensure the "Pending Rewards by Account Type" group is expanded
      const isPendingMode =
        mode === SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS ||
        mode === SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS ||
        mode === SP_COIN_DISPLAY.PENDING_AGENT_REWARDS;

      if (isPendingMode && !pendingVisible) {
        openPanel(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, reason('open(MANAGE_PENDING_REWARDS)'));
      }
    },
    [openPanel, closePanel, pendingVisible],
  );

  /**
   * Pending row right-click opens the group (and the Pending row disappears).
   */
  const onOpenRewardsByAccountType = useCallback(() => {
    if (!pendingVisible) {
      autoRoleRewardEstimateKeyRef.current = '';
      openPanel(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, 'ManageSponsorshipsPanel:onOpenRewardsByAccountType(open)');
    }
  }, [pendingVisible, openPanel]);

  /**
   * Pending Rewards by Account Type row closes the group (and Pending row reappears).
   */
  const onCloseRewardsByAccountType = useCallback(() => {
    if (pendingVisible) {
      autoTotalRewardEstimateKeyRef.current = '';
      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:onCloseRewardsByAccountType(close)',
      );
    }
  }, [pendingVisible, closePanel]);

  if (!isActive) return null;

  const showSummaryTable = true;
  const col1NoWrap = 'whitespace-nowrap';

  // ✅ ensures Staked/Pending buttons align exactly like Trading's tdInner5
  const leftAlignedLinkBtn = 'block w-full text-left m-0 p-0';

  // ✅ removed vertical white column lines
  const vLine = '';

  // ✅ left-aligned amount content (0.0)
  const amountLeft = 'w-full flex items-center justify-start';

  // ✅ enforce col0 width everywhere it matters
  const col0Style: React.CSSProperties = { width: COL_0_WIDTH, minWidth: COL_0_WIDTH, maxWidth: COL_0_WIDTH };

  /**
   * Pending + group header share same styling
   */
  const pendingRowBg = msTableTw.rowA;
  const pendingCellTw = `${pendingRowBg} ${msTableTw.td5} ${vLine}`;
  const pendingTextTw = 'text-white';
  const pendingBtnTw = `${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap} ${leftAlignedLinkBtn} ${pendingTextTw}`;

  return (
    <div id="MANAGE_SPONSORSHIPS_PANEL">
      {pendingVisible && (
        <div id="MANAGE_PENDING_REWARDS" className="hidden" aria-hidden="true" />
      )}
      <div className="mb-0">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect
              callingParent="ManageSponsorshipsPanel"
              defaultAddress={defaultAddr}
              bypassDefaultFsm
              useActiveAddr
              shortAddr
              preText="Deposit Account:"
              showAccount={false}
            />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      {showSummaryTable && (
        <div className={`${msTableTw.wrapper} !mt-0 mt-0 mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto`}>
          <table id="MANAGE_SPONSORSHIPS_TABLE" className={`${msTableTw.table} table-fixed min-w-full`}>
            <colgroup>
              <col style={{ width: COL_0_WIDTH }} />
              <col />
              <col />
            </colgroup>

            <thead>
              <tr className={msTableTw.theadRow}>
                <th scope="col" style={col0Style} className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${vLine}`}>
                  SpCoins
                </th>

                <th scope="col" className={`${msTableTw.th} ${msTableTw.thPad3} text-center ${vLine}`}>
                  Amount
                </th>

                <th scope="col" className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit}`}>
                  Options
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Trading */}
              <tr className={msTableTw.rowBorder}>
                <td style={col0Style} className={`${msTableTw.rowA} ${msTableTw.td5} ${vLine}`}>
                  <div className={`${msTableTw.tdInner5} ${col1NoWrap}`} title="SpCoins Available for Staking/Trading">
                    Trading
                  </div>
                </td>

                <td className={`${msTableTw.rowA} ${msTableTw.td} ${vLine}`}>
                  <div className={amountLeft}>{tradingAmountDisplay}</div>
                </td>

                <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                  <div className={msTableTw.tdInnerCenter5}>
                    <button
                      type="button"
                      className={msTableTw.btnOrange}
                      onClick={() => openOverlay(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL)}
                      aria-label="Open Trading Coins config"
                      title="Stake New Sponsorships"
                    >
                      Stake
                    </button>
                  </div>
                </td>
              </tr>

              {/* Staked */}
              <tr className={msTableTw.rowBorder}>
                <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                  <button
                    type="button"
                    className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap} ${leftAlignedLinkBtn}`}
                    onClick={() => openRewardsMode(SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS)}
                    aria-label="Open Staked list"
                    title="Manage SpCoin Staking Contracts."
                  >
                    Staked
                  </button>
                </td>

                <td className={`${msTableTw.rowB} ${msTableTw.td} ${vLine}`}>
                  <div className={amountLeft}>{stakedAmountDisplay}</div>
                </td>

                <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                  <div className={msTableTw.tdInnerCenter5}>
                    <button
                      type="button"
                      className={msTableTw.btnGreen}
                      onClick={unstakeAllSponsorships}
                      aria-label="Unstake All Sponsorships"
                      title="Unstake All Sponsorships"
                    >
                      Unstake
                    </button>
                  </div>
                </td>
              </tr>

              {/* Pending row (shown ONLY when group is CLOSED) */}
              {!pendingVisible && (
                <tr className={msTableTw.rowBorder}>
                  <td style={col0Style} className={pendingCellTw}>
                    <button
                      type="button"
                      className={pendingBtnTw}
                      onClick={() => void runTotalRewardAction('estimate')}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onOpenRewardsByAccountType();
                      }}
                      aria-label="Estimate total pending rewards"
                      title="Right Click to Expand"
                    >
                      Pending
                    </button>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td} ${vLine}`}>
                    <div className={amountLeft} title={totalReward.error}>
                      {pendingTotalAmountDisplay}
                    </div>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <button
                        type="button"
                        className={`${msTableTw.btnGreen} disabled:cursor-not-allowed disabled:opacity-45`}
                        aria-label="Claim all Sponsorship rewards"
                        onClick={() => void runTotalRewardAction('claim')}
                        title="Claim all Pending Rewards"
                        disabled={totalReward.loading || !activeContractAddr || !activeAccountAddr}
                      >
                        {totalReward.loading && totalReward.action === 'claim' ? '...' : 'Claim All'}
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Pending Rewards by Account Type row (shown ONLY when group is OPEN) */}
              {pendingVisible && (
                <tr className={msTableTw.rowBorder}>
                  <td style={col0Style} className={pendingCellTw}>
                    <button
                      type="button"
                      className={pendingBtnTw}
                      onClick={() => void runAvailableRoleRewardEstimates()}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onCloseRewardsByAccountType();
                      }}
                      aria-label="Estimate pending rewards by account type"
                      title="Left Click to Estimate Roles. Right Click to Collapse"
                    >
                      Pending Rewards by Account Type
                    </button>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td} ${vLine}`}>
                    <div className={amountLeft} />
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5} />
                  </td>
                </tr>
              )}

              {/* Sponsor/Recipient/Agent group rows (shown ONLY when group is OPEN) */}
              {pendingVisible && (
                <>
                  {rewardRows.map((row, index) => {
                    const rowBg = index % 2 === 0 ? msTableTw.rowB : msTableTw.rowA;
                    const claimButtonClass = index % 2 === 0 ? msTableTw.btnOrange : msTableTw.btnGreen;
                    const labelClass = row.available ? 'text-white' : 'text-red-500';
                    const title = row.available
                      ? `Estimate ${row.role} pending rewards`
                      : `${row.role} rewards are not available for this account.`;

                    return (
                      <tr key={row.role} className={msTableTw.rowBorder}>
                        <td style={col0Style} className={`${rowBg} ${msTableTw.td5} ${vLine}`}>
                          <button
                            type="button"
                            className={`${msTableTw.tdInner5} ${row.available ? msTableTw.linkCell5 : 'cursor-default'} ${col1NoWrap} ${labelClass}`}
                            onClick={() => {
                              if (row.available) void runRewardAction(row.role, 'estimate');
                            }}
                            aria-label={`Estimate ${row.role} rewards`}
                            disabled={!row.available || row.loading}
                            title={title}
                          >
                            <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                            {row.role}
                          </button>
                        </td>

                        <td className={`${rowBg} ${msTableTw.td} ${vLine}`}>
                          <div className={`${amountLeft} ${row.available ? '' : 'text-red-500'}`} title={row.error || undefined}>
                            {row.error ? 'Error' : row.amount}
                          </div>
                        </td>

                        <td className={`${rowBg} ${msTableTw.td5}`}>
                          <div className={msTableTw.tdInnerCenter5}>
                            <button
                              type="button"
                              className={`${claimButtonClass} disabled:cursor-not-allowed disabled:opacity-45`}
                              aria-label={`Claim ${row.role} rewards`}
                              onClick={() => {
                                if (row.available) void runRewardAction(row.role, 'claim');
                              }}
                              disabled={!row.available || row.loading}
                              title={row.available ? `Claim ${row.role} rewards` : `${row.role} rewards are not available for this account.`}
                            >
                              Claim
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}

              {/* Total (2 columns; col2 spans Amount+Options) */}
              {(() => {
                const zebra = pendingVisible ? msTableTw.rowA : msTableTw.rowB;

                return (
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${zebra} ${msTableTw.td5} ${vLine}`}>
                      <div className={`${msTableTw.tdInner5} ${col1NoWrap}`} title="Total Available SpCoins">
                        Total Coins
                      </div>
                    </td>

                    <td colSpan={2} className={`${zebra} ${msTableTw.td}`}>
                      <div className={amountLeft}>{totalCoinsDisplay}</div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-[#2d3654] bg-[#111827] px-2 py-1">
            <label className="inline-flex cursor-pointer items-center gap-1 text-[10px] leading-tight text-[#94a3b8]">
              <input
                type="checkbox"
                checked={traceEnabled}
                onChange={(event) => setTraceEnabled(event.target.checked)}
                className="h-3 w-3 accent-[#6f86f7]"
              />
              Trace
            </label>
          </div>
          {traceEnabled && accountRecordTrace && (
            <div
              className="px-2 py-1 text-[10px] leading-tight text-[#94a3b8] bg-[#111827] border-t border-[#2d3654] break-all"
              title="Manage Sponsorships getAccountRecord trace. Full object is also available at window.__manageSponsorshipsTrace."
            >
              TRACE phase={accountRecordTrace.phase}; mode={accountRecordTrace.readMode}; source={accountRecordTrace.accessSource};
              appChainId={String(accountRecordTrace.appChainId ?? '')}; chainId={String(accountRecordTrace.chainId ?? '')};
              decimals={String(accountRecordTrace.decimals ?? '')}; decimalsSource={accountRecordTrace.decimalsSource ?? 'none'};
              contract={accountRecordTrace.activeContractAddr || 'none'}; sellToken={accountRecordTrace.sellTokenAddr || 'none'};
              symbol={accountRecordTrace.networkSymbol || 'none'}; status={String(accountRecordTrace.httpStatus ?? '')};
              success={String(accountRecordTrace.firstSuccess ?? '')}; balanceOf={accountRecordTrace.rawBalanceOf ?? 'none'};
              stakedBalance={accountRecordTrace.rawStakedBalance ?? 'none'}; error={accountRecordTrace.errorMessage ?? 'none'}
            </div>
          )}
          {traceEnabled && totalReward.trace && (
            <div
              className="px-2 py-1 text-[10px] leading-tight text-[#94a3b8] bg-[#111827] border-t border-[#2d3654] break-all"
              title="Manage Sponsorships total rewards trace."
            >
              TRACE totalRewards; {totalReward.trace}; error={totalReward.error ?? 'none'}
            </div>
          )}
        </div>
      )}

      {showToDo && (
        <ToDo show message="ToDo" opacity={0.5} color="#ff1a1a" zIndex={2000} onDismiss={() => doToDo()} />
      )}
    </div>
  );
}
