'use client';

import React from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks';

type Props = {
  isLoadingPrice: boolean;
};

const PriceButton = ({ isLoadingPrice }: Props) => {
  // ✅ Single source of truth: pull the connected address from ExchangeContext
  const { exchangeContext } = useExchangeContext();
  const walletAddress = exchangeContext?.accounts?.connectedAccount?.address;

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
