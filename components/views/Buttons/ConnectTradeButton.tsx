// File: components/views/Buttons/ConnectTradeButton.tsx
'use client';

import React from 'react';
import CustomConnectButton from '../TradingStationPanel/CustomeConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

type Props = { isLoadingPrice: boolean; panelId?: SP };

const ConnectTradeButton = ({ isLoadingPrice, panelId = SP.CONNECT_TRADE_BUTTON }: Props) => {
  const show = usePanelVisible(panelId);
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.activeAccount?.address;

  if (!show) return null;

  return (
    <div id={SP[panelId]}>
      {!walletAddress ? <CustomConnectButton /> : <ExchangeButton isLoadingPrice={isLoadingPrice} />}
    </div>
  );
};

export default ConnectTradeButton;
