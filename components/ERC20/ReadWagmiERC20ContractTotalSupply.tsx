// File: components/ERC20/ReadWagmiERC20ContractTotalSupply.tsx
'use client';

import React from 'react';
import type { Address } from 'viem';
import { useWagmiERC20TokenTotalSupply } from '@/lib/hooks/wagmi/wagmiERC20ClientRead';

type Props = {
  TOKEN_CONTRACT_ADDRESS?: Address;
};

export default function ReadWagmiERC20ContractTotalSupply({ TOKEN_CONTRACT_ADDRESS }: Props) {
  // Call the hook unconditionally (it tolerates undefined)
  const totalSupply = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS);

  if (!TOKEN_CONTRACT_ADDRESS) {
    return <span>Token address is missing.</span>;
  }

  return (
    <>
      <hr className="border-t-4 border-dashed border-gray-400 my-4" />
      <h2 className="text-lg font-semibold">
        Reading Wagmi Token Total Supply for Contract ({TOKEN_CONTRACT_ADDRESS})
      </h2>
      <div>Token Total Supply: {totalSupply?.toString() ?? '—'}</div>
    </>
  );
}
