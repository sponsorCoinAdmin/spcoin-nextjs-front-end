import React, { useEffect, useState } from 'react';
import CustomConnectButton from './CustomConnectButton';
import ExchangeButton from './ExchangeButton';
import { exchangeContext } from "@/lib/context";
import { BURN_ADDRESS } from '@/lib/network/utils';
import { stringifyBigInt } from '@/lib/spCoin/utils';
import DumpContextButton from './DumpContextButton';

type Props = {
    connectedAccountAddr:any
  }

const PriceButton = ({connectedAccountAddr}:Props) => {    
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
            {!connectedAccountAddr || connectedAccountAddr === BURN_ADDRESS?
                (<CustomConnectButton />) :
                (<ExchangeButton />)
            }
            {!displayDumpContextButton || <DumpContextButton />}
        </div>
    );
}

export default PriceButton;
