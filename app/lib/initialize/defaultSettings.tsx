import { TokenElement } from '../structure/types'
import { defaultNetworkSettings as defaultEthereumSettings } from './ethereum/defaultSettings'
import { defaultNetworkSettings as defaultPolygonSettings } from './polygon/defaultSettings'
import { defaultNetworkSettings as defaultSepoliaSettings } from './sepolia/defaultSettings'

const getDefaultNetworkSettings = (network:string|number) => {
    switch(network)
    {
        case 1:
        case "ethereum": return defaultEthereumSettings;
        case 137:
        case "polygon": return defaultPolygonSettings;
        case 11155111:
        case "sepolia": return defaultSepoliaSettings;
        default: return defaultEthereumSettings
    }
}

const defaultSettings = defaultEthereumSettings;

export { 
    getDefaultNetworkSettings,  
    defaultEthereumSettings,
    defaultPolygonSettings,
    defaultSepoliaSettings
 };
