import "./styles/App.module.css";
import type { AppProps } from "next/app";
import { WagmiConfig, createConfig } from "wagmi";
import {
  getDefaultConfig,
} from "connectkit";
import { useEffect, useState } from "react";

const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    alchemyId: "EuL5KyMLLBrMyNbZW9CgtiSy45_bh24c",
    walletConnectProjectId: "2c23de9d13468896a8a189e8f56ba34e",

    // Required
    appName: "SponsorCoin Demo App",

    // Optional
    appDescription: "A Next.js demo app for 0x Swap API and ConnectKit",
  })
);

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div>
        return <Component {...pageProps} />
    </div>
  );
}
