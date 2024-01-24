import React from 'react'
import ApproveOrReviewButton from './ApproveOrReviewButton';
import CustomConnectButton from './CustomConnectButton';
import { type Address } from "wagmi";

function ConnectApproveOrReviewButton({
    connectedWalletAddr,
    token,
    onClick,
    disabled,
  }: {
    connectedWalletAddr: Address;
    token:any
    onClick: () => void;
    disabled?: boolean;
  }) {
  return (
    <div>
      {connectedWalletAddr ? (
        <ApproveOrReviewButton
          token={token}
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
