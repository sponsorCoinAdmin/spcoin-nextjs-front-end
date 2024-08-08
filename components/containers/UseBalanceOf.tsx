import { config } from '@/lib/wagmi/wagmiConfig';
import React from 'react';
import { Address, erc20Abi, parseAbi } from 'viem';
import { useReadContract } from 'wagmi';

export const abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'supply', type: 'uint256' }],
  },
] as const

// const balanceOf2 = readContract(config, { 
//   address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
//   abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
//   functionName: 'balanceOf',
//   args: ['0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59'],
// })
// alert(`balanceOf = ${balanceOf}`)

type Props = {
  accountAddress: Address,
  contractAddress: Address,
}

const UseBalanceOf = ({accountAddress, contractAddress}:Props) => {
const result = useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [contractAddress],
    account: accountAddress,
    config: config
    })
    console.debug(`result = ${JSON.stringify(result,(key, value) => (typeof value === "bigint" ? value.toString() : value),2)}`)
  return (
    <div>
      {result.status.toString()}
      {result.error?.message}
    </div>
  );
}

export default UseBalanceOf;
// export { balanceOf2 }
