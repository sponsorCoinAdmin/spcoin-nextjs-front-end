'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback, useRef } from 'react';
import { InputState } from '@/lib/structure';
import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ValidateAssetPreview from '@/components/shared/utils/sharedPreviews/ValidateAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('addressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    validateHexInput,
    getInputStatusEmoji,
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    onSelect,
    feedType,
  } = useSharedPanelContext();

  const {
    validatedAsset: localValidatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

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

  const onManualSelect = useCallback((item: ValidatedAsset) => {
    debugLog.log(`🧍‍♂️ onManualSelect():`, item);
    manualEntryRef.current = false;
    validateHexInput(item.address);
  }, [validateHexInput]);

  const onDataListSelect = useCallback((item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect():`, item);
    manualEntryRef.current = true;
    onChange(item.address); // triggers validation
  }, [onChange]);

  useEffect(() => {
    if (
      inputState === InputState.VALID_INPUT &&
      manualEntryRef.current &&
      validatedAsset &&
      onSelect
    ) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_INPUT due to manual entry`, validatedAsset);
      onSelect(validatedAsset, InputState.CLOSE_SELECT_INPUT);
      setInputState(InputState.CLOSE_SELECT_INPUT);
      manualEntryRef.current = false;
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
        placeholder="Enter address"
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      <RenderAssetPreview
        inputState={inputState}
        validatedAsset={validatedAsset}
        hasBrokenLogoURL={hasBrokenLogoURL}
        reportMissingLogoURL={reportMissingLogoURL}
        onSelect={onManualSelect}
      />

      <ValidateAssetPreview inputState={inputState} />

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0 gap-[0.2rem]">
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList
            dataFeedType={feedType}
            onSelect={onDataListSelect}
          />
        </div>
      </div>
    </div>
  );
}
