'use client'
import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Choose which chains you'd like to show
const connectKitConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, polygon, sepolia],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_MAINNET_ALCHEMY_ID}`,
      ),      
      [polygon.id]: http(
        `https://polygonzkevm-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID}`,
      ),
      [sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_ID}`,
      ),
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
    <WagmiProvider config={connectKitConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          { children }
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
function cors(): any {
  throw new Error("Function not implemented.");
}

