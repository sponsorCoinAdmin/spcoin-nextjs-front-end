'use client'
import { useEffect, useState } from 'react';
import { getDefaultNetworkSettings } from '@/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, EXCHANGE_STATE, ExchangeContext, TradeData } from '@/lib/structure/types';
import { TokenContract } from "@/lib/structure/types";
import { useAccount, useChainId } from 'wagmi';
// import { isSpCoin } from '@/lib/spCoin/utils';

let chainId:number = 1;
let initialContext:ExchangeContext;

const isSpCoin = (TokenContract:TokenContract) => {
    // alert(`isSpCoin = ${JSON.stringify(TokenContract,null,2)}`)
    return TokenContract.symbol === "SpCoin" ? true:false
  }  

const getInitialContext = (chain:any) => {
    let tradeData =  getInitialDataSettings(chain);
    let initialContext:ExchangeContext = {
        tradeData: tradeData,
    }
    return initialContext;
}

function getInitialDataSettings(chain:any | number): TradeData {
    const chainId:number = chain || 1;
    const defaultNetworkSettings = getDefaultNetworkSettings(chainId)
    const ifBuyTokenSpCoin = isSpCoin(defaultNetworkSettings.defaultBuyToken)

    let tradeData:TradeData = {

        network: defaultNetworkSettings.networkHeader,

        recipientAccount: defaultNetworkSettings.defaultRecipient,
        agentAccount: defaultNetworkSettings.defaultAgent,

        sellTokenContract: defaultNetworkSettings.defaultSellToken,
        buyTokenContract: defaultNetworkSettings.defaultBuyToken,

        connectedWalletAddr: undefined,
        sellAmount: "0",
        sellBalanceOf: 0n,
        sellFormattedBalance: '0',
        buyAmount: "0",
        buyBalanceOf: 0n,
        buyFormattedBalance: '0',
        tradeDirection: "sell",
        displayState: ifBuyTokenSpCoin ? DISPLAY_STATE.SPONSOR_SELL_ON : DISPLAY_STATE.OFF,
        slippage: "0.02",
    }
    return tradeData;
}

const resetContextNetwork = (chain:any) => {
    const networkName = chain.name.toLowerCase();
    console.debug("resetContextNetwork: newNetworkName = " + networkName);
    console.debug("resetContextNetwork: initialContext.tradeData.network.name = " + initialContext.tradeData.network.name);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    initialContext.tradeData.network.chainId = chain.id;
    initialContext.tradeData.network.name = networkName
    initialContext.tradeData.displayState = isSpCoin(defaultNetworkSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR_SELL_ON:DISPLAY_STATE.OFF,
    initialContext.tradeData.slippage = "0.02",
    initialContext.tradeData.sellTokenContract = defaultNetworkSettings.defaultSellToken,
    initialContext.tradeData.buyTokenContract = defaultNetworkSettings.defaultBuyToken,
    initialContext.tradeData.recipientAccount = defaultNetworkSettings.defaultRecipient,
    initialContext.tradeData.agentAccount = defaultNetworkSettings.defaultAgent
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
    initialContext = context;

    return (
        <div>
            {children}
        </div>
    )
}

initialContext = getInitialContext(chainId);
// alert(`getInitialContext:initialContext = ${initialContext}`)

export {
    initialContext,
    resetContextNetwork
}
