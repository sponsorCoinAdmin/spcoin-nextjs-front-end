'use client';

import React, { useEffect } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import {
  useWagmiERC20TokenBalanceOfStr,
  useFormattedClientBalanceOf,
  useWagmiERC20TokenDecimals,
} from '@/lib/hooks/wagmi/wagmiERC20ClientRead';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_EXCHANGE_BALANCES === 'true';
const debugLog = createDebugLogger('ReadWagmiERC20BalanceOf', DEBUG_ENABLED, false);

type Props = {
  TOKEN_CONTRACT_ADDRESS: Address | undefined;
};

const ReadWagmiERC20BalanceOf = ({ TOKEN_CONTRACT_ADDRESS }: Props) => {
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();

  const balanceOf = useWagmiERC20TokenBalanceOfStr(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const formattedBalanceOf = useFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);

  useEffect(() => {
    debugLog.log(`🔍 Rendering ReadWagmiERC20BalanceOf`);
    debugLog.log(`🏦 Wallet Address: ${ACTIVE_ACCOUNT_ADDRESS}`);
    debugLog.log(`🪙 Token Address: ${TOKEN_CONTRACT_ADDRESS}`);
    debugLog.log(`💰 Raw Balance: ${balanceOf}`);
    debugLog.log(`📏 Decimals: ${decimals}`);
    debugLog.log(`💵 Formatted Balance: ${formattedBalanceOf}`);
  }, [ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS, balanceOf, decimals, formattedBalanceOf]);

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
