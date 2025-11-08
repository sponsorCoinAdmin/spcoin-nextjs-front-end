// File: app/(menu)/layout.tsx

import type { Metadata } from 'next'
import '@/app/globals.css'
import Header from '@/components/panes/header'
import SpCoinProviders from '@/components/Wrappers/SpCoinProviders'

export const metadata: Metadata = {
  title: 'spCoin',
  description: 'A decentralized cryptocurrency exchange platform powered by spCoin.', // ✅ updated meaningful description
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* <ExchangeProvider> previously used, currently replaced by SpCoinProviders */}
      <SpCoinProviders>
        <Header />
        {/* {children} */}
        {/* <Footer /> temporarily disabled for redesign */}
      </SpCoinProviders>
    </>
  )
}
