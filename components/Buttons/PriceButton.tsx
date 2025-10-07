'use client';

import React from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';

// ⬇️ Visibility control (Phase 7: subscribe directly to this panel's flag)
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

type Props = {
  isLoadingPrice: boolean;
};

const PriceButton = ({ isLoadingPrice }: Props) => {
  // ✅ Narrow subscription: only re-render when PRICE_BUTTON visibility changes
  const show = usePanelVisible(SP_TREE.PRICE_BUTTON);

  // ✅ Single source of truth: pull the connected address from ExchangeContext
  // (Hook order remains unconditional and stable.)
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.connectedAccount?.address;

  if (!show) return null;

  return (
    <div id="PriceButton">
      {!walletAddress ? (
        <CustomConnectButton />
      ) : (
        <ExchangeButton isLoadingPrice={isLoadingPrice} />
      )}
    </div>
  );
};

export default PriceButton;
