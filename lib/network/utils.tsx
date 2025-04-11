import { useExchangeContext } from '@/lib/context/contextHooks'

import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultBaseSettings } from '@/resources/data/networks/base/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings';
import { Address } from 'viem';
import {
  BASE,     BASE_WETH_ADDRESS,
  ETHEREUM, ETHEREUM_WETH_ADDRESS,
  ExchangeContext,
  FEED_TYPE,
  HARDHAT,  HARDHAT_WETH_ADDRESS,
  POLYGON,  POLYGON_WETH_ADDRESS,
  SEPOLIA,  SEPOLIA_WETH_ADDRESS,
  TokenContract,
  TradeData,
  WalletAccount
} from '@/lib/structure/types';
import { isAddress } from 'viem'


const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png'

const BURN_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
const NATIVE_TOKEN_ADDRESS: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const isActiveAccountSellToken = (exchangeContext:ExchangeContext): boolean =>
  exchangeContext?.tradeData?.sellTokenContract ? isActiveAccountToken(exchangeContext,
    exchangeContext.tradeData.sellTokenContract) : false;

const isActiveAccountBuyToken = (exchangeContext:ExchangeContext): boolean =>
  exchangeContext?.tradeData.buyTokenContract ? isActiveAccountToken(exchangeContext, exchangeContext.tradeData.buyTokenContract) : false;

const isActiveAccountToken = (exchangeContext: ExchangeContext, tokenContract: TokenContract ) =>
  isActiveAccountAddress(exchangeContext, tokenContract.address);

const isActiveAccountAddress = (exchangeContext: ExchangeContext, address?: Address ) =>
  address ? address === exchangeContext.activeAccountAddress : false;

const isWrappedSellToken = (tradeData: TradeData): boolean =>
  tradeData.sellTokenContract ? isWrappedToken(tradeData.sellTokenContract) : false;

const isWrappedBuyToken = (tradeData: TradeData): boolean =>
  tradeData.buyTokenContract ? isWrappedToken(tradeData.buyTokenContract) : false;

const isWrappedToken = (tokenContract: TokenContract): boolean =>
  tokenContract.chainId ? isWrappedAddress(tokenContract.address, tokenContract.chainId) : false;

const isWrappedAddress = (address:Address, chainId:number): boolean =>
  address === getNetworkWethAddress(chainId);

const isNativeSellToken = (tradeData: TradeData) : boolean => 
  tradeData.sellTokenContract ? isNativeToken(tradeData.sellTokenContract) : false;

const isNativeBuyToken = (tradeData: TradeData) : boolean => 
  tradeData.buyTokenContract ? isNativeToken(tradeData.buyTokenContract) : false;

const isNativeToken = (tokenContract: TokenContract) : boolean => 
  isNativeTokenAddress(tokenContract.address);

const isNativeTokenAddress = (address?: Address) : boolean => {
  return address === NATIVE_TOKEN_ADDRESS;
}

const isBlockChainSellToken = (exchangeContext:ExchangeContext) : boolean =>
  exchangeContext?.tradeData?.sellTokenContract ? isBlockChainToken(exchangeContext, exchangeContext.tradeData.sellTokenContract) : false;

const isBlockChainBuyToken = (exchangeContext:ExchangeContext) : boolean =>
  exchangeContext?.tradeData?.buyTokenContract ? isBlockChainToken(exchangeContext, exchangeContext.tradeData.buyTokenContract) : false;

const isBlockChainToken = (exchangeContext:ExchangeContext, tokenContract: TokenContract) : boolean => {
    return isActiveAccountToken(exchangeContext, tokenContract) ||
  isNativeToken(tokenContract) ||
  isWrappedToken(tokenContract) ||
  isBurnToken(tokenContract);
}

const isBurnToken = (tokenContract:TokenContract) : boolean => 
  tokenContract?.address ? isBurnTokenAddress(tokenContract.address) : false;

const isBurnTokenAddress = (address?: Address) : boolean => 
  address === BURN_ADDRESS

// *** WARNING: To be fixed for other networks ***
const getNetworkWethAddress = (chainId: number) : Address | undefined => {
  const wethAddresses: Record<number, Address> = {
    [BASE]: BASE_WETH_ADDRESS,
    [ETHEREUM]: ETHEREUM_WETH_ADDRESS,
    [POLYGON]: POLYGON_WETH_ADDRESS,
    [HARDHAT]: HARDHAT_WETH_ADDRESS,
    [SEPOLIA]: SEPOLIA_WETH_ADDRESS,
  };
  const WETH_ADDRESS = wethAddresses[chainId]; // No need for explicit type annotation
  // console.log(`getNetworkWethAddress(${chainId}): WETH ADDRESS: ${WETH_ADDRESS}`);
  return WETH_ADDRESS || BURN_ADDRESS;
};

