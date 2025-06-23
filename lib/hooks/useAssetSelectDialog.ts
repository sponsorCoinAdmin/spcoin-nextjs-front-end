// File: lib/hooks/useAssetSelectDialog.ts

'use client';

import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';

export function useAssetSelectDialog<T>(
  label: string,
  onSelect: (item: T, state: InputState) => void
) {
  const debugLog = createDebugLogger(label, DEBUG_ENABLED, LOG_TIME);

  const handleSelect = (item: T, state: InputState) => {
    debugLog.log(`✅ [${label}] selected item`, item);
    if (state === InputState.CLOSE_INPUT) {
      onSelect(item, state);
    }
  };

  return { handleSelect, debugLog };
}
