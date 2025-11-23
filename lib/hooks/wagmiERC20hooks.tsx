// File: @/lib/hooks/wagmiERC20hooks.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { isAddress, erc20Abi } from 'viem';
import type { TokenContract } from '@/lib/structure';
import { useAppChainId } from '@/lib/context/hooks';

// ---------------------------------------------
// 🧩 Hook: useErc20TokenContract (Wagmi v2.5+)
// ---------------------------------------------
export function useErc20TokenContract(tokenAddress?: Address): TokenContract | undefined {
  const { address: account } = useAccount();
  const enabled = !!tokenAddress && isAddress(tokenAddress);

  // ✅ useAppChainId returns a tuple [chainId, setChainId]
  const [chainId] = useAppChainId();

  const { data: metaData, status: metaStatus } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
    ],
    query: { enabled },
  });

  const { data: balance, status: balanceStatus } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  if (!enabled || metaStatus !== 'success' || !metaData) return undefined;

  const [symbolRaw, nameRaw, decimalsRaw, totalSupplyRaw] = metaData.map((res) => res.result);

  if (!symbolRaw || !nameRaw || decimalsRaw == null) return undefined;

  const totalSupply =
    typeof totalSupplyRaw === 'bigint'
      ? totalSupplyRaw
      : totalSupplyRaw != null
        ? BigInt(totalSupplyRaw as any)
        : undefined;

  const balanceVal =
    balanceStatus === 'success' && typeof balance === 'bigint' ? (balance as bigint) : 0n;

  return {
    chainId,
    address: tokenAddress!,
    symbol: symbolRaw as string,
    name: nameRaw as string,
    amount: 0n,
    decimals: Number(decimalsRaw),
    totalSupply,
    balance: balanceVal,
  };
}

// ---------------------------------------------
// 💡 TokenFetchGuiExamples — Fully Interactive Demo
// ---------------------------------------------
export function TokenFetchGuiExamples() {
  const [tokenAddressInput, setTokenAddressInput] = useState('');
  const [accountAddressInput, setAccountAddressInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');

  const tokenAddress = isAddress(tokenAddressInput) ? (tokenAddressInput as Address) : undefined;

  const tokenResult: TokenContract | undefined = useErc20TokenContract(
    submitted ? tokenAddress : undefined
  );

  useEffect(() => {
    if (!submitted) return;
    if (!tokenResult && tokenAddressInput) {
      setNotFoundMessage(`❌ Token not found at address ${tokenAddressInput}`);
    } else {
      setNotFoundMessage('');
    }
    setSubmitted(false);
  }, [submitted, tokenResult, tokenAddressInput]);

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
    <div className='mt-8'>
      <h3 className='text-lg font-semibold mb-4'>🔎 Fetch ERC20 Token</h3>

      <div className='mb-4'>
        <label className='block font-medium'>
          Token Contract Address:
          <input
            type='text'
            value={tokenAddressInput}
            onChange={(e) => setTokenAddressInput(e.target.value)}
            className='w-full mt-2 p-2 bg-gray-800 text-white rounded'
            placeholder='0x...'
          />
        </label>
      </div>

      <div className='mb-4'>
        <label className='block font-medium'>
          Account Address (optional):
          <input
            type='text'
            value={accountAddressInput}
            onChange={(e) => setAccountAddressInput(e.target.value)}
            className='w-full mt-2 p-2 bg-gray-800 text-white rounded'
            placeholder='0x...'
          />
        </label>
      </div>

      <button
        onClick={handleFetch}
        disabled={!tokenAddressInput}
        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4'
      >
        Fetch
      </button>

      {notFoundMessage && <div className='text-red-500 mb-4'>{notFoundMessage}</div>}

      {tokenResult && (
        <div className='border border-gray-500 rounded p-4'>
          <h4 className='text-green-400 text-lg font-semibold mb-2'>🎉 Token Found</h4>
          <p>
            <strong>Symbol:</strong> {tokenResult.symbol}
          </p>
          <p>
            <strong>Name:</strong> {tokenResult.name}
          </p>
          <p>
            <strong>Decimals:</strong> {tokenResult.decimals}
          </p>
          <p>
            <strong>Total Supply:</strong> {tokenResult.totalSupply?.toString()}
          </p>
          <p>
            <strong>Balance:</strong> {tokenResult.balance.toString()}
          </p>
          <p>
            <strong>Address:</strong> {tokenResult.address}
          </p>
        </div>
      )}
    </div>
  );
}
