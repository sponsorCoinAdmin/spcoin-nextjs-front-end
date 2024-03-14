'use client'
import { ExchangeTokens} from '@/app/(menuPages)/Exchange';
import { getDefaultNetworkSettings } from '@/app/lib/network/initialize/defaultNetworkSettings';
import { createContext, useState, useContext } from 'react';

enum  EXCHANGE_STATE {
    PRICE, QUOTE, PENDING
  }
  
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
const AppContext = createContext(context);

const exchangeDefaults:ExchangeTokens = initialExchangeTokens('ethereum')

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    let [exchangeTokens, setExchangeTokens] = useState<ExchangeTokens>(context);

    return (
        <>
        <AppContext.Provider value={exchangeTokens}>
            <div>{children}</div>
        </AppContext.Provider>
        </>
    )
}

export function useAppContext() {
    return useContext(AppContext);
}