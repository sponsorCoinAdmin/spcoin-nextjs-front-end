// File: @/components/views/TradingStationPanel/AffiliateFee/index.tsx
'use client';

import React, { useMemo } from 'react';
import type PriceResponse from '@/lib/0x/typesV1';
import { useBuyTokenContract } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';
import { formatUnits } from 'ethers';

type Props = { priceResponse: PriceResponse | undefined };

const AFFILIATE_FEE = Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE ?? '0') || 0;

const AffiliateFee = ({ priceResponse }: Props) => {
  // gate rendering on the panel's visibility
  const show = usePanelVisible(SP.AFFILIATE_FEE);
  const [buyTokenContract] = useBuyTokenContract();
  const decimals = buyTokenContract?.decimals ?? 18;
  const symbol = buyTokenContract?.symbol ?? '';

  const text = useMemo(() => {
    if (!show) return null;
    const gross = priceResponse?.grossBuyAmount;
    if (!gross) return null;

    try {
      const amount = Number(formatUnits(BigInt(gross), decimals));
      const fee = amount * AFFILIATE_FEE;
      if (!isFinite(fee) || fee <= 0) return null;

      const pretty = fee >= 1 ? fee.toFixed(4) : fee.toPrecision(4);
      return `Affiliate Fee: ${pretty} ${symbol}`;
    } catch {
      return null;
    }
  }, [show, priceResponse?.grossBuyAmount, decimals, symbol]);

  if (!text) return null;
  return <div id="AFFILIATE_FEE" className="text-slate-400">{text}</div>;
};

export default AffiliateFee;
