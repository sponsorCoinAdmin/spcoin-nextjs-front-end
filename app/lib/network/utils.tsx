import chainIdList from '../../resources/data/networks/chainIds.json';
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

  export { getNetworkName }
  /////////////////////////////////////////////////////////////
  
  