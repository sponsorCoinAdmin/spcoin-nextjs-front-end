// File: lib/hooks/trade/useTokenSelection.ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('useTokenSelection', DEBUG, false);

const lower = (addr?: string | Address) => (addr ? (addr as string).toLowerCase() : '');

type Params = {
  containerType: SP_COIN_DISPLAY;
  sellTokenContract: any;
  buyTokenContract: any;
  setLocalTokenContract: (t: any) => void;
  setLocalAmount: (a: bigint) => void;
  sellAmount: bigint;
  buyAmount: bigint;
  setSellAmount: (a: bigint) => void;
  setBuyAmount: (a: bigint) => void;
};

export function useTokenSelection({
  containerType,
  sellTokenContract,
  buyTokenContract,
  setLocalTokenContract,
  setLocalAmount,
  sellAmount,
  buyAmount,
  setSellAmount,
  setBuyAmount,
}: Params) {
  const tokenContract =
    containerType === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL ? sellTokenContract : buyTokenContract;

  const tokenAddr = useMemo(() => lower(tokenContract?.address), [tokenContract?.address]);
  const tokenDecimals = tokenContract?.decimals ?? 18;

  // Mirror address changes into local state
  const prevAddrRef = useRef<string>('');
  useEffect(() => {
    if (!tokenAddr && !prevAddrRef.current) return;
    if (tokenAddr === prevAddrRef.current) return;
    prevAddrRef.current = tokenAddr || '';

    if (tokenAddr) {
      debugLog.log(`📦 Loaded token for ${SP_COIN_DISPLAY[containerType]}:`, tokenAddr);
      setLocalTokenContract(tokenContract as any);
    }
  }, [tokenAddr, containerType, setLocalTokenContract, tokenContract]);

  // Zero state when cleared
  const wasDefinedRef = useRef<boolean>(Boolean(tokenAddr));
  useEffect(() => {
    const wasDefined = wasDefinedRef.current;
    const isDefined = Boolean(tokenAddr);
    if (wasDefined && !isDefined) {
      setLocalTokenContract(undefined as any);
      setLocalAmount(0n);
      if (containerType === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL) {
        if (sellAmount !== 0n) setSellAmount(0n);
      } else {
        if (buyAmount !== 0n) setBuyAmount(0n);
      }
    }
    wasDefinedRef.current = isDefined;
  }, [tokenAddr, containerType, setLocalTokenContract, setLocalAmount, sellAmount, buyAmount, setSellAmount, setBuyAmount]);

  return { tokenContract, tokenAddr, tokenDecimals };
}
