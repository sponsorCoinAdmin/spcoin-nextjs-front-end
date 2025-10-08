// File: components/containers/AffiliateFee.tsx
'use client';

import React, { useMemo } from 'react';
import PriceResponse from '@/lib/0X/typesV1';
import { useBuyTokenContract } from '@/lib/context/hooks';
import { formatUnits } from 'ethers';

type Props = { priceResponse: PriceResponse | undefined };

// Parse once; fallback to 0 if unset/invalid
const AFFILIATE_FEE = Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE ?? '0') || 0;

const AffiliateFee = ({ priceResponse }: Props) => {
  const [buyTokenContract] = useBuyTokenContract();
  const decimals = buyTokenContract?.decimals ?? 18;
  const symbol = buyTokenContract?.symbol ?? '';

  const text = useMemo(() => {
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
  }, [priceResponse?.grossBuyAmount, decimals, symbol]);

  if (!text) return null;

  return <div id="AffiliateFee" className="text-slate-400">{text}</div>;
};

export default AffiliateFee;
