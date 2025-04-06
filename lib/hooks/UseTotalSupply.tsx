import * as React from 'react';
import { Address, erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';

type Props = {
  contractAddress: Address;
};

const UseTotalSupply: React.FC<Props> = ({ contractAddress }) => {
  const { data, error, status } = useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: 'totalSupply',
  });

  return (
    <div>
      <p>Status: {status}</p>
      {data && <p>Total Supply: {data.toString()}</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );
};

export default UseTotalSupply;
