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
let setExchangeContext : (exchangeContext:ExchangeContext) => void
let exchangeContext:ExchangeContext;

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
//    alert("ExchangeWrapper")
    const network = useChainId()
    const initialContext = initialExchangeContext(network);
    if (!InitialExchangeState)
        InitialExchangeState = initializeContext(initialContext);
        const [exchangeContext, setExContext] = useState<ExchangeContext>(initialContext);

        setExchangeContext = setExContext;
    return (
        <>
            <ExchangeProvider value={exchangeContext}>
                <div>{children}</div>
            </ExchangeProvider>
        </>
    )
}

function useExchangeContext() {
    exchangeContext = useContext<ExchangeContext>(InitialExchangeState);
    return exchangeContext;
}

export {
    setExchangeContext,
    useExchangeContext,
}
