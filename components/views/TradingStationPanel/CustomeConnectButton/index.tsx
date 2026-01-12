// File: @/components/views/TradingStationPanel/ConnectTradeButton/index.tsx
'use client';

import React from 'react';
import { ConnectKitButton } from 'connectkit';

function formatLabel(
  isConnected: boolean,
  isConnecting: boolean,
  address?: `0x${string}` | null,
  ensName?: string | null
) {
  if (isConnecting) return 'Connecting…';
  if (isConnected) {
    const id =
      ensName ?? (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected');
    return `Connected: ${id}`;
  }
  return 'Connect Wallet';
}

export default function CustomConnectButton() {
  return (
    <ConnectKitButton.Custom>
      {({ show, isConnected, isConnecting, address, ensName }) => (
        <button
          onClick={show}
          type="button"
          aria-label="Connect wallet"
          aria-busy={isConnecting}
          disabled={isConnecting}
          className="
            flex items-center justify-center
            w-full h-[55px]
            text-[20px] font-bold
            rounded-[12px]
            text-[#5981F3]
            bg-[#243056]
            transition-all duration-300
            mb-[5px]
            hover:text-green-500
            disabled:opacity-70
            disabled:cursor-not-allowed
          "
        >
          {formatLabel(
            Boolean(isConnected),
            Boolean(isConnecting),
            address as any,
            ensName as any
          )}
        </button>
      )}
    </ConnectKitButton.Custom>
  );
}
