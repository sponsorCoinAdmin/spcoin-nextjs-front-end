import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks//polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks//hardhat/initialize/defaultNetworkSettings.json';
import defaultSoliditySettings from '@/resources/data/networks//sepolia/initialize/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';
import { TradeData, TRANSACTION_TYPE, ExchangeContext, NetworkElement, AccountRecord, TokenContract, SP_COIN_DISPLAY } from '@/lib/structure/types';

const defaultInitialTradeData:TradeData = {
  signer: undefined,
  sellAmount: 0n,
  buyAmount: 0n,
  transactionType: TRANSACTION_TYPE.SELL_EXACT_OUT,
  slippage: 0.02
};

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

function getInitialContextMap(chain:any) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  return new Map(Object.entries(initialNetworkContext));
}

const getDefaultNetworkSettings = (chain:any) => {
  // alert("getDefaultNetworkSettings"+chain )
  if (chain && typeof chain === "string" && !isLowerCase(chain)) {
    chain = chain.toLowerCase()
  }
  else if (chain && typeof chain !== "number" && typeof chain !== "string") {
    chain = chain.id
  }
  
  // console.debug(`getDefaultNetworkSettings:chain = ${chain}`);
  switch(chain)
  {
      case 1:
      case "ethereum":
        // alert(`SELECTING chain = ${chain} defaultEthereumSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultEthereumSettings;
      case 137:
      case "polygon":
        // alert(`SELECTING chain = ${chain} defaultPolygonSettings = \n${stringifyBigInt(defaultPolygonSettings)}`);
        return defaultPolygonSettings;
      case 31337:
      case "hardhat":
        // alert(`SELECTING chain = ${chain} defaultHardHatSettings = \n${stringifyBigInt(defaultHardHatSettings)}`);
        return defaultHardHatSettings;
      case 11155111:
      case "sepolia":
        // alert(`SELECTING chain = ${chain} defaultSoliditySettings = \n${stringifyBigInt(defaultSoliditySettings)}`);
        return defaultSoliditySettings;
      default: 
      // alert(`SELECTING chain = ${chain} defaultUndefinedSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
        return defaultEthereumSettings;
  }
}

export {
  getDefaultNetworkSettings,
  getInitialContext,
  getInitialContextMap,
  initialContext
 };
