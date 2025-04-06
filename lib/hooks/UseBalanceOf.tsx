import * as React from 'react';
import { Address, erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';

type Props = {
  accountAddress: Address;
  contractAddress: Address;
};

const UseBalanceOf: React.FC<Props> = ({ accountAddress, contractAddress }) => {
  const { data, error, status } = useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [accountAddress], // Corrected argument for balanceOf
  });

  return (
    <div>
      <p>Status: {status}</p>
      {data && <p>Balance: {data.toString()}</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );
};

export default UseBalanceOf;
