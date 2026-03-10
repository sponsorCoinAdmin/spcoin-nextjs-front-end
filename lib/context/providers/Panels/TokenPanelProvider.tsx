// File: lib/context/providers/Panels/TokenPanelProvider.tsx
'use client';

import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Address } from 'viem';
import type { TokenContract } from '@/lib/structure';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { TokenPanelContext } from '../../../../app/(menu)/Test/Tabs/ExchangeContext/hooks/useTokenPanelContext';
import { useSellTokenContract, useBuyTokenContract, useAppChainId } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { loadTokenRecord } from '@/lib/context/tokens/tokenStore';

interface Props {
  containerType: SP_COIN_DISPLAY;
  children: ReactNode;
}

const debugLog = createDebugLogger(
  'TokenPanelProvider',
  process.env.NEXT_PUBLIC_DEBUG_TOKEN_PANEL === 'true'
);

export const TokenPanelProvider = ({ containerType, children }: Props) => {
  // local mirrors used by BaseSelectPanel
  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);
  const latestSelectionKeyRef = useRef('');

  // global trade-store writers (sell/buy)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const appChain = useAppChainId();

  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);

  // List overlay mode mapping:
  // SELL_CONTRACT => SELL selection
  // BUY_CONTRACT  => BUY selection
  const isSellContainer =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL ||
    (containerType === SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL && sellMode);

  const isBuyContainer =
    containerType === SP_COIN_DISPLAY.BUY_SELECT_PANEL ||
    (containerType === SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL && buyMode);

  // required by TokenPanelContextType
  const dumpTokenContext = useCallback(
    (headerInfo?: string) => {
      debugLog.log?.(
        `dumpTokenContext ${headerInfo ?? ''}`,
        {
          containerType: SP_COIN_DISPLAY[containerType],
          feedType: FEED_TYPE.TOKEN_LIST,
          localTokenContract,
          localAmount,
        }
      );
    },
    [containerType, localTokenContract, localAmount]
  );

  // main commit entry used by AssetSelectProvider → DataListSelect
  const setSelectedAssetCallback = useCallback(
    (asset: TokenContract) => {
      if (!asset?.address) return;
      const selectedChainId =
        typeof asset.chainId === 'number' && Number.isFinite(asset.chainId) && asset.chainId > 0
          ? asset.chainId
          : Number(appChain.mappedAppChainId) > 0
          ? Number(appChain.mappedAppChainId)
          : undefined;

      const normalized: TokenContract = {
        ...asset,
        address: asset.address as Address,
        chainId: selectedChainId,
        symbol: asset.symbol ?? '',
        name: asset.name ?? '',
        decimals: typeof asset.decimals === 'number' ? asset.decimals : 18,
        balance: typeof asset.balance === 'bigint' ? asset.balance : 0n,
      };
      const selectionKey = `${normalized.chainId ?? 0}:${String(normalized.address).toLowerCase()}`;
      latestSelectionKeyRef.current = selectionKey;

      setLocalTokenContract(normalized);

      if (isSellContainer) {
        setSellTokenContract(normalized);
      } else if (isBuyContainer) {
        setBuyTokenContract(normalized);
      } else {
        debugLog.warn?.('Unexpected containerType for token commit', SP_COIN_DISPLAY[containerType]);
      }

      const hydrateChainId = Number(normalized.chainId ?? 0);
      if (!(hydrateChainId > 0)) return;
      void loadTokenRecord(hydrateChainId, String(normalized.address))
        .then((record) => {
          if (latestSelectionKeyRef.current !== selectionKey) return;
          const hydrated: TokenContract = {
            ...normalized,
            ...record,
            address: normalized.address,
            chainId: hydrateChainId,
            balance: normalized.balance,
            amount: normalized.amount,
          };
          setLocalTokenContract(hydrated);
          if (isSellContainer) {
            setSellTokenContract(hydrated);
          } else if (isBuyContainer) {
            setBuyTokenContract(hydrated);
          }
        })
        .catch(() => {
          // Keep previous behavior: selection still succeeds even if metadata hydrate fails.
        });
    },
    [
      isSellContainer,
      isBuyContainer,
      containerType,
      setSellTokenContract,
      setBuyTokenContract,
      appChain.appChainId,
      appChain.mappedAppChainId,
    ]
  );

  const ctxValue = useMemo(
    () => ({
      localTokenContract,
      setLocalTokenContract,
      localAmount,
      setLocalAmount,
      dumpTokenContext, // ✅ restored: required by TokenPanelContextType
      containerType,
      setSelectedAssetCallback,
    }),
    [
      localTokenContract,
      localAmount,
      containerType,
      setSelectedAssetCallback,
      dumpTokenContext,
    ]
  );

  return <TokenPanelContext.Provider value={ctxValue}>{children}</TokenPanelContext.Provider>;
};
