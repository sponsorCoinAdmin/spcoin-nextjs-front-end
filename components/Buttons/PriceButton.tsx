import React, { useEffect } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { ExchangeContext, TradeData } from '@/lib/structure/types'

type Props = {
    exchangeContext:ExchangeContext,
    tradeData:TradeData
  }

const PriceButton = ({exchangeContext, tradeData}:Props) => {

    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }
  return (
    <div>
        {!exchangeContext.connectedAccountAddr ?
            (<CustomConnectButton />) :
            (<ExchangeButton  exchangeContext={exchangeContext} tradeData={tradeData} />)
        }
    </div>
);
}

export default PriceButton;
