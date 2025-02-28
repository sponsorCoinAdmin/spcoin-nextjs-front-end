import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultBaseSettings } from '@/resources/data/networks/base/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings';
import { exchangeContext } from "@/lib/context";
import { Address } from 'viem';
import {
  BASE,     BASE_WETH_ADDRESS,
  ETHEREUM, ETHEREUM_WETH_ADDRESS,
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

const isActiveAccountToken = (tokenContract: TokenContract) : boolean => 
  isActiveAccountAddress(tokenContract.address);

const isNativeToken = (tokenContract: TokenContract) : boolean => 
  isNativeTokenAddress(tokenContract.address);

const isNativeTokenAddress = (address?: Address) : boolean => 
  address === NATIVE_TOKEN_ADDRESS;

const isActiveAccountAddress = (address?: Address) : boolean => 
  address === exchangeContext.activeAccountAddress;

const isBurnTokenAddress = (address?: Address) : boolean => 
  address === BURN_ADDRESS

const isTokenAddress = (address?: Address) : boolean => 
  !isActiveAccountAddress(address);

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
const isWrappedNetworkAddress = (address?: Address): boolean =>
  address === getNetworkWethAddress(exchangeContext.tradeData.chainId);

const isNetworkAddress = (address?: Address): boolean => 
  isWrappedNetworkAddress(address) || isActiveAccountAddress(address);

const mapAccountAddrToWethAddr = (tokenAddress: Address): Address | undefined => {
  const chainId = exchangeContext.tradeData.chainId;
  const ethAct = exchangeContext.activeAccountAddress;

  console.log(`mapAccountAddrToWethAddr: chainId(${chainId}) 
               Ethereum Account Address = ${ethAct} 
               Token Account Address = ${tokenAddress}`);

  return ethAct === tokenAddress ? getNetworkWethAddress(chainId) : tokenAddress;
};

const isWrappingTransaction = (
  sellTokenAddress?: Address, 
  buyTokenAddress?: Address
): boolean => 
  !!(sellTokenAddress && buyTokenAddress && 
     mapAccountAddrToWethAddr(sellTokenAddress) === mapAccountAddrToWethAddr(buyTokenAddress));

const getChainMap = (chainList: any[]): Map<number, any> => 
  new Map(chainList.map((e) => [e.chainId, e]));

const chainIdMap = getChainMap(chainIdList);

const getBlockChainName = (chainId: number): string | undefined => 
  chainIdMap.get(chainId)?.name;

const getNativeAvatar = (): string =>
  `assets/blockchains/${exchangeContext.tradeData.chainId}/info/avatar.png`;

const getNetworkAvatar = (): string =>
  `assets/blockchains/${exchangeContext.tradeData.chainId}/info/network$.png`;

const getTokenAvatar = (tokenContract : any | undefined ): string => {
  if (!tokenContract)
    return defaultMissingImage
  tokenContract.img = getAddressAvatar(tokenContract.address, FEED_TYPE.TOKEN_LIST);
  return tokenContract.img;
}

const getWalletAvatar = (wallet : any | undefined ): string => {
  if (!wallet)
    return defaultMissingImage
  const imgURL = wallet.avatarUrl = `/assets/wallets/${wallet.address}/avatar.png`;
  return imgURL;
}

const getAddressAvatar = (tokenAddress: Address | undefined, dataFeedType: FEED_TYPE): string => {
  let avatarURL:string;
  switch(dataFeedType) {
    case FEED_TYPE.AGENT_WALLETS:
    case FEED_TYPE.RECIPIENT_WALLETS:
      avatarURL = `assets/wallets/${tokenAddress}/avatar.png`;
      break;
    case FEED_TYPE.TOKEN_LIST:
      const chainId = exchangeContext.tradeData.chainId;
      // alert(`getTokenAvatar = assets/blockchains/${chainId}/assets/${tokenAddress}/info/avatar.png`);
      if(isActiveAccountAddress(tokenAddress) ||
        isNativeTokenAddress(tokenAddress) || 
        isBurnTokenAddress(tokenAddress))
        avatarURL = getNativeAvatar();
      else
        avatarURL = `assets/blockchains/${chainId}/assets/${tokenAddress}/avatar.png`;
  }
  console.log(`Avatar URL = ${avatarURL}`)
  return avatarURL;
}

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
  getAddressAvatar,
  getBlockChainName,
  getNativeAvatar,
  getNetworkAvatar,
  getNetworkWethAddress,
  getTokenAvatar,
  getWalletAvatar,
  isActiveAccountAddress,
  isActiveAccountToken,
  isBurnTokenAddress,
  isLowerCase,
  isNativeToken,
  isNativeTokenAddress,
  isNetworkAddress,
  isTokenAddress,
  isWrappedNetworkAddress,
  isWrappingTransaction,
  mapAccountAddrToWethAddr
};
