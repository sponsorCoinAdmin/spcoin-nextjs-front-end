'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useState, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { useChainId } from 'wagmi';
import { FEED_TYPE, WalletAccount, InputState } from '@/lib/structure/types';
import { getLogoURL } from '@/lib/network/utils';
import { useExchangeContext } from '@/lib/context/contextHooks';
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import DataList from '@/components/Dialogs/Resources/DataList';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';

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
  } = useDebouncedAddressInput();

  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | undefined>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const chainId = useChainId();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  const fetchAccountDetails = useCallback(async (walletAddr: string) => {
    setInputState(InputState.VALID_INPUT_PENDING);
    try {
      const avatar = getLogoURL(chainId, walletAddr as Address, FEED_TYPE.RECIPIENT_ACCOUNTS);
      const metaURL = `/assets/accounts/${walletAddr}/wallet.json`;
      const metaResponse = await fetch(metaURL);
      const metadata = await metaResponse.json();

      const wallet: WalletAccount = {
        address: walletAddr,
        symbol: metadata.symbol || '',
        avatar,
        name: metadata.name || '',
        type: metadata.type || '',
        website: metadata.website || '',
        description: metadata.description || '',
        status: metadata.status || '',
      };

      setSelectedAccount(wallet);
      setInputState(InputState.VALID_INPUT);
    } catch (e) {
      console.error('ERROR: Fetching wallet details failed', e);
      setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      setSelectedAccount(undefined);
    }
  }, [chainId]);

  const onSelect = useCallback(
    (wallet: WalletAccount) => {
      if (agentAccount && wallet.address === agentAccount.address) {
        alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
        return;
      }
      clearInput();
      onSelectProp(wallet, InputState.CLOSE_INPUT);
      closeDialog();
    },
    [agentAccount, onSelectProp, closeDialog, clearInput]
  );

  useEffect(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) {
      setSelectedAccount(undefined);
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }
    fetchAccountDetails(debouncedAddress);
  }, [debouncedAddress, fetchAccountDetails]);

  useEffect(() => {
    if (!debouncedAddress || !selectedAccount || inputState !== InputState.VALID_INPUT) return;
    if (!manualEntryRef.current) {
      onSelect(selectedAccount);
    }
  }, [debouncedAddress, selectedAccount, inputState, onSelect, manualEntryRef]);

  const getInputStatusImage = () => {
    switch (inputState) {
      case InputState.INVALID_ADDRESS_INPUT:
        return '❓';
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return '❌';
      case InputState.VALID_INPUT:
        return '✅';
      case InputState.VALID_INPUT_PENDING:
        return '⏳';
      default:
        return '🔍';
    }
  };

  const validateInputStatus = (state: InputState) => {
    const emojiMap: Partial<Record<InputState, { emoji?: string; text: string }>> = {
      [InputState.INVALID_ADDRESS_INPUT]: { emoji: '❓', text: 'Valid address required.' },
      [InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN]: { emoji: '❌', text: 'Recipient not found.' },
    };
    const item = emojiMap[state];
    if (!item) return null;
    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'red',
          marginLeft: '1.2rem',
        }}
      >
        {item.emoji && <span style={{ fontSize: 24, marginRight: 6 }}>{item.emoji}</span>}
        <span style={{ fontSize: '15px' }}>{item.text}</span>
      </span>
    );
  };

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={INPUT_PLACEHOLDER}
        statusEmoji={getInputStatusImage()}
      />

      {selectedAccount && inputState === InputState.VALID_INPUT_PENDING && (
        <div className={styles.modalInputSelect}>
          <BasePreviewCard
            name={selectedAccount.name || ''}
            symbol={selectedAccount.symbol || ''}
            avatarSrc={selectedAccount.avatar?.trim() || customUnknownImage_png.src}
            onSelect={() => onSelect(selectedAccount)}
            onInfoClick={() => alert(`Recipient Address = ${selectedAccount.address}`)}
            onContextMenu={(e) => {
              e.preventDefault();
              alert(`Right-click Recipient:\nName: ${selectedAccount.name}\nAddress: ${selectedAccount.address}`);
            }}
            onError={(e) => {
              e.currentTarget.src = customUnknownImage_png.src;
            }}
            width={32}
            height={32}
          />
        </div>
      )}

      {inputState !== InputState.EMPTY_INPUT && inputState !== InputState.VALID_INPUT_PENDING && (
        <div id="validateInputDiv" className={`${styles.modalInputSelect} indent-5`}>
          {validateInputStatus(inputState)}
        </div>
      )}

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <DataList<WalletAccount>
            dataFeedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
            onSelect={(wallet) => {
              manualEntryRef.current = false;
              validateHexInput(wallet.address);
            }}
          />
        </div>
      </div>
    </div>
  );
}
