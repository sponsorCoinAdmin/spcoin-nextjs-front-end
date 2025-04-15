'use client';

import styles from "@/styles/Modal.module.css";
import DataList, { setActiveAccount } from "./Resources/DataList";
import InputSelect, { InputState } from "@/components/Dialogs/InputSelect";
import { CONTAINER_TYPE, FEED_TYPE, TokenContract } from "@/lib/structure/types";
import { isAddress, Address } from "viem";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useExchangeContext } from '@/lib/context/contextHooks';

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
          onClick={closeDialog}
        >
          X
        </div>
      </div>

      <div className={styles.modalBox}>
          <InputSelect
            containerType={containerType}
            placeHolder={INPUT_PLACE_HOLDER}
            passedInputField={inputField || ""}
            setTokenContractCallBack={(tc, state) => updateTokenCallback(tc, state, false)}
            setInputState={setInputState}
            closeDialog={() => closeDialog()}
          />
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
