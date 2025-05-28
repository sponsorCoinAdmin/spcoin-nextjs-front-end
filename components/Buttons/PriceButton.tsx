'use client';

import React, { useEffect, useState } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from '@/lib/context/hooks/contextHooks'
import DumpContextButton from './DumpContextButton';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

type Props = {
    isLoadingPrice: boolean
}

const PriceButton = ({ isLoadingPrice }: Props) => {    
    const { exchangeContext } = useExchangeContext();
    const ACTIVE_ACCOUNT = useAccount();
    
    const [displayDumpContextButton, setDisplayDumpContextButton] = useState<boolean>(exchangeContext.test.dumpContextButton);
    const [walletAccount, setWalletAccount] = useState<Address | undefined>(undefined);

    useEffect(() => {
        setDisplayDumpContextButton(exchangeContext.test.dumpContextButton);
    }, [exchangeContext.test.dumpContextButton]);
    
    useEffect(() => {
        setWalletAccount(ACTIVE_ACCOUNT?.address);
        // alert(`exchangeContext.test.dumpContextButton = ${exchangeContext.test.dumpContextButton}`)
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
            {!displayDumpContextButton || <DumpContextButton />}
        </div>
    );
}

export default PriceButton;
