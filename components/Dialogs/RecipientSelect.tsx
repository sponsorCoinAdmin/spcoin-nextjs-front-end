'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useState, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { useChainId } from 'wagmi';
import { FEED_TYPE, WalletAccount } from '@/lib/structure/types';
import { getLogoURL } from '@/lib/network/utils';
import { useExchangeContext } from '@/lib/context/contextHooks';
import { useDebouncedAddressInput } from '@/lib/hooks/useDebouncedAddressInput';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import ScrollableDataList from '@/components/shared/ScrollableDataList';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';

const INPUT_PLACEHOLDER = 'Type or paste recipient wallet address';

interface Props {
  closeDialog: () => void;
  onSelect: (walletAccount: WalletAccount) => void;
}

export default function RecipientSelect({ closeDialog, onSelect: onSelectProp }: Props) {
  const {
    inputValue,
    debouncedAddress,
    onChange,
    clearInput,
    manualEntryRef,
    validateHexInput
  } = useDebouncedAddressInput();

  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | undefined>();
  const chainId = useChainId();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  const fetchAccountDetails = useCallback(async (walletAddr: string) => {
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
        status: metadata.status || ''
      };

      setSelectedAccount(wallet);
    } catch (e: any) {
      console.error('ERROR: Fetching wallet details failed', e.message);
    }
  }, [chainId]);

  const onSelect = useCallback((wallet: WalletAccount) => {
    if (agentAccount && wallet.address === agentAccount.address) {
      alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
      return;
    }
    clearInput();
    onSelectProp(wallet);
    closeDialog();
  }, [agentAccount, onSelectProp, closeDialog, clearInput]);

  useEffect(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) {
      setSelectedAccount(undefined);
      return;
    }
    fetchAccountDetails(debouncedAddress);
  }, [debouncedAddress, fetchAccountDetails]);

  useEffect(() => {
    if (!debouncedAddress || !selectedAccount) return;
    if (!manualEntryRef.current) {
      onSelect(selectedAccount);
    }
  }, [debouncedAddress, selectedAccount, onSelect, manualEntryRef]);

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={inputValue}
        onChange={onChange}
        placeholder={INPUT_PLACEHOLDER}
        statusEmoji="🔍"
      />

      {selectedAccount && (
        <div className={styles.modalInputSelect}>
          <BasePreviewCard
            name={selectedAccount.name || ''}
            symbol={selectedAccount.symbol || ''}
            avatarSrc={selectedAccount.avatar?.trim() || customUnknownImage_png.src}
            onSelect={() => onSelect(selectedAccount)}
            onInfoClick={() => alert(`Recipient Address = ${selectedAccount.address}`)}
            onError={(e) => {
              e.currentTarget.src = customUnknownImage_png.src;
            }}
            width={32}
            height={32}
          />
        </div>
      )}

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0" style={{ gap: '0.2rem' }}>
        <div id="DataListDiv" className={`${styles.modalScrollBar} ${styles.modalScrollBarHidden}`}>
          <ScrollableDataList<WalletAccount>
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
