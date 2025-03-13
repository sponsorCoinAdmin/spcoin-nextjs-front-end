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

// ✅ Optimized WETH Address Mapping Function
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

// ✅ Optimized Token Address Mapping
const mapAccountAddrToWethAddr = (exchangeContext: ExchangeContext, tokenAddress: Address): Address | undefined => {
  const chainId = exchangeContext.tradeData.chainId;
  const ethAct = exchangeContext.activeAccountAddress;

  return ethAct === tokenAddress ? getNetworkWethAddress(chainId) : tokenAddress;
};

// ✅ Optimized Hook Version (Uses `useMemo`)
const useMapAccountAddrToWethAddr = (tokenAddress: Address): Address | undefined => {
  const { exchangeContext } = useExchangeContext();

  return useMemo(() => mapAccountAddrToWethAddr(exchangeContext, tokenAddress), [exchangeContext, tokenAddress]);
};

// ✅ Optimized `isWrappingTransaction`
const isWrappingTransaction = (exchangeContext: ExchangeContext, tradeData: TradeData): boolean => {
  const sellTokenAddress = tradeData.sellTokenContract?.address;
  const buyTokenAddress = tradeData.buyTokenContract?.address;

  if (!sellTokenAddress || !buyTokenAddress) return false;

  // ✅ Avoid redundant calls by caching mapped addresses
  const mappedSell = mapAccountAddrToWethAddr(exchangeContext, sellTokenAddress);
  const mappedBuy = mapAccountAddrToWethAddr(exchangeContext, buyTokenAddress);

  return mappedSell === mappedBuy;
};

// ✅ Optimized Active Account Check
const useIsActiveAccountAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return address ? address === exchangeContext.activeAccountAddress : false;
};

// ✅ Cached Chain ID Mapping
const chainIdMap = new Map(chainIdList.map((e) => [e.chainId, e]));

const getBlockChainAvatar = (chainId: number): string =>
  `assets/blockchains/${chainId}/info/network.png`;

const getBlockChainName = (chainId: number): string | undefined =>
  chainIdMap.get(chainId)?.name;

const getTokenAvatar = (tokenContract?: TokenContract): string =>
  tokenContract
    ? `assets/blockchains/${tokenContract.chainId}/assets/${tokenContract.address}/avatar.png`
    : defaultMissingImage;

const getWalletAvatar = (wallet?: WalletAccount): string =>
  wallet ? `/assets/accounts/${wallet.address}/avatar.png` : defaultMissingImage;

// ✅ Utility function to create a default network JSON list (for debugging/testing)
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
  getTokenAvatar,
  getWalletAvatar,
  isWrappingTransaction, // ✅ Fixed and Optimized
  useIsActiveAccountAddress,
  useMapAccountAddrToWethAddr,
  mapAccountAddrToWethAddr,
};
