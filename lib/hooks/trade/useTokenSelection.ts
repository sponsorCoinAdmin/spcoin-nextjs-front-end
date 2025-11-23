// File: lib/hooks/trade/useTokenSelection.ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Set NEXT_PUBLIC_TRACE_BALANCE=true to enable deep traces.
const TRACE_BALANCE = process.env.NEXT_PUBLIC_TRACE_BALANCE === 'true';

// Standard toggle for this hook
const DEBUG_FLAG =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';

// Enable logger if either the normal flag or trace flag is on
const DEBUG_ENABLED = DEBUG_FLAG || TRACE_BALANCE;

const debugLog = createDebugLogger('useTokenSelection', DEBUG_ENABLED, false);

const lower = (addr?: string | Address) =>
  addr ? (addr as string).toLowerCase() : '';

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
  // ✅ Determine panel role correctly (supports SELECT and LIST variants)
  const isSellPanel =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL ||
    containerType === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL;
  const chosenFrom = isSellPanel ? 'SELL' : 'BUY';

  // 🔎 READ store snapshot
  if (TRACE_BALANCE) {
    debugLog.log?.('[TRACE][useTokenSelection] READ store', {
      fromContainer: SP_COIN_DISPLAY[containerType],
      branchChosen: chosenFrom,
      sellAddr: sellTokenContract?.address,
      sellSym: sellTokenContract?.symbol,
      sellDec: sellTokenContract?.decimals,
      buyAddr: buyTokenContract?.address,
      buySym: buyTokenContract?.symbol,
      buyDec: buyTokenContract?.decimals,
    });
  }

  // ✅ Use the correct source by panel role
  const tokenContract = isSellPanel ? sellTokenContract : buyTokenContract;

  const tokenAddr = useMemo(
    () => lower(tokenContract?.address),
    [tokenContract?.address],
  );
  const tokenDecimals = tokenContract?.decimals ?? 18;

  // Extra: log the branch decision & chosen contract when it changes
  const prevChosenRef = useRef<string | null>(null);
  useEffect(() => {
    const curr = `${chosenFrom}:${tokenContract?.address ?? '(none)'}`;
    if (prevChosenRef.current !== curr) {
      debugLog.log?.(
        `🔀 branch=${chosenFrom} • selected=${
          tokenContract?.symbol ?? '(?)'
        } @ ${tokenContract?.address ?? '(none)'}`,
      );
      if (TRACE_BALANCE) {
        debugLog.log?.('[TRACE][useTokenSelection] CHOSEN', {
          fromContainer: SP_COIN_DISPLAY[containerType],
          branchChosen: chosenFrom,
          addr: tokenContract?.address,
          sym: tokenContract?.symbol,
          dec: tokenContract?.decimals,
        });
      }
      prevChosenRef.current = curr;
    }
  }, [chosenFrom, containerType, tokenContract]);

  // Mirror address changes into local state
  const prevAddrRef = useRef<string>('');
  useEffect(() => {
    if (!tokenAddr && !prevAddrRef.current) return;
    if (tokenAddr === prevAddrRef.current) return;
    prevAddrRef.current = tokenAddr || '';

    if (tokenAddr) {
      debugLog.log?.(
        `📦 Loaded token for ${SP_COIN_DISPLAY[containerType]} (${chosenFrom}): ${tokenAddr}`,
      );
      if (TRACE_BALANCE) {
        debugLog.log?.('[TRACE][useTokenSelection] setLocalTokenContract <-', {
          addr: tokenContract?.address,
          sym: tokenContract?.symbol,
          dec: tokenContract?.decimals,
          fromContainer: SP_COIN_DISPLAY[containerType],
          branchChosen: chosenFrom,
        });
      }
      setLocalTokenContract(tokenContract as any);
    }
  }, [
    tokenAddr,
    containerType,
    chosenFrom,
    setLocalTokenContract,
    tokenContract,
  ]);

  // Zero state when cleared
  const wasDefinedRef = useRef<boolean>(Boolean(tokenAddr));
  useEffect(() => {
    const wasDefined = wasDefinedRef.current;
    const isDefined = Boolean(tokenAddr);
    if (wasDefined && !isDefined) {
      setLocalTokenContract(undefined as any);
      setLocalAmount(0n);
      if (isSellPanel) {
        if (sellAmount !== 0n) setSellAmount(0n);
      } else {
        if (buyAmount !== 0n) setBuyAmount(0n);
      }
      if (TRACE_BALANCE) {
        debugLog.log?.('[TRACE][useTokenSelection] CLEARED', {
          fromContainer: SP_COIN_DISPLAY[containerType],
          branchChosen: chosenFrom,
        });
      }
    }
    wasDefinedRef.current = isDefined;
  }, [
    tokenAddr,
    containerType,
    chosenFrom,
    isSellPanel,
    setLocalTokenContract,
    setLocalAmount,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
  ]);

  // 🔎 RETURN snapshot
  if (TRACE_BALANCE) {
    debugLog.log?.('[TRACE][useTokenSelection] RETURN', {
      fromContainer: SP_COIN_DISPLAY[containerType],
      branchChosen: chosenFrom,
      tokenAddr,
      tokenDecimals,
      tokenContractAddr: tokenContract?.address,
      tokenContractSym: tokenContract?.symbol,
    });
  }

  return { tokenContract, tokenAddr, tokenDecimals };
}
