'use client';

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";

import { useExchangeContext } from '@/lib/context/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect, { InputState } from "@/components/panes/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from "@/lib/structure/types";
import {
  BURN_ADDRESS,
  defaultMissingImage,
  badTokenAddressImage,
  getTokenAvatar
} from "@/lib/network/utils";
import { isAddress, Address } from "viem";

import info_png from "@/public/assets/miscellaneous/info1.png";

const TITLE_NAME = "Select a token to select";
const INPUT_PLACE_HOLDER = "Type or paste token to select address";

type Props = {
  containerType: CONTAINER_TYPE;
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
  callBackSetter: (tokenContract: TokenContract) => void;
};

export default function AssetSelectDialog({
  containerType,
  showDialog,
  setShowDialog,
  callBackSetter,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [inputField, setInputField] = useState<string | undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>();
  const [inputState, setInputState] = useState<InputState>(InputState.TOKEN_NOT_FOUND_INPUT);
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();
  const { exchangeContext } = useExchangeContext();

  /** 📌 Dialog open/close behavior */
  useEffect(() => {
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  /** 📌 Set active wallet address for context */
  useEffect(() => {
    if (ACTIVE_ACCOUNT_ADDRESS) {
      setActiveAccount(ACTIVE_ACCOUNT_ADDRESS as Address);
    }
  }, [ACTIVE_ACCOUNT_ADDRESS]);

  /** 📌 Update input field value when token changes */
  useEffect(() => {
    setInputField(tokenContract?.address);
  }, [tokenContract]);

  const closeDialog = useCallback(() => {
    setInputField(undefined);
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  const isDuplicateToken = useCallback(
    (tokenAddress: string | undefined): boolean => {
      if (!tokenAddress) return false;
      return containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? exchangeContext.tradeData.buyTokenContract?.address === tokenAddress
        : exchangeContext.tradeData.sellTokenContract?.address === tokenAddress;
    },
    [containerType, exchangeContext.tradeData]
  );

  const cloneIfNetworkToken = useCallback(
    (tokenContract: TokenContract): TokenContract => {
      return tokenContract.address === BURN_ADDRESS
        ? { ...tokenContract, address: ACTIVE_ACCOUNT_ADDRESS as Address }
        : tokenContract;
    },
    [ACTIVE_ACCOUNT_ADDRESS]
  );

  /** 📌 Main callback from InputSelect */
  const updateTokenCallback = useCallback(
    (tokenContract: TokenContract | undefined, state: InputState): boolean => {
      setTokenContract(tokenContract);
      setInputState(state);

      if (state !== InputState.VALID_INPUT) {
        if (state === InputState.BAD_ADDRESS_INPUT) {
          alert(`SELECT_ERROR: Bad token address: ${inputField}`);
        } else if (state === InputState.EMPTY_INPUT) {
          alert(`SELECT_ERROR: Input is empty.`);
        } else {
          alert(`SELECT_ERROR: Token not found or undefined: ${inputField}`);
        }
        return false;
      }

      if (!tokenContract || !tokenContract.address || !isAddress(tokenContract.address)) {
        alert(`SELECT_ERROR: Invalid token: ${tokenContract?.name}`);
        return false;
      }

      const newToken = cloneIfNetworkToken(tokenContract);

      if (isDuplicateToken(newToken.address)) {
        alert(`SELECT_ERROR: Duplicate token: ${newToken.symbol}`);
        return false;
      }

      callBackSetter(newToken);
      closeDialog();
      return true;
    },
    [inputField, cloneIfNetworkToken, isDuplicateToken, callBackSetter, closeDialog]
  );

  const getErrorImage = (tokenContract?: TokenContract): string => {
    return tokenContract?.address && isAddress(tokenContract.address)
      ? defaultMissingImage
      : badTokenAddressImage;
  };

  return (
    <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
        <div className="cursor-pointer rounded border-none w-5 text-xl text-white" onClick={closeDialog}>
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <InputSelect
          placeHolder={INPUT_PLACE_HOLDER}
          passedInputField={inputField || ""}
          setTokenContractCallBack={updateTokenCallback}
        />

        {inputField && inputState === InputState.VALID_INPUT && (
          <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row justify-between" onClick={() => updateTokenCallback(tokenContract, inputState)}>
                <Image
                  id="tokenImage"
                  src={getTokenAvatar(tokenContract)}
                  height={40}
                  width={40}
                  alt="Token Image"
                  onError={(e) => {
                    const fallback = getErrorImage(tokenContract);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
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
          <DataList
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            updateTokenCallback={(tc) => updateTokenCallback(tc, InputState.VALID_INPUT)}
          />
        </div>
      </div>
    </dialog>
  );
}
