'use client'
import { useEffect, useState } from 'react';
import { getDefaultNetworkSettings } from '@/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeContext, TradeData } from '@/lib/structure/types';
import { TokenContract } from "@/lib/structure/types";
import { config } from '@/lib/wagmi/wagmiConfig'
import { useAccount, useChainId } from 'wagmi';
// import { isSpCoin } from '@/lib/spCoin/utils';

let chainId:number = 1;
let exchangeContext:ExchangeContext;

const isSpCoin = (TokenContract:TokenContract) => {
    // alert(`isSpCoin = ${JSON.stringify(TokenContract,null,2)}`)
    return TokenContract.symbol === "SpCoin" ? true:false
  }  

const getInitialContext = (chain:any) => {
    const networkName = ( chain && chain.name) ?  chain.name.toLowerCase() : 1;
    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    const defaultBuyToken = defaultNetworkSettings.defaultBuyToken
    const tokenIsSpCoin = isSpCoin(defaultBuyToken);
    let initialContext:ExchangeContext = {
        data: getInitialDataSettings(networkName, isSpCoin(defaultBuyToken)),
        network: defaultNetworkSettings.networkHeader,
        sellTokenContract: defaultNetworkSettings.defaultSellToken,
        buyTokenContract: defaultNetworkSettings.defaultBuyToken,
        recipientWallet: defaultNetworkSettings.defaultRecipient,
        agentWallet: defaultNetworkSettings.defaultAgent
    }
    return initialContext;
}

function getInitialDataSettings(network: string | number, ifSpCoin:boolean): { chainId: number; networkName: string; sellAmount: any; buyAmount: any; tradeDirection: string; displayState: DISPLAY_STATE; state: EXCHANGE_STATE; slippage: string; } {
let data:TradeData = {
        chainId: 1,
        networkName: "ethereum",
        sellAmount: "0",
        buyAmount: "0",
        tradeDirection: "sell",
        state: EXCHANGE_STATE.PRICE,
        displayState: ifSpCoin ? DISPLAY_STATE.SPONSOR_SELL_ON : DISPLAY_STATE.OFF,
        slippage: "0.02"
    }
    return data;
}

const resetContextNetwork = (chain:any) => {
    const networkName = chain.name.toLowerCase();
    console.debug("resetContextNetwork: newNetworkName = " + networkName);
    console.debug("resetContextNetwork: exchangeContext.networkName = " + exchangeContext.data.networkName);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.data.chainId = chain.id;
    exchangeContext.data.networkName = networkName
    exchangeContext.data.state = EXCHANGE_STATE.PRICE;
    exchangeContext.data.displayState = isSpCoin(defaultNetworkSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR_SELL_ON:DISPLAY_STATE.OFF,
    exchangeContext.data.slippage = "0.02",
    exchangeContext.sellTokenContract = defaultNetworkSettings.defaultSellToken,
    exchangeContext.buyTokenContract = defaultNetworkSettings.defaultBuyToken,
    exchangeContext.recipientWallet = defaultNetworkSettings.defaultRecipient,
    exchangeContext.agentWallet = defaultNetworkSettings.defaultAgent
}

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    const { chain } = useAccount();

    alert(`Context.Outside:useEffect(() => chain = ${JSON.stringify(chain, null, 2)}`);

    useEffect(() => {
        alert(`Context:useEffect(() => chain = ${JSON.stringify(chain, null, 2)}`);
      }, [chain]);
    
    const [context, setContext] = useState<ExchangeContext>(getInitialContext(chain))
    exchangeContext = context;

    return (
        <div>
            {children}
        </div>
    )
}

exchangeContext = getInitialContext(chainId);
// alert(`getInitialContext:exchangeContext = ${exchangeContext}`)

export {
    exchangeContext,
    resetContextNetwork
}
