// File: components/views/DataListSelect.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FEED_TYPE, WalletAccount, InputState } from '@/lib/structure';
import TokenListItem from './ListItems/TokenListItem';
import AccountListItem from './ListItems/AccountListItem';
import { useAppChainId } from '@/lib/context/hooks';
import { useAssetSelectContext } from '@/lib/context';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { fetchAndBuildDataList } from '@/lib/utils/feeds/assetSelect';
interface DataListProps<T> {
  dataFeedType: FEED_TYPE;
}

export default function DataListSelect<T>({ dataFeedType }: DataListProps<T>) {
  // Accounts
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  // Tokens
  const [tokens, setTokens] = useState<any[]>([]);

  const { handleHexInputChange, setManualEntry, setInputState, manualEntry, setTradingTokenCallback } =
    useAssetSelectContext();
  const [chainId] = useAppChainId();

  const pendingPickRef = useRef<string | null>(null);
  const [enforceProgrammatic, setEnforceProgrammatic] = useState(false);
  const programmaticReady = useEnsureBoolWhen([manualEntry, setManualEntry], false, enforceProgrammatic);

  // Fetch + build once per dependency set
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Only show the loading spinner for account feeds.
      const isAccountFeed =
        dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS;
      if (isAccountFeed) setLoadingWallets(true);

      try {
        const { wallets: w, tokens: t } = await fetchAndBuildDataList(dataFeedType, Number(chainId));
        if (cancelled) return;

        if (w) setWallets(w);
        if (t) setTokens(t);
        if (!w && !t) {
          // unknown feed type: clear both for safety
          setWallets([]);
          setTokens([]);
        }
      } finally {
        if (!cancelled && isAccountFeed) setLoadingWallets(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataFeedType, chainId]);

  // Commit deferred pick once allowed
  useEffect(() => {
    if (!programmaticReady || !pendingPickRef.current) return;
    const addr = pendingPickRef.current;
    pendingPickRef.current = null;
    setEnforceProgrammatic(false);

    setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic commit)');
    handleHexInputChange(addr, false);

    if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
      const picked = wallets.find((w) => w.address.toLowerCase() === addr.toLowerCase());
      if (picked) setTradingTokenCallback(picked);
    }
  }, [programmaticReady, handleHexInputChange, setInputState, dataFeedType, wallets, setTradingTokenCallback]);

  const handlePickAddress = useCallback(
    (address: string) => {
      if (!programmaticReady) {
        pendingPickRef.current = address;
        setEnforceProgrammatic(true);
        return;
      }

      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic)');
      handleHexInputChange(address, false);

      if (dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS) {
        const picked = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
        if (picked) setTradingTokenCallback(picked);
      }
    },
    [programmaticReady, setInputState, handleHexInputChange, dataFeedType, wallets, setTradingTokenCallback]
  );

  const wrapperClass =
    'flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#243056] text-[#5981F3] rounded-[20px] p-2.5 box-border';

  const renderEmptyState = (message: string) => (
    <div className="flex flex-1 items-center justify-center">
      <p>{message}</p>
    </div>
  );

  return (
    <>
      <style jsx>{`
        #DataListWrapper { scrollbar-width: none; -ms-overflow-style: none; }
        #DataListWrapper::-webkit-scrollbar { display: none; }
      `}</style>

      <div id="DataListWrapper" className={wrapperClass}>
        {dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS ? (
          loadingWallets
            ? renderEmptyState('Loading accounts...')
            : wallets.length === 0
              ? renderEmptyState('No accounts available.')
              : wallets.map((wallet) => (
                  <AccountListItem
                    key={wallet.address}
                    account={wallet}
                    onPick={handlePickAddress}
                    role={dataFeedType === FEED_TYPE.AGENT_ACCOUNTS ? 'agent' : 'recipient'}
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
