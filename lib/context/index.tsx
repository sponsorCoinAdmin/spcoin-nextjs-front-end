'use client'
import { useEffect } from 'react';
import { getDefaultNetworkSettings } from '@/lib/network/initialize/defaultNetworkSettings';
import { DISPLAY_STATE, ExchangeContext } from '@/lib/structure/types';
import { TokenContract } from "@/lib/structure/types";
import { useAccount, useChainId } from 'wagmi';
// import { isSpCoin } from '@/lib/spCoin/utils';

let chainId:number = 1;
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
    return exchangeContext;
}

const resetContextNetwork = (chain:any) => {
    const networkName = chain.name.toLowerCase();
    console.debug("resetContextNetwork: newNetworkName = " + networkName);
    console.debug("resetContextNetwork: exchangeContext.network.name = " + exchangeContext.network.name);
    console.debug(`UPDATING NETWORK to ${networkName}`);

    const defaultNetworkSettings = getDefaultNetworkSettings(networkName)
    console.debug(`Loaded defaultNetworkSettings for ${networkName}: ${JSON.stringify(defaultNetworkSettings,null,2)}`);
    exchangeContext.network.chainId = chain.id;
    exchangeContext.network.name = networkName
    exchangeContext.displayState = isSpCoin(defaultNetworkSettings.defaultBuyToken) ? DISPLAY_STATE.SPONSOR_SELL_ON:DISPLAY_STATE.OFF,
    exchangeContext.slippage = "0.02",
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
    resetContextNetwork,
    exchangeContext
}
