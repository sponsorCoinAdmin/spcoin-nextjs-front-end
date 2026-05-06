export type ExecutionPayloadRecord = Record<string, unknown>;

type OnChainSummary = {
  method: string;
  totalOnChainMs: number;
  totalGasUsed?: bigint;
  totalGasPriceWei?: bigint;
  totalFeePaidWei?: bigint;
  totalFeePaidEth?: number;
};

function toNumberValue(value: unknown): number {
  const parsed = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBigIntValue(value: unknown): bigint {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  return /^\d+$/.test(normalized) ? BigInt(normalized) : 0n;
}

function getCallMethod(value: unknown, fallback = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const call = (value as ExecutionPayloadRecord).call;
  if (!call || typeof call !== 'object' || Array.isArray(call)) return fallback;
  return String((call as ExecutionPayloadRecord).method || fallback).trim();
}

function getOnChainLocalSummary(onChainCalls: ExecutionPayloadRecord, method: string): OnChainSummary {
  const calls = Array.isArray(onChainCalls.calls) ? (onChainCalls.calls as ExecutionPayloadRecord[]) : [];
  const summary: OnChainSummary = {
    method,
    totalOnChainMs: calls.reduce((sum, entry) => sum + toNumberValue(entry.onChainRunTimeMs), 0),
  };
  let gasUsed = 0n;
  let gasPriceWei = 0n;
  let feePaidWei = 0n;
  let feePaidEth = 0;
  for (const entry of calls) {
    gasUsed += toBigIntValue(entry.gasUsed);
    gasPriceWei += toBigIntValue(entry.gasPriceWei);
    feePaidWei += toBigIntValue(entry.feePaidWei);
    feePaidEth += toNumberValue(entry.feePaidEth);
  }
  if (gasUsed > 0n) summary.totalGasUsed = gasUsed;
  if (gasPriceWei > 0n) summary.totalGasPriceWei = gasPriceWei;
  if (feePaidWei > 0n) summary.totalFeePaidWei = feePaidWei;
  if (feePaidEth > 0) summary.totalFeePaidEth = feePaidEth;
  return summary;
}

function getOnChainInclusiveSummary(value: unknown, fallbackMethod: string): OnChainSummary | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as ExecutionPayloadRecord;
  const onChainCalls = record.onChainCalls;
  if (!onChainCalls || typeof onChainCalls !== 'object' || Array.isArray(onChainCalls)) return null;
  const oc = onChainCalls as ExecutionPayloadRecord;
  const method = getCallMethod(record, fallbackMethod);
  const summary: OnChainSummary = {
    method,
    totalOnChainMs: toNumberValue(oc.totalOnChainMs),
  };
  const gasUsed = toBigIntValue(oc.totalGasUsed);
  const gasPriceWei = toBigIntValue(oc.totalGasPriceWei);
  const feePaidWei = toBigIntValue(oc.totalFeePaidWei);
  const feePaidEth = toNumberValue(oc.totalFeePaidEth);
  if (gasUsed > 0n) summary.totalGasUsed = gasUsed;
  if (gasPriceWei > 0n) summary.totalGasPriceWei = gasPriceWei;
  if (feePaidWei > 0n) summary.totalFeePaidWei = feePaidWei;
  if (feePaidEth > 0) summary.totalFeePaidEth = feePaidEth;
  return summary;
}

function collectImmediateChildOnChainSummaries(value: unknown): OnChainSummary[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => {
      const direct = getOnChainInclusiveSummary(entry, String(index));
      return direct ? [direct] : collectImmediateChildOnChainSummaries(entry);
    });
  }
  const record = value as ExecutionPayloadRecord;
  const summaries: OnChainSummary[] = [];
  for (const [key, child] of Object.entries(record)) {
    if (['call', 'meta', 'onChainCalls'].includes(key)) continue;
    const direct = getOnChainInclusiveSummary(child, key);
    if (direct) {
      summaries.push(direct);
    } else {
      summaries.push(...collectImmediateChildOnChainSummaries(child));
    }
  }
  return summaries;
}

