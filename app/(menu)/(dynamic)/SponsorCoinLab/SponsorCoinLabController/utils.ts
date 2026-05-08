import {
  setSpCoinLabAbi,
} from '../jsonMethods/shared/spCoinAbi';

export const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
export const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.28rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
export const actionButtonStyle =
  'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60';
export const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';
export const hiddenScrollbarClass =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
export const SP_COIN_LAB_STORAGE_KEY = 'spCoinLabKey';

export async function refreshSponsorCoinLabAbi() {
  const response = await fetch('/api/spCoin/abi', { cache: 'no-store' });
  const payload = (await response.json()) as { ok?: boolean; abi?: unknown[] };
  if (!response.ok || payload?.ok === false || !Array.isArray(payload?.abi)) {
    throw new Error('Unable to refresh SPCoin ABI.');
  }
  setSpCoinLabAbi(payload.abi);
  return payload.abi.length;
}

export function normalizeAddressValue(value: string) {
  const trimmed = String(value || '').trim();
  return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
}

export function parseListParam(raw: string): string[] {
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

export function buildDefaultAccountParams(
  params: Array<{ label: string }>,
  defaults: {
    sender?: string;
    sponsor: string;
    recipient: string;
    agent: string;
    recipientRate?: string;
    agentRate?: string;
    previousReleaseDir?: string;
    latestReleaseDir?: string;
  },
) {
  return params.map((param) => {
    const label = String(param.label || '').toLowerCase();
    const sender = String(defaults.sender || defaults.sponsor || '').trim();
    if (label === 'hhfunding account') return defaults.sponsor;
    if (label === 'fund all hardhat accounts') return 'true';
    if (label === 'fund hh account') return defaults.recipient;
    if (label === 'msg.sender') return sender;
    if (label.includes('sponsor')) return defaults.sponsor;
    if (label.includes('recipient rate')) return String(defaults.recipientRate || '');
    if (label.includes('recipient') && !label.includes('rate')) return defaults.recipient;
    if (label.includes('agent rate')) return String(defaults.agentRate || '');
    if (label.includes('agent') && !label.includes('rate')) return defaults.agent;
    if (label === 'account key') return defaults.sponsor;
    if (label === 'previous release directory') return String(defaults.previousReleaseDir || '');
    if (label === 'latest release directory') return String(defaults.latestReleaseDir || '');
    return '';
  });
}

export function normalizeParamLabel(value: string) {
  return String(value || '').trim().toLowerCase();
}

export { isAddressLike, isIntegerString };

export function isDefinedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function hasNonZeroRateRangeTuple(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1])) &&
    (Number(value[0]) !== 0 || Number(value[1]) !== 0)
  );
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
  const DATE_TIME_KEYS = ['creationTime', 'creationDate', 'Date Created', 'lastUpdateTime', 'updateTime', 'insertionTime'];
  const DURATION_KEYS = ['methodRunTime', 'runtime', 'duration'];
  const parseScriptCreatedDate = (input: string): string | null => {
    const normalized = input.trim().replace(/_/g, ' ');
    const match = normalized.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/i,
    );
    if (!match) return null;
    const [, monthText, dayText, yearText, hourText, minuteText, secondText = '00'] = match;
    const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(
      monthText.toLowerCase(),
    );
    if (monthIndex < 0) return null;
    const date = new Date(
      Number(yearText),
      monthIndex,
      Number(dayText),
      Number(hourText),
      Number(minuteText),
      Number(secondText),
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };
  const normalizeDisplayDateString = (input: string): string | null => {
    const trimmed = input.trim();
    const scriptCreatedDate = parseScriptCreatedDate(trimmed);
    if (scriptCreatedDate) return scriptCreatedDate;
    const normalized = trimmed.replace(/_/g, ' ');
    const match = normalized.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)(?:\s+([A-Z]{2,5}))?$/i,
    );
    if (!match) return null;

    const [, monthName, day, year, hourText, minute, , meridiem] = match;
    const monthMap: Record<string, string> = {
      january: 'JAN',
      february: 'FEB',
      march: 'MAR',
      april: 'APR',
      may: 'MAY',
      june: 'JUN',
      july: 'JUL',
      august: 'AUG',
      september: 'SEP',
      october: 'OCT',
      november: 'NOV',
      december: 'DEC',
    };
    const month = monthMap[monthName.toLowerCase()] || 'JAN';
    const normalizedDay = String(Number(day)).padStart(2, '0');
    const hour = String(Number(hourText));
    const normalizedMeridiem = meridiem.toUpperCase() === 'AM' ? 'a.m.' : 'p.m.';
    return `${month}-${normalizedDay}-${year}, ${hour}:${minute} ${normalizedMeridiem}`;
  };

  const normalizeLegacyDateObject = (input: unknown): string | null => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const entries = Object.entries(input as Record<string, unknown>);
    if (entries.length !== 1) return null;
    const [outerKey, outerValue] = entries[0];
    if (!outerValue || typeof outerValue !== 'object' || Array.isArray(outerValue)) return null;
    const innerEntries = Object.entries(outerValue as Record<string, unknown>);
    if (innerEntries.length !== 1) return null;
    const [minuteKey, secondValue] = innerEntries[0];
    if (typeof secondValue !== 'string') return null;
    return normalizeDisplayDateString(`${outerKey}:${minuteKey}:${secondValue}`);
  };

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
    const keyedEntries =
      normalizedEntries.length > 0 &&
      normalizedEntries.every((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
        const record = entry as Record<string, unknown>;
        const candidateKey = record.label ?? record.key;
        return typeof candidateKey === 'string' && 'value' in record;
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
    const normalizedLegacyDate = normalizeLegacyDateObject(value);
    if (normalizedLegacyDate && DATE_TIME_KEYS.includes(keyPath[keyPath.length - 1] || '')) {
      return normalizedLegacyDate;
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, formatOutputValue(entry, [...keyPath, key])]),
    );
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || isAddressLike(trimmed) || isHashLike(trimmed)) return value;
    if (keyPath.includes('meta')) return value;
    if (keyPath.includes('formatted')) return value;
    if (DURATION_KEYS.includes(keyPath[keyPath.length - 1] || '') && /^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (DATE_TIME_KEYS.includes(keyPath[keyPath.length - 1] || '')) {
      return normalizeDisplayDateString(trimmed) ?? value;
    }
    const normalizedDateString = normalizeDisplayDateString(trimmed);
    if (normalizedDateString) return normalizedDateString;
    if (keyPath.includes('error') || keyPath[keyPath.length - 1] === 'message') {
      const parsedError = parseStructuredErrorMessage(trimmed);
      return parsedError ?? value;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(trimmed)) {
      return value;
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

export function formatOutputDisplayValue(value: unknown) {
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
  return JSON.stringify(normalized, (_key, entry) => (typeof entry === 'bigint' ? entry.toString() : entry), 2);
}

export function buildMethodCallEntry(
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
