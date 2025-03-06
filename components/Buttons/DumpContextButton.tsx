import React, { createContext } from 'react';
import styles from '@/styles/Exchange.module.css';
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

import { useExchangeContext } from '@/lib/context/ExchangeContext'; // ✅ Updated import

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
