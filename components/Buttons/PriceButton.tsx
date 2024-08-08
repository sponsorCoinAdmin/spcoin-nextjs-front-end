import React, { useEffect } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { TradeData } from '@/lib/structure/types';

type Props = {
    tradeData:TradeData,
  }

const PriceButton = ({
    tradeData}:Props) => {

    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }
  return (
    <div>
        {!tradeData.connectedWalletAddr ?
            (<CustomConnectButton />) :
            (<ExchangeButton  tradeData={tradeData} />)
        }
    </div>
);
}

export default PriceButton;
