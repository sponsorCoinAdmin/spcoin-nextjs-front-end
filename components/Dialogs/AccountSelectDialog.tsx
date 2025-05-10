"use client";

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { isAddress } from "ethers";
import { Address } from "viem";

import { useExchangeContext } from '@/lib/context/contextHooks'
import { getWagmiBalanceOfRec } from "@/lib/wagmi/getWagmiBalanceOfRec";
import DataList from "./Resources/DataList";
import { FEED_TYPE, WalletAccount } from "@/lib/structure/types";
import { hideElement, showElement } from "@/lib/spCoin/guiControl";
import { getLogoURL } from "@/lib/network/utils";

import searchMagGlassGrey_png from "@/public/assets/miscellaneous/SearchMagGlassGrey.png";
import customUnknownImage_png from "@/public/assets/miscellaneous/QuestionWhiteOnRed.png";
import info_png from "@/public/assets/miscellaneous/info1.png";

const TITLE_NAME = "Select a Recipient";
const INPUT_PLACE_HOLDER = "Type or paste recipient wallet address";

type Props = {
  callBackWallet: (walletAccount: WalletAccount) => void;
  setShowDialog: (showDialog: boolean) => void;
  showDialog: boolean;
};

export default function Dialog({ showDialog, setShowDialog, callBackWallet }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [recipientInput, setRecipientInput] = useState<string | undefined>();
  const [walletElement, setWalletElement] = useState<WalletAccount | undefined>();
  const { exchangeContext } = useExchangeContext();
  const agentAccount = exchangeContext.agentAccount;

  /** 📌 Handle Dialog Visibility */
  useEffect(() => {
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  /** 📌 Handle Input Field Change */
  const handleRecipientInputChange = useCallback((event: any) => {
    setRecipientInput(event.target.value);
  }, []);

  /** 📌 Update Wallet Details */
  useEffect(() => {
    if (!recipientInput) {
      hideElement("recipientSelectGroup_ID");
      return;
    }

    showElement("recipientSelectGroup_ID");

    if (isAddress(recipientInput)) {
      fetchWalletDetails(recipientInput);
    }
  }, [recipientInput]);

  /** 📌 Fetch Wallet Details */
  const fetchWalletDetails = useCallback(async (walletAddr: string) => {
    try {
      if (isAddress(walletAddr)) {
        let retResponse: any = await getWagmiBalanceOfRec(walletAddr);

        let wallet: WalletAccount = {
          address: walletAddr,
          symbol: retResponse.symbol,
          avatar: "/assets/miscellaneous/QuestionWhiteOnRed.png",
          name: "",
          type: "",
          website: "",
          description: "",
          status: "",
        };

        setWalletElement(wallet);
      }
    } catch (e: any) {
      console.error("ERROR: Fetching wallet details failed", e.message);
    }
  }, []);

  /** ✅ Fix: Handle Wallet Selection Correctly */
  const handleWalletSelect = useCallback((selectedWallet: WalletAccount) => {
    console.log("🔹 handleWalletSelect received wallet:", selectedWallet);

    if (!selectedWallet) {
      alert("Invalid Wallet address.");
      return;
    }
    if (selectedWallet.address === agentAccount?.address) {
      alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
      return;
    }

    const avatar = getLogoURL(exchangeContext, selectedWallet.address as Address, FEED_TYPE.RECIPIENT_WALLETS);
    selectedWallet.avatar = avatar;

    setWalletElement(selectedWallet); // ✅ Update wallet state
    callBackWallet(selectedWallet);

    setShowDialog(false);
    dialogRef.current?.close();
  }, [agentAccount, exchangeContext, callBackWallet, setShowDialog]);

  return (
    <dialog id="recipientDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
        <div className="cursor-pointer rounded border-none w-5 text-xl text-white" onClick={() => setShowDialog(false)}>
          X
        </div>
      </div>
      <div className={styles.modalBox}>
        <div className={styles.modalElementSelect}>
          <div className={styles.leftH}>
            <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
            <input
              id="recipientInput"
              className={styles.modalElementSelect}
              autoComplete="off"
              placeholder={INPUT_PLACE_HOLDER}
              onChange={handleRecipientInputChange}
              value={recipientInput || ""}
            />
          </div>
        </div>

        {recipientInput && (
          <div id="recipientSelectGroup_ID" className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row justify-between" onClick={() => handleWalletSelect(walletElement!)}>
                <Image id="walletImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Search Image Grey" />
                <div>
                  <div className={styles.elementName}>{walletElement?.name || "Unknown Wallet"}</div>
                  <div className={styles.elementSymbol}>{walletElement?.symbol || "N/A"}</div>
                </div>
              </div>
              <div
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                  onClick={() => alert(`Wallet Address = ${walletElement?.address}`)}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
              </div>
            </div>
          </div>
        )}

        <div className={styles.modalScrollBar}>
          <DataList dataFeedType={FEED_TYPE.RECIPIENT_WALLETS} updateTokenCallback={handleWalletSelect} />
        </div>
      </div>
    </dialog>
  );
}
