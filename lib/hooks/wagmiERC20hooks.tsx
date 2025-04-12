'use client';

import { useReadContract, useReadContracts, useAccount, useChainId } from 'wagmi';
import { erc20Abi } from 'viem';
import { isAddress, Address } from 'viem';
import { useState, useEffect } from 'react';
import { TokenContract as MappedTokenContract } from '@/lib/structure/types';

// ---------------------------------------------
// 🔁 Local TokenContract used in hook
// ---------------------------------------------
type RawTokenContract = {
  address: Address;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
  balance: bigint;
};

// ---------------------------------------------
// 🧩 Hook: useErc20TokenContract (Wagmi v2.5+)
// ---------------------------------------------
function useErc20TokenContract(
  tokenAddress?: Address,
  accountAddress?: Address
): RawTokenContract | undefined {
  const { address: account } = useAccount();
  const resolvedAccount = accountAddress ?? account;
  const enabled = !!tokenAddress && isAddress(tokenAddress);

  const { data: metaData, status: metaStatus } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
    ],
    query: {
      enabled,
    },
  });

  const { data: balance, status: balanceStatus } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: resolvedAccount ? [resolvedAccount] : undefined,
    query: {
      enabled: !!tokenAddress && !!resolvedAccount,
    },
  });

  if (!enabled || metaStatus !== 'success' || !metaData) return undefined;

  const [symbolRaw, nameRaw, decimalsRaw, totalSupplyRaw] = metaData.map((res) => res.result);

  return {
    address: tokenAddress!,
    symbol: symbolRaw as string,
    name: nameRaw as string,
    decimals: Number(decimalsRaw),
    totalSupply: totalSupplyRaw as bigint,
    balance: balanceStatus === 'success' ? (balance as bigint) : 0n,
  };
}

// ---------------------------------------------
// 🔁 Hook: useMappedTokenContract
// Converts raw token to your global TokenContract
// ---------------------------------------------
export function useMappedTokenContract(
  tokenAddress?: Address,
  accountAddress?: Address
): MappedTokenContract | undefined {
  const account = useAccount();
  const chainId = useChainId();
  const token = useErc20TokenContract(tokenAddress, accountAddress ?? account.address);
  if (!token) return undefined;

  return {
    address: token.address,
    amount: 0n,
    balance: token.balance,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    totalSupply: token.totalSupply,
    img: undefined,
    chainId,
  };
}

// ---------------------------------------------
// 💡 TokenFetchGuiExample — Fully Interactive Demo
// ---------------------------------------------
export function TokenFetchGuiExample() {
  const [tokenAddressInput, setTokenAddressInput] = useState('');
  const [accountAddressInput, setAccountAddressInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const account = useAccount();

  const tokenAddress = isAddress(tokenAddressInput) ? (tokenAddressInput as Address) : undefined;
  const accountAddress =
    accountAddressInput && isAddress(accountAddressInput)
      ? (accountAddressInput as Address)
      : account.address;

  const tokenResult = useMappedTokenContract(submitted ? tokenAddress : undefined, accountAddress);

  useEffect(() => {
    if (submitted && !tokenResult) {
      alert('TOKEN NOT FOUND ON BLOCK CHAIN');
      setSubmitted(false); // prevent repeated alerts
    }
  }, [submitted, tokenResult]);

  const handleFetch = () => {
    if (!tokenAddressInput) {
      alert('Missing Token Contract Address');
      return;
    }

    if (!isAddress(tokenAddressInput)) {
      alert('BAD CONTRACT ADDRESS');
      return;
    }

    if (accountAddressInput && !isAddress(accountAddressInput)) {
      alert('BAD ACCOUNT ADDRESS');
      return;
    }

    setSubmitted(true);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>🔎 Fetch ERC20 Token</h3>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          <strong>Token Contract Address:</strong>
          <input
            type="text"
            value={tokenAddressInput}
            onChange={(e) => setTokenAddressInput(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
            placeholder="0x..."
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          <strong>Account Address (optional):</strong>
          <input
            type="text"
            value={accountAddressInput}
            onChange={(e) => setAccountAddressInput(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
            placeholder="0x..."
          />
        </label>
      </div>

      <button
        onClick={handleFetch}
        disabled={!tokenAddressInput}
        style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }}
      >
        Fetch
      </button>

      {tokenResult && (
        <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
          <h4>🎉 Token Found</h4>
          <p><strong>Symbol:</strong> {tokenResult.symbol}</p>
          <p><strong>Name:</strong> {tokenResult.name}</p>
          <p><strong>Decimals:</strong> {tokenResult.decimals}</p>
          <p><strong>Total Supply:</strong> {tokenResult.totalSupply?.toString()}</p>
          <p><strong>Balance:</strong> {tokenResult.balance.toString()}</p>
          <p><strong>Address:</strong> {tokenResult.address}</p>
        </div>
      )}
    </div>
  );
}
