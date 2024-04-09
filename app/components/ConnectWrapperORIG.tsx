'use client'
import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { useEffect, useState } from "react";

// Choose which chains you'd like to show
const connectKitConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, polygon, sepolia],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`,
      ),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID === undefined ? "0" : process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,

    // Required App Info
    appName: "SponsorCoin Exchange",

    // Optional App Info
    appDescription: "SponsorCoin Exchange",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

export default function ConnectWrapper(props: {
      [x: string]: any; Component: any; 
}) {
    let { Component, pageProps } = props;

  // alert(Component);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <WagmiProvider config={connectKitConfig}>
        <ConnectKitProvider>
          {mounted && <Component {...pageProps}/>}
        </ConnectKitProvider>
      </WagmiProvider>
    </>
  );
}