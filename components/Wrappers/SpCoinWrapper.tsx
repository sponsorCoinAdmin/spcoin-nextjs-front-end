'use client'
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi/wagmiConfig";
import { ExchangeWrapper } from "@/lib/context/ExchangeContext";

export default function ({children} : {
  children: React.ReactNode;
}) {

  // alert(`children = ${JSON.stringify(children,null,2)}`)
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ExchangeWrapper>
          <ConnectKitProvider>
            { children }
          </ConnectKitProvider>
        </ExchangeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
