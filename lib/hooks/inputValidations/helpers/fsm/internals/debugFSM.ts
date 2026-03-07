// File: @/lib/hooks/inputValidations/helpers/fsm/internals/debugFSM.ts
'use client';

import { InputState } from '@/lib/structure/assetSelection';
import { FEED_TYPE } from '@/lib/structure';

export function getStateIcon(state: InputState): string {
  switch (state) {
    case InputState.EMPTY_INPUT: return '🕳️';
    case InputState.INVALID_HEX_INPUT: return '🚫';
    case InputState.VALIDATE_ADDRESS: return '📬';
    case InputState.INCOMPLETE_ADDRESS: return '✂️';
    case InputState.INVALID_ADDRESS_INPUT: return '❓';
    case InputState.TEST_DUPLICATE_INPUT: return '🧪';
    case InputState.DUPLICATE_INPUT_ERROR: return '❌';
    case InputState.VALIDATE_PREVIEW: return '🖼️';
    case InputState.VALIDATE_LOCAL_NATIVE_TOKEN: return '📁';
    case InputState.VALIDATE_EXISTS_ON_CHAIN: return '🛰️';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN: return '📵';
    case InputState.RESOLVE_ERC20_ASSET: return '📊';
    case InputState.VALIDATE_ERC20_ASSET_ERROR: return '❗';
    case InputState.MISSING_ACCOUNT_ADDRESS: return '🙈';
    case InputState.RETURN_VALIDATED_ASSET: return '✅';
    case InputState.CLOSE_SELECT_PANEL: return '🔒';
    default: return '➖';
  }
}

/** Build a list of FEED_TYPE enum names (ignore numeric reverse mapping). */
function getFeedNames(): string[] {
  return Object.keys(FEED_TYPE).filter((k) => isNaN(Number(k)));
}

/** Remove any FEED_TYPE token (e.g., TOKEN_LIST) if it appears in a header (prefix/suffix). */
function stripFeedTokens(line: string): string {
  const feeds = getFeedNames();
  if (!feeds.length) return line;

  const feedAlt = feeds.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  // Suffix: " TOKEN_LIST" or " • TOKEN_LIST"
  const suffixRe = new RegExp(`\\s*(?:•\\s*)?(?:${feedAlt})\\s*$`);
  // Prefix right after emoji: "🧮 TOKEN_LIST "
  const prefixRe = new RegExp(`^(\\s*🧮\\s*)(?:${feedAlt})\\s+`);

  let out = line.replace(suffixRe, '');
  out = out.replace(prefixRe, '$1');
  return out;
}

/**
 * Formats a trace of InputState transitions.
 * If `opts.header` is provided, it's sanitized to strip any FEED_TYPE tokens and prepended.
 */
export function formatTrace(
  trace: InputState[],
  opts?: { header?: string; withSeparator?: boolean }
): string {
  if (!trace?.length) {
    // If header requested, still show it (sanitized) even if no trace lines.
    if (opts?.header) {
      const header = stripFeedTokens(opts.header);
      return opts?.withSeparator ? `${sepLine()}\n${header}` : header;
    }
    return 'No FSM trace found.';
  }

  const collapsed: InputState[] = [];
  for (let i = 0; i < trace.length; i++) {
    const s = trace[i];
    if (i === 0 || s !== trace[i - 1]) collapsed.push(s);
  }

  const lines: string[] = [];
  for (let i = 0; i < collapsed.length; i++) {
    const s = collapsed[i];
    const color = i === 0 ? '🟢' : '🟡';
    const isLast = i === collapsed.length - 1;
    lines.push(
      `${color} ${getStateIcon(s)} ${InputState[s]}(${s})${isLast ? '' : ' →'}`,
    );
  }

  // Optional sanitized header
  if (opts?.header) {
    const header = stripFeedTokens(opts.header);
    return opts?.withSeparator ? `${sepLine()}\n${header}\n${lines.join('\n')}` : `${header}\n${lines.join('\n')}`;
  }

  return lines.join('\n');
}

/** Local separator so this file is self-contained. */
function sepLine() {
  return '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
}
