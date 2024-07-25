import React from 'react';
import ApproveOrReviewButtonTEST from './ApproveOrReviewButtonTEST';
import { EXCHANGE_STATE, TokenContract } from '@/lib/structure/types';
import CustomConnectButton from './CustomConnectButton';
import { Address } from 'viem';

type Props = {
    connectedWalletAddr: Address | undefined;
    sellTokenContract: TokenContract, 
    buyTokenContract: TokenContract,
    sellBalance:string,
    disabled: boolean,
    slippage:string | null,
  }

const PriceButton = ({
    connectedWalletAddr,
    sellTokenContract,
    buyTokenContract,
    sellBalance,
    slippage,
    disabled}:Props) => {

    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }
    // alert("HERE 0")

  return (
    <div>
        {!connectedWalletAddr ?
            (<CustomConnectButton />) :
            (<ApproveOrReviewButtonTEST  />)
                // token={sellTokenContract}
                // connectedWalletAddr={connectedWalletAddr}
                // sellBalance={sellBalance}
                // disabled={disabled}
                // setErrorMessage={setErrorMessage}/>)
        }
    </div>
);
}

export default PriceButton;
