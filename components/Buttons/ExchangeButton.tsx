import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { ExchangeContext } from '@/lib/structure/types'


type Props = {
  exchangeContext:ExchangeContext,
}

const CustomConnectButton = ({ exchangeContext}:Props) => {
  const show = () => {
    alert(`CustomConnectButton:useEffect(() => exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`);
  }

  const noTradingAmounts = () => {
    // let noTradingAmount:boolean = !( exchangeContext.tradeData.sellAmount === "0"  || exchangeContext.tradeData.buyAmount === "0" )
    let noTradingAmount:boolean = ( exchangeContext.tradeData.sellAmount === "0" )
    console.log(`CustomConnectButton => exchangeContext.tradeData.sellAmount = ${exchangeContext.tradeData.sellAmount}\noTradingAmount = ${noTradingAmount}`);
    // alert (validTradingAmount)
    return noTradingAmount;
  }

  const insufficientBalance = () => {
    return ( exchangeContext.tradeData.sellBalanceOf <  exchangeContext.tradeData.sellAmount)
  }

  return (
    <div>
      <button
        onClick={show}
        // disabled={true}
        type="button"
        className={styles["exchangeButton"]}
        >
        {noTradingAmounts() ? "Enter an Amount" : "Insufficient Balance"}
      </button>
    </div>
  )
}

export default CustomConnectButton