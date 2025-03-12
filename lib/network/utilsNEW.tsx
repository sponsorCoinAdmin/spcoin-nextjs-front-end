import { useExchangeContext } from "@/lib/context/ExchangeContext";
import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultBaseSettings } from '@/resources/data/networks/base/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings';
import { Address } from 'viem';
import {
  BASE, BASE_WETH_ADDRESS,
  ETHEREUM, ETHEREUM_WETH_ADDRESS,
  ExchangeContext,
  FEED_TYPE,
  HARDHAT, HARDHAT_WETH_ADDRESS,
  POLYGON, POLYGON_WETH_ADDRESS,
  SEPOLIA, SEPOLIA_WETH_ADDRESS,
  TokenContract,
  TradeData,
  WalletAccount
} from '@/lib/structure/types';
import { useChainId } from 'wagmi';
import { useMemo } from "react";

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const BURN_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
const NATIVE_TOKEN_ADDRESS: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const isActiveAccountSellToken = (exchangeContext: ExchangeContext, tradeData: TradeData): boolean =>
  tradeData.sellTokenContract ? isActiveAccountToken(exchangeContext, tradeData.sellTokenContract) : false;

const isActiveAccountBuyToken = (exchangeContext: ExchangeContext, tradeData: TradeData): boolean =>
  tradeData.buyTokenContract ? isActiveAccountToken(exchangeContext, tradeData.buyTokenContract) : false;

const isActiveAccountToken = (exchangeContext: ExchangeContext, tokenContract: TokenContract) =>
  isActiveAccountAddress(exchangeContext, tokenContract.address);

const isActiveAccountAddress = (exchangeContext: ExchangeContext, address?: Address) =>
  address ? address === exchangeContext.activeAccountAddress : false;

const isWrappedSellToken = (tradeData: TradeData): boolean =>
  tradeData.sellTokenContract ? isWrappedToken(tradeData.sellTokenContract) : false;

const isWrappedBuyToken = (tradeData: TradeData): boolean =>
  tradeData.buyTokenContract ? isWrappedToken(tradeData.buyTokenContract) : false;

const isWrappedToken = (tokenContract: TokenContract): boolean =>
  tokenContract.chainId ? isWrappedAddress(tokenContract.address, tokenContract.chainId) : false;

const isWrappedAddress = (address: Address, chainId: number): boolean =>
  address === getNetworkWethAddress(chainId);

const isNativeSellToken = (tradeData: TradeData): boolean =>
  tradeData.sellTokenContract ? isNativeToken(tradeData.sellTokenContract) : false;

const isNativeBuyToken = (tradeData: TradeData): boolean =>
  tradeData.buyTokenContract ? isNativeToken(tradeData.buyTokenContract) : false;

const isNativeToken = (tokenContract: TokenContract): boolean =>
  isNativeTokenAddress(tokenContract.address);

const isNativeTokenAddress = (address?: Address): boolean =>
  address === NATIVE_TOKEN_ADDRESS;

const isBlockChainSellToken = (exchangeContext: ExchangeContext, tradeData: TradeData): boolean =>
  tradeData.sellTokenContract ? isBlockChainToken(exchangeContext, tradeData.sellTokenContract) : false;

const isBlockChainBuyToken = (exchangeContext: ExchangeContext, tradeData: TradeData): boolean =>
  tradeData.buyTokenContract ? isBlockChainToken(exchangeContext, tradeData.buyTokenContract) : false;

const isBlockChainToken = (exchangeContext: ExchangeContext, tokenContract: TokenContract): boolean => {
  return isActiveAccountToken(exchangeContext, tokenContract) ||
         isNativeToken(tokenContract) ||
         isWrappedToken(tokenContract) ||
         isBurnToken(tokenContract);
};

const isBurnToken = (tokenContract: TokenContract): boolean =>
  tokenContract?.address ? isBurnTokenAddress(tokenContract.address) : false;

const isBurnTokenAddress = (address?: Address): boolean =>
  address === BURN_ADDRESS;

// ✅ Fix: Make `useMapAccountAddrToWethAddr` a hook instead of a function
const useMapAccountAddrToWethAddr = (tokenAddress: Address): Address | undefined => {
  const { exchangeContext } = useExchangeContext();
  const chainId = exchangeContext.tradeData.chainId;
  const ethAct = exchangeContext.activeAccountAddress;

  return useMemo(() => {
    return ethAct === tokenAddress ? getNetworkWethAddress(chainId) : tokenAddress;
  }, [ethAct, tokenAddress, chainId]);
};

// ✅ Fix: Make `isWrappingTransaction` a hook instead of a function
const useIsWrappingTransaction = (
  sellTokenAddress?: Address,
  buyTokenAddress?: Address
): boolean => {
  const mappedSellAddress = useMapAccountAddrToWethAddr(sellTokenAddress!);
  const mappedBuyAddress = useMapAccountAddrToWethAddr(buyTokenAddress!);

  return useMemo(() => mappedSellAddress === mappedBuyAddress, [mappedSellAddress, mappedBuyAddress]);
};

const getNetworkWethAddress = (chainId: number): Address | undefined => {
  const wethAddresses: Record<number, Address> = {
    [BASE]: BASE_WETH_ADDRESS,
    [ETHEREUM]: ETHEREUM_WETH_ADDRESS,
    [POLYGON]: POLYGON_WETH_ADDRESS,
    [HARDHAT]: HARDHAT_WETH_ADDRESS,
    [SEPOLIA]: SEPOLIA_WETH_ADDRESS,
  };

  const WETH_ADDRESS = wethAddresses[chainId];
  
  if (process.env.NEXT_PUBLIC_DEBUG === "true") {
    console.log(`getNetworkWethAddress(${chainId}): WETH ADDRESS: ${WETH_ADDRESS}`);
  }

  return WETH_ADDRESS || BURN_ADDRESS;
};

const getBlockChainAvatar = (chainId: number): string =>
  `assets/blockchains/${chainId}/info/network.png`;

const getBlockChainName = (chainId: number): string | undefined =>
  chainIdList.find((e) => e.chainId === chainId)?.name;

// Utility function to create a default network JSON list (for debugging/testing)
const createNetworkJsonList = () => {
  const defaultNetworkSettings = {
    base: defaultBaseSettings,
    ethereum: defaultEthereumSettings,
    hardhat: defaultHardHatSettings,
    polygon: defaultPolygonSettings,
    sepolia: defaultSepoliaSettings
  };
  console.log(`Default JSON Network Settings:\n${JSON.stringify(defaultNetworkSettings, null, 2)}`);
};

const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

export {
  BURN_ADDRESS,
  defaultMissingImage,
  delay,
  getBlockChainAvatar,
  getBlockChainName,
  getNetworkWethAddress,
  isActiveAccountAddress,
  isActiveAccountBuyToken,
  isActiveAccountSellToken,
  isActiveAccountToken,
  isBlockChainSellToken,
  isBlockChainBuyToken,
  isBlockChainToken,
  isBurnTokenAddress,
  isNativeBuyToken,
  isNativeSellToken,
  isNativeToken,
  isNativeTokenAddress,
  isWrappedAddress,
  useIsWrappingTransaction,
  isWrappedBuyToken,
  isWrappedToken,
  isWrappedSellToken,
  useMapAccountAddrToWethAddr,
};
