'use client'
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeContext } from '@/app/lib/structure/types';
import { useState, useEffect, useContext } from 'react';
import { initializeContext, ExchangeProvider } from './context';
import { isSpCoin } from '../spCoin/utils';
import { useChainId } from "wagmi";

const initialExchangeContext = (network:string|number) => {
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

let InitialExchangeState:any;
let CallBackSetter: (exchangeContext:ExchangeContext) => void;

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
//    alert("ExchangeWrapper")
    const network = useChainId()
    const initialContext = initialExchangeContext(network);
    if (!InitialExchangeState)
        InitialExchangeState = initializeContext(initialContext);
    let [exchangeContext, setExchangeContext] = useState<ExchangeContext>(initialContext);
 
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
