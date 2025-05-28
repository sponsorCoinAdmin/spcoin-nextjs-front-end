import React, { createContext } from 'react';
import styles from '@/styles/Exchange.module.css';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'

import { useExchangeContext } from '@/lib/context/hooks/contextHooks'; // ✅ Updated import

const DumpContextButton = () => {
    const { exchangeContext } = useExchangeContext(); // ✅ Using `useExchangeContext()`

    const show = () => {
        // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
        console.log(`CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    };

    return (
        <div>
            <button
                onClick={show}
                type="button"
                className={styles["exchangeButton"]}
            >
                Dump Context
            </button>
        </div>
    );
};

export const testContext = createContext(undefined);

export default DumpContextButton;
