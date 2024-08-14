import { mainnet, polygon, sepolia } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { getDefaultConfig } from 'connectkit';

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

export const config = createConfig(
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
