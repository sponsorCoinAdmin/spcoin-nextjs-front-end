// File: @/components/Buttons/PriceButton.tsx
'use client';

import React from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

type Props = { isLoadingPrice: boolean };

const PriceButton = ({ isLoadingPrice }: Props) => {
  const show = usePanelVisible(SP.PRICE_BUTTON);
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.activeAccount?.address;

  if (!show) return null;

  return (
    <div id="PriceButton">
      {!walletAddress ? <CustomConnectButton /> : <ExchangeButton isLoadingPrice={isLoadingPrice} />}
    </div>
  );
};

export default PriceButton;
