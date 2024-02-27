import chainIdList from '../../resources/data/networks/chainIds.json';
import { defaultNetworkSettings as defaultEthereumSettings } from './initialize/ethereum/defaultNetworkSettings'
import { defaultNetworkSettings as defaultPolygonSettings } from './initialize/polygon/defaultNetworkSettings'
import { defaultNetworkSettings as defaultSepoliaSettings } from './initialize/sepolia/defaultNetworkSettings'
// This is duplicate code found in Datalist.tsx.  Put in Library call
/////////////////////////////////////////////////////////////
const getChainMap = (chainList: any[]) => {
    let chainMap = new Map();
    const tList = chainList?.map((e: any, i: number) => {
        chainMap.set(chainList[i].chainId,chainList[i])
    })
    return chainMap
  }
  const chainIdMap = getChainMap(chainIdList)

  const getNetworkName = (chainId:number) => {
    return chainIdMap?.get(chainId)?.name;
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

  export { getNetworkName, createNetworkJsonList }
  /////////////////////////////////////////////////////////////
  
  