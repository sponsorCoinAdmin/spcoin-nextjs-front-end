'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect, useCallback } from 'react';
import {
  getTokenLogoURL,
  type RequiredAssetMembers,
} from '@/lib/network/utils';
import {
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure/types';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ValidationDisplay from '@/components/shared/ValidationDisplay';
import DataList from './Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

interface AddressSelectProps<T extends TokenContract | WalletAccount> {
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  closeDialog: () => void;
  onSelect: (item: T, state: InputState) => void;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
}

export default function AddressSelect<T extends TokenContract | WalletAccount>({
  feedType,
  inputPlaceholder,
  closeDialog,
  onSelect: onSelectProp,
  duplicateMessage,
  showDuplicateCheck = false,
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
    validatedToken,
    isLoading,
    reportMissingAvatar,
  } = useInputValidationState<T>(debouncedAddress, feedType);

  const onSelect = useCallback(
    (item: T) => {
      debugLog.log(`🟢 onSelect() called with:`, item);
      clearInput();
      onSelectProp(item, InputState.CLOSE_INPUT);
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
    if (validatedToken) {
      debugLog.log(`✅ validatedToken:`, validatedToken);
    }
  }, [validatedToken]);

  useEffect(() => {
    if (!debouncedAddress || isLoading || !validatedToken) return;
    if (!manualEntryRef.current) {
      debugLog.log(`🚀 Auto-selecting validatedToken`);
      onSelect(validatedToken);
    }
  }, [debouncedAddress, isLoading, validatedToken, manualEntryRef, onSelect]);

  const renderPreview = () => {
    if (!validatedToken || inputState !== InputState.VALID_INPUT_PENDING)
      return null;

    const name = 'name' in validatedToken ? validatedToken.name : '';
    const symbol = 'symbol' in validatedToken ? validatedToken.symbol : '';

    let avatarSrc = '/assets/miscellaneous/badTokenAddressImage.png';
    if ('chainId' in validatedToken && validatedToken.chainId !== undefined) {
      avatarSrc = getTokenLogoURL({
        address: validatedToken.address,
        chainId: validatedToken.chainId,
      });
    }

    debugLog.log('🟦 Rendering VALID_INPUT_PENDING preview');
    return (
      <div id="pendingDiv" className={styles.modalInputSelect}>
        <BasePreviewCard
          name={name || ''}
          symbol={symbol || ''}
          avatarSrc={avatarSrc}
          onSelect={() => onSelect(validatedToken)}
          onError={() => reportMissingAvatar()}
        />
      </div>
    );
  };

  return (
    <div
      id="inputSelectDiv"
      className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}
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

      {renderPreview()}

      {inputState !== InputState.VALID_INPUT_PENDING &&
        inputState !== InputState.EMPTY_INPUT && (
          <div
            id="validateInputDiv"
            className="indent-5"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: '146px',                          // match preview height
              padding: '8px',
              borderRadius: '22px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',   // ✅ debug green background
              color: '#5981F3',
              boxSizing: 'border-box',
            }}
          >
            <ValidationDisplay
              inputState={inputState}
              duplicateMessage={
                showDuplicateCheck ? duplicateMessage : undefined
              }
            />
          </div>
        )}

      <div
        id="inputSelectFlexDiv"
        className="flex flex-col flex-grow min-h-0"
        style={{ gap: '0.2rem' }}
      >
        <div
          id="DataListDiv"
          className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}
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
