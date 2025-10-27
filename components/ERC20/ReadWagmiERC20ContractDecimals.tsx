import React from 'react';
import type { Address } from 'viem';
import { useWagmiERC20TokenDecimalRec } from '@/lib/hooks/wagmi/wagmiERC20ClientRead';

type Props = {
  TOKEN_CONTRACT_ADDRESS?: Address;
};

export default function ReadWagmiERC20ContractDecimals({ TOKEN_CONTRACT_ADDRESS }: Props) {
  const { data: decimals, isLoading, error } =
    useWagmiERC20TokenDecimalRec(TOKEN_CONTRACT_ADDRESS);

  return (
    <>
      <hr className="my-3 border-t-4 border-dashed border-gray-300" />
      <h2>
        Reading Wagmi Token Decimals for Contract ({TOKEN_CONTRACT_ADDRESS ?? '—'})
      </h2>
      {isLoading && <>Loading…</>}
      {!isLoading && error && <>—</>}
      {!isLoading && !error && <>Token Decimals: {decimals ?? '—'}</>}
      <br />
    </>
  );
}
