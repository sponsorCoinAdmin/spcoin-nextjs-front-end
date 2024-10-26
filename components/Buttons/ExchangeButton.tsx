'use client'
import styles from '@/styles/Exchange.module.css'
import { stringifyBigInt } from '@/lib/spCoin/utils';
import useERC20WagmiBalances from '../ERC20/useERC20WagmiBalances';
import { exchangeContext, exchangeContextMap } from "@/lib/context";
import { BUTTON_TYPE, TRANSACTION_TYPE, TokenContract } from '@/lib/structure/types';

type Props = {
  isLoadingPrice: boolean
}

const ExchangeButton = ({isLoadingPrice}:Props) => {
  const transActionType:TRANSACTION_TYPE = exchangeContext.tradeData.transactionType;
  console.debug(`ExchangeButton:transActionType = ${transActionType}`);

  const getTokenContractByTradeType = () =>{
    const tokenContract:TokenContract|undefined = (transActionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ?
              exchangeContext.sellTokenContract as TokenContract | undefined :
              exchangeContext.buyTokenContract as TokenContract | undefined;
    console.debug(`ExchangeButton:transActionType = ${transActionType}`);
    console.debug(`ExchangeButton:getTokenContractByTradeType tokenContract = ${stringifyBigInt(tokenContract)}`);
    return tokenContract;
  };

  const tokenContract:TokenContract|undefined = getTokenContractByTradeType();
  const {balance} = useERC20WagmiBalances("ExchangeButton", tokenContract?.address);

  const insufficientSellAmount = () => {
    let noTradingAmount:boolean = false;
    try {
      noTradingAmount = ( exchangeContext.tradeData.sellAmount.toString() === "0" )
    } catch(err:any) {
      console.debug(`ERROR: ExchangeButton.insufficientSellAmount: ${err.message}`)
    }
    return noTradingAmount;
  }

  const insufficientSellBalance = () => {
    let insufficientBalance:boolean = false;
     try {
      // console.debug(`EXCHANGE_BUTTON.exchangeContext = \n${stringifyBigInt(exchangeContext)}`);
      const tradeAmount = exchangeContext.tradeData.sellAmount;
      const tradeBalance = balance || BigInt(0);
      insufficientBalance = tradeBalance <  tradeAmount

      console.debug(`CustomConnectButton.insufficientBalance: sellBalanceOf = "${tradeBalance}"`);
      console.debug(`tradeAmount             = "${tradeAmount}"`);
      console.debug(`tradeBalance            = "${tradeBalance}"`);
      console.debug(`insufficientBalance     = "${insufficientBalance}"`);

    } catch(err:any) {
      console.debug(`ERROR: ExchangeButton.insufficientSellBalance: ${err.message}`)
    }
    return insufficientBalance;
  }

  const show = () => {
    // alert(`ExchangeButton:show exchangeContext = ${stringifyBigInt(exchangeContext)}`);
    console.log(`ExchangeButton:show exchangeContext = ${stringifyBigInt(exchangeContext)}`);
  }

  const getButtonType = () => {
    let buttonType:BUTTON_TYPE = 
    isLoadingPrice ? BUTTON_TYPE.IS_LOADING_PRICE : 
    insufficientSellAmount() ? BUTTON_TYPE.ZERO_AMOUNT : 
    insufficientSellBalance() ? BUTTON_TYPE.INSUFFICIENT_BALANCE :
      BUTTON_TYPE.SWAP;
    return buttonType;
  }
  const getSwapType = () => {
    return exchangeContext.tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
    "EXACT OUT SWAP" : "EXACT IN SWAP";
  }

  const getButtonText = (buttonType: BUTTON_TYPE) => {
    switch(buttonType) {
      case BUTTON_TYPE.IS_LOADING_PRICE:
        return "Fetching the best price...";
      case BUTTON_TYPE.ZERO_AMOUNT: 
        return "Enter an Amount";
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return `Insufficient ${exchangeContext.sellTokenContract?.symbol} Balance`;
      case BUTTON_TYPE.SWAP:
        return exchangeContext.tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
        "EXACT OUT SWAP" : "EXACT IN SWAP";
      default:
        return "Button Type Undefined";
    }
  }

  const getButtonColor = (buttonType: BUTTON_TYPE) => {
    switch(buttonType) {
      case BUTTON_TYPE.IS_LOADING_PRICE:
      case BUTTON_TYPE.ZERO_AMOUNT: 
        return "standardColor";
      case BUTTON_TYPE.SWAP:
        return "executeColor";
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
      default:
        return "errorColor";
    }
  }

  const buttonClick = () => {
    let buttonType:any = getButtonType()
    switch(buttonType) {
      case BUTTON_TYPE.ZERO_AMOUNT: alert("Enter An Amount");
        break;
      case BUTTON_TYPE.INSUFFICIENT_BALANCE: alert("Insufficient Sell Balance");
        break;
      case BUTTON_TYPE.SWAP: swap();
        break;
      default: alert("Button Type Undefined");
        break;
    }
    show();
  }

  const swap = () => {
    alert("Doing the Swap");
  }

  const  buttonColor = "errorColor"
  const buttonType:BUTTON_TYPE = getButtonType()

  return (
    <div>
      <button
        onClick={buttonClick}
        // disabled={true}
        type="button"
        className={styles["exchangeButton"] + " " + styles[getButtonColor(buttonType)]}>
        {getButtonText(buttonType)}
      </button>
    </div>
  )
}

export default ExchangeButton