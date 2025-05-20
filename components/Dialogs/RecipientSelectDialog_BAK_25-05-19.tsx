'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { isAddress } from 'ethers';
import { Address } from 'viem';

import { useExchangeContext } from '@/lib/context/contextHooks';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import DataList from './Resources/DataList';
import { FEED_TYPE, WalletAccount } from '@/lib/structure/types';
import { getLogoURL } from '@/lib/network/utils';

import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { useChainId } from 'wagmi';

const TITLE_NAME = 'Select a Recipient';
const INPUT_PLACE_HOLDER = 'Type or paste recipient wallet address';

type Props = {
  callBackAccount: (walletAccount: WalletAccount) => void;
  setShowDialog: (showDialog: boolean) => void;
  showDialog: boolean;
};

export default function RecipientSelectDialog({ showDialog, setShowDialog, callBackAccount }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [recipientInput, setRecipientInput] = useState<string>('');
  const [walletElement, setWalletElement] = useState<WalletAccount | undefined>();
  const chainId = useChainId();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  useEffect(() => {
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  const handleRecipientInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientInput(event.target.value);
  }, []);

  useEffect(() => {
    if (!recipientInput || !isAddress(recipientInput)) {
      setWalletElement(undefined);
      return;
    }

    fetchAccountDetails(recipientInput);
  }, [recipientInput]);

  const fetchAccountDetails = useCallback(async (walletAddr: string) => {
    try {
      if (isAddress(walletAddr)) {
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

        setWalletElement(wallet);
      }
    } catch (e: any) {
      console.error('ERROR: Fetching wallet details failed', e.message);
    }
  }, [chainId]);

  const handleWalletSelect = useCallback((selectedWallet: WalletAccount) => {
    if (!selectedWallet) {
      alert('Invalid Wallet address.');
      return;
    }
    if (selectedWallet.address === agentAccount?.address) {
      alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
      return;
    }

    setWalletElement(selectedWallet);
    callBackAccount(selectedWallet);
    setShowDialog(false);
    dialogRef.current?.close();
  }, [agentAccount, callBackAccount, setShowDialog]);

  return (
    <dialog id="recipientDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">
          {TITLE_NAME}
        </h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={() => setShowDialog(false)}
        >
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.modalElementSelect}>
          <div className={styles.leftH}>
            <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search" />
            <input
              className={styles.modalElementSelect}
              autoComplete="off"
              placeholder={INPUT_PLACE_HOLDER}
              onChange={handleRecipientInputChange}
              value={recipientInput}
            />
          </div>
        </div>

        {walletElement && (
          <div className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row" onClick={() => handleWalletSelect(walletElement)}>
                <Image
                  src={walletElement.avatar || customUnknownImage_png}
                  className={styles.elementLogo}
                  alt="Wallet Avatar"
                />
                <div>
                  <div className={styles.elementName}>{walletElement.name || 'Unknown Wallet'}</div>
                  <div className={styles.elementSymbol}>{walletElement.symbol || 'N/A'}</div>
                </div>
              </div>
              <div
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={() => alert(`Wallet Address = ${walletElement.address}`)}
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
      </div>
    </dialog>
  );
}
