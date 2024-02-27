import defaultNetworkSettings from "./defaultNetworkSettings.json"

const getDefaultNetworkSettings = (network:string|number) => {
  if (typeof network === "string")
    network = network.toLowerCase()
  switch(network)
  {
      case 1:
      case "ethereum": return defaultNetworkSettings.ethereum;
      case 137:
      case "polygon": return defaultNetworkSettings.polygon;
      case 11155111:
      case "sepolia": return defaultNetworkSettings.sepolia;
      default: return defaultNetworkSettings.ethereum;
  }
}

export { 
    getDefaultNetworkSettings,  
    defaultNetworkSettings
 };
