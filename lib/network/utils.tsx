import { useExchangeContext } from '@/lib/context/hooks'

import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultBaseSettings } from '@/resources/data/networks/base/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings';
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings';
import { Address } from 'viem';
import {
  BASE,
  ETHEREUM,
  ExchangeContext,
  FEED_TYPE,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  TokenContract,
  TradeData,
  WalletAccount
} from '@/lib/structure';
import { isAddress } from 'viem'
import { createDebugLogger } from '../utils/debugLogger';

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_UTILS === 'true';
const debugLog = createDebugLogger('ExchangeButton', DEBUG_ENABLED, LOG_TIME);

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
  address ? address === exchangeContext?.accounts?.connectedAccount?.address : false;

const isNativeSellToken = (tradeData: TradeData) : boolean => 
  tradeData.sellTokenContract ? isNativeToken(tradeData.sellTokenContract) : false;

const isNativeBuyToken = (tradeData: TradeData) : boolean => 
  tradeData.buyTokenContract ? isNativeToken(tradeData.buyTokenContract) : false;

const isNativeToken = (tokenContract: TokenContract) : boolean => 
  isNativeTokenAddress(tokenContract.address);

const isNativeTokenAddress = (address?: Address) : boolean => {
  return address === NATIVE_TOKEN_ADDRESS;
}

const isBurnToken = (tokenContract:TokenContract) : boolean => 
  tokenContract?.address ? isBurnTokenAddress(tokenContract.address) : false;

const isBurnTokenAddress = (address?: Address) : boolean => 
  address === BURN_ADDRESS

// Add (or keep) these helpers somewhere above getLogoURL:
const logoExistenceCache = new Map<string, boolean>();

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  // Don't probe during SSR; let the client verify after hydration.
  if (typeof window === 'undefined') return true;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    let res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(t);
    if (res.ok) return true;
    if (res.status === 405) {
      res = await fetch(url, { method: 'GET', cache: 'no-store' });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

// Replace your existing getLogoURL with this version (no lowercasing anywhere):
const getLogoURL = async (
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE
): Promise<string> => {
  const addr = (address ?? '').trim();
  if (!addr) return defaultMissingImage;

  const path =
    dataFeedType === FEED_TYPE.TOKEN_LIST
      ? `/assets/blockchains/${chainId ?? 1}/contracts/${addr}/logo.png`
      : (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS)
        ? `/assets/accounts/${addr}/logo.png`
        : '';

  if (!path) return defaultMissingImage;

  if (logoExistenceCache.has(path)) {
    return logoExistenceCache.get(path)! ? path : defaultMissingImage;
  }

  const ok = await resourceExists(path);
  logoExistenceCache.set(path, ok);
  return ok ? path : defaultMissingImage;
};


const useIsActiveAccountAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return isActiveAccountAddress(exchangeContext, address)
};

const getChainMap = (chainList: any[]): Map<number, any> => 
  new Map(chainList.map((e) => [e.chainId, e]));

const chainIdMap = getChainMap(chainIdList);

const getBlockChainLogoURL = (chainId:number): string => 
  `/assets/blockchains/${chainId}/info/network.png`;

const getBlockChainName = (chainId: number): string | undefined => 
  chainIdMap.get(chainId)?.name;

type RequiredAssetMembers = { address: string; chainId: number };

const getTokenLogoURL = (requiredAssetMembers?: RequiredAssetMembers): string => {
  if (!requiredAssetMembers || !isAddress(requiredAssetMembers.address)) {
    return badTokenAddressImage;
  }

  const { chainId, address } = requiredAssetMembers;
  const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
  debugLog.log(`getTokenLogoURL.logoURL=${logoURL}`);
  return logoURL;
};


export const getAddressLogoURL = (address: string, chainId: number): string => {
  if (isAddress(address)) {
    const logoURL=`/assets/blockchains/${chainId}/contracts/${address}/logo.png`
    debugLog.log(`getAddressLogoURL.logoURL=${logoURL}`)
    return logoURL
  }

  return badTokenAddressImage
}

const getAccountLogo = (account?: WalletAccount): string =>
  account ? `/assets/accounts/${account.address}/logo.png` : defaultMissingImage;

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
  debugLog.log(`Default JSON Network Settings:\n${networkSettings}`);
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

// File: lib/network/utils/getBlockExplorerURL.ts

/**
 * Returns the block explorer URL for a given chain ID.
 * Falls back to an empty string if not recognized.
 */

export function getBlockExplorerURL(chainId: number): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return 'https://etherscan.io/';
    case 5: // Goerli Testnet
      return 'https://goerli.etherscan.io/';
    case 137: // Polygon Mainnet
      return 'https://polygonscan.com/';
    case 80001: // Mumbai Testnet
      return 'https://mumbai.polygonscan.com/';
    case 11155111: // Sepolia Testnet
      return 'https://sepolia.etherscan.io/';
    case 31337: // Hardhat localhost
      return 'http://localhost:8545/';
    default:
      return '';
  }
}


export {
  BURN_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  // createNetworkJsonList,
  badTokenAddressImage,
  defaultMissingImage,
  delay,
  getLogoURL,
  getBlockChainLogoURL,
  getBlockChainName,
  getTokenLogoURL,
  type RequiredAssetMembers,
  getAccountLogo,
  isActiveAccountAddress,
  isActiveAccountBuyToken,
  isActiveAccountSellToken,
  isActiveAccountToken,
  isBurnTokenAddress,
  isLowerCase,
  isNativeBuyToken,
  isNativeSellToken,
  isNativeToken,
  isNativeTokenAddress,
  tokenContractsEqual,
  useIsActiveAccountAddress,
  };
