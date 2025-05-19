// File: app\(menu)\layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import Footer from '@/components/panes/footer'
import Header from '@/components/panes/header'
import SpCoinWrapper from '@/components/Wrappers/SpCoinWrapper'

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
      {/* <ExchangeWrapper> previously used, currently replaced by SpCoinWrapper */}
      <SpCoinWrapper>
        <Header />
        {children}
        {/* <Footer /> temporarily disabled for redesign */}
      </SpCoinWrapper>
    </>
  )
}
