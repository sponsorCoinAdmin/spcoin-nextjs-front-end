'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { BURN_ADDRESS, delay, useIsActiveAccountAddress } from '@/lib/network/utils';
import { Address } from 'viem';
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI';
import { useAccount } from 'wagmi';

/**
 * Hook to fetch the balance of an ERC-20 or native token in wei.
 */
export const useBalanceInWei = (
  TOKEN_CONTRACT_ADDRESS: Address,
  provider: ethers.Provider | undefined,
  signer: ethers.Signer | undefined
): bigint | undefined => {
  const [balanceInWei, setBalanceInWei] = useState<bigint | undefined>();
  const isActiveAccount = useIsActiveAccountAddress(TOKEN_CONTRACT_ADDRESS);
  const { address: ACTIVE_ACCOUNT_ADDRESS } = useAccount();

  useEffect(() => {
    if (!TOKEN_CONTRACT_ADDRESS || !provider || !ACTIVE_ACCOUNT_ADDRESS) {
      setBalanceInWei(undefined);
      return;
    }

    const fetchBalance = async () => {
      try {
        if (isActiveAccount) {
          await delay(400);
          const newBal = await provider.getBalance(TOKEN_CONTRACT_ADDRESS);
          setBalanceInWei(BigInt(newBal.toString()));
        } else if (TOKEN_CONTRACT_ADDRESS !== BURN_ADDRESS && signer) {
          const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
          const newBal: bigint = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
          setBalanceInWei(BigInt(newBal.toString()));
        } else {
          setBalanceInWei(undefined);
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch balance:`, err);
        setBalanceInWei(undefined);
      }
    };

    fetchBalance();
  }, [TOKEN_CONTRACT_ADDRESS, provider, signer, isActiveAccount, ACTIVE_ACCOUNT_ADDRESS]);

  return balanceInWei;
};

type BalanceDisplayProps = {
  contractAddress: Address;
  provider: ethers.Provider | undefined;
  signer: ethers.Signer | undefined;
};

/**
 * Component Example: Displays the balance using useBalanceInWei hook.
 */
export const BalanceInWeiDisplayExample: React.FC<BalanceDisplayProps> = ({
  contractAddress,
  provider,
  signer,
}) => {
  const balance = useBalanceInWei(contractAddress, provider, signer);

  return (
    <div className="p-4 bg-[#0E111B] text-white border border-gray-700 rounded text-sm">
      <p className="font-mono text-xs text-gray-400 mb-2">Contract: {contractAddress}</p>

      {balance === undefined ? (
        <p className="text-yellow-400">⏳ Fetching balance...</p>
      ) : (
        <p className="text-green-400">
          Balance in Wei: <span className="font-mono">{balance.toString()}</span>
        </p>
      )}
    </div>
  );
};
