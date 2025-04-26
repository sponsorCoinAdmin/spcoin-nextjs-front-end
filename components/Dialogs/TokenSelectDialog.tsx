'use client';

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAccount } from "wagmi";

import { useBuyTokenContract, useContainerType, useExchangeContext, useSellTokenContract } from '@/lib/context/contextHooks';
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect from "@/components/Dialogs/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, InputState, TokenContract } from "@/lib/structure/types";
import { Address } from "viem";

export default function TokenSelectDialog({
  showDialog,
  setShowDialog
}: {
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputSelectRef = useRef<{ clearInput: () => void } | null>(null); // ✅ Added ref to control InputSelect
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>();
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const [containerType] = useContainerType();
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
    if (showDialog) {
      updateInputState(InputState.EMPTY_INPUT);
      inputSelectRef.current?.clearInput(); // ✅ Clear input field when dialog opens
    }

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
            : "Select a Token to Buy"}
        </h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}>
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <InputSelect
          ref={inputSelectRef} // ✅ Pass the ref down
          externalAddress={externalAddress}
          setTokenContractCallback={(token, state) => {
            setTokenContract(token);
            updateInputState(state);
          }}
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
