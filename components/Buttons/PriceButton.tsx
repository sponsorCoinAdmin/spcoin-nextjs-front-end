import React, { useEffect, useState } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { exchangeContext } from "@/lib/context";
import { BURN_ADDRESS } from '@/lib/network/utils';
import { stringifyBigInt } from '@/lib/spCoin/utils';
import DumpContextButton from './DumpContextButton';
import { useAccount } from 'wagmi';

const PriceButton = () => {    
    const ACTIVE_ACCOUNT = useAccount()
    const [ displayDumpContextButton, setDisplayDumpContextButton ] = useState<boolean>(exchangeContext.test.dumpContextButton)
    useEffect(() => {
        setDisplayDumpContextButton(exchangeContext.test.dumpContextButton)
    }, [exchangeContext.test.dumpContextButton])
    useEffect(() => {
        setDisplayDumpContextButton(exchangeContext.test.dumpContextButton)
        // alert(`exchangeContext.test.dumpContextButton = ${exchangeContext.test.dumpContextButton}`)
    }, [exchangeContext.test.dumpContextButton])

    return (
        <div>
            {!ACTIVE_ACCOUNT?.address?
                (<CustomConnectButton />) :
                (<ExchangeButton />)
            }
            {!displayDumpContextButton || <DumpContextButton />}
        </div>
    );
}

export default PriceButton;
