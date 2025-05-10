import { base, mainnet, polygon, sepolia, hardhat } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { getDefaultConfig } from 'connectkit';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME:boolean = false;
const NEXT_PUBLIC_DEBUG_LOG_WAGMI_CONFIG = process.env.NEXT_PUBLIC_DEBUG_LOG_WAGMI_CONFIG === 'true';
const debugLog = createDebugLogger(
  'wagmiConfig',
   NEXT_PUBLIC_DEBUG_LOG_WAGMI_CONFIG,
  LOG_TIME
);

// 🌐 Blockchain provider selection (INFURA or ALCHEMY)
const BLOCKCHAIN_PROVIDER = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER;
let BASE_URL: string = '';
let MAINNET_URL: string = '';
let POLYGON_URL: string = '';
let SEPOLIA_URL: string = '';
let HARDHAT_URL: string = process.env.HARDHAT || '';

switch (BLOCKCHAIN_PROVIDER) {
  case 'ALCHEMY':
    MAINNET_URL = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL || '';
    POLYGON_URL = process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL || '';
    SEPOLIA_URL = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL || '';
    break;
  case 'INFURA':
    BASE_URL    = process.env.NEXT_PUBLIC_INFURA_BASE_URL    || '';
    MAINNET_URL = process.env.NEXT_PUBLIC_INFURA_MAINNET_URL || '';
    POLYGON_URL = process.env.NEXT_PUBLIC_INFURA_POLYGON_URL || '';
    SEPOLIA_URL = process.env.NEXT_PUBLIC_INFURA_SEPOLIA_URL || '';
    break;
  default:
    debugLog.warn('⚠️ BLOCKCHAIN_PROVIDER not set or unrecognized — no URLs configured.');
}

debugLog.log('BLOCKCHAIN_PROVIDER =', BLOCKCHAIN_PROVIDER);
debugLog.log('BASE_URL            =', BASE_URL);
debugLog.log('MAINNET_URL         =', MAINNET_URL);
debugLog.log('POLYGON_URL         =', POLYGON_URL);
debugLog.log('SEPOLIA_URL         =', SEPOLIA_URL);
debugLog.log('HARDHAT_URL         =', HARDHAT_URL);

export const config = createConfig(
  getDefaultConfig({
    chains: [base, mainnet, polygon, sepolia, hardhat],
    connectors: [
      injected(),
      // coinbaseWallet({ appName: 'SponsorCoin Exchange' }),
      // walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '' }),
    ],
    ssr: true,
    transports: {
      [base.id]: http(BASE_URL),
      [mainnet.id]: http(MAINNET_URL),
      [polygon.id]: http(POLYGON_URL),
      [sepolia.id]: http(SEPOLIA_URL),
      [hardhat.id]: http(HARDHAT_URL),
    },

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
    appName: 'SponsorCoin Exchange',
    appDescription: 'SponsorCoin Exchange',
    appUrl: 'https://family.co',
    appIcon: 'https://family.co/avatar.png',
  })
);
