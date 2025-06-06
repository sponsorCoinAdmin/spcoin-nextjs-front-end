'use client';

import React, { useEffect, useState } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks'
import { useAccount } from 'wagmi';
import { Address } from 'viem';

type Props = {
    isLoadingPrice: boolean
}

const PriceButton = ({ isLoadingPrice }: Props) => {    
    const { exchangeContext } = useExchangeContext();
    const ACTIVE_ACCOUNT = useAccount();
    
    const [walletAccount, setWalletAccount] = useState<Address | undefined>(undefined);
    
    useEffect(() => {
        setWalletAccount(ACTIVE_ACCOUNT?.address);
    }, [ACTIVE_ACCOUNT?.address]);

    return (
        <div>
            {!walletAccount ? (
                <CustomConnectButton />
            ) : (
                <ExchangeButton
                    isLoadingPrice={isLoadingPrice}
                />
            )}
        </div>
    );
}

export default PriceButton;
