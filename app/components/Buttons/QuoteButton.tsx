import React from 'react';
import styles from '../../styles/Exchange.module.css'

type Props = {
    sendTransaction:any;
  }

const PlaceOrder = ({
    sendTransaction } : Props) => {
    function setErrorMessage(msg: Error): void {
        throw new Error('Function not implemented.');
    }

    const placeOrder = async () => {
        console.log("submitting quote to blockchain");
        if (sendTransaction) {
            let receipt = await sendTransaction();
            alert("Transaction receipt : " + receipt)
        }
    }

    return (
        <button type="button"
            onClick={() => { placeOrder(); }
            }
            className={styles["exchangeButton"] + " " + styles["swapButton"]}
            >
            Place Order
        </button>
    );
}

export default PlaceOrder;
