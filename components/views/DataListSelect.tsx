// File: @/components/views/DataListSelect.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { FEED_TYPE, InputState } from '@/lib/structure';
import TokenListItem from './ListItems/TokenListItem';
import AccountListItem from './ListItems/AccountListItem';
import { useAssetSelectContext } from '@/lib/context';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Normalize the token feed so TokenListItem always receives strict strings
export type TokenFeedItem = {
  address: `0x${string}` | string;
  name?: string | null;
  symbol?: string | null;
  logoURL?: string | null;
};

type FeedData = {
  wallets?: WalletAccount[];
  tokens?: TokenFeedItem[];
};

type Props = {
  /** SSOT: pre-populated, normalized data. No internal mirroring. */
  feedData: FeedData;
  /** Optional loading flag (useful while upstream normalizes accounts). */
  loading?: boolean;
  /** Which feed we’re rendering, to wire selection behavior. */
  feedType: FEED_TYPE;
};

const LOG_TIME = false as const;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_DATALIST === 'true';
const debugLog = createDebugLogger('DataListSelect', DEBUG_ENABLED, LOG_TIME);

function isAccountFeedType(feedType: FEED_TYPE) {
  return (
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
    feedType === FEED_TYPE.AGENT_ACCOUNTS ||
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  );
}

function roleFromFeedType(feedType: FEED_TYPE): string {
  if (feedType === FEED_TYPE.AGENT_ACCOUNTS || feedType === FEED_TYPE.MANAGE_AGENTS)
    return 'agent';
  if (feedType === FEED_TYPE.SPONSOR_ACCOUNTS) return 'sponsor';
  return 'recipient';
}

