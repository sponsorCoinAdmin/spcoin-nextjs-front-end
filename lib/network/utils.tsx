import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultEthereumSettings } from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings'
import { defaultNetworkSettings as defaultHardHatSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings'
import { defaultNetworkSettings as defaultPolygonSettings } from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings'
import { defaultNetworkSettings as defaultSepoliaSettings } from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings'
import { exchangeContext } from "@/lib/context";
import { Address } from 'viem';
import { TokenContract } from '@/lib/structure/types';

const BURN_ADDRESS:Address = "0x0000000000000000000000000000000000000000"
const NETWORK_PROTOCOL_CRYPTO:Address = BURN_ADDRESS
// const NETWORK_PROTOCOL_CRYPTO = "NETWORK PROTOCOL CRYPTO"

// This should work
const imgHome = "/resources/images/chains/"
// const imgHome = "../../resources/images/chains"
const imgType = ".png"

const isNetworkProtocolToken = (tokenContract:TokenContract) => {
  return isNetworkBurnAddress(tokenContract.address);
}

const isNetworkProtocolAddress = (address:Address|undefined) : boolean => {
  // alert(`address = ${address}\nexchangeContext.activeWalletAccount = ${exchangeContext.activeWalletAccount}`);
  const isActiveWallet:boolean = isActiveWalletAccount(address);
  return isActiveWallet;
}

const isNetworkBurnAddress = (address:Address|undefined) : boolean => {
  return address === NETWORK_PROTOCOL_CRYPTO;
}

const isActiveWalletAccount = (address:Address|undefined) : boolean => {
  // alert(`address = ${address}\nexchangeContext.activeWalletAccount = ${exchangeContext.activeWalletAccount}`);
  const activeWalletAccount:Address|undefined = exchangeContext?.activeWalletAccount as Address|undefined;
  const isActiveWalletAccount:boolean = address === activeWalletAccount;
  return isActiveWalletAccount;
}

const isNetworkOrWalletAccountAddress = (address:Address|undefined) : boolean => {
  return isNetworkBurnAddress(address) || isActiveWalletAccount(address)
}

const isTokenAddress = (address:Address|undefined) : boolean => {
  return !isNetworkOrWalletAccountAddress(address);
}

// *** WARNING To be fixed for other networks
const getWrappedNetworkAddress = (chainId:number):Address|undefined => {
  const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  switch(chainId) {
    case 1: return WETH;
    default: return undefined;
  }
}

// *** WARNING HARDCODING To be fixed for other networks
const isWrappedNetworkAddress = (address:Address|undefined) : boolean => {
  const chainId:number = 1;
  const  wrappedNetworkAddress:boolean = address === getWrappedNetworkAddress(chainId);
  return wrappedNetworkAddress;
}

const isNetworkAddress = (address:Address|undefined) : boolean => {
  return isWrappedNetworkAddress(address) || isNetworkOrWalletAccountAddress(address);
}

const isTransaction_A_Wrap = () : boolean => {
  const sellTokenAddress:Address = exchangeContext.tradeData.sellTokenContract?.address;
  const buyTokenAddress:Address = exchangeContext.tradeData.buyTokenContract?.address;
  return  buyTokenAddress && sellTokenAddress && (buyTokenAddress !== sellTokenAddress) ? 
    isNetworkAddress(sellTokenAddress) && isNetworkAddress(buyTokenAddress) :
          false
}

const getChainMap = (chainList: any[]) => {
  const chainMap = new Map();
  const tList = chainList.map((e: any, i: number) => {
      chainMap.set(chainList[i].chainId,chainList[i])
  })
  return chainMap
}

const chainIdMap = getChainMap(chainIdList)

const getNetworkName = (chainId:number) => {
  const networkName:string = chainIdMap.get(chainId)?.name;
  return networkName;
}

function getAvatarImageURL(chainId:number|string) {
  // console.debug(`getAvatarImageURL:chainId = (${chainId})`)
  let imgURL:string = imgHome+chainId + imgType;
  // console.debug(`getAvatarImageURL:imgURL = (${imgURL})`)
  return imgURL
}

  // This method is never executed in the main program but is a utility to create a default network json list
const createNetworkJsonList = () => {
  const defaultNetworkSettings = {
    ethereum : defaultEthereumSettings,
    hardhat : defaultHardHatSettings,
    polygon  : defaultPolygonSettings,
    sepolia  : defaultSepoliaSettings,
  }
  let networkSettings = "default json Network Settings for all Networks AS follows:\n"+ JSON.stringify(defaultNetworkSettings, null, 2);
  console.log(networkSettings)
  alert("NetworkSettings: "+networkSettings)
}

function isLowerCase (input:string) {  
  return input === String(input).toLowerCase()
}

// This code is not used anywhere but is implemented for future use
async function catchPromiseError<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
  return promise
    .then(data => {
      return [undefined, data] as [undefined, T]
    })
    .catch(error => {
      return [error]
    })
}

export {
  BURN_ADDRESS,
  NETWORK_PROTOCOL_CRYPTO,
  catchPromiseError,
  createNetworkJsonList,
  getAvatarImageURL,
  getNetworkName,
  isLowerCase,
  isNetworkAddress,
  isNetworkBurnAddress,
  isNetworkOrWalletAccountAddress,
  isNetworkProtocolAddress,
  isNetworkProtocolToken,
  isTransaction_A_Wrap,
  isTokenAddress,
  isWrappedNetworkAddress
}
  