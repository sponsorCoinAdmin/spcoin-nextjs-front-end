import { mainnet, polygon, sepolia } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

  export const wagmiConfig = createConfig({
    chains: [mainnet, polygon, sepolia], 
    transports: { 
      // [mainnet.id]: http(), 
      // [polygon.id]: http(), 
      // [sepolia.id]: http(), 
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_MAINNET_ALCHEMY_ID}`,
      ),      
      [polygon.id]: http(),
      [sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_ID}`,
      ),
    },
  })
  
