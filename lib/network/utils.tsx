import { useExchangeContext } from "@/lib/context/ExchangeContext";

import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultBaseSettings } from '@/resources/data/networks/base/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings';
// import { exchangeContext } from "@/lib/context";
import { Address } from 'viem';
import {
  BASE,     BASE_WETH_ADDRESS,
  ETHEREUM, ETHEREUM_WETH_ADDRESS,
  ExchangeContext,
  FEED_TYPE,
  HARDHAT,  HARDHAT_WETH_ADDRESS,
  POLYGON,  POLYGON_WETH_ADDRESS,
  SEPOLIA,  SEPOLIA_WETH_ADDRESS,
  TokenContract
} from '@/lib/structure/types';
import { useChainId } from 'wagmi';

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

const BURN_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
const NATIVE_TOKEN_ADDRESS: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const useExchangeValues = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext;
};

const useIsActiveAccountAddress = (address?: Address): boolean => {
  const exchangeContext = useExchangeValues();
  return address === exchangeContext.activeAccountAddress;
};

const isActiveAccountToken = (tokenContract: TokenContract) : boolean => 
  useIsActiveAccountAddress(tokenContract.address);

const isNativeToken = (tokenContract: TokenContract) : boolean => 
  isNativeTokenAddress(tokenContract.address);

const isNativeTokenAddress = (address?: Address) : boolean => 
  address === NATIVE_TOKEN_ADDRESS;

const isBurnTokenAddress = (address?: Address) : boolean => 
  address === BURN_ADDRESS

const isTokenAddress = (address?: Address) : boolean => 
  !useIsActiveAccountAddress(address);

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
  console.log(`getNetworkWethAddress(${chainId}): WETH ADDRESS: ${WETH_ADDRESS}`);
  return WETH_ADDRESS || BURN_ADDRESS;
};

// *** WARNING: HARDCODING To be fixed for other networks ***
const useIsWrappedNetworkAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return address === getNetworkWethAddress(exchangeContext.tradeData.chainId);
}

const useIsNetworkAddress = (address?: Address): boolean => {
  const isWrappedNetworkAddress = useIsWrappedNetworkAddress(address) 
  const isActiveAccountAddress = useIsActiveAccountAddress(address);
  return isWrappedNetworkAddress || isActiveAccountAddress;
}

const useMapAccountAddrToWethAddr = (tokenAddress: Address): Address | undefined => {
  const { exchangeContext } = useExchangeContext();

  const chainId = exchangeContext.tradeData.chainId;
  const ethAct = exchangeContext.activeAccountAddress;

  console.log(`useMapAccountAddrToWethAddr: chainId(${chainId}) 
               Ethereum Account Address = ${ethAct} 
               Token Account Address = ${tokenAddress}`);

  return ethAct === tokenAddress ? getNetworkWethAddress(chainId) : tokenAddress;
};

const isWrappingTransaction = (
  sellTokenAddress?: Address, 
  buyTokenAddress?: Address
): boolean => 
  !!(sellTokenAddress && buyTokenAddress && 
     useMapAccountAddrToWethAddr(sellTokenAddress) === useMapAccountAddrToWethAddr(buyTokenAddress));

const getChainMap = (chainList: any[]): Map<number, any> => 
  new Map(chainList.map((e) => [e.chainId, e]));

const chainIdMap = getChainMap(chainIdList);

const getBlockChainAvatar = (chainId:number): string => 
  `assets/blockchains/${chainId}/info/network.png`;

const getBlockChainName = (chainId: number): string | undefined => 
  chainIdMap.get(chainId)?.name;

const useBlockChainAvatar = (): string => {
  const { exchangeContext } = useExchangeContext();
  return `assets/blockchains/${exchangeContext.tradeData.chainId}/info/avatar.png`;
}

const getTokenAvatar = (tokenContract?: { address: Address }): string => {
  return tokenContract 
    ? useGetAddressAvatar(tokenContract.address, FEED_TYPE.TOKEN_LIST) 
    : defaultMissingImage;
};

const getWalletAvatar = (wallet?: { address: Address }): string => 
  wallet ? `/assets/wallets/${wallet.address}/avatar.png` : defaultMissingImage;

const useGetAddressAvatar = (tokenAddress: Address, dataFeedType: FEED_TYPE): string => {
  const chainId = useChainId();
  const isActiveAccount = useIsActiveAccountAddress(tokenAddress);

  if (!tokenAddress) return defaultMissingImage;

  switch (dataFeedType) {
    case FEED_TYPE.AGENT_WALLETS:
    case FEED_TYPE.RECIPIENT_WALLETS:
      return `assets/wallets/${tokenAddress}/avatar.png`;
    case FEED_TYPE.TOKEN_LIST:
      return isActiveAccount || isNativeTokenAddress(tokenAddress) || isBurnTokenAddress(tokenAddress)
        ? getBlockChainAvatar(chainId)
        : `assets/blockchains/${chainId}/assets/${tokenAddress}/avatar.png`;
    default:
      return defaultMissingImage;
  }
};

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

export {
  BURN_ADDRESS,
  createNetworkJsonList,
  defaultMissingImage,
  delay,
  useGetAddressAvatar,
  getBlockChainName,
  useBlockChainAvatar,
  getBlockChainAvatar,
  getNetworkWethAddress,
  getTokenAvatar,
  getWalletAvatar,
  useIsActiveAccountAddress,
  isActiveAccountToken,
  isBurnTokenAddress,
  isLowerCase,
  isNativeToken,
  isNativeTokenAddress,
  useIsNetworkAddress,
  isTokenAddress,
  useIsWrappedNetworkAddress,
  isWrappingTransaction,
  useMapAccountAddrToWethAddr
};
