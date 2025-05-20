// File: components/Dialogs/RecipientSelect.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Address, isAddress } from 'viem';
import { useExchangeContext } from '@/lib/context/contextHooks';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import DataList from './Resources/DataList';
import { FEED_TYPE, WalletAccount } from '@/lib/structure/types';
import { getLogoURL } from '@/lib/network/utils';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';
import info_png from '@/public/assets/miscellaneous/info1.png';

const INPUT_PLACE_HOLDER = 'Type or paste recipient wallet address';

type Props = {
  closeDialog: () => void;
  onSelect: (walletAccount: WalletAccount) => void;
};

export default function RecipientSelect({ closeDialog, onSelect }: Props) {
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

  const handleWalletSelect = useCallback((wallet: WalletAccount) => {
    if (!wallet) {
      alert('Invalid Wallet address.');
      return;
    }
    if (wallet.address === agentAccount?.address) {
      alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
      return;
    }
    setSelectedAccount(wallet);
    onSelect(wallet);
    closeDialog();
  }, [agentAccount, onSelect, closeDialog]);

  return (
    <>
      <div className={styles.modalElementSelect}>
        <div className={styles.leftH}>
          <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search" />
          <input
            className={styles.modalElementSelect}
            autoComplete="off"
            placeholder={INPUT_PLACE_HOLDER}
            onChange={(e) => validateHexInput(e.target.value)}
            value={inputValue}
          />
        </div>
      </div>

      {selectedAccount && (
        <div className={styles.modalInputSelect}>
          <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
            <div className="cursor-pointer flex flex-row" onClick={() => handleWalletSelect(selectedAccount)}>
              <Image
                src={selectedAccount.avatar || customUnknownImage_png}
                className={styles.elementLogo}
                alt="Wallet Avatar"
              />
              <div>
                <div className={styles.elementName}>{selectedAccount.name || 'Unknown Wallet'}</div>
                <div className={styles.elementSymbol}>{selectedAccount.symbol || 'N/A'}</div>
              </div>
            </div>
            <div
              className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
              onClick={() => alert(`Wallet Address = ${selectedAccount.address}`)}
            >
              <Image src={info_png} className={styles.infoLogo} alt="Info" />
            </div>
          </div>
        </div>
      )}

      <div className={styles.modalScrollBar}>
        <DataList
          dataFeedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
          onSelect={(wallet) => handleWalletSelect(wallet as WalletAccount)}
        />
      </div>
    </>
  );
}
