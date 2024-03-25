import { createConfig, configureChains, fetchBalance } from '@wagmi/core'
import { mainnet, polygon, sepolia } from '@wagmi/chains'
import { publicProvider } from '@wagmi/core/providers/public'

const { publicClient, webSocketPublicClient } = configureChains(
    [mainnet, polygon, sepolia],
    [publicProvider()],
  )
  
  const config = createConfig({
    publicClient,
    webSocketPublicClient,
  })

  function setWagmiConfig() {
    return config
  }
  
  export { setWagmiConfig }