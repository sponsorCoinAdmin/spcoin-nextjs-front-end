'use client';

import React, { useEffect, useState } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { useExchangeContext } from "@/lib/context/ExchangeContext";
import DumpContextButton from './DumpContextButton';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { ErrorMessage } from '@/lib/structure/types';

type Props = {
    isLoadingPrice: boolean,
    errorMessage: ErrorMessage | undefined,
    setErrorMessage: (errorMessage: ErrorMessage | undefined) => void,
    setResetAmounts: (resetAmounts: boolean) => void,
    toggleButton: boolean
}

const PriceButton = ({ isLoadingPrice, errorMessage, setErrorMessage, setResetAmounts, toggleButton }: Props) => {    
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
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                    setResetAmounts={setResetAmounts}
                    toggleButton={toggleButton}
                />
            )}
            {!displayDumpContextButton || <DumpContextButton />}
        </div>
    );
}

export default PriceButton;
