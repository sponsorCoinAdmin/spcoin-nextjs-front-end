import { mainnet, polygon, sepolia, hardhat } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { getDefaultConfig } from 'connectkit';

export const BLOCKCHAIN_PROVIDER = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER;
let MAINNET_URL:string = "";
let POLYGON_URL:string = "";
let SEPOLIA_URL:string = "";
let HARDHAT_URL:string = process.env.HARDHAT || "";

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

console.log(`BLOCKCHAIN_PROVIDER = ${BLOCKCHAIN_PROVIDER}`)
console.log(`MAINNET_URL         = ${MAINNET_URL}`)
console.log(`POLYGON_URL         = ${POLYGON_URL}`)
console.log(`SEPOLIA_URL         = ${SEPOLIA_URL}`)
console.log(`HARDHAT_URL         = ${HARDHAT_URL}`)

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, polygon, sepolia, hardhat],
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
      [hardhat.id]: http(HARDHAT_URL),
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
