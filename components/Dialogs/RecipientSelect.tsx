'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useChainId } from 'wagmi';

import {
  FEED_TYPE,
  InputState,
  WalletAccount,
} from '@/lib/structure/types';

import { getLogoURL } from '@/lib/network/utils';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { useBaseSelectShared } from '@/lib/hooks/useBaseSelectShared';
import { useExchangeContext } from '@/lib/context/contextHooks';
import { isWalletAccount } from '@/lib/utils/isWalletAccount';


import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ValidationDisplay from '@/components/shared/ValidationDisplay';
import DataList from '@/components/Dialogs/Resources/DataList';

const INPUT_PLACEHOLDER = 'Type or paste recipient wallet address';

interface Props {
  closeDialog: () => void;
  onSelect: (walletAccount: WalletAccount, state: InputState) => void;
}

export default function RecipientSelect({ closeDialog, onSelect: onSelectProp }: Props) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput,
    getInputStatusEmoji,
  } = useBaseSelectShared();

  const chainId = useChainId();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  const {
    inputState,
    validatedToken: validatedAccount,
    isLoading,
    reportMissingAvatar,
  } = useInputValidationState(debouncedAddress, FEED_TYPE.RECIPIENT_ACCOUNTS);

  const onSelect = useCallback((account: WalletAccount) => {
    if (agentAccount && account.address === agentAccount.address) {
      alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
      return;
    }
    clearInput();
    onSelectProp(account, InputState.CLOSE_INPUT);
    closeDialog();
  }, [agentAccount, clearInput, onSelectProp, closeDialog]);

  useEffect(() => {
    if (
      !debouncedAddress ||
      isLoading ||
      !validatedAccount ||
      !isWalletAccount(validatedAccount)
    ) return;

    if (!manualEntryRef.current) {
      onSelect(validatedAccount);
    }
  }, [debouncedAddress, validatedAccount, isLoading, manualEntryRef, onSelect]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={INPUT_PLACEHOLDER}
        statusEmoji={getInputStatusEmoji(inputState)}
      />

      {validatedAccount &&
        inputState === InputState.VALID_INPUT_PENDING &&
        isWalletAccount(validatedAccount) && (
          <div id="pendingDiv" className={styles.modalInputSelect}>
            <BasePreviewCard
              name={validatedAccount.name || ''}
              symbol={validatedAccount.symbol || ''}
              avatarSrc={getLogoURL(chainId, validatedAccount.address as Address, FEED_TYPE.RECIPIENT_ACCOUNTS)}
              onSelect={() => onSelect(validatedAccount)}
              onError={() => reportMissingAvatar()}
            />
          </div>
        )}

      {inputState !== InputState.EMPTY_INPUT && inputState !== InputState.VALID_INPUT_PENDING && (
        <div id="validateInputDiv" className={`${styles.modalInputSelect} indent-5`}>
          <ValidationDisplay inputState={inputState} />
        </div>
      )}

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList<WalletAccount>
            dataFeedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
            onSelect={(account) => {
              manualEntryRef.current = false;
              validateHexInput(account.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
