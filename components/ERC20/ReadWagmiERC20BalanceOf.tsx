'use client';

import React from 'react';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import {
  useWagmiERC20TokenBalanceOfStr,
  useFormattedClientBalanceOf,
  useWagmiERC20TokenDecimals,
} from '@/lib/hooks/wagmi/wagmiERC20ClientRead';

type Props = {
  TOKEN_CONTRACT_ADDRESS: Address | undefined;
};

const ReadWagmiERC20BalanceOf = ({ TOKEN_CONTRACT_ADDRESS }: Props) => {
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();

  const balanceOf = useWagmiERC20TokenBalanceOfStr(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const formattedBalanceOf = useFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);

  return (
    <>
      <hr className="border-top: 3px dashed #bbb" />
      <h2>For Wallet {ACTIVE_ACCOUNT_ADDRESS}</h2>
      <h2>Reading Wagmi ERC20 Contract BalanceOf {TOKEN_CONTRACT_ADDRESS}</h2>
      BalanceOf: {balanceOf} <br />
      Decimals: {decimals} <br />
      Formatted BalanceOf: {formattedBalanceOf}
    </>
  );
};

export default ReadWagmiERC20BalanceOf;
