// File: @/components/panes/header.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectNetworkButtonProps from '@/components/Buttons/Connect/ConnectNetworkButton';

import { labelForPath, PATH_TO_ID } from '@/lib/utils/tabs/registry';
import { closeTabByHref, useTabs } from '@/lib/utils/tabs/tabsManager';

const NON_NAV_HOVER = '__non_nav_hover__';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // 🔹 Source of truth for open tabs (persists via localStorage inside useTabs)
  const { hrefs: openTabs } = useTabs(); // hrefs = list of open tab paths

  const TEST_LINK = process.env.NEXT_PUBLIC_SHOW_TEST_TAB === 'true';
  const EXCHANGE_LINK = process.env.NEXT_PUBLIC_SHOW_EXCHANGE_TAB === 'true';
  const SPCOIN_LINK = process.env.NEXT_PUBLIC_SHOW_SPCOIN_TAB === 'true';

  // ✅ Debounce/lock per-tab close clicks (prevents double-fire)
  const closingTabsRef = useRef<Set<string>>(new Set());

  /** Close handler: delegate to tabsManager and navigate if the active tab is closed. */
  const closeTab = useCallback(
    (href: string) => {
      if (closingTabsRef.current.has(href)) return;
      closingTabsRef.current.add(href);

      try {
        const currentId = PATH_TO_ID[href];
        closeTabByHref(href, {
          navigate: true,
          router,
          currentId,
        });
      } finally {
        // Small delay so rapid double-clicks / duplicate bubbling can't re-run close.
        window.setTimeout(() => {
          closingTabsRef.current.delete(href);
        }, 150);
      }
    },
    [router],
  );

  const linkClass = (href: string) => {
    const isHovered = hoveredTab === href;
    const isActive = pathname === href && hoveredTab === null;
    return `
      px-4 py-2 rounded font-medium transition cursor-pointer
      ${
        isHovered || isActive
          ? 'bg-[#222a3a] text-[#5981F3]'
          : 'text-white/90 hover:bg-[#222a3a] hover:text-[#5981F3]'
      }
    `;
  };

  const onMouseEnter = (href: string) => () => setHoveredTab(href);
  const onMouseLeave = () => setHoveredTab(null);

  return (
    <header className="text-white border-b border-[#21273a] py-4 bg-[#77808e] px-[15px] lg:px-[33px]">
      <div className="flex flex-row justify-between items-center w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
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

          {openTabs.length > 0 && (
            <div className="flex items-center gap-2">
              {openTabs.map((href) => {
                const isHovered = hoveredTab === href; // show 'X' only on hover
                return (
                  <div
                    key={`tab-${href}`}
                    className="relative"
                    onMouseEnter={onMouseEnter(href)}
                    onMouseLeave={onMouseLeave}
                  >
                    <Link href={href} className={`${linkClass(href)} pr-7`}>
                      {labelForPath(href)}
                    </Link>

                    {/* Show the close X ONLY on hover; light orange + bold */}
                    <button
                      type="button"
                      aria-label={`Close ${labelForPath(href)}`}
                      className={[
                        'absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 leading-none select-none z-10',
                        isHovered ? 'inline-block' : 'hidden',
                        '!text-orange-400 hover:!text-orange-300 focus:!text-orange-300 font-extrabold',
                      ].join(' ')}
                      style={{ color: '#fb923c' }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        closeTab(href);
                      }}
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div
            id="WalletConnectWrapper"
            className="relative z-[1000]"
            onMouseEnter={() => setHoveredTab(NON_NAV_HOVER)}
            onMouseLeave={() => setHoveredTab(null)}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ConnectNetworkButtonProps
              showName={false}
              showSymbol={true}
              showChevron={true}
              showConnect={true}
              showDisconnect={false}
              showHoverBg={true}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
