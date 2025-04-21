'use client';

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAccount } from "wagmi";

import { useBuyTokenContract, useContainerType, useExchangeContext, useSellTokenContract } from '@/lib/context/contextHooks';
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect from "@/components/Dialogs/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from "@/lib/structure/types";
import { isAddress, Address } from "viem";

// Token Address Input Select States
export enum InputState {
  EMPTY_INPUT,
  VALID_INPUT,
  INVALID_ADDRESS_INPUT,
  CONTRACT_NOT_FOUND_INPUT,
  DUPLICATE_INPUT,
  IS_LOADING,
  CLOSE_INPUT,
}

export const getInputStateString = (state: InputState): string => {
  switch (state) {
    case InputState.EMPTY_INPUT:
      return 'EMPTY_INPUT';
    case InputState.VALID_INPUT:
      return 'VALID_INPUT';
    case InputState.INVALID_ADDRESS_INPUT:
      return 'INVALID_ADDRESS_INPUT';
    case InputState.CONTRACT_NOT_FOUND_INPUT:
      return 'CONTRACT_NOT_FOUND_INPUT';
    case InputState.DUPLICATE_INPUT:
      return 'DUPLICATE_INPUT';
    case InputState.IS_LOADING:
      return 'IS_LOADING';
    case InputState.CLOSE_INPUT:
      return 'CLOSE_INPUT';
    default:
      return 'UNKNOWN_INPUT_STATE';
  }
};

type Props = {
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
};

export default function TokenSelectDialog({
  showDialog,
  setShowDialog
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [inputField, setInputField] = useState<string | undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const [containerType, setContainerType] = useContainerType();

  useEffect(() => {
    setInputState(InputState.EMPTY_INPUT)
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  useEffect(() => {
    if (inputState === InputState.CLOSE_INPUT) {
      closeDialog();
    }
  }, [inputState]);

  useEffect(() => {
    if (ACTIVE_ACCOUNT_ADDRESS) {
      setActiveAccount(ACTIVE_ACCOUNT_ADDRESS as Address);
    }
  }, [ACTIVE_ACCOUNT_ADDRESS]);

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

  const closeDialog = useCallback(() => {
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

  return (
    <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">
          {containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? "Select a Token to Sell"
            : "Select a Token to to Buy"}
        </h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}>
          X
        </div>
      </div>

      <div className={styles.modalBox}>
          <InputSelect
            inputState={inputState}
            setInputState={setInputState}
          />
        <div className={styles.modalScrollBar}>
          <DataList
            inputState={inputState}
            setInputState={setInputState}
            dataFeedType={FEED_TYPE.TOKEN_LIST}
          />
        </div>
      </div>
    </dialog>
  );


/*
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
      // alert(`SELECT_ERROR: Invalid token: ${tokenContract?.name}`);
      return false;
    }

    if (isDuplicateToken(tokenContract.address)) {
      console.log("[updateTokenCallback] Exiting: Duplicate token", tokenContract.symbol);
      // alert(`SELECT_ERROR: Duplicate token: ${tokenContract.symbol}`);
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
*/
}