function formatSummaryEntry(summary: OnChainSummary) {
  return {
    method: summary.method,
    totalOnChainMs: summary.totalOnChainMs,
    ...(summary.totalGasUsed && summary.totalGasUsed > 0n ? { totalGasUsed: summary.totalGasUsed.toLocaleString('en-US') } : {}),
    ...(summary.totalGasPriceWei && summary.totalGasPriceWei > 0n ? { totalGasPriceWei: summary.totalGasPriceWei.toLocaleString('en-US') } : {}),
    ...(summary.totalFeePaidWei && summary.totalFeePaidWei > 0n ? { totalFeePaidWei: summary.totalFeePaidWei.toLocaleString('en-US') } : {}),
    ...(summary.totalFeePaidEth && summary.totalFeePaidEth > 0 ? { totalFeePaidEth: String(summary.totalFeePaidEth) } : {}),
  };
}

export function aggregateOnChainCallsDeep(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((entry) => aggregateOnChainCallsDeep(entry));
  const record = value as ExecutionPayloadRecord;
  const nextRecord = Object.fromEntries(
    Object.entries(record).map(([key, entryValue]) => [
      key,
      key === 'onChainCalls' || key === 'meta' || key === 'call' ? entryValue : aggregateOnChainCallsDeep(entryValue),
    ]),
  ) as ExecutionPayloadRecord;
  const meta = nextRecord.meta;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const metaRecord = meta as ExecutionPayloadRecord;
    if (metaRecord.onChainCalls) {
      const { onChainCalls, ...metaWithoutOnChainCalls } = metaRecord;
      nextRecord.meta = metaWithoutOnChainCalls;
      if (!nextRecord.onChainCalls) {
        nextRecord.onChainCalls = onChainCalls;
      }
    }
  }
  if (!nextRecord.onChainCalls || typeof nextRecord.onChainCalls !== 'object' || Array.isArray(nextRecord.onChainCalls)) {
    return nextRecord;
  }
  const oc = nextRecord.onChainCalls as ExecutionPayloadRecord;
  const method = getCallMethod(nextRecord, '');
  const local = getOnChainLocalSummary(oc, method);
  const childSummaries = collectImmediateChildOnChainSummaries(nextRecord);
  const totalMs = local.totalOnChainMs + childSummaries.reduce((sum, entry) => sum + entry.totalOnChainMs, 0);
  const totalGasUsed = (local.totalGasUsed ?? 0n) + childSummaries.reduce((sum, entry) => sum + (entry.totalGasUsed ?? 0n), 0n);
  const totalGasPriceWei = (local.totalGasPriceWei ?? 0n) + childSummaries.reduce((sum, entry) => sum + (entry.totalGasPriceWei ?? 0n), 0n);
  const totalFeePaidWei = (local.totalFeePaidWei ?? 0n) + childSummaries.reduce((sum, entry) => sum + (entry.totalFeePaidWei ?? 0n), 0n);
  const totalFeePaidEth = (local.totalFeePaidEth ?? 0) + childSummaries.reduce((sum, entry) => sum + (entry.totalFeePaidEth ?? 0), 0);
  nextRecord.onChainCalls = {
    ...oc,
    ...(childSummaries.length > 0 ? { childOnChainCalls: childSummaries.map(formatSummaryEntry) } : {}),
    totalOnChainMs: totalMs,
    ...(totalGasUsed > 0n ? { totalGasUsed: totalGasUsed.toLocaleString('en-US') } : {}),
    ...(totalGasPriceWei > 0n ? { totalGasPriceWei: totalGasPriceWei.toLocaleString('en-US') } : {}),
    ...(totalFeePaidWei > 0n ? { totalFeePaidWei: totalFeePaidWei.toLocaleString('en-US') } : {}),
    ...(totalFeePaidEth > 0 ? { totalFeePaidEth: String(totalFeePaidEth) } : {}),
  };
  if (childSummaries.length === 0) {
    delete (nextRecord.onChainCalls as ExecutionPayloadRecord).childOnChainCalls;
  }
  return nextRecord;
}

export function normalizeExecutionPayload<T>(payload: T): T {
  return aggregateOnChainCallsDeep(payload) as T;
}
