import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultHardHatSettings from './hardhat/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';
import { TradeData, TRANSACTION_TYPE, ExchangeContext, NetworkElement, AccountRecord, TokenContract, SP_COIN_DISPLAY } from '@/lib/structure/types';
import { stringifyBigInt } from '@/lib/spCoin/utils';
import { getNetworkName } from "@/lib/network/utils";

const getNetworkName2:any = getNetworkName;

const defaultInitialTradeData:TradeData = {
  signer: undefined,
  sellAmount: 0n,
  buyAmount: 0n,
  transactionType: TRANSACTION_TYPE.SELL_EXACT_OUT,
  slippage: 0.02
};

const getEmptyContext = () => {
  const emptyContext = {
      activeWalletAccount : undefined,
      network: undefined,
      recipientAccount: undefined,
      agentAccount: undefined,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
      tradeData: defaultInitialTradeData,
      spCoinPanels: SP_COIN_DISPLAY.SELECT_BUTTON,
      test : {dumpContextButton:false}
  }
  return emptyContext;
}

const initialContext = () => {
  // Default startup network to Ethereum
  const chainId:number = 1;
  const exchangeContext:ExchangeContext  = getInitialContext(chainId);
  const exchangeContextMap = new Map(Object.entries(exchangeContext));
  return { exchangeContext, exchangeContextMap }
}

const getInitialContext = (chain:any | number): ExchangeContext => {
  const chainId:number = chain || 1;
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

const getDefaultNetworkSettings = (chainId:any) => {
  if (chainId && typeof chainId === "string" && !isLowerCase(chainId)) {
    chainId = chainId.toLowerCase()
  }
  else if (chainId && typeof chainId !== "number" && typeof chainId !== "string") {
    chainId = chainId.id
  }

  
  alert("*** getDefaultNetworkSettings:chainId = " + chainId )
  const networkName = getNetworkName(chainId)
  alert(`*** getDefaultNetworkSettings:networkName = ${networkName}`);

  // console.debug(`getDefaultNetworkSettings:chainId = ${chainId}`);
  // console.debug(`getDefaultNetworkSettings:networkName = ${networkName}`);
  switch(chainId)
  {
      case 1:
      case "ethereum":
        alert(`SELECTING defaultEthereumSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultEthereumSettings;
      case 137:
      case "polygon":
        alert(`SELECTING defaultPolygonSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultPolygonSettings;
      case 31337:
      case "hardhat":
        return defaultHardHatSettings;
      case 11155111:
      case "sepolia":
        alert(`SELECTING defaultSoliditySettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultSoliditySettings;
      default: 
      alert(`SELECTING defaultSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultEthereumSettings;
  }
}

export {
  getDefaultNetworkSettings,
  getInitialContext,
  getInitialContextMap,
  getEmptyContext,
  initialContext
 };
