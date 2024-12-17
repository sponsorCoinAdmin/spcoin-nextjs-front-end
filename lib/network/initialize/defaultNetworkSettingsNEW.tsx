import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultHardHatSettings from './hardhat/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';
import { TradeData, TRANSACTION_TYPE, ExchangeContext, NetworkElement, AccountRecord, TokenContract, SP_COIN_DISPLAY } from '@/lib/structure/types';
import { stringifyBigInt } from '@/lib/spCoin/utils';

import { useChainId } from "wagmi";
import { config } from '@/lib/wagmi/wagmiConfig'


const defaultInitialTradeData:TradeData = {
  signer: undefined,
  sellAmount: 0n,
  buyAmount: 0n,
  transactionType: TRANSACTION_TYPE.SELL_EXACT_OUT,
  slippage: 0.02
};

const initialContext = (chainId:any =undefined) => {
  alert(`initialContext(${chainId})`)
  let exchangeContext:ExchangeContext;

  if(!chainId) {
    exchangeContext = {
      activeWalletAccount : undefined,
      network: undefined,
      recipientAccount: undefined,
      agentAccount: undefined,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
      tradeData: {
        signer: undefined,
        transactionType:TRANSACTION_TYPE.SELL_EXACT_OUT,
        sellAmount:BigInt(0),
        buyAmount:BigInt(0),
        slippage: 0.02
      },
      spCoinPanels: undefined,
      test : {dumpContextButton:false}
    }
  }
  else
    exchangeContext = getInitialContext(chainId);
  const exchangeContextMap = new Map(Object.entries(exchangeContext));
  return { exchangeContext, exchangeContextMap }
}

const getInitialContext = (chainId:any | number): ExchangeContext => {
  alert(`getInitialContext(${chainId})`)
  const initialContextMap = getInitialContextMap(chainId);
  const initialContext = {
      activeWalletAccount : undefined,
      network: initialContextMap.get("networkHeader") as NetworkElement,
      recipientAccount: initialContextMap.get("defaultRecipient") as AccountRecord | undefined,
      agentAccount: initialContextMap.get("defaultAgent") as AccountRecord | undefined,
      sellTokenContract: initialContextMap.get("defaultSellToken") as TokenContract | undefined,
      buyTokenContract: initialContextMap.get("defaultBuyToken") as TokenContract | undefined,
      tradeData: defaultInitialTradeData,
      spCoinPanels: SP_COIN_DISPLAY.SELECT_BUTTON,
      test : {dumpContextButton:false}
  }
  // alert(`***Context.getInitialContext:sellTokenContract: ${JSON.stringify(defaultNetworkSettings.defaultSellToken,null,2)}`)
  // alert(`***Context.getInitialContext: ${JSON.stringify(defaultNetworkSettings,null,2)}`)
  return initialContext;
}

function getInitialContextMap(chainId:any) {
  const initialNetworkContext = getDefaultNetworkSettings(chainId);
  return new Map(Object.entries(initialNetworkContext));
}

const getDefaultNetworkSettings = (chain:any) => {
  alert("getDefaultNetworkSettings:chain 1 = "+chain )
  if (chain && typeof chain === "string" && !isLowerCase(chain)) {
    chain = chain.toLowerCase()
  }
  else if (chain && typeof chain !== "number" && typeof chain !== "string") {
    chain = chain.id
  }
  
  alert(`getDefaultNetworkSettings:chain 2 = ${chain}`);
  // console.debug(`getDefaultNetworkSettings:chain = ${chain}`);
  alert(`getDefaultNetworkSettings:chain = ${chain}`);
  switch(chain)
  {
      case 1:
      case "ethereum": 
      alert(`SELECTING chain(${chain}) defaultEthereumSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultEthereumSettings;
      case 137:
      case "polygon":  
        alert(`SELECTING chain(${chain}) defaultPolygonSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultPolygonSettings;
      case 31337:
      case "hardhat":  
        alert(`SELECTING chain(${chain}) defaultHardHatSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultHardHatSettings;
      case 11155111:
      case "sepolia":  
        alert(`SELECTING chain(${chain}) defaultSoliditySettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultSoliditySettings;
      default: 
        alert(`SELECTING chain(${chain}) defaultSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
      return defaultEthereumSettings;
  }
}

export {
  getDefaultNetworkSettings,
  getInitialContext,
  // getInitialContextMap,
  initialContext
 };
