// File: app/(menu)/Test/Tabs/Tokens/index.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { TokenContract } from '@/lib/structure';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import {
  ALL_NETWORKS_VALUE,
} from '@/lib/utils/network';
import { useExchangeContext } from '@/lib/context/hooks';
import { getTokensPage, type TokenApiItem } from '@/lib/api';

function safeStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
}

const tokenOptions = ['Active Account', 'Agents', 'Recipients', 'Sponsors', 'All Accounts'] as const;
export type TokenFilter = (typeof tokenOptions)[number];
export type AccountFilter = TokenFilter;

type TokenListNetworkValue = `${number}` | typeof ALL_NETWORKS_VALUE;

type TokensPageProps = {
  selectedFilter?: TokenFilter;
  onSelectedFilterChange?: (next: TokenFilter) => void;
  selectedNetwork?: TokenListNetworkValue;
  showTestNets?: boolean;
  showFilterControls?: boolean;
};

function TokensPage({
  selectedFilter,
  onSelectedFilterChange,
  selectedNetwork,
  showTestNets = false,
  showFilterControls = true,
}: TokensPageProps) {
  const { exchangeContext } = useExchangeContext();
  const [tokens, setTokens] = useState<TokenContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [internalTokenType, setInternalTokenType] =
    useState<TokenFilter>('All Accounts');
  const tokenType = selectedFilter ?? internalTokenType;
  const setTokenType = onSelectedFilterChange ?? setInternalTokenType;

  const activeTokenAddress = useMemo(() => {
    const candidate =
      exchangeContext?.tradeData?.previewTokenContract?.address ??
      exchangeContext?.tradeData?.sellTokenContract?.address ??
      exchangeContext?.tradeData?.buyTokenContract?.address;
    return typeof candidate === 'string' ? candidate.toLowerCase() : '';
  }, [exchangeContext]);

  useEffect(() => {
    let cancelled = false;

    const loadTokens = async () => {
      setLoading(true);
      setErr(null);

      try {
        const target = selectedNetwork ?? ALL_NETWORKS_VALUE;
        const PAGE_SIZE = 200;
        const allItems: Array<TokenApiItem<any>> = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const payload = await getTokensPage<any>(page, PAGE_SIZE, {
            allNetworks: target === ALL_NETWORKS_VALUE,
            chainId: target === ALL_NETWORKS_VALUE ? undefined : Number(target),
          });
          if (!Array.isArray(payload?.items) || payload.items.length === 0) break;
          allItems.push(...payload.items);
          hasNextPage = Boolean(payload.hasNextPage);
          page += 1;
        }

        const allTokens: TokenContract[] = allItems.map((item) => {
          const data = (item?.data ?? {}) as any;
          const address =
            typeof data.address === 'string'
              ? data.address
              : item.address;
          return {
            ...data,
            address,
            chainId: Number(data.chainId ?? item.chainId),
            logoURL:
              typeof data.logoURL === 'string' && data.logoURL.trim()
                ? data.logoURL
                : defaultMissingImage,
          } as TokenContract;
        });

        const deduped: TokenContract[] = [];
        const seen = new Set<string>();
        for (const token of allTokens) {
          const chainPart = Number(token?.chainId ?? 0);
          const addressPart =
            typeof token?.address === 'string' ? token.address.toLowerCase() : '';
          const key = `${chainPart}:${addressPart}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(token);
          }
        }

        if (cancelled) return;
        setTokens(deduped);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Failed to load tokens');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTokens();
    return () => {
      cancelled = true;
    };
  }, [selectedNetwork, showTestNets]);

  const visibleTokens =
    tokenType === 'Active Account' && activeTokenAddress
      ? tokens.filter(
          (token) =>
            typeof token.address === 'string' &&
            token.address.toLowerCase() === activeTokenAddress,
        )
      : tokens;

  return (
    <div>
      <div className="sticky top-0 z-20 bg-[#192134] w-full border-[#444] text-white flex flex-col items-center pb-1">
        <div className="flex items-center gap-3 text-[16px] mb-1 flex-wrap justify-center w-full">
          <span className="text-sm text-slate-300/80 whitespace-nowrap">
            Active Account: {activeTokenAddress || 'N/A'}
          </span>
          {showFilterControls &&
            tokenOptions.map((option) => (
              <label key={option} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tokenFilter"
                  value={option}
                  checked={tokenType === option}
                  onChange={() => setTokenType(option)}
                  className="mr-2"
                />
                <span className={tokenType === option ? 'text-green-400' : ''}>
                  {option}
                </span>
              </label>
            ))}
        </div>
      </div>

      <main>
        <div className="relative pr-2">
          {loading ? (
            <p className="text-center text-lg text-gray-400">Loading...</p>
          ) : err ? (
            <p className="text-center text-base text-red-400">Error: {err}</p>
          ) : (
            <>
              <ul className="list-none p-0 m-0">
                {visibleTokens.map((token: TokenContract, index) => (
                  <li
                    key={`${tokenType}-${token.chainId}-${token.address}-${index}`}
                    className={`flex items-center p-3 mb-2 rounded ${
                      index % 2 === 0
                        ? 'bg-[#d6d6d6] text-[#000000]'
                        : 'bg-[#000000] text-[#d6d6d6]'
                    }`}
                  >
                    <img
                      src={token.logoURL || defaultMissingImage}
                      alt="Token Logo"
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-gray-300 mr-3"
                    />
                    <div className="text-inherit">
                      <div className="text-lg font-bold mb-2">
                        {token.name || token.symbol || 'Unknown Token'}
                      </div>
                      <pre className="whitespace-pre-wrap break-words ml-3 text-sm m-0 text-inherit">
                        {safeStringify(token)}
                      </pre>
                    </div>
                  </li>
                ))}
              </ul>
              {!loading && !err && visibleTokens.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-2">No tokens found.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

type TestTokensTabProps = {
  selectedFilter?: TokenFilter;
  onSelectedFilterChange?: (next: TokenFilter) => void;
  selectedNetwork?: TokenListNetworkValue;
  showTestNets?: boolean;
};

export default function TestTokensTab({
  selectedFilter,
  onSelectedFilterChange,
  selectedNetwork,
  showTestNets,
}: TestTokensTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <TokensPage
          selectedFilter={selectedFilter}
          onSelectedFilterChange={onSelectedFilterChange}
          selectedNetwork={selectedNetwork}
          showTestNets={showTestNets}
          showFilterControls={false}
        />
      </div>
    </div>
  );
}
