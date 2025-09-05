// File: components/panes/header.tsx
'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from '@/components/Buttons/Connect/ConnectButton';
import NetworkSelect from '@/components/containers/NetworkSelect';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEADER === 'true';
const debugLog = createDebugLogger('Header', DEBUG_ENABLED, LOG_TIME);

export default function Header() {
  const { exchangeContext } = useExchangeContext();

  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const networkElement = exchangeContext?.network;

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
          {/* Fix: if CSS changes one dimension, set the other to auto.
             - Remove width/height props so Next uses intrinsic metadata.
             - Size via className: height fixed, width auto to keep aspect ratio. */}
          <Image
            src={spCoin_png}
            alt="Sponsor Coin Logo"
            priority
            className="h-8 w-auto"
          />

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
              href="/Test"
              className={linkClass('/Test')}
              onMouseEnter={onMouseEnter('/Test')}
              onMouseLeave={onMouseLeave}
            >
              Test
            </Link>
          )}

          {staticLinks
            .filter((link) => pathname === link.href)
            .map((link) => (
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

        {/* Right side: use Tailwind gap for an exact 10px spacing (gap-2.5 = 0.625rem ≈ 10px) */}
        <div className="flex items-center gap-2.5">
          <ConnectButton
            showName={true}
            showSymbol={false}
            showChevron={true}
            showConnect={true}
            showDisconnect={false}
            showHoverBg={true}
          />
        </div>
      </div>
    </header>
  );
}
