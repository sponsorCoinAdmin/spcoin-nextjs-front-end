// File: components/views/DataListSelect.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FEED_TYPE, WalletAccount } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import type { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { InputState } from '@/lib/structure/assetSelection';
import TokenListItem from './ListItems/TokenListItem';
import AccountListItem from './ListItems/AccountListItem';
import { useAppChainId } from '@/lib/context/hooks';
import { getLogoURL } from '@/lib/network/utils';
import { useAssetSelectContext } from '@/lib/context';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_DATA_LIST === 'true';
const debugLog = createDebugLogger('DataListSelect', DEBUG_ENABLED, LOG_TIME);

// Small lookup instead of a switch
const TOKEN_LISTS: Record<number, any[]> = {
  [CHAIN_ID.ETHEREUM]: ethereumTokenList as any[],
  [CHAIN_ID.BASE]: baseTokenList as any[],
  [CHAIN_ID.POLYGON]: polygonTokenList as any[],
  [CHAIN_ID.HARDHAT]: hardhatTokenList as any[],
  [CHAIN_ID.SEPOLIA]: sepoliaTokenList as any[],
};

interface DataListProps<T> {
  dataFeedType: FEED_TYPE.TOKEN_LIST | FEED_TYPE.RECIPIENT_ACCOUNTS | FEED_TYPE.AGENT_ACCOUNTS;
}

export default function DataListSelect<T>({ dataFeedType }: DataListProps<T>) {
  const [isClient, setIsClient] = useState(false);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [logoTokenList, setLogoTokenList] = useState<any[]>([]);

  const { handleHexInputChange, setManualEntry, setInputState, manualEntry } = useAssetSelectContext();
  const [chainId] = useAppChainId();

  const isAccountsFeed =
    dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS;

  const pendingPickRef = useRef<string | null>(null);
  const [enforceProgrammatic, setEnforceProgrammatic] = useState(false);
  const programmaticReady = useEnsureBoolWhen([manualEntry, setManualEntry], false, enforceProgrammatic);

  useEffect(() => setIsClient(true), []);

  // Load account feeds (recipients/agents)
  useEffect(() => {
    if (!isAccountsFeed) return;

    setLoadingWallets(true);
    const jsonList = dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS ? recipientJsonList : agentJsonList;

    loadAccounts(jsonList)
      .then((accounts) => {
        setWallets(
          accounts.map((account) => ({
            ...account,
            name: account.name || 'N/A',
            symbol: account.symbol || 'N/A',
            logoURL: account.logoURL || `/assets/accounts/${account.address}/logo.png`,
            address: (account.address as Address) || BURN_ADDRESS,
          }))
        );
      })
      .catch((err) => debugLog.error('Failed to load accounts', err))
      .finally(() => setLoadingWallets(false));
  }, [dataFeedType, isAccountsFeed]);

  // Commit programmatic pick once manual-entry enforcement relaxes
  useEffect(() => {
    if (programmaticReady && pendingPickRef.current) {
      const addr = pendingPickRef.current;
      pendingPickRef.current = null;
      setEnforceProgrammatic(false);
      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic commit)');
      const accepted = handleHexInputChange(addr, false);
      debugLog.log?.(`[pick ${addr.slice(0, 6)}…] programmatic commit accepted=${accepted}`);
    }
  }, [programmaticReady, handleHexInputChange, setInputState]);

  // Resolve token list for current chain
  const dataFeedList = useMemo(() => {
    const list = isClient && dataFeedType === FEED_TYPE.TOKEN_LIST ? TOKEN_LISTS[Number(chainId)] ?? [] : [];
    debugLog.log?.('dataFeedList resolved', {
      chainId,
      type: dataFeedType,
      count: Array.isArray(list) ? list.length : 0,
    });
    return list;
  }, [chainId, isClient, dataFeedType]);

  // Resolve logo URLs asynchronously for current chain
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isClient || dataFeedType !== FEED_TYPE.TOKEN_LIST) {
        setLogoTokenList([]);
        return;
      }

      try {
        const resolved = await Promise.all(
          dataFeedList.map(async (token: any) => {
            try {
              const logoURL = await getLogoURL(Number(chainId), token.address as Address, dataFeedType);
              return { ...token, logoURL };
            } catch (e) {
              if (DEBUG_ENABLED) debugLog.warn('getLogoURL failed for token', token.address, e);
              return {
                ...token,
                logoURL: `/assets/blockchains/${chainId}/contracts/${token.address}/logo.png`,
              };
            }
          })
        );
        if (!cancelled) setLogoTokenList(resolved);
      } catch (e) {
        if (DEBUG_ENABLED) debugLog.error('Failed resolving token logos', e);
        if (!cancelled) setLogoTokenList(dataFeedList);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, dataFeedType, dataFeedList, chainId]);

  const handlePickAddress = useCallback(
    (address: string) => {
      const trace = `[pick ${address.slice(0, 6)}…]`;
      debugLog.log?.(`${trace} programmaticReady=${programmaticReady}`);

      if (!programmaticReady) {
        pendingPickRef.current = address;
        setEnforceProgrammatic(true);
        return;
      }
      setInputState(InputState.EMPTY_INPUT, 'DataListSelect (Programmatic)');
      const accepted = handleHexInputChange(address, false);
      debugLog.log?.(`${trace} handleHexInputChange accepted=${accepted}`);
    },
    [programmaticReady, setInputState, handleHexInputChange]
  );

  const wrapperClass =
    'flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#243056] text-[#5981F3] rounded-[20px] p-2.5 box-border';

  const renderEmptyState = (message: string) => (
    <div className="flex flex-1 items-center justify-center">
      <p>{message}</p>
    </div>
  );

  if (!isClient) return renderEmptyState('Loading data...');

  return (
    <>
      <style jsx>{`
        #DataListWrapper { scrollbar-width: none; -ms-overflow-style: none; }
        #DataListWrapper::-webkit-scrollbar { display: none; }
      `}</style>

      <div id="DataListWrapper" className={wrapperClass}>
        {isAccountsFeed ? (
          loadingWallets
            ? renderEmptyState('Loading accounts...')
            : wallets.length === 0
              ? renderEmptyState('No accounts available.')
              : wallets.map((wallet) => (
                  <AccountListItem key={wallet.address} account={wallet} onPick={handlePickAddress} />
                ))
        ) : logoTokenList.length === 0 ? (
          renderEmptyState('No tokens available.')
        ) : (
          logoTokenList.map((token: any) => (
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
