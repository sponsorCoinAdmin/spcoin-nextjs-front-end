'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/wagmi/wagmiConfig';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from '../Buttons/ConnectButton';
import { defaultMissingImage } from '@/lib/network/utils';
import { useChainId, useAccount, useSwitchChain } from 'wagmi';
import {
  useBuyTokenContract,
  useSellTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks';
import { useResetContracts } from '@/lib/context/hooks/nestedHooks/useResetContracts';
import { useNetwork } from '@/lib/context/hooks/nestedHooks/useNetwork';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useDidHydrate } from '@/lib/hooks/useDidHydrate';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEADER === 'true';
const debugLog = createDebugLogger('Header', DEBUG_ENABLED, LOG_TIME);

export default function Header() {
  useResetContracts();

  const chainId = useChainId({ config });
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const didHydrate = useDidHydrate();

  const [_, setSellTokenContract] = useSellTokenContract();
  const [__, setBuyTokenContract] = useBuyTokenContract();
  const { exchangeContext } = useExchangeContext();
  const { isConnected } = useAccount();
  const { setNetworkConnected } = useNetwork();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    setNetworkConnected(isConnected);
  }, [isConnected]);

  useEffect(() => {
    const trySwitch = async () => {
      if (!isConnected || !exchangeContext?.network?.chainId) return;

      const contextChainId = exchangeContext.network.chainId;
      if (chainId !== contextChainId) {
        debugLog.warn(`⚠️ Chain mismatch: wallet=${chainId} vs context=${contextChainId}`);
        try {
          await switchChainAsync({ chainId: contextChainId });
        } catch (err: any) {
          debugLog.error(`❌ switchChain failed: ${err?.message || err}`);
        }
      }
    };
    trySwitch();
  }, [isConnected, chainId, exchangeContext?.network?.chainId]);

  const networkName = exchangeContext?.network?.name ?? '';
  const logo = exchangeContext?.network?.logoURL ?? '';

  const SHOW_TEST_LINK = process.env.NEXT_PUBLIC_SHOW_TEST_PAGE === 'true';
  const SHOW_ADMIN_LINK = process.env.NEXT_PUBLIC_SHOW_ADMIN_PAGE === 'true';
  const SHOW_EXCHANGE_LINK = process.env.NEXT_PUBLIC_SHOW_EXCHANGE_PAGE === 'true';
  const SHOW_SPCOIN_LINK = process.env.NEXT_PUBLIC_SHOW_SPCOIN_PAGE === 'true';

  const staticLinks = useMemo(() => [
    { href: '/WhitePaper', label: 'White Paper' },
    { href: '/SpCoinAPI', label: 'Sponsor Coin API' },
    { href: '/SponsorMe', label: 'Sponsor Me' },
    { href: '/ManageAccounts', label: 'Manage Accounts' },
    { href: '/CreateAgent', label: 'Create Agent' },
  ], []);

  const linkClass = (href: string) => {
    const isHovered = hoveredTab === href;
    const isActive = pathname === href && hoveredTab === null;
    return `
      px-4 py-2 rounded font-medium transition cursor-pointer
      ${isHovered || isActive ? 'bg-[#222a3a] text-[#5981F3]' : ''}
    `;
  };

  return (
    <header className="text-white border-b border-[#21273a] py-4 bg-[rgb(119,126,142)] px-[15px] sm:px-[33px]">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Image src={spCoin_png} width={25} height={25} alt="Sponsor Coin Logo" />

          {SHOW_SPCOIN_LINK && (
            <Link
              href="/SponsorCoin"
              className={linkClass('/SponsorCoin')}
              aria-current={pathname === '/SponsorCoin' ? 'page' : undefined}
              onMouseEnter={() => setHoveredTab('/SponsorCoin')}
              onMouseLeave={() => setHoveredTab(null)}
            >
              SponsorCoin
            </Link>
          )}

          {SHOW_EXCHANGE_LINK && (
            <Link
              href="/Exchange"
              className={linkClass('/Exchange')}
              aria-current={pathname === '/Exchange' ? 'page' : undefined}
              onMouseEnter={() => setHoveredTab('/Exchange')}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Exchange
            </Link>
          )}

          {SHOW_TEST_LINK && (
            <Link
              href="/Exchange/Test"
              className={linkClass('/Exchange/Test')}
              aria-current={pathname === '/Exchange/Test' ? 'page' : undefined}
              onMouseEnter={() => setHoveredTab('/Exchange/Test')}
              onMouseLeave={() => setHoveredTab(null)}
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
                aria-current="page"
                onMouseEnter={() => setHoveredTab(link.href)}
                onMouseLeave={() => setHoveredTab(null)}
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
                onError={(e) => {
                  debugLog.warn(`⚠️ Failed to load logo: ${logo}, using fallback.`);
                  e.currentTarget.src = defaultMissingImage;
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
