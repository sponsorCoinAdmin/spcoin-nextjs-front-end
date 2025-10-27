// File: components/ERC20/ReadWagmiERC20ContractSymbol.tsx
'use client';

import React from 'react';
import type { Address } from 'viem';
import { useWagmiERC20TokenSymbol } from '@/lib/hooks/wagmi/wagmiERC20ClientRead';

type Props = {
  TOKEN_CONTRACT_ADDRESS?: Address;
};

export default function ReadWagmiERC20ContractSymbol({ TOKEN_CONTRACT_ADDRESS }: Props) {
  if (!TOKEN_CONTRACT_ADDRESS) {
    return <span>Token address is missing.</span>;
  }

  // Your hook returns `string | undefined`
  const symbol = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS);

  return (
    <>
      <hr className={`border-t-4 border-dashed border-gray-400 my-4`} />
      <h2 className={`text-lg font-semibold`}>
        Reading Wagmi Token Symbol for Contract ({TOKEN_CONTRACT_ADDRESS})
      </h2>
      <div>Token Symbol: {symbol ?? '—'}</div>
    </>
  );
}
