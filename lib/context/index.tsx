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
    let tradeData =  getInitialDataSettings(networkName, isSpCoin(defaultBuyToken));
    let initialContext:ExchangeContext = {
        tradeData: tradeData,
        network: defaultNetworkSettings.networkHeader,
        sellTokenContract: defaultNetworkSettings.defaultSellToken,
        buyTokenContract: defaultNetworkSettings.defaultBuyToken,
        recipientWallet: defaultNetworkSettings.defaultRecipient,
        agentWallet: defaultNetworkSettings.defaultAgent
    }
    return initialContext;
}

function getInitialDataSettings(network: string | number, ifSpCoin:boolean): TradeData {
    let tradeData:TradeData = {
        connectedWalletAddr: undefined,
        chainId: 1,
        networkName: "ethereum",
        sellAmount: "0",
        sellDecimals: 0,
        sellFormattedBalance: '0',
        buyAmount: "0",
        buyDecimals: 0,
        buyFormattedBalance: '0',
        tradeDirection: "sell",
        displayState: ifSpCoin ? DISPLAY_STATE.SPONSOR_SELL_ON : DISPLAY_STATE.OFF,
        slippage: "0.02",
    }
    return tradeData;
}

const resetContextNetwork = (chain:any) => {
    const networkName = chain.name.toLowerCase();
    console.debug("resetContextNetwork: newNetworkName = " + networkName);
    console.debug("resetContextNetwork: exchangeContext.networkName = " + exchangeContext.tradeData.networkName);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.tradeData.chainId = chain.id;
    exchangeContext.tradeData.networkName = networkName
    exchangeContext.tradeData.displayState = isSpCoin(defaultNetworkSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR_SELL_ON:DISPLAY_STATE.OFF,
    exchangeContext.tradeData.slippage = "0.02",
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
