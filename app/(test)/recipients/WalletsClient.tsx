'use client'

import { WalletAccount } from '@/lib/structure'
import { defaultMissingImage } from '@/lib/network/utils'

export default function WalletsClient({ wallets }: { wallets: WalletAccount[] }) {

  return (
    <div style={{ padding: '20px' }}>
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {wallets.map((wallet, index) => {
          const logoUrl = wallet.logoURL;
          const isMissingLogo = logoUrl === defaultMissingImage

          return (
            <li
              key={wallet.address}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: index % 2 === 0 ? '#d6d6d6' : '#f5f5f5',
                marginBottom: '10px',
                borderRadius: '8px',
              }}
            >
              <div style={{ textAlign: 'center', marginRight: '12px' }}>
                <img
                  src={logoUrl}
                  alt='Logo'
                  width='100'
                  height='100'
                  style={{
                    borderRadius: '50%',
                    border: '2px solid #ccc',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultMissingImage
                  }}
                />
                {isMissingLogo && (
                  <div
                    style={{
                      color: 'red',
                      fontSize: '16px',
                      marginTop: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    Missing Logo
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {wallet.name || 'Unknown Wallet'}
                </div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    margin: '4px 0 0 12px',
                    fontSize: '14px',
                    color: '#333',
                  }}
                >
                  {JSON.stringify(wallet, null, 2)}
                </pre>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
