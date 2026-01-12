// File: @/components/views/Buttons/ConnectTradeButton.tsx
'use client';

import React from 'react';
import CustomConnectButton from '../TradingStationPanel/CustomeConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

type Props = { isLoadingPrice: boolean };

const ConnectTradeButton = ({ isLoadingPrice }: Props) => {
  const show = usePanelVisible(SP.CONNECT_TRADE_BUTTON);
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.activeAccount?.address;

  if (!show) return null;

  return (
    <div id="ConnectTradeButton">
      {!walletAddress ? <CustomConnectButton /> : <ExchangeButton isLoadingPrice={isLoadingPrice} />}
    </div>
  );
};

export default ConnectTradeButton;
