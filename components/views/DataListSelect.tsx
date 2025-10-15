// File: components/views/DataListSelect.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { FEED_TYPE, WalletAccount, InputState } from '@/lib/structure';
import TokenListItem from './ListItems/TokenListItem';
import AccountListItem from './ListItems/AccountListItem';
import { useAssetSelectContext } from '@/lib/context';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';

type FeedData = {
  wallets?: WalletAccount[];
  tokens?: Array<{
    address: string;
    name?: string;
    symbol?: string;
    logoURL?: string;
  }>;
};

type Props<T> = {
  /** SSOT: pre-populated, normalized data. No internal mirroring. */
  feedData: FeedData;
  /** Optional loading flag (useful while upstream normalizes accounts). */
  loading?: boolean;
  /** Which feed we’re rendering, to wire selection behavior. */
  feedType: FEED_TYPE;
};

export default function DataListSelect<T>({ feedData, loading = false, feedType }: Props<T>) {
  // 💡 SSOT: use props directly; do not copy to local state
  const wallets = useMemo<WalletAccount[]>(() => feedData.wallets ?? [], [feedData.wallets]);
  const tokens = useMemo(() => feedData.tokens ?? [], [feedData.tokens]);

  // FSM / selection bridge (unchanged)
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

  // Commit deferred pick once allowed (unchanged)
  useEffect(() => {
    if (!programmaticReady || !pendingPickRef.current) return;

    const addr = pendingPickRef.current;
    pendingPickRef.current = null;
    setEnforceProgrammatic(false);

    setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic commit)');
    handleHexInputChange(addr, false);

    if (feedType === FEED_TYPE.RECIPIENT_ACCOUNTS || feedType === FEED_TYPE.AGENT_ACCOUNTS) {
      const picked = wallets.find((w) => w.address.toLowerCase() === addr.toLowerCase());
      if (picked) setTradingTokenCallback(picked);
    }
  }, [
    programmaticReady,
    handleHexInputChange,
    setInputState,
    feedType,
    wallets,
    setTradingTokenCallback,
  ]);

  const handlePickAddress = useCallback(
    (address: string) => {
      if (!programmaticReady) {
        pendingPickRef.current = address;
        setEnforceProgrammatic(true);
        return;
      }

      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic)');
      handleHexInputChange(address, false);

      if (feedType === FEED_TYPE.RECIPIENT_ACCOUNTS || feedType === FEED_TYPE.AGENT_ACCOUNTS) {
        const picked = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
        if (picked) setTradingTokenCallback(picked);
      }
    },
    [
      programmaticReady,
      setInputState,
      handleHexInputChange,
      feedType,
      wallets,
      setTradingTokenCallback,
    ]
  );

  const wrapperClass =
    'flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#243056] text-[#5981F3] rounded-[20px] p-2.5 box-border';

  const renderEmptyState = (message: string) => (
    <div className="flex flex-1 items-center justify-center">
      <p>{message}</p>
    </div>
  );

  const isAccountFeed =
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS || feedType === FEED_TYPE.AGENT_ACCOUNTS;

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
        {isAccountFeed ? (
          loading
            ? renderEmptyState('Loading accounts...')
            : wallets.length === 0
              ? renderEmptyState('No accounts available.')
              : wallets.map((wallet) => (
                <AccountListItem
                  key={wallet.address}
                  account={wallet}
                  onPick={handlePickAddress}
                  role={feedType === FEED_TYPE.AGENT_ACCOUNTS ? 'agent' : 'recipient'}
                />
              ))
        ) : loading ? (
          renderEmptyState('Loading tokens...')
        ) : tokens.length === 0 ? (
          renderEmptyState('No tokens available.')
        ) : (
          tokens.map((token: any) => (
            <TokenListItem
              key={token.address}
              name={token.name}
              symbol={token.symbol}
              address={token.address}
              logoURL={token.logoURL}
              confirmAssetCallback={handlePickAddress}
            />
          ))
        )}
      </div>
    </>
  );
}
