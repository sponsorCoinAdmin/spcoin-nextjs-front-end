import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';

/**
 * Determine whether the given `input` is a string in lowercase.
 * @param {*} input
 * @returns {Boolean}
 */

const getDefaultNetworkSettings = (chain:any) => {
  // alert("getDefaultNetworkSettings"+chain )
  if (typeof chain === "string" && !isLowerCase(chain)) {
    chain = chain.toLowerCase()
  }
  else if (typeof chain !== "number" ) {
    chain = chain.id
  }
  
  switch(chain)
  {
      case 1:
      case "ethereum": return defaultEthereumSettings;
      case 137:
      case "polygon": return defaultPolygonSettings;
      case 11155111:
      case "sepolia": return defaultSoliditySettings;
      default: return defaultEthereumSettings;
  }
}

export { 
    getDefaultNetworkSettings
 };
