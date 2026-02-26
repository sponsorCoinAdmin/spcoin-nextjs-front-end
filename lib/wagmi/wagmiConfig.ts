// File: @/lib/wagmi/wagmiConfig.ts

'use client';

import { mainnet, base, polygon, sepolia, hardhat } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { getDefaultConfig } from 'connectkit';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Debug Logging
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_WAGMI_CONFIG === 'true';
const debugLog = createDebugLogger('wagmiConfig', DEBUG_ENABLED, LOG_TIME);

// Provider selection (INFURA or ALCHEMY)
export const BLOCKCHAIN_PROVIDER = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER;

let BASE_URL = '';
let MAINNET_URL = '';
let POLYGON_URL = '';
let SEPOLIA_URL = '';
const NEXT_PUBLIC_BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || '';
const NEXT_PUBLIC_HARDHAT_URL =
  process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || process.env.NEXT_PUBLIC_HARDHAT_URL || '';

switch (BLOCKCHAIN_PROVIDER) {
  case 'ALCHEMY':
    MAINNET_URL = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL || '';
    POLYGON_URL = process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL || '';
    SEPOLIA_URL = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL || '';
    break;
  case 'INFURA':
    BASE_URL = NEXT_PUBLIC_BASE_RPC_URL || '';
    MAINNET_URL = process.env.NEXT_PUBLIC_INFURA_MAINNET_URL || '';
    POLYGON_URL = process.env.NEXT_PUBLIC_INFURA_POLYGON_URL || '';
    SEPOLIA_URL = process.env.NEXT_PUBLIC_INFURA_SEPOLIA_URL || '';
    break;
  default:
    debugLog.warn('⚠️ BLOCKCHAIN_PROVIDER not set or unrecognized — no URLs configured.');
}

if (!BASE_URL) {
  BASE_URL = NEXT_PUBLIC_BASE_RPC_URL || '';
}

debugLog.log('BLOCKCHAIN_PROVIDER =', BLOCKCHAIN_PROVIDER);
debugLog.log('BASE_URL            =', BASE_URL);
debugLog.log('MAINNET_URL         =', MAINNET_URL);
debugLog.log('POLYGON_URL         =', POLYGON_URL);
debugLog.log('SEPOLIA_URL         =', SEPOLIA_URL);
debugLog.log('NEXT_PUBLIC_BASE_RPC_URL =', NEXT_PUBLIC_BASE_RPC_URL);
debugLog.log('NEXT_PUBLIC_HARDHAT_URL  =', NEXT_PUBLIC_HARDHAT_URL );

// Export Wagmi config
export const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, base, polygon, sepolia, hardhat],
    connectors: [injected()],
    ssr: true,
    transports: {
      [base.id]: http(BASE_URL),
      [mainnet.id]: http(MAINNET_URL),
      [polygon.id]: http(POLYGON_URL),
      [sepolia.id]: http(SEPOLIA_URL),
      [hardhat.id]: http(NEXT_PUBLIC_HARDHAT_URL ),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
    appName: 'SponsorCoin Exchange',
    appDescription: 'SponsorCoin Exchange',
    appUrl: 'https://family.co',
    appIcon: 'https://family.co/logo.png',
  })
);

// ✅ In Wagmi v2, use `usePublicClient()` where needed — no static `publicClient` export here
