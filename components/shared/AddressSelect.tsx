// File: components/shared/AddressSelect.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import React from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import ErrorAssetPreview from './utils/sharedPreviews/ErrorAssetPreview';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const {
    validatedAsset,
    feedType,
    validHexInput,
    handleHexInputChange,
  } = useSharedPanelContext();

  const { updateActiveDisplay } = useActiveDisplay();

  const MANUAL_ENTRY = true;

  const safeInput = validHexInput.trim() !== '' ? validHexInput : undefined;

  // ✅ Debug input updates
  console.debug('⚡ [AddressSelect] Re-render, validHexInput =', validHexInput);
  console.debug('💥 [AddressSelect] Passing to useValidateFSMInput →', safeInput);

  // Run FSM hook
  useValidateFSMInput(safeInput);

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect →`, item.address);
    handleHexInputChange(item.address, true);
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect →`, item.address);
    handleHexInputChange(item.address, false);
    updateActiveDisplay(SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL);
  };

  return (
    <div
      id="inputSelectDiv"
      className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}
    >
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          console.debug('✏️ [HexAddressInput] onChange →', val);
          handleHexInputChange(val, MANUAL_ENTRY);
        }}
        placeholder="Enter address"
        statusEmoji=""
      />

      <ErrorAssetPreview />

      <RenderAssetPreview
        validatedAsset={validatedAsset}
        onSelect={onManualSelect}
      />

      <div
        id="inputSelectFlexDiv"
        className="flex flex-col flex-grow min-h-0 gap-[0.2rem]"
      >
        <div
          id="DataListDiv"
          className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}
        >
          <DataList
            dataFeedType={feedType}
            onSelect={onDataListSelect}
          />
        </div>
      </div>
    </div>
  );
}
