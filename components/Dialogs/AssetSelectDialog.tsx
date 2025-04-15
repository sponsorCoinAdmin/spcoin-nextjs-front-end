'use client';

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";

import { useExchangeContext } from '@/lib/context/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect, { InputState } from "@/components/Dialogs/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from "@/lib/structure/types";
import {
  defaultMissingImage,
  badTokenAddressImage,
  getTokenAvatar
} from "@/lib/network/utils";

import { isAddress, Address } from "viem";
import info_png from "@/public/assets/miscellaneous/info1.png";

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
  const [inputState, setInputState] = useState<InputState>(InputState.CONTRACT_NOT_FOUND_INPUT);
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const prevAddressRef = useRef<string | undefined>();

  const getTitleFromState = (state: InputState): string | JSX.Element => {
    switch (state) {
      case InputState.VALID_INPUT:
        return containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? "Select a Token to Sell" : "Select a Token to to Buy";
      case InputState.EMPTY_INPUT:
        return containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? "Select a Token to Sell" : "Select a Token to to Buy";
      case InputState.INVALID_ADDRESS_INPUT:
        return <span style={{ color: 'orange' }}>Entering a Valid Token Hex Address!</span>;
      case InputState.DUPLICATE_INPUT:
        return containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? <span style={{ color: 'orange' }}>Sell Address Cannot Be the Same as Buy Address</span>
          : <span style={{ color: 'orange' }}>Buy Address Cannot Be the Same as Sell Address</span>;
      case InputState.CONTRACT_NOT_FOUND_INPUT:
        return <span style={{ color: 'orange' }}>⚠️ Contract Not Found on BlockChain</span>;
      default:
        return <span style={{ color: 'red' }}>(Unknown Error ❓)</span>;
    }
  };

  useEffect(() => {
    setInputState(InputState.EMPTY_INPUT)
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  useEffect(() => {
    if (ACTIVE_ACCOUNT_ADDRESS) {
      setActiveAccount(ACTIVE_ACCOUNT_ADDRESS as Address);
    }
  }, [ACTIVE_ACCOUNT_ADDRESS]);

  const closeDialog = useCallback(() => {
    console.log(`closeDialog:updateTokenCallbackClosing AssertSelectDialog`)
    setInputField(undefined);
    setInputState(InputState.EMPTY_INPUT)
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  const isDuplicateToken = useCallback(
    (tokenAddress?: string): boolean => {
      if (!tokenAddress) return false;

      const { buyTokenContract, sellTokenContract } = exchangeContext.tradeData;
      const oppositeTokenAddress =
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? buyTokenContract?.address
          : sellTokenContract?.address;

      const isDuplicateContract = tokenAddress === oppositeTokenAddress;

      if (isDuplicateContract) {
        setInputState(InputState.DUPLICATE_INPUT);
      }

      return isDuplicateContract;
    },
    [containerType, exchangeContext.tradeData, setInputState]
  );

  const updateTokenCallback = useCallback(
    (
      tokenContract: TokenContract | undefined,
      state: InputState,
      shouldClose: boolean,
      ignorePrevSelection: boolean = false
    ): boolean => {
      console.log("[updateTokenCallback] tokenContract:", tokenContract, "state:", state, "shouldClose:", shouldClose);

      setInputState(state);

      if (state !== InputState.VALID_INPUT) {
        console.log("[updateTokenCallback] Exiting: Invalid state", state);
        return false;
      }

      if (!tokenContract || !tokenContract.address || !isAddress(tokenContract.address)) {
        console.log("[updateTokenCallback] Exiting: Invalid token or address", tokenContract);
        alert(`SELECT_ERROR: Invalid token: ${tokenContract?.name}`);
        return false;
      }

      if (isDuplicateToken(tokenContract.address)) {
        console.log("[updateTokenCallback] Exiting: Duplicate token", tokenContract.symbol);
        alert(`SELECT_ERROR: Duplicate token: ${tokenContract.symbol}`);
        return false;
      }

      if (!ignorePrevSelection && prevAddressRef.current === tokenContract.address) {
        if (shouldClose) {
          console.log("[updateTokenCallback] Previously selected token, but closing anyway:", tokenContract.address);
          closeDialog();
          return true; // ✅ Allow closure even if previously selected
        } else {
          console.log("[updateTokenCallback] Exiting: Previously selected token", tokenContract.address);
          return false;
        }
      }

      prevAddressRef.current = tokenContract.address;
      setTokenContract(tokenContract);
      callBackSetter(tokenContract);

      if (shouldClose) {
        closeDialog();
      }

      return true;
    },
    [isDuplicateToken, callBackSetter, closeDialog]
  );

  const getErrorImage = (tokenContract?: TokenContract): string => {
    return tokenContract?.address && isAddress(tokenContract.address)
      ? defaultMissingImage
      : badTokenAddressImage;
  };

  return (
    <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="indent-8 mt-4">{getTitleFromState(inputState)}</h1>
        <div className="cursor-pointer rounded border-none w-5 text-xl text-white" onClick={closeDialog}>
          X
        </div>
      </div>

      <div className={styles.modalBox}>
          <InputSelect
            placeHolder={INPUT_PLACE_HOLDER}
            passedInputField={inputField || ""}
            setTokenContractCallBack={(tc, state) => updateTokenCallback(tc, state, false)}
            setInputState={setInputState}
            closeDialog={() => closeDialog()}
          />

        {inputState === InputState.VALID_INPUT && (
          <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <div className="cursor-pointer flex flex-row justify-between">
                <Image
                  id="tokenImage"
                  src={getTokenAvatar(tokenContract)}
                  height={40}
                  width={40}
                  alt="Token Image"
                  onClick={() => { closeDialog() }}
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
              <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={() => alert(`Token Contract Address = ${stringifyBigInt(tokenContract?.address)}`)}>
                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
              </div>
            </div>
          </div>
        )}

        <div className={styles.modalScrollBar}>
          <DataList
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            updateTokenCallback={(tc) => updateTokenCallback(tc, InputState.VALID_INPUT, true)}
          />
        </div>
      </div>

    </dialog>
  );
}
