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
    let noTradingAmount:boolean = false;
    try {
    // let noTradingAmount:boolean = !( exchangeContext.tradeData.sellAmount === "0"  || exchangeContext.tradeData.buyAmount === "0" )
    noTradingAmount = ( exchangeContext.tradeData.sellAmount === "0" )
    // console.log(`ExchangeButton => exchangeContext.tradeData.sellAmount = ${exchangeContext.tradeData.sellAmount}\noTradingAmount = ${noTradingAmount}`);
    // alert (validTradingAmount)
    } catch(err:any) {
      alert(`ERROR: CustomConnectButton.noTradingAmounts: ${err.message}`)
    }
    return noTradingAmount;
  }

  const insufficientBalance = () => {
    let insufficientBalance:boolean = false;
     try {
      console.debug(`CustomConnectButton.insufficientBalance: exchangeContext.tradeData.sellBalanceOf = "${exchangeContext.tradeData.sellBalanceOf}"\n
        exchangeContext.tradeData.sellAmount = "${exchangeContext.tradeData.sellAmount}"`)
      let bigIntSellBalanceOf:BigInt  = BigInt(exchangeContext.tradeData.sellBalanceOf);
      let bigIntSellAmount:BigInt  = BigInt(exchangeContext.tradeData.sellAmount);
      // alert(`SUCCESS: CustomConnectButton. insufficientBalance = ${insufficientBalance}`)

      insufficientBalance = bigIntSellBalanceOf <  bigIntSellAmount
    } catch(err:any) {
      alert(`ERROR: CustomConnectButton.insufficientBalance: ${err.message}`)
    }
    return insufficientBalance;
  }

  return (
    <div>
      <button
        onClick={show}
        // disabled={true}
        type="button"
        className={styles["exchangeButton"]}
        >
        {/* {noTradingAmounts() ? "Enter an Amount" : "Insufficient Balance"} */}

        {noTradingAmounts() ? "Enter an Amount" : 
        insufficientBalance() ? "Insufficient Balance" :
        "SWAP"}

      </button>
    </div>
  )
}

export default CustomConnectButton