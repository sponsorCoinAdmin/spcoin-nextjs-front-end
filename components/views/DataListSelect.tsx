// File: components/views/DataListSelect.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  /** Data already fetched + normalized by the parent (via useFeedData). */
  feedData: FeedData;
  /** Optional loading flag the parent can set for account feeds. */
  loading?: boolean;
  /** The active feed type so we know how to render & which role to tag. */
  feedType: FEED_TYPE;
};

export default function DataListSelect<T>({ feedData, loading = false, feedType }: Props<T>) {
  // Local copies of lists (kept so we can use the same interaction logic as before)
  const [wallets, setWallets] = useState<WalletAccount[]>(feedData.wallets ?? []);
  const [tokens, setTokens] = useState<any[]>(feedData.tokens ?? []);

  // Keep in sync if parent refreshes feedData
  useEffect(() => {
    setWallets(feedData.wallets ?? []);
  }, [feedData.wallets]);
  useEffect(() => {
    setTokens(feedData.tokens ?? []);
  }, [feedData.tokens]);

  // FSM / selection bridge
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

  // Commit deferred pick once allowed
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
