import type { LabScript } from './types';

export function formatScriptCreatedDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day}-${year}, ${hours}:${minutes}:${seconds}`;
}

export function inferScriptCreatedDate(script: Pick<LabScript, 'id'> & Partial<Record<'Date Created', unknown>>) {
  const existing = String(script['Date Created'] || '').trim();
  if (existing) return existing;

  const timestampMatch = /^script-(\d+)-/.exec(String(script.id || '').trim());
  const parsedTimestamp = timestampMatch ? Number(timestampMatch[1]) : Number.NaN;
  return Number.isFinite(parsedTimestamp) ? formatScriptCreatedDate(parsedTimestamp) : formatScriptCreatedDate(new Date());
}

export function buildDefaultScriptName(index: number) {
  return `Script ${index}`;
}
