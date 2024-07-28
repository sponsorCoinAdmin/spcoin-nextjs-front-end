import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { ExchangeContext } from '@/lib/structure/types'
import { formatUnits, parseUnits } from "ethers";


type Props = {
  exchangeContext:ExchangeContext,
}

const CustomConnectButton = ({ exchangeContext}:Props) => {
  const show = () => {
    alert(`CustomConnectButton:useEffect(() => exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`);
  }

  const insufficientSellAmount = () => {
    let noTradingAmount:boolean = false;
    try {
    // let noTradingAmount:boolean = !( exchangeContext.tradeData.sellAmount === "0"  || exchangeContext.tradeData.buyAmount === "0" )
    noTradingAmount = ( exchangeContext.tradeData.sellAmount === "0" )
    // console.log(`ExchangeButton => exchangeContext.tradeData.sellAmount = ${exchangeContext.tradeData.sellAmount}\noTradingAmount = ${noTradingAmount}`);
    // alert (validTradingAmount)
    } catch(err:any) {
      alert(`ERROR: CustomConnectButton.insufficientSellAmount: ${err.message}`)
    }
    return noTradingAmount;
  }

  const insufficientSellBalance = () => {
    let insufficientSellBalance:boolean = false;
     try {
      console.debug(`EXCHANGE_BUTTON.exchangeContext.tradeData = \n${JSON.stringify(exchangeContext.tradeData,null,2)}`);
      const sellAmount = exchangeContext.tradeData.sellAmount;
      const sellBalanceOf = exchangeContext.tradeData.sellBalanceOf;
      const sellDecimals = exchangeContext.tradeData.sellDecimals;
      const bigIntSellAmount = parseUnits(sellAmount, sellDecimals)
      const bigIntSellBalanceOf = parseUnits(sellBalanceOf, sellDecimals);
      insufficientSellBalance = bigIntSellBalanceOf <  bigIntSellAmount

      // let bigIntSellBalanceOf:BigInt  = BigInt(exchangeContext.tradeData.sellBalanceOf);
      // let bigIntSellAmount:BigInt  = BigInt(exchangeContext.tradeData.sellAmount);

      console.debug(`CustomConnectButton.insufficientSellBalance: sellBalanceOf = "${sellBalanceOf}"`);
      console.debug(`sellAmount              = "${sellAmount}"`);
      console.debug(`SellBalanceOf           = "${sellBalanceOf}"`);
      console.debug(`sellDecimals            = "${sellDecimals}"`);
      console.debug(`bigIntSellAmount        = "${bigIntSellAmount}"`);
      console.debug(`bigIntSellBalanceOf     = "${bigIntSellBalanceOf}"`);
      console.debug(`insufficientSellBalance = "${insufficientSellBalance}"`);

    } catch(err:any) {
      alert(`ERROR: CustomConnectButton.insufficientSellBalance: ${err.message}`)
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

export default CustomConnectButton