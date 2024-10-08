'use client'
import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { exchangeContext } from "@/lib/context";
import { stringifyBigInt } from '@/lib/spCoin/utils';

const ExchangeButton = () => {

  const tradeData = exchangeContext.tradeData;

  const show = () => {
    // alert(`show:CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    console.debug(`CustomConnectButton:useEffect(() => exchangeContext = ${stringifyBigInt(exchangeContext)}`);
  }

  const insufficientSellAmount = () => {
    let noTradingAmount:boolean = false;
    try {
    noTradingAmount = ( exchangeContext.tradeData.sellAmount.toString() === "0" )

    } catch(err:any) {
      console.debug(`ERROR: CustomConnectButton.insufficientSellAmount: ${err.message}`)
    }
    return noTradingAmount;
  }

  const insufficientSellBalance = () => {
    let insufficientSellBalance:boolean = false;
     try {
      // console.debug(`EXCHANGE_BUTTON.exchangeContext = \n${stringifyBigInt(exchangeContext)}`);
      const sellAmount = exchangeContext.tradeData.sellAmount;
      const sellBalanceOf = exchangeContext.tradeData.sellBalanceOf;
      insufficientSellBalance = sellBalanceOf <  sellAmount

      // console.debug(`CustomConnectButton.insufficientSellBalance: sellBalanceOf = "${sellBalanceOf}"`);
      // console.debug(`sellAmount              = "${sellAmount}"`);
      // console.debug(`sellBalanceOf           = "${sellBalanceOf}"`);
      // console.debug(`insufficientSellBalance = "${insufficientSellBalance}"`);

    } catch(err:any) {
      console.debug(`ERROR: CustomConnectButton.insufficientSellBalance: ${err.message}`)
    }
    return insufficientSellBalance;
  }

  return (
    <div>
      <button
        onClick={show}
        // disabled={true}
        type="button"
        className={styles["exchangeButton"]}
        >
        {/* {insufficientSellAmount() ? "Enter an Amount" : "Insufficient Balance"} */}

        {insufficientSellAmount() ? "Enter an Amount" : 
        insufficientSellBalance() ? "Insufficient Sell Balance" :
        "SWAP"}
      </button>
    </div>
  )
}

export default ExchangeButton