'use client';

import * as React from 'react';
import { Address, erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';

/**
 * Hook: Returns the totalSupply of an ERC-20 token.
 * @param contractAddress ERC-20 token contract address
 */
export const useTotalSupply = (contractAddress: Address) => {
  return useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: 'totalSupply',
  });
};

type DisplayProps = {
  contractAddress: Address;
};

/**
 * Component Example: Displays totalSupply using useTotalSupply hook
 */
export const TotalSupplyDisplayExample: React.FC<DisplayProps> = ({ contractAddress }) => {
  const { data, status, error } = useTotalSupply(contractAddress);

  return (
    <div className="p-4 bg-[#0E111B] text-white border border-gray-700 rounded text-sm">
      <p>Status: <span className="font-mono">{status}</span></p>

      {status === 'pending' && (
        <p className="text-yellow-400 animate-pulse">⏳ Loading total supply...</p>
      )}

      {data && (
        <p>
          Total Supply (raw):{' '}
          <span className="font-mono text-green-400">{data.toString()}</span>
        </p>
      )}

      {error && (
        <p className="text-red-500">⚠️ Error: {error.message}</p>
      )}
    </div>
  );
};
