"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import styles from "@/styles/Modal.module.css";
import { getWagmiBalanceOfRec } from "@/lib/wagmi/getWagmiBalanceOfRec";
import searchMagGlassGrey_png from "@/public/assets/miscellaneous/SearchMagGlassGrey.png";
import customUnknownImage_png from "@/public/assets/miscellaneous/QuestionWhiteOnRed.png";
import info_png from "@/public/assets/miscellaneous/info1.png";
import Image from "next/image";
import { FEED_TYPE, WalletAccount } from "@/lib/structure/types";
import { isAddress } from "ethers";
import DataList from "./Resources/DataList";
import { hideElement, showElement } from "@/lib/spCoin/guiControl";
import { useExchangeContext } from "@/lib/context/ExchangeContext";
import { getAddressAvatar } from "@/lib/network/utils";
import { Address } from "viem";

const TITLE_NAME = "Select a Recipient";
const INPUT_PLACE_HOLDER = "Type or paste recipient wallet address";
const ELEMENT_DETAILS = `This container allows for the entry selection of a valid recipient address.
When the address entry is completed and selected, this address will be verified prior to entry acceptance.
Currently, there is no image token lookup, but that is to come.`;

type Props = {
    callBackWallet: (walletAccount: WalletAccount) => void;
    setShowDialog: (showDialog: boolean) => void;
    showDialog: boolean;
};

export default function Dialog({ showDialog, setShowDialog, callBackWallet }: Props) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const [recipientInput, setRecipientInput] = useState("");
    const [walletElement, setWalletElement] = useState<WalletAccount | undefined>();
    const { exchangeContext } = useExchangeContext();
    const agentAccount = exchangeContext.agentAccount;

    useEffect(() => {
        showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close();
    }, [showDialog]);

    useEffect(() => {
        recipientInput === "" ? hideElement("recipientSelectGroup_ID") : showElement("recipientSelectGroup_ID");
        if (isAddress(recipientInput)) {
            setWalletDetails(recipientInput);
        }
    }, [recipientInput]);

    useEffect(() => {
        if (walletElement?.symbol) {
            setRecipientInput(walletElement.symbol);
        }
    }, [walletElement]);

    const closeDialog = useCallback(() => {
        setRecipientInput("");
        setShowDialog(false);
        dialogRef.current?.close();
    }, [setShowDialog]);

    const setWalletDetails = async (walletAddr: string) => {
        try {
            if (isAddress(walletAddr)) {
                const retResponse = await getWagmiBalanceOfRec(walletAddr);
                const walletAccount: WalletAccount = {
                    address: recipientInput,
                    symbol: retResponse.symbol,
                    avatar: customUnknownImage_png.src,
                    name: "",
                    type: "",
                    website: "",
                    description: "",
                    status: ""
                };
                setWalletElement(walletAccount);
                return true;
            }
        } catch (e: any) {
            alert("ERROR: " + e.message);
        }
        return false;
    };

    const handleSelectWallet = useCallback(() => {
        const { exchangeContext } = useExchangeContext(); // ✅ Using `useExchangeContext()`
        
        if (!walletElement) {
            alert("Invalid Wallet address: " + recipientInput);
            return;
        }
        if (walletElement.address === agentAccount?.address) {
            alert(`Recipient cannot be the same as Agent (${agentAccount.symbol})`);
            return;
        }
        walletElement.avatar = getAddressAvatar(exchangeContext, walletElement.address as Address, FEED_TYPE.RECIPIENT_WALLETS);
        callBackWallet(walletElement);
        closeDialog();
    }, [walletElement, agentAccount, callBackWallet, closeDialog]);

    return (
        <dialog id="recipientDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white" onClick={closeDialog}>X</div>
            </div>
            <div className={styles.modalBox}>
                <div className={styles.modalElementSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Icon" />
                        <input className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={(e) => setRecipientInput(e.target.value)} value={recipientInput} />
                    </div>
                </div>
                <div id="recipientSelectGroup_ID" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
                        <div className="cursor-pointer flex flex-row justify-between" onClick={handleSelectWallet}>
                            <Image id="walletImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Unknown Wallet" />
                            <div>
                                <div className={styles.elementName}>{recipientInput || "Select Wallet"}</div>
                                <div className={styles.elementSymbol}>User Specified Wallet</div>
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white" onClick={() => alert(ELEMENT_DETAILS)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Icon" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.RECIPIENT_WALLETS} updateTokenCallback={handleSelectWallet} />
                </div>
            </div>
        </dialog>
    );
}
