export const balanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/*
EXAMPLE USAGE:
const updateBalance = async () => {
        if (accountAddress && publicClient) {
          try {
            const balance = await publicClient.readContract({
              abi: balanceOfAbi,
              address: tokenWithBalance.address as `0x${string}`,
              functionName: 'balanceOf',
              args: [accountAddress],
            }) as bigint;

            if (typeof balance !== 'bigint') {
              throw new Error(`Expected bigint balance but received ${typeof balance}`);
            }

            debugLog.log(`💰 Updated balance for ${tokenWithBalance.symbol}: ${balance.toString()}`);
            tokenWithBalance.balance = balance;
            setValidatedAsset(tokenWithBalance as unknown as T);
          } catch (err) {
            debugLog.error(`❌ Failed to fetch balance for ${tokenWithBalance.symbol}:`, err);
          }
        }
      };
*/