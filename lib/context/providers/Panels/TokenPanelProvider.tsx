// File: lib/context/TradePanelProviders/TokenPanelProvider.tsx
'use client';

import React, { useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract } from '@/lib/structure';
import { TokenPanelContext } from '../../../../app/(menu)/Test/Tabs/ExchangeContext/hooks/useTokenPanelContext';
import { InputState } from '@/lib/structure/assetSelection';
import { useSellTokenContract, useBuyTokenContract } from '@/lib/context/hooks';

interface Props {
  containerType: SP_COIN_DISPLAY;
  children: ReactNode;
}

export const TokenPanelProvider = ({ containerType, children }: Props) => {
  // kept for future cleanup compatibility
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);

  // local mirror (used by TradeAssetPanel)
  const [localTokenContract, setLocalTokenContract] = useState<TokenContract | undefined>(undefined);
  const [localAmount, setLocalAmount] = useState<bigint>(0n);

  // global trade-store writers (sell/buy)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract]  = useBuyTokenContract();

  // --- LOG: mount ---
  // TODO(LOG_CLEANUP): remove after debugging
  useEffect(() => {
    console.log('[LOG][TokenPanelProvider] mount', {
      containerType: SP_COIN_DISPLAY[containerType],
      feedType: FEED_TYPE.TOKEN_LIST,
    });
  }, [containerType]);

  // 🔑 single commit entry used by AssetSelectProvider → DataListSelect
  // TODO(LOG_CLEANUP): remove all console logs in this callback when done
  const setSelectedAssetCallback = useCallback((asset: TokenContract) => {
    console.log('[LOG][TokenPanelProvider] setSelectedAssetCallback IN', {
      containerType: SP_COIN_DISPLAY[containerType],
      rawAsset: asset,
    });

    if (!asset || !(asset as any).address) {
      console.warn('[LOG][TokenPanelProvider] invalid asset payload; ignoring', { asset });
      return;
    }

const normalized: TokenContract = {
  address: asset.address as Address,
  symbol: asset.symbol ?? '',
  name: asset.name ?? '',
  decimals: typeof asset.decimals === 'number' ? asset.decimals : 18,
  logoURL: (asset as any).logoURL ?? undefined,
  balance: (asset as any).balance ?? 0n,   // ✅ required by TokenContract
  // amount: (asset as any).amount,        // optional, include if you have it
  // chainId: (asset as any).chainId,      // optional, include if you have it
};

    // keep local mirror up to date (so TradeAssetPanel reads it immediately)
    setLocalTokenContract(normalized);

    if (containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL) {
      console.log('[LOG][TokenPanelProvider] WRITE -> setSellTokenContract', {
        address: normalized.address,
        symbol: normalized.symbol,
        decimals: normalized.decimals,
      });
      setSellTokenContract(normalized as any);
      console.log('[LOG][TokenPanelProvider] setSellTokenContract DONE');
    } else if (containerType === SP_COIN_DISPLAY.BUY_SELECT_PANEL) {
      console.log('[LOG][TokenPanelProvider] WRITE -> setBuyTokenContract', {
        address: normalized.address,
        symbol: normalized.symbol,
        decimals: normalized.decimals,
      });
      setBuyTokenContract(normalized as any);
      console.log('[LOG][TokenPanelProvider] setBuyTokenContract DONE');
    } else {
      console.warn(
        '[LOG][TokenPanelProvider] unexpected containerType for token commit',
        SP_COIN_DISPLAY[containerType]
      );
    }

    console.log('[LOG][TokenPanelProvider] setSelectedAssetCallback OUT', {
      committedTo:
        containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL ? 'SELL' :
        containerType === SP_COIN_DISPLAY.BUY_SELECT_PANEL  ? 'BUY'  :
        'UNKNOWN',
    });
  }, [containerType, setSellTokenContract, setBuyTokenContract]);

  // helper to dump current context
  // TODO(LOG_CLEANUP): remove when no longer needed
  const dumpTokenContext = (headerInfo?: string) => {
    console.log(`🛠️ [${SP_COIN_DISPLAY[containerType]} Dump] ${headerInfo || ''}`, {
      inputState,
      validatedAsset,
      localTokenContract,
      localAmount,
      containerType,
      feedType: FEED_TYPE.TOKEN_LIST,
    });
  };

  // expose full context + the new setter so upstream can commit tokens
  const ctxValue = useMemo(
    () => ({
      localTokenContract,
      setLocalTokenContract,
      localAmount,
      setLocalAmount,
      dumpTokenContext,
      containerType,
      // 👇 IMPORTANT: this is what AssetSelectProvider / DataListSelect will call
      setSelectedAssetCallback,
    }),
    [localTokenContract, localAmount, containerType, setSelectedAssetCallback]
  );

  return (
    <TokenPanelContext.Provider value={ctxValue}>
      {children}
    </TokenPanelContext.Provider>
  );
};
