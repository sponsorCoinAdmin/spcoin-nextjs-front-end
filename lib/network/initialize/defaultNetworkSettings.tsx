import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';
import { useAccount } from 'wagmi';
import { stringifyBigInt } from '@/lib/spCoin/utils';


/**
 * Determine whether the given `input` is a string in lowercase.
 * @param {*} input
 * @returns {Boolean}
 */

const getDefaultNetworkSettings = (chain:any) => {
    // alert("getDefaultNetworkSettings"+chain )
  if (chain && typeof chain === "string" && !isLowerCase(chain)) {
    chain = chain.toLowerCase()
  }
  else if (chain && typeof chain !== "number" && typeof chain !== "string") {
    chain = chain.id
  }
  
  console.debug(`getDefaultNetworkSettings:chain = ${chain}`);
  switch(chain)
  {
      case 1:
      case "ethereum": //alert(`SELECTING defaultEthereumSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
      return defaultEthereumSettings;
      case 137:
      case "polygon":  //alert(`SELECTING defaultPolygonSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
      return defaultPolygonSettings;
      case 11155111:
      case "sepolia":  //alert(`SELECTING defaultSoliditySettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
      return defaultSoliditySettings;
      default: // alert(`SELECTING defaultEthereumSettings = \n${stringifyBigInt(defaultEthereumSettings)}`);
      return defaultEthereumSettings;
  }
}

export {
  getDefaultNetworkSettings
 };
