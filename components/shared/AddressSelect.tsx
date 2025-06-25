"use client";

import React, { useEffect, useCallback } from "react";
import {
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
  CONTAINER_TYPE,
} from "@/lib/structure";
import { useInputValidationState } from "@/lib/hooks/useInputValidationState";
import { useBaseSelectShared } from "@/lib/hooks/useBaseSelectShared";
import HexAddressInput from "@/components/shared/HexAddressInput";
import RenderAssetPreview from "@/components/shared/utils/sharedPreviews/RenderAssetPreview";
import ValidateAssetPreview from "@/components/shared/utils/sharedPreviews/ValidateAssetPreview";
import DataList from "../Dialogs/Resources/DataList";
import { createDebugLogger } from "@/lib/utils/debugLogger";

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === "true";
const debugLog = createDebugLogger("addressSelect", DEBUG_ENABLED, LOG_TIME);

interface AddressSelectProps<T extends TokenContract | WalletAccount> {
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  closeDialog: () => void;
  onSelect: (item: T, state: InputState) => void;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
  containerType?: CONTAINER_TYPE;
}

export default function AddressSelect<T extends TokenContract | WalletAccount>({
  feedType,
  inputPlaceholder,
  closeDialog,
  onSelect: onSelectProp,
  duplicateMessage,
  showDuplicateCheck = false,
  containerType,
}: AddressSelectProps<T>) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
    getInputStatusEmoji,
  } = useBaseSelectShared();

  const {
    inputState,
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState<T>(
    debouncedAddress,
    feedType,
    containerType
  );

  const onSelect = useCallback(
    (item: TokenContract | WalletAccount) => {
      debugLog.log(`🟢 onSelect() called with:`, item);
      clearInput();
      onSelectProp(item as T, InputState.CLOSE_INPUT);
      closeDialog();
    },
    [clearInput, closeDialog, onSelectProp]
  );

  useEffect(() => {
    debugLog.log(`📨 debouncedAddress:`, debouncedAddress);
  }, [debouncedAddress]);

  useEffect(() => {
    debugLog.log(`📌 inputState:`, inputState);
  }, [inputState]);

  useEffect(() => {
    if (validatedAsset) {
      debugLog.log(`✅ validatedAsset:`, validatedAsset);
    }
  }, [validatedAsset]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedAsset) return;
    if (!manualEntryRef.current) {
      debugLog.log(`🚀 Auto-selecting validatedAsset`);
      onSelect(validatedAsset);
    }
  }, [debouncedAddress, isLoading, validatedAsset, manualEntryRef, onSelect]);

  return (
    <div
      id="inputSelectDiv"
      className="flex flex-col h-full min-h-0 w-full gap-[0.2rem]"
    >
      <HexAddressInput
        inputValue={inputValue}
        onChange={(val) => {
          debugLog.log(`⌨️ onChange inputValue: ${val}`);
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
        onSelect={onSelect}
      />

      <ValidateAssetPreview
        inputState={inputState}
        duplicateMessage={showDuplicateCheck ? duplicateMessage : undefined}
      />

      <div
        id="inputSelectFlexDiv"
        className="flex flex-col flex-grow min-h-0 gap-[0.2rem]"
      >
        <div
          id="DataListDiv"
          className="bg-[#243056] w-full h-full overflow-y-auto flex-grow scrollbar-thin p-2 text-[#5981F3] mb-1 rounded-[22px]"
        >
          <DataList<T>
            dataFeedType={feedType}
            onSelect={(item) => {
              debugLog.log(`🧾 DataList onSelect:`, item);
              manualEntryRef.current = false;
              validateHexInput(item.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
