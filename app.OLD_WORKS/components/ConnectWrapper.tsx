'use client'
import { mainnet, polygon, sepolia, } from "wagmi/chains"
import { WagmiConfig, createConfig } from "wagmi";
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";
import { useEffect, useState } from "react";


// NOT SURE why this is needed works with address set to "0"
const polygonAlchemyId       = process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID === undefined ? "0" : process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID === undefined ? "0" : process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
// alert("polygonAlchemyId               :" + polygonAlchemyId)
// console.log ("polygonAlchemyId               :" + polygonAlchemyId)
// console.log ("walletConnectProjectId  :" + walletConnectProjectId)

// Choose which chains you'd like to show
const chains = [mainnet, polygon, sepolia];
const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: polygonAlchemyId,
    walletConnectProjectId: walletConnectProjectId,
    // Required
    appName: "SponsorCoin Dev Demo App",
    // Optional
    appDescription: "A Next.js SponsorCoin app for 0x Swap API and ConnectKit",
    chains,
  })
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
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          {mounted && <Component {...pageProps}/>}
        </ConnectKitProvider>
      </WagmiConfig>
    </>
  );
}