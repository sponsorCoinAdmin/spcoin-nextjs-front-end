'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useResetContracts } from '@/lib/context/hooks/nestedHooks/useResetContracts';
import { useNetwork } from '@/lib/context/hooks/nestedHooks/useNetwork';
import { useLocalChainId } from '@/lib/context/hooks/nestedHooks/useLocalChainId';
import { useExchangeContext, useSellTokenContract, useBuyTokenContract } from '@/lib/context/hooks';
import { useDidHydrate } from '@/lib/hooks/useDidHydrate';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { defaultMissingImage } from '@/lib/network/utils';

import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from '../Buttons/ConnectButton';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEADER === 'true';
const debugLog = createDebugLogger('Header', DEBUG_ENABLED, LOG_TIME);

export default function Header() {
  const { setNetworkConnected } = useNetwork();
  useResetContracts();

  const chainId = useLocalChainId();
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const didHydrate = useDidHydrate();
  const [_, setSellTokenContract] = useSellTokenContract();
  const [__, setBuyTokenContract] = useBuyTokenContract();
  const { exchangeContext } = useExchangeContext();
  const { isConnected } = useAccount();

  useEffect(() => {
    setNetworkConnected(isConnected);
  }, [isConnected]);

  const networkName = exchangeContext?.network?.name ?? '';
  const logo = exchangeContext?.network?.logoURL ?? '';

  const TEST_LINK = process.env.NEXT_PUBLIC_SHOW_TEST_PAGE === 'true';
  const ADMIN_LINK = process.env.NEXT_PUBLIC_ADMIN_PAGE === 'true';
  const EXCHANGE_LINK = process.env.NEXT_PUBLIC_SHOW_EXCHANGE_PAGE === 'true';
  const SPCOIN_LINK = process.env.NEXT_PUBLIC_SHOW_SPCOIN_PAGE === 'true';

  const linkClass = (href: string) => {
    const isHovered = hoveredTab === href;
    const isActive = pathname === href && hoveredTab === null;

    return `
      px-4 py-2 rounded font-medium transition cursor-pointer
      ${isHovered || isActive ? 'bg-[#222a3a] text-[#5981F3]' : ''}
    `;
  };

  const onMouseEnter = (href: string) => () => setHoveredTab(href);
  const onMouseLeave = () => setHoveredTab(null);

  const staticLinks = [
    { href: '/WhitePaper', label: 'White Paper' },
    { href: '/SpCoinAPI', label: 'Sponsor Coin API' },
    { href: '/SponsorMe', label: 'Sponsor Me' },
    { href: '/ManageAccounts', label: 'Manage Accounts' },
    { href: '/CreateAgent', label: 'Create Agent' },
  ];

  return (
    <header className="text-white border-b border-[#21273a] py-4 bg-[#77808e] px-[15px] lg:px-[33px]">
      <div className="flex flex-row justify-between items-center w-full">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Image src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />

          {SPCOIN_LINK && (
            <Link
              href="/SponsorCoin"
              className={linkClass('/SponsorCoin')}
              onMouseEnter={onMouseEnter('/SponsorCoin')}
              onMouseLeave={onMouseLeave}
            >
              SponsorCoin
            </Link>
          )}

          {EXCHANGE_LINK && (
            <Link
              href="/Exchange"
              className={linkClass('/Exchange')}
              onMouseEnter={onMouseEnter('/Exchange')}
              onMouseLeave={onMouseLeave}
            >
              Exchange
            </Link>
          )}

          {TEST_LINK && (
            <Link
              href="/Exchange/Test"
              className={linkClass('/Exchange/Test')}
              onMouseEnter={onMouseEnter('/Exchange/Test')}
              onMouseLeave={onMouseLeave}
            >
              Test
            </Link>
          )}

          {staticLinks
            .filter(link => pathname === link.href)
            .map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onMouseEnter={onMouseEnter(link.href)}
                onMouseLeave={onMouseLeave}
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {logo && (
              <img
                key={logo}
                src={logo}
                className="h-[36px]"
                alt={`Header ChainId = ${chainId} Network = ${networkName}`}
                onError={(event) => {
                  debugLog.warn(`⚠️ Failed to load logo: ${logo}, using fallback.`);
                  event.currentTarget.src = defaultMissingImage;
                }}
              />
            )}
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
