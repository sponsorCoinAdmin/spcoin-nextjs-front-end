// File: components/shared/AddressSelect.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import React from 'react';
import {
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';
import { useDisplayControls } from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import {
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';

import { useValidateHexInput } from '@/lib/hooks/inputValidations';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('addressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const { inputState, setInputState, containerType, validatedAsset, feedType } = useSharedPanelContext();

  const {
    inputValue,
    handleHexInputChange,
  } = useValidateHexInput(feedType); // ✅ Now the only validation hook

  const MANUAL_ENTRY = true;

  const { updateAssetScrollDisplay } = useDisplayControls();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect():`, MANUAL_ENTRY);
    handleHexInputChange(item.address, true);
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect():`, item);
    handleHexInputChange(item.address, !MANUAL_ENTRY);
    alert(`onDataListSelect(${item.address})`);
    updateAssetScrollDisplay(SP_COIN_DISPLAY.DISPLAY_OFF);
  };

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => handleHexInputChange(val, MANUAL_ENTRY)}
        placeholder="Enter address"
        statusEmoji=""
      />

      <RenderAssetPreview
        validatedAsset={validatedAsset}
        onSelect={onManualSelect}
      />

      {/* <ValidateAssetPreview /> */}

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
