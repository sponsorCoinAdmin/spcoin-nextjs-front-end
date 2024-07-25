import React, { useEffect } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { ExchangeContext } from '@/lib/structure/types';

type Props = {
    exchangeContext:ExchangeContext,
  }

const PriceButton = ({
    exchangeContext}:Props) => {

    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }
  return (
    <div>
        {!exchangeContext.tradeData.connectedWalletAddr ?
            (<CustomConnectButton />) :
            (<ExchangeButton  exchangeContext={exchangeContext} />)
        }
    </div>
);
}

export default PriceButton;
