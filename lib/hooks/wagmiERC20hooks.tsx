'use client';

import { useReadContract, useReadContracts, useAccount, useChainId } from 'wagmi';
import { erc20Abi } from 'viem';
import { isAddress, Address } from 'viem';
import { useState, useEffect } from 'react';
import { TokenContract as MappedTokenContract, TokenContract } from '@/lib/structure/types';
import { getNativeWrapAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils'
import { useNativeToken } from './useNativeToken';

// ---------------------------------------------
// 🧩 Hook: useErc20TokenContract (Wagmi v2.5+)
// ---------------------------------------------
function useErc20TokenContract( tokenAddress?: Address ): TokenContract | undefined {
    const { address: account } = useAccount();
    const enabled = !!tokenAddress && isAddress(tokenAddress);
    const chainId = useChainId()
  
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
  
    return {
      chainId,
      address: tokenAddress!,
      symbol: symbolRaw as string,
      name: nameRaw as string,
      amount: 0n,
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
): MappedTokenContract | undefined | null {
  const chainId = useChainId();
  const isNativeToken:boolean = tokenAddress === NATIVE_TOKEN_ADDRESS
  const validAddress = isNativeToken ? getNativeWrapAddress(chainId) :  tokenAddress
  const token = useErc20TokenContract(validAddress);
  const nativeToken = useNativeToken()

  if (!token) {
    // console.warn(`[❌ useMappedTokenContract] Failed to resolve token for address: ${tokenAddress}`);
    return null; // ⚠️ Return `null` to indicate known failure instead of staying undefined forever
  }

  return isNativeToken ? nativeToken : token as TokenContract;
}

// ---------------------------------------------
// 💡 TokenFetchGuiExamples — Fully Interactive Demo
// ---------------------------------------------
export function TokenFetchGuiExamples() {
  const [tokenAddressInput, setTokenAddressInput] = useState('');
  const [accountAddressInput, setAccountAddressInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const account = useAccount();

  const tokenAddress = isAddress(tokenAddressInput) ? (tokenAddressInput as Address) : undefined;
  const accountAddress =
    accountAddressInput && isAddress(accountAddressInput)
      ? (accountAddressInput as Address)
      : account.address;

  const tokenResult: TokenContract | undefined | null = useMappedTokenContract(submitted ? tokenAddress : undefined);

  useEffect(() => {
    if (submitted) {
      if (!tokenResult && tokenAddressInput) {
        setNotFoundMessage(`❌ Token not found at address ${tokenAddressInput}`);
      } else {
        setNotFoundMessage('');
      }
      setSubmitted(false); // prevent repeated alerts or stale results
    }
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
        style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>
          Fetch
      </button>

      {notFoundMessage && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {notFoundMessage}
        </div>
      )}

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