export default function DataListSelect({ feedData, loading = false, feedType }: Props) {
  // 💡 SSOT: use props directly; do not copy to local state
  const wallets = useMemo<WalletAccount[]>(() => feedData.wallets ?? [], [feedData.wallets]);
  const tokens = useMemo<TokenFeedItem[]>(() => feedData.tokens ?? [], [feedData.tokens]);

  // ✅ Zebra row backgrounds (Tailwind arbitrary values)
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';
  const zebraForIndex = (i: number) => (i % 2 === 0 ? zebraA : zebraB);

  // FSM / selection bridge (unchanged except explicit manualEntry=false when programmatic)
  const {
    handleHexInputChange,
    setManualEntry,
    setInputState,
    manualEntry,
    setTradingTokenCallback,
  } = useAssetSelectContext();

  const pendingPickRef = useRef<string | null>(null);
  const [enforceProgrammatic, setEnforceProgrammatic] = useState(false);

  const programmaticReady = useEnsureBoolWhen(
    [manualEntry, setManualEntry],
    false,
    enforceProgrammatic
  );

  // Log mount + whenever feed changes / data changes
  useEffect(() => {
    debugLog.log?.('[render]', {
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      isAccountFeed: isAccountFeedType(feedType),
      walletsCount: wallets.length,
      tokensCount: tokens.length,
      loading,
      sampleWalletAddresses: wallets.slice(0, 3).map((w) => w.address),
    });
  }, [feedType, wallets, tokens.length, loading]);

  // Commit deferred pick once allowed (unchanged + manualEntry=false)
  useEffect(() => {
    if (!programmaticReady || !pendingPickRef.current) return;

    const addr = pendingPickRef.current;
    pendingPickRef.current = null;
    setEnforceProgrammatic(false);

    debugLog.log?.('[deferred-commit] begin', { addr, programmaticReady });

    // ✅ Programmatic flow: ensure manualEntry=false
    debugLog.log?.('[deferred-commit] setManualEntry(false)');
    setManualEntry(false);

    setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic commit)');
    handleHexInputChange(addr, false);

    // ✅ FIX: include SPONSOR_ACCOUNTS (+ manage feeds) as account selections
    if (isAccountFeedType(feedType)) {
      const picked = wallets.find((w) => w.address.toLowerCase() === addr.toLowerCase());
      if (picked) {
        debugLog.log?.('[deferred-commit] setTradingTokenCallback', {
          address: picked.address,
          role: roleFromFeedType(feedType),
        });
        setTradingTokenCallback(picked);
      } else {
        debugLog.warn?.('[deferred-commit] picked not found in wallets', {
          addr,
          walletsCount: wallets.length,
        });
      }
    }

    debugLog.log?.('[deferred-commit] end');
  }, [
    programmaticReady,
    handleHexInputChange,
    setInputState,
    feedType,
    wallets,
    setTradingTokenCallback,
    setManualEntry,
  ]);

  const handlePickAddress = useCallback(
    (address: string) => {
      debugLog.log?.('[pick]', {
        addressPreview: address?.slice(0, 12),
        manualEntry,
        programmaticReady,
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
      });

      if (!programmaticReady) {
        debugLog.log?.('[pick] not ready → deferring', { address });
        pendingPickRef.current = address;
        setEnforceProgrammatic(true);
        return;
      }

      // ✅ Programmatic flow: ensure manualEntry=false before we kick FSM
      debugLog.log?.('[pick] setManualEntry(false) immediate');
      setManualEntry(false);

      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic)');
      handleHexInputChange(address, false);

      // ✅ FIX: include SPONSOR_ACCOUNTS (+ manage feeds)
      if (isAccountFeedType(feedType)) {
        const picked = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
        if (picked) {
          debugLog.log?.('[pick] setTradingTokenCallback immediate', {
            address: picked.address,
            role: roleFromFeedType(feedType),
          });
          setTradingTokenCallback(picked);
        } else {
          debugLog.warn?.('[pick] picked not found in wallets', {
            address,
            walletsCount: wallets.length,
          });
        }
      }
    },
    [
      programmaticReady,
      setInputState,
      handleHexInputChange,
      feedType,
      wallets,
      setTradingTokenCallback,
      setManualEntry,
      manualEntry,
    ]
  );

  const wrapperClass =
    'flex flex-col flex-1 min-h-0 overflow-y-auto overflow-hidden bg-[#243056] text-[#5981F3] rounded-[20px] p-0 box-border';

  const renderEmptyState = (message: string) => (
    <div className="flex flex-1 items-center justify-center">
      <p>{message}</p>
    </div>
  );

  const isAccountFeed = isAccountFeedType(feedType);
  const role = roleFromFeedType(feedType);

  return (
    <>
      <style jsx>{`
        #DataListWrapper {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        #DataListWrapper::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div id="DataListWrapper" className={wrapperClass}>
        {/* ✅ Sticky header */}
        <div className="sticky top-0 z-20 border-b border-black bg-[#2b2b2b]">
          <div className="w-full flex justify-between px-5 py-2">
            <div className="text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80">
              Token
            </div>

            {/* Meta label centered over the right-side meta button column */}
            <div className="w-8 flex items-center justify-center text-center text-xs font-semibold uppercase tracking-wide text-slate-300/80">
              Meta
            </div>
          </div>
        </div>

        {isAccountFeed ? (
          loading ? (
            renderEmptyState('Loading accounts…')
          ) : wallets.length === 0 ? (
            renderEmptyState('No accounts available.')
          ) : (
            wallets.map((wallet, i) => (
              <div key={wallet.address} className={zebraForIndex(i)}>
                <AccountListItem
                  account={wallet}
                  onPick={handlePickAddress}
                  role={role}
                />
              </div>
            ))
          )
        ) : loading ? (
          renderEmptyState('Loading tokens…')
        ) : tokens.length === 0 ? (
          renderEmptyState('No tokens available.')
        ) : (
          tokens.map((token, i) => {
            // Ensure TokenListItem receives required string props
            const safeName: string =
              token.name ??
              token.symbol ??
              (typeof token.address === 'string' ? token.address : String(token.address));
            const safeSymbol: string = token.symbol ?? '';

            return (
              <div key={token.address} className={zebraForIndex(i)}>
                <TokenListItem
                  name={safeName}
                  symbol={safeSymbol}
                  address={token.address as `0x${string}` | string}
                  logoURL={token.logoURL ?? undefined}
                  confirmAssetCallback={handlePickAddress}
                />
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
