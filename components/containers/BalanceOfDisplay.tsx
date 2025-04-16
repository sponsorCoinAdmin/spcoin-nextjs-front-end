'use client';

import * as React from 'react';
import { Address, erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';

type Props = {
  accountAddress: Address;
  contractAddress: Address;
};

const BalanceOfDisplay: React.FC<Props> = ({ accountAddress, contractAddress }) => {
  const { data, error, status } = useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [accountAddress],
  });

  return (
    <div className="text-sm p-2 rounded border border-gray-700 bg-[#0E111B] text-white">
      <p className="mb-1">
        Status: <span className="font-mono">{status}</span>
      </p>

      {status === 'pending' && (
        <p className="text-yellow-400 animate-pulse">⏳ Fetching balance...</p>
      )}

      {data && (
        <p>
          Balance (wei): <span className="font-mono text-green-400">{data.toString()}</span>
        </p>
      )}

      {error && (
        <p className="text-red-500">⚠️ Error: {error.message}</p>
      )}
    </div>
  );
};

export default BalanceOfDisplay;
