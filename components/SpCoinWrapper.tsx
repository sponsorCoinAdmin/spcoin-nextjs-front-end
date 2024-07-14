'use client'
import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const BLOCKCHAIN_PROVIDER = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER;
let MAINNET_URL:string = "";
let POLYGON_URL:string = "";
let SEPOLIA_URL:string = "";

switch (BLOCKCHAIN_PROVIDER) {
  case "ALCHEMY":
    MAINNET_URL = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL || "";
    POLYGON_URL = process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL || "";
    SEPOLIA_URL = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL || "";
  break;
  case "INFURA":
    MAINNET_URL = process.env.NEXT_PUBLIC_INFURA_MAINNET_URL || "";
    POLYGON_URL = process.env.NEXT_PUBLIC_INFURA_POLYGON_URL || "";
    SEPOLIA_URL = process.env.NEXT_PUBLIC_INFURA_SEPOLIA_URL || "";
  break;
}

console.debug(`BLOCKCHAIN_PROVIDER = ${BLOCKCHAIN_PROVIDER}`)
console.debug(`MAINNET_URL         = ${MAINNET_URL}`)
console.debug(`POLYGON_URL         = ${POLYGON_URL}`)
console.debug(`SEPOLIA_URL         = ${SEPOLIA_URL}`)

// Choose which chains you'd like to show
const connectKitWagmiConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, polygon, sepolia],
    connectors: [
      injected(),
      // coinbaseWallet({ appName: 'Create Wagmi' }),
      // walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""}),
    ],
    ssr: true,
    transports: {
      // [mainnet.id]: http(),
      // [polygon.id]: http(),
      // [sepolia.id]: http(),
      [mainnet.id]: http(MAINNET_URL),      
      [polygon.id]: http(POLYGON_URL),
      [sepolia.id]: http(SEPOLIA_URL),
    },
  
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "SponsorCoin Exchange",

    // Optional App Info
    appDescription: "SponsorCoin Exchange",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

export default function ({children} : {
  children: React.ReactNode;
}) {

  // alert(`children = ${JSON.stringify(children,null,2)}`)
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={connectKitWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          { children }
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
