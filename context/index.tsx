'use client'
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeTokens } from '@/app/lib/structure/types';
import { useState, useEffect, useContext } from 'react';
import { ExchangeProvider, initialContext } from './context';

const initialExchangeTokens = (network:string|number) => {
    const defaultNetworkSettings = getDefaultNetworkSettings(network)
    let exchangeContext:ExchangeTokens = {
      state: EXCHANGE_STATE.PRICE,
      displayState: DISPLAY_STATE.OFF,
      slippage:"0.02",
      sellToken: defaultNetworkSettings.defaultSellToken,
      buyToken: defaultNetworkSettings.defaultBuyToken,
      recipientWallet: defaultNetworkSettings.defaultRecipient,      
      agentWallet: defaultNetworkSettings.defaultAgent        
    }
    return exchangeContext;
  }

const context = initialExchangeTokens('ethereum');
const InitialExchangeState = initialContext(context);
let CallBackSetter: (exchangeTokens:ExchangeTokens) => void;

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    let [exchangeContext, setExchangeTokens] = useState<ExchangeTokens>(context);

    useEffect(() => {
        // alert (`ExchangeWrapper:exchangeContext = ${JSON.stringify(exchangeContext,null,2)}`)
      },[exchangeContext]);    CallBackSetter = setExchangeTokens

    return (
        <>
        <ExchangeProvider value={exchangeContext}>
            <div>{children}</div>
        </ExchangeProvider>
        </>
    )
}

export function useExchangeContext() {
    let useExchangeContext = useContext(InitialExchangeState);
    return useExchangeContext;
}

export function useExchangeContextSetter() {
    let useExchangeContext = useContext(InitialExchangeState);
    return CallBackSetter;
}
