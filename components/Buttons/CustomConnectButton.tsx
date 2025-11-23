// File: @/components/Buttons/CustomConnectButton.tsx
'use client';

import React from 'react';
import styles from '@/styles/Exchange.module.css';
import { ConnectKitButton } from 'connectkit';

function formatLabel(isConnected: boolean, isConnecting: boolean, address?: `0x${string}` | null, ensName?: string | null) {
  if (isConnecting) return 'Connecting…';
  if (isConnected) {
    const id = ensName ?? (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected');
    return `Connected: ${id}`;
  }
  return 'Connect Wallet';
}

export default function CustomConnectButton() {
  return (
    <div id='CustomConnectButton'>
      <ConnectKitButton.Custom>
        {({ show, isConnected, isConnecting, address, ensName }) => (
          <button
            onClick={show}
            type='button'
            className={styles.exchangeButton}
            aria-label='Connect wallet'
            aria-busy={isConnecting ? 'true' : 'false'}
            disabled={isConnecting}
          >
            {formatLabel(Boolean(isConnected), Boolean(isConnecting), address as any, ensName as any)}
          </button>
        )}
      </ConnectKitButton.Custom>
    </div>
  );
}
