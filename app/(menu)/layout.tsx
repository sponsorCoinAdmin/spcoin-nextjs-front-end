// File: app/(menu)/layout.tsx

import type { Metadata } from 'next'
import '@/app/globals.css'
import Header from '@/components/panes/header'
import SpCoinProviders from '@/components/Wrappers/SpCoinProviders'

export const metadata: Metadata = {
  title: 'spCoin',
  description: 'A decentralized cryptocurrency exchange platform powered by spCoin.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // keep the param to satisfy Next.js layout typing, but don't render it
  void children

  return (
    <>
      <SpCoinProviders>
        <Header />
        {/* {children} */}
        {/* <Footer /> */}
      </SpCoinProviders>
    </>
  )
}
