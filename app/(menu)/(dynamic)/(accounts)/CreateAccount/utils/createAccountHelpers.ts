import type { AccountFormData, AccountFormField } from '../types';
import {
  DEFAULT_ACCOUNT_LOGO_URL,
  FIELD_MAX_LENGTHS,
} from './createAccountConstants';

export function normalizeAddress(value: string): string {
  return `0x${String(value).replace(/^0[xX]/, '').toLowerCase()}`;
}

export function ensureAbsoluteAssetURL(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return DEFAULT_ACCOUNT_LOGO_URL;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('assets/')) return `/${trimmed}`;
  return trimmed;
}

export function withCacheBust(value: string): string {
  const url = String(value ?? '').trim();
  if (!url) return url;
  const hasQuery = url.includes('?');
  const sep = hasQuery ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidWebsite(value: string): boolean {
  if (!value) return true;
  if (value.startsWith('/assets/') || value.startsWith('assets/')) return true;
  try {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
      ? value
      : `https://${value}`;
    const url = new URL(candidate);
    const hostname = String(url.hostname || '').toLowerCase();
    const hasDot = hostname.includes('.');
    return /^https?:$/i.test(url.protocol) && hasDot;
  } catch {
    return false;
  }
}

export function toPreviewHref(
  field: keyof AccountFormData,
  rawValue: string,
): string | null {
  const value = String(rawValue ?? '').trim();
  if (!value) return null;

  if (field === 'email') {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return emailOk ? `mailto:${value}` : null;
  }

  if (field === 'website') {
    if (value.startsWith('/assets/')) return value;
    if (value.startsWith('assets/')) return `/${value}`;
    try {
      const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
        ? value
        : `https://${value}`;
      const url = new URL(candidate);
      const hostname = String(url.hostname || '').toLowerCase();
      const hasDot = hostname.includes('.');
      if (!/^https?:$/i.test(url.protocol) || !hasDot) return null;
      return candidate;
    } catch {
      return null;
    }
  }

  return null;
}

export function getAbsoluteFieldError(
  field: AccountFormField,
  rawValue: string,
): string | null {
  const raw = String(rawValue ?? '');
  if (field === 'name' && raw.length > 50) return 'Name too large';
  if (field === 'symbol' && raw.length > 10) return 'Symbol too large';
  return null;
}

export function getFieldTooLargeMessage(field: AccountFormField): string | null {
  if (field === 'name') return 'Name too large';
  if (field === 'symbol') return 'Symbol too large';
  if (field === 'email') return 'Email too large';
  if (field === 'website') return 'Website too large';
  if (field === 'description') return 'Description too large';
  return null;
}

export function shouldBlockAdditionalInput(
  field: AccountFormField,
  currentRawValue: string,
  nextRawValue: string,
): boolean {
  const maxLen = FIELD_MAX_LENGTHS[field];
  if (!maxLen) return false;
  const currentLen = String(currentRawValue ?? '').length;
  const nextLen = String(nextRawValue ?? '').length;
  if (currentLen > maxLen) return nextLen >= currentLen;
  return nextLen > maxLen;
}

let textMeasureCtx: CanvasRenderingContext2D | null = null;

export function shouldOpenLinkFromInputClick(
  input: HTMLInputElement,
  value: string,
  event: React.MouseEvent<HTMLInputElement>,
): boolean {
  const raw = String(value ?? '');
  if (!raw) return false;

  const style = window.getComputedStyle(input);
  const paddingLeft = parseFloat(style.paddingLeft || '0') || 0;
  const paddingRight = parseFloat(style.paddingRight || '0') || 0;
  const font = style.font || `${style.fontSize} ${style.fontFamily}`;

  if (!textMeasureCtx) {
    textMeasureCtx = document.createElement('canvas').getContext('2d');
  }
  const ctx = textMeasureCtx;
  if (!ctx) return false;
  ctx.font = font;

  const measured = ctx.measureText(raw).width;
  const textWidth = Math.min(
    measured,
    Math.max(0, input.clientWidth - paddingLeft - paddingRight),
  );

  const rect = input.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  return clickX >= paddingLeft && clickX <= paddingLeft + textWidth;
}

export function trimForm(data: AccountFormData): AccountFormData {
  return {
    name: data.name.trim(),
    symbol: data.symbol.trim(),
    email: data.email.trim(),
    website: data.website.trim(),
    description: data.description.trim(),
  };
}
