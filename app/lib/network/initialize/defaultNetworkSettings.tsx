import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';

/**
 * Determine whether the given `input` is a string in lowercase.
 * @param {*} input
 * @returns {Boolean}
 */

const getDefaultNetworkSettings = (network:string|number) => {
  if (typeof network === "string" && !isLowerCase(network)) {
    alert("getDefaultNetworkSettings"+network )
    network = network.toLowerCase()
  }
  switch(network)
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
