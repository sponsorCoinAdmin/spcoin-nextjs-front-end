'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback, useRef } from 'react';
import {
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
  CONTAINER_TYPE,
  getInputStateString,
} from '@/lib/structure';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { BaseSelectSharedState } from '@/lib/hooks/useBaseSelectShared';
import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ValidateAssetPreview from '@/components/shared/utils/sharedPreviews/ValidateAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('addressSelect', DEBUG_ENABLED, LOG_TIME);

interface AddressSelectProps<T extends TokenContract | WalletAccount> {
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  closeDialog: () => void;
  onSelect: (item: T, state: InputState) => void;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
  containerType?: CONTAINER_TYPE;
  sharedState: BaseSelectSharedState; // ✅ Accept shared state as prop
}

export default function AddressSelect<T extends TokenContract | WalletAccount>({
  feedType,
  inputPlaceholder,
  closeDialog,
  onSelect: onSelectProp,
  duplicateMessage,
  showDuplicateCheck = false,
  containerType,
  sharedState,
}: AddressSelectProps<T>) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    validateHexInput,
    getInputStatusEmoji,
  } = sharedState;

  const {
    inputState,
    validatedAsset,
    isLoading,
    setInputState,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState<T>(debouncedAddress, feedType, containerType);

  const manualEntryRef = useRef(false); // ✅ default false

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualEntryRef.current = false;
    };
  }, []);

  // ✅ Manual select from token preview
  const onManualSelect = useCallback((item: T) => {
    debugLog.log(`🧍‍♂️ onManualSelect():`, item);
    manualEntryRef.current = false;
    validateHexInput(item.address);
  }, [validateHexInput]);

  // ✅ Select from DataList
  const onDataListSelect = useCallback((item: T) => {
    debugLog.log(`📜 onDataListSelect():`, item);
    manualEntryRef.current = true;
    validateHexInput(item.address);
    alert(`🎯 onDataListSelect(): CHANGING Input State ${getInputStateString(inputState)}`);
     /* ToDo: Move to proper Location*/   setInputState(InputState.CLOSE_SELECT_INPUT);
     
  }, [validateHexInput]);

  // ✅ Promote VALID_INPUT → CLOSE_INPUT if manualEntry === true
  useEffect(() => {
    if (inputState === InputState.VALID_INPUT && manualEntryRef.current && validatedAsset) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_INPUT due to manual entry`);
      setInputState(InputState.CLOSE_SELECT_INPUT);
    }
  }, [inputState, validatedAsset, setInputState]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => {
          debugLog.log(`⌨️ onChange inputValue: ${val}`);
          manualEntryRef.current = false;
          onChange(val);
        }}
        placeholder={inputPlaceholder}
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      <RenderAssetPreview
        inputState={inputState}
        validatedAsset={validatedAsset}
        hasBrokenLogoURL={hasBrokenLogoURL}
        reportMissingLogoURL={reportMissingLogoURL}
        onSelect={onManualSelect}
      />

      <ValidateAssetPreview
        inputState={inputState}
        duplicateMessage={showDuplicateCheck ? duplicateMessage : undefined}
      />

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0 gap-[0.2rem]">
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList<T>
            dataFeedType={feedType}
            onSelect={onDataListSelect}
          />
        </div>
      </div>
    </div>
  );
}
