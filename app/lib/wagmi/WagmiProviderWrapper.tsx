'use client'
import { WagmiProvider } from 'wagmi'
import { config } from './wagmiConfig' 
import { useEffect, useState } from "react";

export default function WagmiProviderWrapper(props: {
    [x: string]: any; Component: any; 
}) {
  let { Component, pageProps } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}> 
      {/** ... */} 
    </WagmiProvider> 
  )
}