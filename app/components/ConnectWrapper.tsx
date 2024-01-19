'use client'
import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiConfig, createConfig } from "wagmi";
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { useEffect, useState } from "react";

const alchemyId              = process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID === undefined ? "0" : process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID === undefined ? "0" : process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
// console.log ("alchemyId               :" + alchemyId)
// console.log ("walletConnectProjectId  :" + walletConnectProjectId)

// Choose which chains you'd like to show
const chains = [mainnet, polygon, sepolia];
const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: alchemyId,
    walletConnectProjectId: walletConnectProjectId,
    // Required
    appName: "SponsorCoin Dev Demo App",
    // Optional
    appDescription: "A Next.js SponsorCoin app for 0x Swap API and ConnectKit",
    chains,
  })
);

export default function App(props: {
      [x: string]: any; Component: any; 
}) {
    let { Component, pageProps } = props;

  // alert(Component);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          {mounted && <Component {...pageProps}/>}
        </ConnectKitProvider>
      </WagmiConfig>
    </>
  );
}