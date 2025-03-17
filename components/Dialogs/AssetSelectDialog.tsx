"use client";

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { isAddress } from "ethers";
import { useAccount } from "wagmi";

import { useExchangeContext } from "@/lib/context/ExchangeContext";
import { stringifyBigInt } from "@/lib/spCoin/utils";
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect from "../panes/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from "@/lib/structure/types";
import { BURN_ADDRESS, defaultMissingImage, getTokenAvatar } from "@/lib/network/utils";
import { Address } from "viem";

import info_png from "@/public/assets/miscellaneous/info1.png";

const TITLE_NAME = "Select a token to select";
const INPUT_PLACE_HOLDER = "Type or paste token to select address";

type Props = {
  containerType: CONTAINER_TYPE;
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
  callBackSetter: (tokenContract: TokenContract) => void;
};

export default function Dialog({ containerType, showDialog, setShowDialog, callBackSetter }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [inputField, setInputField] = useState<string | undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>();
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();
  const { exchangeContext } = useExchangeContext();

  /** 📌 Handle Dialog Visibility */
  useEffect(() => {
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  /** 📌 Set Active Account */
  useEffect(() => {
    if (ACTIVE_ACCOUNT_ADDRESS) {
      setActiveAccount(ACTIVE_ACCOUNT_ADDRESS as Address);
    }
  }, [ACTIVE_ACCOUNT_ADDRESS]);

  /** 📌 Sync Input Field with Selected Token */
  useEffect(() => {
    setInputField(tokenContract?.address);
  }, [tokenContract]);

  /** 📌 Close Dialog */
  const closeDialog = useCallback(() => {
    setInputField(undefined);
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  /** 📌 Check if the Selected Token is a Duplicate */
  const isDuplicateToken = useCallback(
    (tokenAddress: string | undefined): boolean => {
      if (!tokenAddress) return false;
      return containerType === CONTAINER_TYPE.INPUT_SELL_PRICE
        ? exchangeContext.tradeData.buyTokenContract?.address === tokenAddress
        : exchangeContext.tradeData.sellTokenContract?.address === tokenAddress;
    },
    [containerType, exchangeContext.tradeData]
  );

  /** 📌 Clone Network Token if Needed */
  const cloneIfNetworkToken = useCallback(
    (tokenContract: TokenContract): TokenContract => {
      return tokenContract.address === BURN_ADDRESS
        ? { ...tokenContract, address: ACTIVE_ACCOUNT_ADDRESS as Address }
        : tokenContract;
    },
    [ACTIVE_ACCOUNT_ADDRESS]
  );

  /** 📌 Handle Token Selection */
  const updateTokenCallback = useCallback(
    (tokenContract: TokenContract | undefined): boolean => {
      if (!tokenContract || !tokenContract.address) {
        alert(`SELECT_ERROR: Invalid Token contract : ${inputField}`);
        return false;
      }

      if (!isAddress(tokenContract.address)) {
        alert(`SELECT_ERROR: ${tokenContract.name} has invalid token address: ${tokenContract.address}`);
        return false;
      }

      const newToken = cloneIfNetworkToken(tokenContract);

      if (isDuplicateToken(newToken.address)) {
        alert(`SELECT_ERROR: Sell Token cannot be the same as Buy Token (${newToken.symbol})`);
        console.error(`ERROR: Sell Token cannot be the same as Buy Token (${newToken.symbol})`);
        return false;
      }

      callBackSetter(newToken);
      closeDialog();
      return true;
    },
    [inputField, cloneIfNetworkToken, isDuplicateToken, callBackSetter, closeDialog]
  );

  return (
    <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
        <div className="cursor-pointer rounded border-none w-5 text-xl text-white" onClick={closeDialog}>
          X
        </div>
      </div>
      <div className={styles.modalBox}>
        <InputSelect placeHolder={INPUT_PLACE_HOLDER} passedInputField={inputField || ""} setTokenContractCallBack={setTokenContract} />

        {inputField && (
          <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row justify-between" onClick={() => updateTokenCallback(tokenContract)}>
                <Image id="tokenImage" src={getTokenAvatar(tokenContract) || defaultMissingImage} height={40} width={40} alt="Token Image" />
                <div>
                  <div className={styles.elementName}>{tokenContract?.name}</div>
                  <div className={styles.elementSymbol}>{tokenContract?.symbol}</div>
                </div>
              </div>
              <div
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={() => alert(`Token Contract Address = ${stringifyBigInt(tokenContract?.address)}`)}
              >
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
              </div>
            </div>
          </div>
        )}
        <div className={styles.modalScrollBar}>
          <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} updateTokenCallback={updateTokenCallback} />
        </div>
      </div>
    </dialog>
  );
}
