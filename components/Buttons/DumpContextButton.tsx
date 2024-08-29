import React, { useEffect } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { ExchangeContext, TradeData } from '@/lib/structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils';
import styles from '@/styles/Exchange.module.css'
import { stringifyBigInt } from '@/lib/spCoin/utils';

type Props = {
    exchangeContext:ExchangeContext,
    tradeData:TradeData
  }

const PriceButton = ({exchangeContext, tradeData}:Props) => {
    
    const show = () => {
        // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
        console.debug(`CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
      }
    
    return (
        <div>
            {!exchangeContext.connectedAccountAddr || exchangeContext.connectedAccountAddr === BURN_ADDRESS?
                (<CustomConnectButton />) :
                (<ExchangeButton  exchangeContext={exchangeContext} tradeData={tradeData} />)
            }
            <button
                onClick={show}
                // disabled={true}
                type="button"
                className={styles["exchangeButton"]}
                >
                Dump Context
            </button>
        </div>
    );
}

export default PriceButton;
