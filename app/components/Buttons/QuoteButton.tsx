import React from 'react';
import styles from '../../styles/Exchange.module.css'

type Props = {
    sendTransaction:any;
  }

const PlaceOrder = ({
    sendTransaction }:Props) => {
    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }

    return (
        <button type="button"
            onClick={() => {
                console.log("submitting quote to blockchain");
                sendTransaction && sendTransaction();
                }
            }
            className={styles["exchangeButton"] + " " + styles["swapButton"]}
            >
            Place Order
        </button>
    );
}

export default PlaceOrder;
