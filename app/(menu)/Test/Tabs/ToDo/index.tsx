'use client';

import React, { useMemo, useCallback } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePageState } from '@/lib/context/PageStateContext';

import ReadWagmiERC20Fields from '@/components/ERC20/ReadWagmiERC20Fields';
import ReadWagmiERC20RecordFields from '@/components/ERC20/ReadWagmiERC20RecordFields';
import ReadWagmiERC20Records from '@/components/ERC20/ReadWagmiERC20Records';
import ReadWagmiERC20ContractFields from '@/components/ERC20/ReadWagmiERC20ContractFields';
import ReadWagmiERC20BalanceOf from '@/components/ERC20/ReadWagmiERC20BalanceOf';
import ReadWagmiERC20ContractName from '@/components/ERC20/ReadWagmiERC20ContractName';
import ReadWagmiERC20ContractSymbol from '@/components/ERC20/ReadWagmiERC20ContractSymbol';
import ReadWagmiERC20ContractDecimals from '@/components/ERC20/ReadWagmiERC20ContractDecimals';
import ReadWagmiERC20ContractTotalSupply from '@/components/ERC20/ReadWagmiERC20ContractTotalSupply';

export default function ToDoTab() {
  const { exchangeContext } = useExchangeContext();
  const { setState } = usePageState();

  const tokenAddress = useMemo(
    () => exchangeContext?.tradeData?.sellTokenContract?.address,
    [exchangeContext]
  );

  const updateExchangePage = useCallback((updates: any) => {
    setState((prev: any) => ({
      ...prev,
      page: {
        ...prev?.page,
        exchangePage: {
          ...(prev?.page?.exchangePage ?? {}),
          ...updates,
        },
      },
    }));
  }, [setState]);

  const hideToDo = useCallback(() => {
    updateExchangePage({ showToDo: false });
  }, [updateExchangePage]);

  return (
    <div className="space-y-6">
      {/* Top bar: consistent with other tabs — centered controls (none) + Close X at top-right, shifted up 15px */}
      <div className="relative w-full -mt-[15px]">
        {/* Centered controls placeholder to keep layout consistent */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          {/* (No buttons here yet) */}
        </div>

        {/* Top-right Close "X" (double text size) */}
        <button
          onClick={hideToDo}
          aria-label="Close ToDo"
          title="Close ToDo"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        >
          X
        </button>
      </div>

      {!tokenAddress ? (
        <div className="text-sm text-gray-400">
          Select a token to view ERC-20 details here.
        </div>
      ) : (
        <div className="grid gap-6">
          <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20BalanceOf TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={tokenAddress} />
        </div>
      )}
    </div>
  );
}
