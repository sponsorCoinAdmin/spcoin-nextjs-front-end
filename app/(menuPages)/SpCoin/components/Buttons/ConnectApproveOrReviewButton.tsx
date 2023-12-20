import React from 'react'
import ApproveOrReviewButton from './ApproveOrReviewButton';
import CustomConnectButton from './CustomConnectButton';
import { type Address } from "wagmi";

  import {
    MAX_ALLOWANCE,
    exchangeProxy,
  } from "../../lib/constants";


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
