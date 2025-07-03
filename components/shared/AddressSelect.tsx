'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useRef } from 'react';
import { InputState, CONTAINER_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ValidateAssetPreview from '@/components/shared/utils/sharedPreviews/ValidateAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import { useSellTokenContract, useBuyTokenContract, useDisplayControls } from '@/lib/context/hooks';
import { useValidateHexInputChange } from '@/lib/hooks/inputValidations';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('addressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const {
    inputValue,
    debouncedAddress,
    validateHexInput,
    getInputStatusEmoji,
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    containerType,
    feedType,
  } = useSharedPanelContext();

  const {
    validatedAsset: localValidatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

  const { assetSelectScrollDisplay, updateAssetScrollDisplay } = useDisplayControls();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const manualEntryRef = useRef(false);
  const { onChange: handleInputChange } = useValidateHexInputChange(validateHexInput, manualEntryRef);
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

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect():`, item);
    handleInputChange(item.address, true);
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect():`, item);
    handleInputChange(item.address, false);
    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_OFF)
  };

  useEffect(() => {
    if (
      inputState === InputState.VALID_INPUT &&
      manualEntryRef.current &&
      validatedAsset
    ) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_INPUT due to manual entry`, validatedAsset);
      setInputState(InputState.CLOSE_SELECT_INPUT);
      manualEntryRef.current = false;
    }
  }, [inputState, validatedAsset, setInputState]);

  useEffect(() => {
    if (inputState === InputState.CLOSE_SELECT_INPUT && validatedAsset) {
      debugLog.log(`📦 Applying validatedAsset from CLOSE_SELECT_INPUT`, validatedAsset);
      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setSellTokenContract(structuredClone(validatedAsset));
      } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
        setBuyTokenContract(structuredClone(validatedAsset));
      }
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [inputState, validatedAsset, containerType, setSellTokenContract, setBuyTokenContract, setInputState]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => handleInputChange(val, false)}
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
