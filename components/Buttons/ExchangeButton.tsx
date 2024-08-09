import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { ExchangeContext } from '@/lib/structure/types'
import { formatUnits, parseUnits } from "ethers";
import { stringifyBigInt } from '@/lib/spCoin/utils';


type Props = {
  tradeData:ExchangeContext,
}

const CustomConnectButton = ({ tradeData}:Props) => {
  const show = () => {
    alert(`CustomConnectButton:useEffect(() => tradeData = ${stringifyBigInt(tradeData)}`);
  }

  const insufficientSellAmount = () => {
    let noTradingAmount:boolean = false;
    try {
    // let noTradingAmount:boolean = !( tradeData.sellAmount === "0"  || tradeData.buyAmount === "0" )
    noTradingAmount = ( tradeData.sellAmount === "0" )
    // console.log(`ExchangeButton => tradeData.sellAmount = ${tradeData.sellAmount}\noTradingAmount = ${noTradingAmount}`);
    // alert (validTradingAmount)
    } catch(err:any) {
      console.debug(`ERROR: CustomConnectButton.insufficientSellAmount: ${err.message}`)
    }
    return noTradingAmount;
  }

  const insufficientSellBalance = () => {
    let insufficientSellBalance:boolean = false;
     try {
      console.debug(`EXCHANGE_BUTTON.tradeData = \n${stringifyBigInt(tradeData)}`);
      const sellAmount = tradeData.sellAmount;
      const bigIntSellBalanceOf = tradeData.sellBalanceOf;
      const sellDecimals = tradeData.sellTokenContract.decimals;
      const sellBalanceOf = tradeData.sellBalanceOf;
      const bigIntSellAmount = parseUnits(sellAmount, sellDecimals)
      insufficientSellBalance = bigIntSellBalanceOf <  bigIntSellAmount

      // let bigIntSellBalanceOf:BigInt  = BigInt(tradeData.sellBalanceOf);
      // let bigIntSellAmount:BigInt  = BigInt(tradeData.sellAmount);

      console.debug(`CustomConnectButton.insufficientSellBalance: sellBalanceOf = "${bigIntSellBalanceOf}"`);
      console.debug(`sellAmount              = "${sellAmount}"`);
      console.debug(`sellDecimals            = "${sellDecimals}"`);
      console.debug(`sellBalanceOf           = "${sellBalanceOf}"`);
      console.debug(`bigIntSellAmount        = "${bigIntSellAmount}"`);
      console.debug(`bigIntSellBalanceOf     = "${bigIntSellBalanceOf}"`);
      console.debug(`insufficientSellBalance = "${insufficientSellBalance}"`);

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

export default CustomConnectButton