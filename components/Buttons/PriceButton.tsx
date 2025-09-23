// File: components/Buttons/PriceButton.tsx
'use client';

import React from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';

// ⬇️ Visibility control
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

type Props = {
  isLoadingPrice: boolean;
};

const PriceButton = ({ isLoadingPrice }: Props) => {
  // ✅ Single source of truth: pull the connected address from ExchangeContext
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.connectedAccount?.address;

  // 🔒 Gate by panel tree: hide if PRICE_BUTTON is not visible
  const { isVisible } = usePanelTree();
  const show = isVisible(SP_TREE.PRICE_BUTTON);
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
