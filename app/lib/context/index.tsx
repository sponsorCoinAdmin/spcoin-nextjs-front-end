'use client'
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeContext } from '@/app/lib/structure/types';
import { useState, useContext } from 'react';
import { initializeContext, ExchangeProvider } from './context';
import { isSpCoin } from '../spCoin/utils';

const initialExchangeContext = (network:string|number) => {
    console.log(`initialExchangeContext:ExchangeWrapper chainId = ${network}`)

    const defaultNetworkSettings = getDefaultNetworkSettings(network)
    let exchangeContext:ExchangeContext = {
      state: EXCHANGE_STATE.PRICE,
      displayState: isSpCoin(defaultNetworkSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR:DISPLAY_STATE.OFF,
      slippage:"0.02",
      sellToken: defaultNetworkSettings.defaultSellToken,
      buyToken: defaultNetworkSettings.defaultBuyToken,
      recipientWallet: defaultNetworkSettings.defaultRecipient,      
      agentWallet: defaultNetworkSettings.defaultAgent        
    }
    return exchangeContext;
}

// Returns
const context:any = initializeContext(initialExchangeContext("ethereum"));
let exchangeContext:ExchangeContext;

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    //  alert(`ExchangeWrapper:ExchangeWrapper exchangeContext = ${exchangeContext}`)
     const [exContext, setExContext] = useState<ExchangeContext>(useContext<ExchangeContext>(context));

    exchangeContext = exContext;

    return (
        <>
            <ExchangeProvider value={exchangeContext}>
                <div>{children}</div>
            </ExchangeProvider>
        </>
    )
}

function useExchangeContext() {
    exchangeContext = useContext<ExchangeContext>(context);
    return exchangeContext;
}   

export {
    exchangeContext
}
