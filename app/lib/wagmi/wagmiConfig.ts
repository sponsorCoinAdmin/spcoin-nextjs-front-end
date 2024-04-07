import { mainnet, polygon, sepolia } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

  export const wagmiConfig = createConfig({
    chains: [mainnet, polygon, sepolia], 
    transports: { 
      [mainnet.id]: http(), 
      [polygon.id]: http(), 
      [sepolia.id]: http(), 
    },
  })
  
  function getWagmiConfig() {
    return wagmiConfig
  }
  
  export { getWagmiConfig }