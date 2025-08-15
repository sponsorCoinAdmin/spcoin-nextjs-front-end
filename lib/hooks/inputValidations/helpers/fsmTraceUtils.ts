// File: lib/hooks/inputValidations/helpers/fsmTraceUtils.ts

import { InputState } from '@/lib/structure/assetSelection';

export const LOCAL_TRACE_KEY = 'latestFSMTrace';
export const LOCAL_TRACE_LINES_KEY = 'latestFSMTraceLines';

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
    case InputState.PREVIEW_ADDRESS: return '🔎';
    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY: return '📁';
    case InputState.VALIDATE_EXISTS_ON_CHAIN: return '🛰️';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN: return '📵';
    case InputState.RESOLVE_ASSET: return '📊';
    case InputState.TOKEN_NOT_RESOLVED_ERROR: return '❗';
    case InputState.RESOLVE_ASSET_ERROR: return '💥';
    case InputState.MISSING_ACCOUNT_ADDRESS: return '🙈';
    case InputState.UPDATE_VALIDATED_ASSET: return '✅';
    case InputState.CLOSE_SELECT_PANEL: return '🔒';
    default: return '➖';
  }
}

export function formatTrace(trace: InputState[]): string {
  if (!trace?.length) return 'No FSM trace found.';
  const lines: string[] = [];
  for (let i = 0; i < trace.length - 1; i++) {
    const from = trace[i];
    const to = trace[i + 1];
    if (from === to) continue;
    const icon = i === 0 ? '🟢' : '🟡';
    lines.push(`${icon} ${getStateIcon(from)} ${InputState[from]} → ${getStateIcon(to)} ${InputState[to]}`);
  }
  if (trace.length === 1) {
    lines.push(`🟢 ${getStateIcon(trace[0])} ${InputState[trace[0]]}`);
  }
  return lines.join('\n');
}
