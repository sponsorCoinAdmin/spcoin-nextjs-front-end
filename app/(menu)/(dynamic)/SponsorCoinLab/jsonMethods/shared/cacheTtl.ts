export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const TTL_FORMAT_OPTIONS = ['MS', 'Seconds', 'mm:ss.ms', 'hh:mm:ss.ms', 'ddd:hh:mm:ss.ms'] as const;

export type TtlFormat = (typeof TTL_FORMAT_OPTIONS)[number];

export const DEFAULT_TTL_FORMAT: TtlFormat = 'hh:mm:ss.ms';

export function normalizeTtlFormat(value: unknown): TtlFormat {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'ms') return 'MS';
  if (text === 'seconds' || text === 'second' || text === 'sec' || text === 's') return 'Seconds';
  if (text === 'mm:ss.ms') return 'mm:ss.ms';
  if (text === 'hh:mm:ss.ms') return 'hh:mm:ss.ms';
  if (text === 'ddd:hh:mm:ss.ms') return 'ddd:hh:mm:ss.ms';
  return DEFAULT_TTL_FORMAT;
}

function parsePositiveNumber(value: unknown): number | undefined {
  const text = String(value ?? '').replace(/,/g, '').trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseSecondsWithMs(value: string): { seconds: number; ms: number } | null {
  const [secondsRaw, msRaw = '0'] = value.split('.');
  if (!/^\d+$/.test(secondsRaw || '') || !/^\d*$/.test(msRaw)) return null;
  const ms = msRaw ? Number(msRaw.slice(0, 3)) : 0;
  if (!Number.isFinite(ms) || ms < 0) return null;
  return { seconds: Number(secondsRaw), ms };
}

export function parseTtlMs(value: unknown, formatValue?: unknown): number {
  const text = String(value ?? '').trim();
  if (!text) return DEFAULT_CACHE_TTL_MS;

  const format = normalizeTtlFormat(formatValue);
  if (format === 'MS') {
    return Math.round(parsePositiveNumber(text) ?? DEFAULT_CACHE_TTL_MS);
  }
  if (format === 'Seconds') {
    return Math.round((parsePositiveNumber(text) ?? DEFAULT_CACHE_TTL_MS / 1000) * 1000);
  }

  const parts = text.split(':').map((part) => part.trim());
  const expectedParts = format === 'mm:ss.ms' ? 2 : format === 'hh:mm:ss.ms' ? 3 : 4;
  if (parts.length !== expectedParts) return DEFAULT_CACHE_TTL_MS;

  const secondsPart = parseSecondsWithMs(parts[parts.length - 1] || '');
  if (!secondsPart) return DEFAULT_CACHE_TTL_MS;

  const wholeParts = parts.slice(0, -1);
  if (wholeParts.some((part) => !/^\d+$/.test(part))) return DEFAULT_CACHE_TTL_MS;

  const wholeValues = wholeParts.map(Number);
  const [days, hours, minutes] =
    format === 'ddd:hh:mm:ss.ms'
      ? [wholeValues[0], wholeValues[1], wholeValues[2]]
      : format === 'hh:mm:ss.ms'
        ? [0, wholeValues[0], wholeValues[1]]
        : [0, 0, wholeValues[0]];

  return Math.round(
    (((days * 24 + hours) * 60 + minutes) * 60 + secondsPart.seconds) * 1000 + secondsPart.ms,
  );
}

function pad(value: number, size: number) {
  return String(Math.trunc(value)).padStart(size, '0');
}

export function formatTtlValue(ttlMs: number, formatValue?: unknown): string {
  const safeMs = Number.isFinite(ttlMs) && ttlMs >= 0 ? Math.round(ttlMs) : DEFAULT_CACHE_TTL_MS;
  const format = normalizeTtlFormat(formatValue);
  if (format === 'MS') return String(safeMs);
  if (format === 'Seconds') return String(safeMs / 1000);

  const ms = safeMs % 1000;
  const totalSeconds = Math.floor(safeMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  if (format === 'mm:ss.ms') {
    return `${Math.floor(totalSeconds / 60)}:${pad(seconds, 2)}.${pad(ms, 3)}`;
  }
  if (format === 'ddd:hh:mm:ss.ms') {
    return `${pad(days, 3)}:${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(ms, 3)}`;
  }
  return `${totalHours}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(ms, 3)}`;
}
