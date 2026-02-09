// File: @/lib/context/TradePanelProviders/TokenPanelProvider.tsx
'use client';

import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import type { Address } from 'viem';
import type { TokenContract } from '@/lib/structure';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { TokenPanelContext } from '../../../../app/(menu)/Test/Tabs/ExchangeContext/hooks/useTokenPanelContext';
import { useSellTokenContract, useBuyTokenContract } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { createDebugLogger } from '@/lib/utils/debugLogger';

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

  // global trade-store writers (sell/buy)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);

  // List overlay mode mapping:
  // SELL_TOKEN => SELL selection
  // BUY_TOKEN  => BUY selection
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
      if (!asset || !(asset as any).address) return;

      const normalized: TokenContract = {
        address: asset.address as Address,
        symbol: asset.symbol ?? '',
        name: asset.name ?? '',
        decimals: typeof asset.decimals === 'number' ? asset.decimals : 18,
        logoURL: (asset as any).logoURL ?? undefined,
        balance: (asset as any).balance ?? 0n,
      };

      setLocalTokenContract(normalized);

      if (isSellContainer) {
        setSellTokenContract(normalized as any);
      } else if (isBuyContainer) {
        setBuyTokenContract(normalized as any);
      } else {
        debugLog.warn?.('Unexpected containerType for token commit', SP_COIN_DISPLAY[containerType]);
      }
    },
    [isSellContainer, isBuyContainer, containerType, setSellTokenContract, setBuyTokenContract]
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
