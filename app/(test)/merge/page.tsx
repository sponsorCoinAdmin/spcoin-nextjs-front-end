'use client'

import { useState, useEffect, useMemo } from 'react'
import { defaultMissingImage } from '@/lib/network/utils'
import { publicWalletPath, WalletAccount } from '@/lib/structure/types'

export default function Page() {
  const [wallets, setWallets] = useState<WalletAccount[]>([])
  const [filter, setFilter] = useState<'All' | 'Recipients' | 'Agents'>('All')

  useEffect(() => {
    async function loadWallets() {
      try {
        const res = await fetch('/wallets.json') // ✅ replace with your data source
        const data = await res.json()
        setWallets(data)
      } catch (err) {
        console.error('Failed to load wallets', err)
      }
    }

    loadWallets()
  }, [])

  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      if (filter === 'All') return true
      if (filter === 'Recipients') return wallet.type === 'recipient'
      if (filter === 'Agents') return wallet.type === 'agent'
      return false
    })
  }, [wallets, filter])

  const getAvatarUrl = (walletAddress: string) => {
    return `/${publicWalletPath}/${walletAddress}/avatar.png` // let browser 404 if missing
  }

  const getTitle = () => {
    if (filter === 'All') return 'All Wallets'
    if (filter === 'Recipients') return 'Recipient Wallets'
    if (filter === 'Agents') return 'Agent Wallets'
    return 'Wallets'
  }

  return (
    <div>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#333',
        color: '#fff',
        padding: '10px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
          {getTitle()}
        </h1>
        <div style={{ display: 'flex', gap: '10px', fontSize: '16px', marginTop: '8px' }}>
          {['All', 'Recipients', 'Agents'].map(option => (
            <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type='radio'
                name='walletFilter'
                value={option}
                checked={filter === option}
                onChange={() => setFilter(option as any)}
                style={{ marginRight: '5px' }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '90px', padding: '0 20px' }}>
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {filteredWallets.map((wallet, index) => {
            const avatarUrl = getAvatarUrl(wallet.address)

            return (
              <li key={wallet.address} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: index % 2 === 0 ? '#d6d6d6' : '#f5f5f5',
                marginBottom: '10px',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center', marginRight: '12px' }}>
                  <img
                    src={avatarUrl}
                    alt='Avatar'
                    width='100'
                    height='100'
                    style={{ borderRadius: '50%', border: '2px solid #ccc' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = defaultMissingImage }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {wallet.name || 'Unknown Wallet'}
                  </div>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    margin: '4px 0 0 12px',
                    fontSize: '14px',
                    color: '#333'
                  }}>
                    {JSON.stringify(wallet, null, 2)}
                  </pre>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
