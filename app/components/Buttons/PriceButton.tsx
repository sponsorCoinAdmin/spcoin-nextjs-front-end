import React from 'react';
import ApproveOrReviewButton from './ApproveOrReviewButton'
import { Address } from 'wagmi';
import { TokenElement } from '@/app/lib/structure/types';
import CustomConnectButton from './CustomConnectButton';

type Props = {
    connectedWalletAddr: Address | undefined;
    sellTokenElement: TokenElement, 
    buyTokenElement: TokenElement,
    sellBalance:string,
    disabled: boolean,
    slippage:string | null,
    setExchangeTokensCallback: () => void
  }


const PriceButton = ({
    connectedWalletAddr,
    sellTokenElement,
    buyTokenElement,
    sellBalance,
    slippage,
    disabled,
    setExchangeTokensCallback}:Props) => {
    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }

  return (
    <div>
        {connectedWalletAddr ?
            (<ApproveOrReviewButton 
                token={sellTokenElement}
                connectedWalletAddr={connectedWalletAddr}
                sellBalance={sellBalance}
                onClick={() => { setExchangeTokensCallback()}}
                disabled={disabled}
                setErrorMessage={setErrorMessage}/>) :
            (<CustomConnectButton />)
        }
    </div>
);
}

export default PriceButton;