const getAvatarAddress = (exchangeContext:ExchangeContext, tokenAddress: Address, dataFeedType: FEED_TYPE): string => {
  const chainId = exchangeContext.tradeData.chainId;
  const isNativeToken = isActiveAccountAddress(exchangeContext, tokenAddress);

  if (!tokenAddress) return defaultMissingImage;

  switch (dataFeedType) {
    case FEED_TYPE.AGENT_WALLETS:
    case FEED_TYPE.RECIPIENT_WALLETS:
      return `assets/accounts/${tokenAddress}/avatar.png`;
    case FEED_TYPE.TOKEN_LIST:
      return isNativeToken || isNativeTokenAddress(tokenAddress) || isBurnTokenAddress(tokenAddress)
        ? getNativeAvatar(chainId)
        : `assets/blockchains/${chainId}/contracts/${tokenAddress}/avatar.png`;
        default:
      return defaultMissingImage;
  }
};

const useIsActiveAccountAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return isActiveAccountAddress(exchangeContext, address)
};

const mapAccountAddrToWethAddr = (exchangeContext:ExchangeContext, tokenAddress: Address): Address | undefined => {
  const chainId = exchangeContext.tradeData.chainId;
  const ethAct = exchangeContext.activeAccountAddress;

  // console.log(`mapAccountAddrToWethAddr: chainId(${chainId}) 
  //              Ethereum Account Address = ${ethAct} 
  //              Token Account Address = ${tokenAddress}`);

  return ethAct === tokenAddress ? getNetworkWethAddress(chainId) : tokenAddress;
};

const useMapAccountAddrToWethAddr = (tokenAddress: Address): Address | undefined => {
  const { exchangeContext } = useExchangeContext();
  return mapAccountAddrToWethAddr(exchangeContext, tokenAddress)
  // return useMemo(() => mapAccountAddrToWethAddr(exchangeContext, tokenAddress), [exchangeContext, tokenAddress]);
};

const isWrappingTransaction = (exchangeContext: ExchangeContext): boolean => {
  const sellTokenAddress = exchangeContext.tradeData.sellTokenContract?.address;
  const buyTokenAddress = exchangeContext.tradeData.buyTokenContract?.address;

  if (!sellTokenAddress || !buyTokenAddress) return false;

  // ✅ Avoid redundant calls by caching mapped addresses
  const mappedSell = mapAccountAddrToWethAddr(exchangeContext, sellTokenAddress);
  const mappedBuy = mapAccountAddrToWethAddr(exchangeContext, buyTokenAddress);

  return mappedSell === mappedBuy;
};

const getChainMap = (chainList: any[]): Map<number, any> => 
  new Map(chainList.map((e) => [e.chainId, e]));

const chainIdMap = getChainMap(chainIdList);

const getNativeAvatar = (chainId:number): string => 
  `assets/blockchains/${chainId}/info/network.png`;

const getBlockChainName = (chainId: number): string | undefined => 
  chainIdMap.get(chainId)?.name;


const getTokenAvatar = (tokenContract?: TokenContract): string => {
  if (!tokenContract) {
    return badTokenAddressImage
  }

  const { chainId, address } = tokenContract

  if (isAddress(address)) {
    return `/assets/blockchains/${chainId}/contracts/${address}/avatar.png`
  }

  return badTokenAddressImage
}


const getWalletAvatar = (wallet?: WalletAccount): string => 
  wallet ? `/assets/accounts/${wallet.address}/avatar.png` : defaultMissingImage;


// Utility function to create a default network JSON list (for debugging/testing)
const createNetworkJsonList = () => {
  const defaultNetworkSettings = {
    base: defaultBaseSettings,
    ethereum: defaultEthereumSettings,
    hardhat: defaultHardHatSettings,
    polygon: defaultPolygonSettings,
    sepolia: defaultSepoliaSettings
  };
  const networkSettings = JSON.stringify(defaultNetworkSettings, null, 2);
  console.log(`Default JSON Network Settings:\n${networkSettings}`);
  alert(`Network Settings: ${networkSettings}`);
};

const isLowerCase = (input: string): boolean => 
  input === input.toLowerCase();

function delay(ms: number | undefined) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const tokenContractsEqual = (a?: TokenContract, b?: TokenContract): boolean => {
  return (
    a?.address === b?.address &&
    a?.symbol === b?.symbol &&
    a?.decimals === b?.decimals
  );
};

export {
  BURN_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  // createNetworkJsonList,
  badTokenAddressImage,
  defaultMissingImage,
  delay,
  getAvatarAddress,
  getNativeAvatar,
  getBlockChainName,
  getNetworkWethAddress,
  getTokenAvatar,
  getWalletAvatar,
  isActiveAccountAddress,
  isActiveAccountBuyToken,
  isActiveAccountSellToken,
  isActiveAccountToken,
  isBlockChainSellToken,
  isBlockChainBuyToken,
  isBlockChainToken,
  isBurnTokenAddress,
  isLowerCase,
  isNativeBuyToken,
  isNativeSellToken,
  isNativeToken,
  isNativeTokenAddress,
  isWrappedAddress,
  isWrappingTransaction,
  isWrappedBuyToken,
  isWrappedToken,
  isWrappedSellToken,
  mapAccountAddrToWethAddr,
  tokenContractsEqual,
  useIsActiveAccountAddress,
  useMapAccountAddrToWethAddr,
};