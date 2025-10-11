// File: components/panes/header.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from '@/components/Buttons/Connect/ConnectButton';

import { labelForPath, getTabById, PATH_TO_ID } from '@/lib/utils/tabs/registry';
import { closeTabByHref, listOpenTabs } from '@/lib/utils/tabs/tabsManager';

const NON_NAV_HOVER = '__non_nav_hover__';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]); // hrefs only

  const TEST_LINK = process.env.NEXT_PUBLIC_SHOW_TEST_PAGE === 'true';
  const EXCHANGE_LINK = process.env.NEXT_PUBLIC_SHOW_EXCHANGE_PAGE === 'true';
  const SPCOIN_LINK = process.env.NEXT_PUBLIC_SHOW_SPCOIN_PAGE === 'true';

  /** Hydrate from tabsManager (single source of truth). */
  useEffect(() => {
    try {
      const ids = listOpenTabs(); // TabId[]
      const hrefs = ids.map((id) => getTabById(id).path);
      setOpenTabs(hrefs);
    } catch {}
  }, []);

  /** Listen to add/remove events dispatched by tabsManager. */
  useEffect(() => {
    const onAdd = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      setOpenTabs((prev) => (prev.includes(href) ? prev : [...prev, href]));
    };
    const onRemove = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      setOpenTabs((prev) => prev.filter((h) => h !== href));
    };

    window.addEventListener('header:add-tab', onAdd as EventListener);
    window.addEventListener('header:remove-tab', onRemove as EventListener);
    return () => {
      window.removeEventListener('header:add-tab', onAdd as EventListener);
      window.removeEventListener('header:remove-tab', onRemove as EventListener);
    };
  }, []);

  /** Close handler: delegate to tabsManager and navigate if the active tab is closed. */
  const closeTab = useCallback(
    (href: string) => {
      const currentId = PATH_TO_ID[href];
      closeTabByHref(href, {
        navigate: true,
        router,
        currentId,
      });
    },
    [router, pathname]
  );

  const linkClass = (href: string) => {
    const isHovered = hoveredTab === href;
    const isActive = pathname === href && hoveredTab === null;
    return `
      px-4 py-2 rounded font-medium transition cursor-pointer
      ${isHovered || isActive ? 'bg-[#222a3a] text-[#5981F3]' : 'text-white/90 hover:bg-[#222a3a] hover:text-[#5981F3]'}
    `;
  };

  const onMouseEnter = (href: string) => () => setHoveredTab(href);
  const onMouseLeave = () => setHoveredTab(null);

  return (
    <header className="text-white border-b border-[#21273a] py-4 bg-[#77808e] px-[15px] lg:px-[33px]">
      <div className="flex flex-row justify-between items-center w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Image src={spCoin_png} alt="Sponsor Coin Logo" priority className="h-8 w-auto" />

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
            <ConnectButton
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
