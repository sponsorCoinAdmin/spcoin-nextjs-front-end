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
  INVALID_ADDRESS_INPUT,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
  CONTRACT_NOT_FOUND_LOCALLY,
  DUPLICATE_INPUT,
  VALID_INPUT_PENDING,
  VALID_INPUT,
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
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return 'CONTRACT_NOT_FOUND_ON_BLOCKCHAIN';
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
      return 'CONTRACT_NOT_FOUND_LOCALLY';
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
  const [externalAddress, setExternalAddress] = useState<string | undefined>(undefined);

  const updateInputState = useCallback((next: InputState) => {
    setInputState(prev => {
      if (prev !== next) {
        console.log(`[🔄 updateInputState] Changed to: ${next}`);
        return next;
      } else {
        console.log(`[⏸ updateInputState] No change (still: ${next})`);
        return prev;
      }
    });
  }, []);

  useEffect(() => {
    updateInputState(InputState.EMPTY_INPUT);
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog, updateInputState]);

  useEffect(() => {
    if (inputState === InputState.VALID_INPUT) {
      console.log('[TokenSelectDialog] VALID_INPUT confirmed — promoting to CLOSE_INPUT');
      updateInputState(InputState.CLOSE_INPUT);
    } else if (inputState === InputState.CLOSE_INPUT) {
      console.log('[TokenSelectDialog] CLOSE_INPUT detected — closing dialog');
      closeDialog();
    }
  }, [inputState, updateInputState]);

  useEffect(() => {
    if (ACTIVE_ACCOUNT_ADDRESS) {
      setActiveAccount(ACTIVE_ACCOUNT_ADDRESS as Address);
    }
  }, [ACTIVE_ACCOUNT_ADDRESS]);

  const closeDialog = useCallback(() => {
    setInputField(undefined);
    updateInputState(InputState.EMPTY_INPUT);
    setShowDialog(false);
    dialogRef.current?.close();
    setExternalAddress(undefined);
  }, [setShowDialog, updateInputState]);

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
          setInputState={updateInputState}
          externalAddress={externalAddress}
        />
        <div className={styles.modalScrollBar}>
          <DataList
            inputState={inputState}
            setInputState={updateInputState}
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            setExternalAddress={setExternalAddress}
          />
        </div>
      </div>
    </dialog>
  );
}
