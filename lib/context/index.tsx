'use client'
import { useEffect } from 'react';
import { getDefaultNetworkSettings } from '@/lib/network/initialize/defaultNetworkSettings';
import { ExchangeContext, TradeData, TRANSACTION_TYPE } from '@/lib/structure/types';
import { TokenContract } from "@/lib/structure/types";
import { useAccount, useChainId } from 'wagmi';
import { Address } from 'viem';
import { stringifyBigInt } from '../spCoin/utils';
// import { isSpCoin } from '@/lib/spCoin/utils';

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

const isSpCoin = (TokenContract:TokenContract) => {
    // alert(`isSpCoin = ${JSON.stringify(TokenContract,null,2)}`)
    return TokenContract.symbol === "SpCoin" ? true:false
}  

function getInitialContext(chain:any | number): ExchangeContext {
    const chainId:number = chain || 1;
    const defaultNetworkSettings = getDefaultNetworkSettings(chainId)
    const ifBuyTokenSpCoin = isSpCoin(defaultNetworkSettings.defaultBuyToken)

    exchangeContext = {
        network: defaultNetworkSettings.networkHeader,

        recipientAccount: defaultNetworkSettings.defaultRecipient,
        agentAccount: defaultNetworkSettings.defaultAgent,
        sellTokenContract: defaultNetworkSettings.defaultSellToken,
        buyTokenContract: defaultNetworkSettings.defaultBuyToken,

        tradeData: defaultInitialTradeData,
        test : {dumpContextButton:false}
    }
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

const resetSellNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
    console.debug("resetNetworkContext: newNetworkName = " + networkName);
    console.debug("resetNetworkContext: exchangeContext.network.name = " + exchangeContext.network.name);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.network.chainId = chain?.id;
    exchangeContext.network.name = networkName
    exchangeContext.sellTokenContract = defaultNetworkSettings.defaultSellToken,
    exchangeContext.buyTokenContract = defaultNetworkSettings.defaultBuyToken,
    exchangeContext.recipientAccount = defaultNetworkSettings.defaultRecipient,
    exchangeContext.agentAccount = defaultNetworkSettings.defaultAgent
}

const resetBuyNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
    console.debug("resetNetworkContext: newNetworkName = " + networkName);
    console.debug("resetNetworkContext: exchangeContext.network.name = " + exchangeContext.network.name);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.network.chainId = chain?.id;
    exchangeContext.network.name = networkName
    exchangeContext.sellTokenContract = defaultNetworkSettings.defaultSellToken,
    exchangeContext.buyTokenContract = defaultNetworkSettings.defaultBuyToken,
    exchangeContext.recipientAccount = defaultNetworkSettings.defaultRecipient,
    exchangeContext.agentAccount = defaultNetworkSettings.defaultAgent
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
