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
    instanceId,
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
      debugLog.log(`✅ Syncing validated asset to context (instanceId=${instanceId})`, localValidatedAsset);
      setValidatedAsset(localValidatedAsset);
    }
  }, [localValidatedAsset, setValidatedAsset, instanceId]);

  useEffect(() => {
    if (
      inputState === InputState.VALID_INPUT &&
      manualEntryRef.current &&
      validatedAsset
    ) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_INPUT due to manual entry (instanceId=${instanceId})`, validatedAsset);
      setInputState(InputState.CLOSE_SELECT_INPUT);
      manualEntryRef.current = false;
    }
  }, [inputState, validatedAsset, setInputState, instanceId]);

  const updateValidTokenSelection = (asset: ValidatedAsset) => {
    debugLog.log(`✅ updateValidTokenSelection() (instanceId=${instanceId}):`, asset);
    debugLog.log(
      `📦 containerType (${containerType}): ${containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? 'SELL_SELECT_CONTAINER'
        : containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER
          ? 'BUY_SELECT_CONTAINER'
          : 'UNKNOWN'
      } at updateValidTokenSelection()`
    );

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      debugLog.log(`🟦 Applying to SELL container`);
      setSellTokenContract(structuredClone(asset));
    } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      debugLog.log(`🟥 Applying to BUY container`);
      setBuyTokenContract(structuredClone(asset));
    } else {
      debugLog.warn(`⚠️ Unexpected containerType: ${containerType}`);
    }

    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_OFF);
  };

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect() (instanceId=${instanceId}):`, item);
    handleInputChange(item.address, true);
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect() (instanceId=${instanceId}):`, item);
    handleInputChange(item.address, false);
    updateValidTokenSelection(item);
  };

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
