import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BURN_ADDRESS, delay, useIsActiveAccountAddress } from '@/lib/context/helpers/NetworkHelpers';
import { Address } from "viem";
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'
import { useAccount } from "wagmi";

export const useBalanceInWei = (TOKEN_CONTRACT_ADDRESS: Address, provider: any, signer: any): bigint | undefined => {
    const [balanceInWei, setBalanceInWei] = useState<bigint | undefined>();
    const isActiveAccount = useIsActiveAccountAddress(TOKEN_CONTRACT_ADDRESS); // ✅ Hook used at the top level
    const ACTIVE_ACCOUNT = useAccount();
    const ACTIVE_ACCOUNT_ADDRESS = ACTIVE_ACCOUNT.address;

    useEffect(() => {
        const getBalance = async () => {
            if (!TOKEN_CONTRACT_ADDRESS) {
                setBalanceInWei(undefined);
                return;
            }
            if (isActiveAccount) {
                await delay(400);
                const newBal = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
                setBalanceInWei(newBal);
            } else if (TOKEN_CONTRACT_ADDRESS !== BURN_ADDRESS && signer) {
                const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
                const newBal: bigint = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
                setBalanceInWei(newBal);
            } else {
                setBalanceInWei(undefined);
            }
        };

        getBalance();
    }, [TOKEN_CONTRACT_ADDRESS, provider, signer, isActiveAccount]); // ✅ Dependencies ensure it updates when necessary

    return balanceInWei;
};
