// File: components/Headers/Header.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { config } from '@/lib/wagmi/wagmiConfig';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from '../Buttons/ConnectButton';
import {
  defaultMissingImage,
  getBlockChainName,
  getBlockChainLogoURL,
} from '@/lib/network/utils';
import { useChainId } from 'wagmi';
import {
  useBuyTokenContract,
  useSellTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks/contextHooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEADER === 'true';
const debugLog = createDebugLogger('Header', DEBUG_ENABLED, LOG_TIME);

export default function Header() {
  const [networkName, setNetworkName] = useState('Ethereum');
  const chainId = useChainId({ config });

  const [logo, setLogo] = useState(() => getBlockChainLogoURL(chainId));

  const [_, setSellTokenContract] = useSellTokenContract();
  const [__, setBuyTokenContract] = useBuyTokenContract();
  const { setExchangeContext } = useExchangeContext();

  const SHOW_TEST_LINK = process.env.NEXT_PUBLIC_DEBUG_TEST_PAGE_ON === 'true';

  // Update network display
  useEffect(() => {
    if (!chainId) return;

    const network = getBlockChainName(chainId) || '';
    const newLogo = getBlockChainLogoURL(chainId);

    debugLog.log(`🔄 chainId = ${chainId}`);
    debugLog.log(`🌐 networkName = ${network}`);
    debugLog.log(`🖼️ newLogo = ${newLogo}`);

    setNetworkName(network);
    setLogo(newLogo);
  }, [chainId]);

  // Clear token contracts + update context chainId globally
  useEffect(() => {
    if (!chainId) return;

    debugLog.warn(`⚠️ Clearing token contracts due to chain switch: ${chainId}`);

    // Clear token state immediately
    setSellTokenContract(undefined);
    setBuyTokenContract(undefined);

    // Update exchangeContext with new chainId
    setExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        chainId,
      },
    }));
  }, [chainId]);

  return (
    <header
      className="text-white border-b border-[#21273a] py-4"
      style={{
        background: 'rgb(119, 126, 142)',
        paddingLeft: '15px',
        paddingRight: '33px',
      }}
    >
      <div className="flex flex-row justify-between items-center w-full">
        {/* Left-aligned nav */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Image
            src={spCoin_png}
            width={25}
            height={25}
            alt="Sponsor Coin Logo"
          />

          <Link
            href="/SponsorCoin"
            className="px-4 py-2 rounded font-medium transition hover:bg-[#222a3a] hover:text-[#5981F3] cursor-pointer"
          >
            SponsorCoin
          </Link>
          <Link
            href="/Exchange"
            className="px-4 py-2 rounded font-medium transition hover:bg-[#222a3a] hover:text-[#5981F3] cursor-pointer"
          >
            Exchange
          </Link>
          <Link
            href="/Recipient"
            className="px-4 py-2 rounded font-medium transition hover:bg-[#222a3a] hover:text-[#5981F3] cursor-pointer"
          >
            Recipient
          </Link>
          <Link
            href="/Admin"
            className="px-4 py-2 rounded font-medium transition hover:bg-[#222a3a] hover:text-[#5981F3] cursor-pointer"
          >
            Admin
          </Link>
          {SHOW_TEST_LINK && (
            <Link
              href="/Exchange/Test"
              className="px-4 py-2 rounded font-medium transition hover:bg-[#222a3a] hover:text-[#5981F3] cursor-pointer"
            >
              Test
            </Link>
          )}
        </div>

        {/* Right-aligned network + connect */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              key={logo} // ⬅️ Force re-render when logo changes
              src={logo}
              className="h-[36px]"
              alt={`Header ChainId = ${chainId} Network = ${networkName}`}
              onError={(event) => {
                debugLog.warn(`⚠️ Failed to load logo: ${logo}, using fallback.`);
                event.currentTarget.src = defaultMissingImage;
              }}
            />
            <span className="text-[15px] font-semibold">{networkName}</span>
          </div>
          <div className="ml-2">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
