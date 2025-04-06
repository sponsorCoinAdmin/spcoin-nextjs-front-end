import { createConfig, http } from '@wagmi/core'
import { mainnet, polygon, sepolia, base, hardhat } from 'wagmi/chains'

export const wagmiServerConfig = createConfig({
  chains: [mainnet, polygon, sepolia, base, hardhat],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL || ''),
    [polygon.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL || ''),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL || ''),
    [base.id]: http(process.env.NEXT_PUBLIC_INFURA_BASE_URL || ''),
    [hardhat.id]: http(process.env.HARDHAT || 'http://127.0.0.1:8545'),
  },
})
