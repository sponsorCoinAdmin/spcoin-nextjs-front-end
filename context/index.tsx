'use client'
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { EXCHANGE_STATE, ExchangeTokens } from '@/app/lib/structure/types';
import { createContext, useState, useContext } from 'react';
 
const initialExchangeTokens = (network:string|number) => {
    const defaultNetworkSettings = getDefaultNetworkSettings(network)
    let exchangeTokens:ExchangeTokens = {
      state: EXCHANGE_STATE.PRICE,
      slippage:"0.02",
      sellToken: defaultNetworkSettings.defaultSellToken,
      buyToken: defaultNetworkSettings.defaultBuyToken,
      recipientWallet: defaultNetworkSettings.defaultRecipient,      
      agentWallet: defaultNetworkSettings.defaultAgent        
    }
    return exchangeTokens;
  }

const context = initialExchangeTokens('ethereum');
const ExchangeContext = createContext(context);
const ExchangeProvider = ExchangeContext.Provider
const ExchangeConsumer = ExchangeContext.Consumer

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    let [exchangeTokens, setExchangeTokens] = useState<ExchangeTokens>(context);

    return (
        <>
        <ExchangeProvider value={exchangeTokens}>
            <div>{children}</div>
        </ExchangeProvider>
        </>
    )
}

export function useExchangeContext() {
    return useContext(ExchangeContext);
}

export {ExchangeProvider, ExchangeConsumer}