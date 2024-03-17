'use client'
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeContext } from '@/app/lib/structure/types';
import { useState, useEffect, useContext } from 'react';
import { initializeContext, ExchangeProvider } from './context';
import { isSpCoin } from '../spCoin/utils';
import { useChainId } from "wagmi";

const initialExchangeContext = (network:string|number) => {
    const defaultContextSettings = getDefaultNetworkSettings(network)
    let exchangeContext:ExchangeContext = {
      state: EXCHANGE_STATE.PRICE,
      displayState: isSpCoin(defaultContextSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR:DISPLAY_STATE.OFF,
      slippage:"0.02",
      sellToken: defaultContextSettings.defaultSellToken,
      buyToken: defaultContextSettings.defaultBuyToken,
      recipientWallet: defaultContextSettings.defaultRecipient,      
      agentWallet: defaultContextSettings.defaultAgent        
    }
    return exchangeContext;
  }

let InitialExchangeState:any;
let CallBackSetter: (exchangeContext:ExchangeContext) => void;

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    alert("ExchangeWrapper")
    const network = useChainId()
    const initialContext = initialExchangeContext(network);

    let [exchangeContext, setExchangeContext] = useState<ExchangeContext>(initialContext);
    InitialExchangeState = initializeContext(initialContext);

    useEffect(() => {
        // alert (`ExchangeWrapper:exchangeContext = ${JSON.stringify(exchangeContext,null,2)}`)
      },[exchangeContext]);    
      
    CallBackSetter = setExchangeContext

    return (
        <>
            <ExchangeProvider value={exchangeContext}>
                <div>{children}</div>
            </ExchangeProvider>
        </>
    )
}

function useExchangeContext() {
    let useExchangeContext:ExchangeContext = useContext<ExchangeContext>(InitialExchangeState);
    return useExchangeContext;
}

function useExchangeContextSetter() {
    return CallBackSetter;
}

export {
    useExchangeContext,
    useExchangeContextSetter,
}
