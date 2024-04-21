import React from 'react';
import ApproveOrReviewButton from './ApproveOrReviewButton'
import ApproveOrReviewButtonTEST from './ApproveOrReviewButtonTEST';
import { EXCHANGE_STATE, TokenElement } from '@/app/lib/structure/types';
import CustomConnectButton from './CustomConnectButton';
import { Address } from 'viem';

type Props = {
    connectedWalletAddr: Address | undefined;
    sellTokenElement: TokenElement, 
    buyTokenElement: TokenElement,
    sellBalance:string,
    disabled: boolean,
    slippage:string | null,
  }

const PriceButton = ({
    connectedWalletAddr,
    sellTokenElement,
    buyTokenElement,
    sellBalance,
    slippage,
    disabled}:Props) => {

    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }
    // alert("HERE 0")

  return (
    <div>
        {connectedWalletAddr ?
            (<ApproveOrReviewButtonTEST 
                token={sellTokenElement}
                connectedWalletAddr={connectedWalletAddr}
                sellBalance={sellBalance}
                disabled={disabled}
                setErrorMessage={setErrorMessage}/>) :
            (<CustomConnectButton />)
        }
    </div>
);
}

export default PriceButton;
