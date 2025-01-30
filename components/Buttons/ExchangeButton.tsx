'use client'
import styles from '@/styles/Exchange.module.css'
import { dumpContext } from '@/lib/spCoin/utils';
import useERC20WagmiBalances from '../ERC20/useWagmiERC20Balances';
import { exchangeContext } from "@/lib/context";
import { BUTTON_TYPE, ErrorMessage, SWAP_TYPE, TRANSACTION_TYPE, TokenContract } from '@/lib/structure/types';
import { useSwapState } from '@/lib/hooks/useSwapState';
import { swap } from '@/lib/spCoin/swap';

type Props = {
  isLoadingPrice: boolean,
  errorMessage:ErrorMessage|undefined,
  setErrorMessage: (errorMessage:ErrorMessage|undefined) => void
}

const ExchangeButton = ({isLoadingPrice, errorMessage, setErrorMessage}:Props) => {
  const swapType = useSwapState();
  const tokenContract:TokenContract|undefined = exchangeContext.tradeData.sellTokenContract as TokenContract | undefined;
  const {balance:sellBalance} = useERC20WagmiBalances("ExchangeButton", tokenContract?.address);

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
      const sellTradeBalance = sellBalance || BigInt(0);
      insufficientBalance = sellTradeBalance <  tradeAmount

      console.debug(`CustomConnectButton.insufficientBalance: sellBalanceOf = "${sellTradeBalance}"`);
      console.debug(`tradeAmount             = "${tradeAmount}"`);
      console.debug(`sellTradeBalance        = "${sellTradeBalance}"`);
      console.debug(`insufficientBalance     = "${insufficientBalance}"`);

    } catch(err:any) {
      console.debug(`ERROR: ExchangeButton.insufficientSellBalance: ${err.message}`)
    }
    return insufficientBalance;
  }

  const getButtonType = () => {
    // alert(`"getButtonType()\n
    // errorMessage = ${errorMessage}\n
    // isLoadingPrice = ${isLoadingPrice}\n
    // insufficientSellAmount() = ${insufficientSellAmount()}\n
    // insufficientSellBalance() = ${insufficientSellBalance()}`)
    const buttonType = (
      errorMessage ? BUTTON_TYPE.API_TRANSACTION_ERROR :
      isLoadingPrice ? BUTTON_TYPE.IS_LOADING_PRICE : 
      insufficientSellAmount() ? BUTTON_TYPE.ZERO_AMOUNT : 
      insufficientSellBalance() ? BUTTON_TYPE.INSUFFICIENT_BALANCE :
      BUTTON_TYPE.SWAP)
    // alert(`buttonType = ${buttonType}`)
    return buttonType
  }

  const getButtonText = (buttonType: BUTTON_TYPE) => {
    switch(buttonType) {
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        return "API Transaction Error";
      case BUTTON_TYPE.IS_LOADING_PRICE:
        return "Fetching the best price...";
      case BUTTON_TYPE.ZERO_AMOUNT: 
        return "Enter an Amount";
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return `Insufficient ${exchangeContext.tradeData.sellTokenContract?.symbol} Balance`;
      case BUTTON_TYPE.SWAP:
        return exchangeContext.tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
        "EXACT OUT SWAP" : "EXACT IN SWAP";
      default:
        return "Button Type Undefined";
    }
  }

  const getButtonColor = (buttonType: BUTTON_TYPE|undefined) => {
    switch(buttonType) {
      case BUTTON_TYPE.IS_LOADING_PRICE:
      case BUTTON_TYPE.SWAP:
        return "executeColor";
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return "errorColor";
      case BUTTON_TYPE.ZERO_AMOUNT: 
      default:
        return "standardColor";
    }
  }

  const buttonClick = () => {
    let buttonType:any = getButtonType()
    switch(buttonType) {
      case BUTTON_TYPE.API_TRANSACTION_ERROR: alert(errorMessage?.msg);
        break;
      case BUTTON_TYPE.ZERO_AMOUNT: alert("Enter An Amount");
        break;
      case BUTTON_TYPE.INSUFFICIENT_BALANCE: alert("Insufficient Sell Balance");
        break;
      case BUTTON_TYPE.SWAP: swap(swapType);
        break;
      default: alert("Button Type Undefined");
        break;
    }
    dumpContext();
  }

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