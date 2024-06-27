import chainIdList from '@/resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultEthereumSettings } from './initialize/ethereum/defaultNetworkSettings'
import { defaultNetworkSettings as defaultPolygonSettings } from './initialize/polygon/defaultNetworkSettings'
import { defaultNetworkSettings as defaultSepoliaSettings } from './initialize/sepolia/defaultNetworkSettings'
// This is duplicate code found in Datalist.tsx.  Put in Library call
/////////////////////////////////////////////////////////////
const BURN_ADDRESS = "0x0000000000000000000000000000000000000000"

// This should work
const imgHome = "/resources/images/chains/"
// const imgHome = "../../resources/images/chains"
const imgType = ".png"

const getChainMap = (chainList: any[]) => {
    const chainMap = new Map();
    const tList = chainList.map((e: any, i: number) => {
        chainMap.set(chainList[i].chainId,chainList[i])
    })
    return chainMap
  }

const chainIdMap = getChainMap(chainIdList)

const getNetworkName = (chainId:number) => {
  // console.debug(`getNetworkName:chainId = (${chainId})`)
  const networkName:string = chainIdMap.get(chainId)?.name;
  // const networkName:string = await chainIdMap?.get(chainId)?.name;
  // console.debug(`getNetworkName:networkName = (${networkName})`)
  return networkName;
}

function getAvatarImageURL(chainId:number|string) {
  console.debug(`getAvatarImageURL:chainId = (${chainId})`)
  let imgURL:string = imgHome+chainId + imgType;
  console.debug(`getAvatarImageURL:imgURL = (${imgURL})`)
  return imgURL
}

  // This method is never executed in the main program but is a utility to create a default network json list
const createNetworkJsonList = () => {
  const defaultNetworkSettings = {
    ethereum : defaultEthereumSettings,
    polygon  : defaultPolygonSettings,
    sepolia  : defaultSepoliaSettings,
  }
  let networkSettings = "default json Network Settings for all Networks AS follows:\n"+ JSON.stringify(defaultNetworkSettings, null, 2);
  console.debug(networkSettings)
  alert("NetworkSettings: "+networkSettings)
}

function isLowerCase (input:string) {  
  return input === String(input).toLowerCase()
}

export { BURN_ADDRESS, getNetworkName, createNetworkJsonList, getAvatarImageURL, isLowerCase }
  