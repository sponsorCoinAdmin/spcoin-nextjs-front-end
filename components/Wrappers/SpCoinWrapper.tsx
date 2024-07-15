'use client'
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectKitWagmiConfig } from "@/lib/wagmi/wagmiConfig";

export default function ({children} : {
  children: React.ReactNode;
}) {

  // alert(`children = ${JSON.stringify(children,null,2)}`)
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={connectKitWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          { children }
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
