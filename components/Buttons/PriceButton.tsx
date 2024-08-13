import React, { useEffect } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { ExchangeContext, TradeData } from '@/lib/structure/types'

type Props = {
    exchangeContext:ExchangeContext,
    tradeData:TradeData
  }

const PriceButton = ({exchangeContext, tradeData}:Props) => {
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
