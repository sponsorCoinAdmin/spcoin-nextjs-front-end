'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useState, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { useExchangeContext } from '@/lib/context/contextHooks';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import { FEED_TYPE, WalletAccount } from '@/lib/structure/types';
import { getLogoURL } from '@/lib/network/utils';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import ScrollableDataList from '@/components/shared/ScrollableDataList';
import HexAddressInput from '@/components/shared/HexAddressInput';
import BasePreviewCard from '@/components/shared/BasePreviewCard';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';

const INPUT_PLACE_HOLDER = 'Type or paste recipient wallet address';

type Props = {
  closeDialog: () => void;
  onSelect: (walletAccount: WalletAccount) => void;
};

export default function RecipientSelect({ closeDialog, onSelect: onSelectProp }: Props) {
  const { inputValue, validateHexInput } = useHexInput();
  const debouncedAddress = useDebounce(inputValue, 250);

  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | undefined>();
  const chainId = useChainId();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  useEffect(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) {
      setSelectedAccount(undefined);
      return;
    }
    fetchAccountDetails(debouncedAddress);
  }, [debouncedAddress]);

  const fetchAccountDetails = useCallback(async (walletAddr: string) => {
    try {
      const retResponse = await getWagmiBalanceOfRec(walletAddr);
      const wallet: WalletAccount = {
        address: walletAddr,
        symbol: retResponse.symbol,
        avatar: getLogoURL(chainId, walletAddr as Address, FEED_TYPE.RECIPIENT_ACCOUNTS),
        name: '',
        type: '',
        website: '',
        description: '',
        status: '',
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

    setSelectedAccount(wallet);
    onSelectProp(wallet);
    closeDialog();
  }, [agentAccount, onSelectProp, closeDialog]);

  return (
    <>
      <HexAddressInput
        inputValue={inputValue}
        onChange={validateHexInput}
        placeholder={INPUT_PLACE_HOLDER}
        statusEmoji="🔍"
      />

      {selectedAccount && (
        <div className={styles.modalInputSelect}>
          <BasePreviewCard
            name={selectedAccount.name || ''}
            symbol={selectedAccount.symbol || ''}
            avatarSrc={selectedAccount.avatar || customUnknownImage_png.src}
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

      <ScrollableDataList<WalletAccount>
        dataFeedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
        onSelect={onSelect}
      />
    </>
  );
}
