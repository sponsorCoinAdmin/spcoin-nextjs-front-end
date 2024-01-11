'use client'

import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiConfig, createConfig, chain } from "wagmi";
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { useEffect, useState } from "react";

const alchemyId              = process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID === undefined ? "0" : process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID === undefined ? "0" : process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

// Choose which chains you'd like to show
const chains = [mainnet, polygon, sepolia];
const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    // alchemyId: "EuL5KyMLLBrMyNbZW9CgtiSy45_bh24c",
    // walletConnectProjectId: "2c23de9d13468896a8a189e8f56ba34e",

    // alert("alchemyId:" + alchemyId)
    // alert("walletConnectProjectId:" + walletConnectProjectId)
  
    alchemyId: alchemyId,
    walletConnectProjectId: "walletConnectProjectId",
    // Required
    appName: "SponsorCoin Dev Demo App",
    // Optional
    appDescription: "A Next.js SponsorCoin app for 0x Swap API and ConnectKit",
    chains,
  })
);

// export default function App({ Component, pageProps }: AppProps) {
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
          {/* <ConnectKitButton /> */}
          {mounted && <Component {...pageProps}/>}
        </ConnectKitProvider>
      </WagmiConfig>
    </>
  );
}
