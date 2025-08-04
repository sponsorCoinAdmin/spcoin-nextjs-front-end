import React from 'react';
import styles from '@/styles/Exchange.module.css'
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

type Props = {
    sendTransaction:any;
  }

const PlaceOrder = ({
    sendTransaction }:Props) => {
    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }

    const placeOrder = async () => {
        console.log(`placing order transaction sendTransaction = ${sendTransaction}`);
        if (sendTransaction) {
            let receipt = await sendTransaction();
            JUNK_ALERTS("Transaction receipt : " + receipt)
        }
    }

    return (
        <button type="button"
            onClick={() => { placeOrder(); } }
            className={styles["exchangeButton"] + " " + styles["swapButton"]}
        >
            Place Order
        </button>
    );
}

export default PlaceOrder;
