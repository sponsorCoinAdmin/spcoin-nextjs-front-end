'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect } from 'react';
import {
  InputState,
  CONTAINER_TYPE,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ValidateAssetPreview from '@/components/shared/utils/sharedPreviews/ValidateAssetPreview';
import DataList from '../Dialogs/Resources/DataList';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import {
  useSellTokenContract,
  useBuyTokenContract,
  useDisplayControls,
} from '@/lib/context/hooks';
import { useValidateHexInputChange } from '@/lib/hooks/inputValidations';

import { usePanelFeedContext } from '@/lib/context/ScrollSelectPanels';
import { getInputStatusEmoji } from '@/lib/hooks/inputValidations/helpers/getInputStatusEmoji';
import { useDebouncedAddressInput } from '@/lib/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('addressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const {
    // inputValue,
    // debouncedAddress,
    // validateHexInput,
    inputState,
    setInputState,
    validatedAsset,
    containerType,
    feedType,
  } = usePanelFeedContext();

  const {
    inputValue,
    debouncedAddress,
    validateHexInput,
  } = useDebouncedAddressInput();

  const { onChange: handleInputChange } = useValidateHexInputChange(validateHexInput);

  const {
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

  const MANUAL_ENTRY = true;

  const { updateAssetScrollDisplay } = useDisplayControls();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();


  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect():`, MANUAL_ENTRY);
    handleInputChange(item.address, true);
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect():`, item);
    handleInputChange(item.address, !MANUAL_ENTRY);
    alert(`onDataListSelect${item.address}:inputState(${inputState}) = ${InputState[inputState]}`);
    setInputState(InputState.VALID_INPUT);
    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_OFF);
  };

  // ✅ Always promote VALID_INPUT to CLOSE_SELECT_INPUT
  useEffect(() => {
    if (inputState === InputState.VALID_INPUT && validatedAsset) {
      debugLog.log(`🎯 Promoting VALID_INPUT → CLOSE_SELECT_INPUT`, validatedAsset);
      setInputState(InputState.CLOSE_SELECT_INPUT);
    }
  }, [inputState, validatedAsset, setInputState]);

  // ✅ Apply the selected token to context when input closes
  useEffect(() => {
    if (inputState === InputState.CLOSE_SELECT_INPUT && validatedAsset) {
      debugLog.log(`📦 Applying validatedAsset from CLOSE_SELECT_INPUT`, validatedAsset);
      const cloned = structuredClone(validatedAsset);
      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setSellTokenContract(cloned);
      } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
        setBuyTokenContract(cloned);
      }
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [
    inputState,
    validatedAsset,
    containerType,
    setSellTokenContract,
    setBuyTokenContract,
    setInputState,
  ]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => handleInputChange(val, MANUAL_ENTRY)}
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
