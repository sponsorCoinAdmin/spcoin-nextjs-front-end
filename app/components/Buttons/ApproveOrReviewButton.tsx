import React from 'react'
import styles from '../../styles/Exchange.module.css'

import {
    erc20ABI,
    useContractRead,
    usePrepareContractWrite,
    useContractWrite,
    useWaitForTransaction,
    type Address,
} from "wagmi";

const BURN_ADDRESS = "0x0000000000000000000000000000000000000000"
const ENV_ADDRESS:any = process.env.NEXT_PUBLIC_EXCHANGE_PROXY;
const EXCHANGE_PROXY:Address  = ENV_ADDRESS === undefined ? BURN_ADDRESS : ENV_ADDRESS
const MAX_ALLOWANCE = BigInt(process.env.NEXT_PUBLIC_MAX_ALLOWANCE === undefined ? "0" : process.env.NEXT_PUBLIC_MAX_ALLOWANCE)

// console.debug("MAX_ALLOWANCE              = " + MAX_ALLOWANCE);
// console.debug("EXCHANGE_PROXY             = " + EXCHANGE_PROXY);

function ApproveOrReviewButton({
    connectedWalletAddr,
    onClick,
    tokenToSellAddr,
    disabled,
  }: {
    connectedWalletAddr: Address;
    onClick: () => void;
    tokenToSellAddr: Address;
    disabled?: boolean;
  }) {
    console.log("ApproveOrReviewButton:connectedWalletAddr: " + connectedWalletAddr);
    console.log("ApproveOrReviewButton:tokenToSellAddr: " + tokenToSellAddr);
    console.log("ApproveOrReviewButton:disabled: " + disabled);
    // 1. Read from erc20, does spender (0x Exchange Proxy) have allowance?
    const { isError, data: allowance, refetch } = useContractRead({
      address: tokenToSellAddr,
      abi: erc20ABI,
      functionName: "allowance",
      args: [connectedWalletAddr, EXCHANGE_PROXY],
      onError(error) {
        console.log('***ERROR*** useContractRead Error', error)
      },
    });
    console.log("ApproveOrReviewButton:AFTER useContractRead()");
    console.log("isError:" + isError + " allowance:" + allowance + " refetch:"+ refetch);
  
    // 2. (only if no allowance): write to erc20, approve 0x Exchange Proxy to spend max integer
    const { config } = usePrepareContractWrite({
      address: tokenToSellAddr,
      abi: erc20ABI,
      functionName: "approve",
      args: [EXCHANGE_PROXY, MAX_ALLOWANCE],
    });
    console.log("ApproveOrReviewButton:AFTER usePrepareContractWrite()");
  
    const {
      data: writeContractResult,
      writeAsync: approveAsync,
      error,
    } = useContractWrite(config);

    console.log("ApproveOrReviewButton:AFTER useContractWrite()");

    const { isLoading: isApproving } = useWaitForTransaction({
      hash: writeContractResult ? writeContractResult.hash : undefined,
      onSuccess(data) {
        refetch();
      },
    });

    console.log("ApproveOrReviewButton:AFTER useWaitForTransaction()");

    if (error) {
      return <div>Something went wrong: {error.message}</div>;
    }
  
    // Approve Button
    if (allowance === 0n && approveAsync) {
      return (
        <>
          <button
            type="button"
            className={styles["exchangeButton"] + " " + styles["approveButton"]}
            onClick={async () => {
              const writtenValue = await approveAsync();
            }}
          >
            {isApproving ? "Approving…" : "Approve"}
          </button>
        </>
      );
    }
  
    // Bad Request
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
         className={styles["exchangeButton"] + " " + styles["swapButton"]}
      >
        {disabled ? "Insufficient Balance" : "Review Trade"}
      </button>
    );
  }

export default ApproveOrReviewButton
