'use client';

import { useCallback, useEffect } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import {
  CONTAINER_TYPE,
  InputState,
  TokenContract,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';
import BaseModalDialog from './BaseModalDialog';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('ScrollPanelContext', DEBUG_ENABLED, LOG_TIME);

interface BaseProps {
  setShowDialog: (show: boolean) => void;
  onSelect: (item: ValidatedAsset, state: InputState) => void;
  title: string;
  inputPlaceholder: string;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
  containerType: CONTAINER_TYPE;
}

export default function AssetSelectScrollContainer({
  setShowDialog,
  onSelect,
  title,
  inputPlaceholder,
  duplicateMessage,
  showDuplicateCheck = false,
  containerType,
}: BaseProps) {
  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollContainer mounted`);
    debugLog.log(`📦 containerType = ${containerType}`);
  }, [containerType]);

  const handleSelect = useCallback(
    (item: ValidatedAsset, state: InputState) => {
      const stateStr = getInputStateString(state);
      debugLog.log(`🎯 handleSelect called with state=${stateStr}`);
      debugLog.log(`📦 item = ${stringifyBigInt(item)}`);

      if (state === InputState.CLOSE_SELECT_INPUT) {
        debugLog.log(`✅ onSelect forwarding CLOSE_SELECT_INPUT`);
        onSelect(item, state);
      }
    },
    [onSelect]
  );

  return (
    <SharedPanelProvider containerType={containerType} onSelect={handleSelect}>
      <BaseModalDialog id="AssetSelectScrollContainer" title={title}>
        <AddressSelect />
      </BaseModalDialog>
    </SharedPanelProvider>
  );
}
