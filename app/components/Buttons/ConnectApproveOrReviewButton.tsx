import React from 'react'
import ApproveOrReviewButton from './ApproveOrReviewButton';
import CustomConnectButton from './CustomConnectButton';
import { type Address } from "wagmi";

  import {
    MAX_ALLOWANCE,
    EXCHANGE_PROXY,
  } from "../../resources/data/constants";

const NEXT_PUBLIC_MAX_ALLOWANCE = process.env.NEXT_PUBLIC_MAX_ALLOWANCE === undefined ? "0" : process.env.NEXT_PUBLIC_MAX_ALLOWANCE
const NEXT_PUBLIC_EXCHANGE_PROXY = process.env.NEXT_PUBLIC_EXCHANGE_PROXY === undefined ? "0" : process.env.NEXT_PUBLIC_EXCHANGE_PROXY

function ConnectApproveOrReviewButton({
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
  return (
    <div>
      {connectedWalletAddr ? (
        <ApproveOrReviewButton
          tokenToSellAddr={tokenToSellAddr}
          connectedWalletAddr={connectedWalletAddr}
          onClick={onClick}
          disabled={disabled}
        />
        ) : (
        <CustomConnectButton />)}
    </div>
  )
}

export default ConnectApproveOrReviewButton
