import defaultNetworkSettings from "./defaultNetworkSettings.json"

import defaultEthereumSettings from './ethereum/defaultNetworkSettings.json';
import defaultPolygonSettings from './polygon/defaultNetworkSettings.json';
import defaultSoliditySettings from './sepolia/defaultNetworkSettings.json';


const getDefaultNetworkSettings = (network:string|number) => {
  if (typeof network === "string")
    network = network.toLowerCase()
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
  getDefaultNetworkSettings,  
  defaultNetworkSettings
 };
