'use client'
import { useEffect } from 'react';
import { getDefaultNetworkSettings, getInitialContextMap } from '@/lib/network/initialize/defaultNetworkSettings';
import { AccountRecord, ExchangeContext, NetworkElement, SP_COIN_DISPLAY, TokenContract, TradeData, TRANSACTION_TYPE } from '@/lib/structure/types';
import { useAccount, useChainId } from 'wagmi';

const chainId:number = 1;
const defaultInitialTradeData:TradeData = {
    sellAmount: 0n,
    sellBalanceOf: 0n,
    formattedSellAmount: '0',
    buyAmount: 0n,
    buyBalanceOf: 0n,
    formattedBuyAmount: '0',
    transactionType: TRANSACTION_TYPE.SELL_EXACT_OUT,
    slippage: "0.02"
};
let exchangeContext:ExchangeContext;
let exchangeContextMap;

function getInitialContext(chain:any | number): ExchangeContext {
    const chainId:number = chain || 1;
    const initialContextMap = getInitialContextMap(chainId);
    exchangeContext = {
        network: initialContextMap.get("networkHeader") as NetworkElement,
        recipientAccount: initialContextMap.get("defaultRecipient") as AccountRecord | undefined,
        agentAccount: initialContextMap.get("defaultAgent") as AccountRecord | undefined,
        sellTokenContract: initialContextMap.get("defaultSellToken") as TokenContract | undefined,
        buyTokenContract: initialContextMap.get("defaultBuyToken") as TokenContract | undefined,
        activeContainerId: "MainSwapContainer_ID",
        tradeData: defaultInitialTradeData,
        spCoinPanels: SP_COIN_DISPLAY.SELECT_BUTTON,
        test : {dumpContextButton:false}
    }
    exchangeContextMap = new Map(Object.entries(exchangeContext));

    // alert(`***Context.getInitialContext:sellTokenContract: ${JSON.stringify(defaultNetworkSettings.defaultSellToken,null,2)}`)
    // alert(`***Context.getInitialContext: ${JSON.stringify(defaultNetworkSettings,null,2)}`)
    return exchangeContext;
}

const resetNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
    console.debug("resetNetworkContext: newNetworkName = " + networkName);
    console.debug("resetNetworkContext: exchangeContext.network.name = " + exchangeContext.network.name);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    exchangeContext.network.chainId = chain?.id;

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.network.name = networkName
    exchangeContext.sellTokenContract = defaultNetworkSettings.defaultSellToken,
    exchangeContext.buyTokenContract = defaultNetworkSettings.defaultBuyToken,
    exchangeContext.recipientAccount = defaultNetworkSettings.defaultRecipient,
    exchangeContext.agentAccount = defaultNetworkSettings.defaultAgent
    // alert(`Context.resetNetworkContext:sellTokenContract: ${stringifyBigInt(defaultNetworkSettings.defaultSellToken)}`)
}

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    const { chain } = useAccount();

    alert(`Context.Outside:useEffect(() => chain = ${JSON.stringify(chain, null, 2)}`);

    useEffect(() => {
        alert(`Context:useEffect(() => chain = ${JSON.stringify(chain, null, 2)}`);
      }, [chain]);
    

    return (
        <div>
            {children}
        </div>
    )
}

getInitialContext(chainId);

export {
    resetNetworkContext,
    exchangeContext
}
