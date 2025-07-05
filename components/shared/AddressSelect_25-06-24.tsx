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

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';

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
  sharedState: BaseSelectSharedState;
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
    setInputState,
    validatedAsset,
    setValidatedAsset,
    onSelect,
  } = useSharedPanelContext();

  const {
    validatedAsset: localValidatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState<T>(debouncedAddress, feedType, containerType);

  const manualEntryRef = useRef(false);

  useEffect(() => {
    return () => {
      manualEntryRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (localValidatedAsset && setValidatedAsset) {
      debugLog.log(`✅ Syncing validated asset to context`, localValidatedAsset);
      setValidatedAsset(localValidatedAsset);
    }
  }, [localValidatedAsset, setValidatedAsset]);

  const onManualSelect = useCallback((item: T) => {
    debugLog.log(`🧍‍♂️ onManualSelect():`, item);
    manualEntryRef.current = false;
    validateHexInput(item.address);
  }, [validateHexInput]);

  const onDataListSelect = useCallback((item: T) => {
  debugLog.log(`📜 onDataListSelect():`, item);
  manualEntryRef.current = true;
  validateHexInput(item.address);

  // NEW: wait a tick then force close if validatedAsset is already set
  setTimeout(() => {
    if (validatedAsset && onSelect) {
      debugLog.log(`✅ Forcing CLOSE_SELECT_INPUT via onDataListSelect`, validatedAsset);
      onSelect(validatedAsset, InputState.CLOSE_SELECT_INPUT);
      setInputState(InputState.CLOSE_SELECT_INPUT);
    }
  }, 0);
}, [validateHexInput, validatedAsset, onSelect, setInputState]);


  useEffect(() => {
    if (
      inputState === InputState.VALID_INPUT &&
      manualEntryRef.current &&
      validatedAsset &&
      onSelect
    ) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_INPUT due to manual entry`);
      onSelect(validatedAsset, InputState.CLOSE_SELECT_INPUT);
      setInputState(InputState.CLOSE_SELECT_INPUT);
    }
  }, [inputState, validatedAsset, setInputState, onSelect]);

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
        validatedAsset={validatedAsset as T}
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
