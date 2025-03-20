'use client'

import styles from '@/styles/Exchange.module.css'
import { useBuyAmount, useExchangeContext, useSellAmount } from "@/lib/context/contextHooks";
import { BUTTON_TYPE, ErrorMessage, ExchangeContext, STATUS, TRADE_DIRECTION, TokenContract, TradeData } from '@/lib/structure/types';
import swap from '@/lib/spCoin/swap';
import { isActiveAccountBuyToken, isWrappedBuyToken, isActiveAccountSellToken, isWrappedSellToken } from '@/lib/network/utils';

// import { stringifyBigInt } from '@sponsorcoin/spcoin-lib-es6'
type Props = {
  isLoadingPrice: boolean,
  errorMessage: ErrorMessage | undefined,
  setErrorMessage: (errorMessage: ErrorMessage | undefined) => void,
  setResetAmounts: (resetAmounts: boolean) => void,
  toggleButton: boolean
}

const ExchangeButton = ({ isLoadingPrice, errorMessage, setErrorMessage, setResetAmounts, toggleButton }: Props) => {
  // ✅ Use useExchangeContext() instead of direct reference
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  
  const tokenContract: TokenContract | undefined = tradeData.sellTokenContract as TokenContract | undefined;
  let buttonType: BUTTON_TYPE = BUTTON_TYPE.UNDEFINED;
  const transactionType: string = tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT ?
    "EXACT OUT " : "EXACT IN "

  // ✅ Set the button type dynamically
  const setButtonType = (_buttonType: BUTTON_TYPE): BUTTON_TYPE => {
    buttonType = _buttonType;
    return buttonType;
  }

  // ✅ Determine the swap type text
  const getSwapTypeInfo = (exchangeContext:ExchangeContext) => {
    const buyTokenContract = tradeData.buyTokenContract;
    const sellTokenContract = tradeData.sellTokenContract;
  
    if (isActiveAccountSellToken(exchangeContext)) {
      return isWrappedBuyToken(tradeData)
        ? "SWAP WRAP ( ETH -> WETH )"
        : `${transactionType} ( WRAP ETH -> WETH ) -> ${buyTokenContract?.symbol}`;
    }
  
    if (isActiveAccountBuyToken(exchangeContext)) {
      return isWrappedSellToken(tradeData)
        ? "SWAP UN-WRAP\n( WETH -> ETH )"
        : `${transactionType} ${sellTokenContract?.symbol} -> ( WETH -> ETH )`;
    }
  
    return `${transactionType} SWAP`;
  };
  
  // ✅ Button text based on state
  const getButtonText = (buttonType: BUTTON_TYPE) => {
    switch (buttonType) {
      case BUTTON_TYPE.TOKENS_REQUIRED:
        return "Select Trading Pair";
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        return "API Transaction Error";
      case BUTTON_TYPE.IS_LOADING_PRICE:
        return "Fetching Best Price...";
      case BUTTON_TYPE.NO_HARDHAT_API:
        return "No Hardhat API Provisioning..";
      case BUTTON_TYPE.ZERO_AMOUNT:
        return "Enter an Amount";
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return `Insufficient ${tradeData.sellTokenContract?.symbol} Balance`;
      case BUTTON_TYPE.SWAP: return getSwapTypeInfo(exchangeContext);
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return "Sell Token Required";
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
        return "Buy Token Required";
      default:
        return "Button Type Undefined";
    }
  }

  // ✅ Check if the sell balance is sufficient
  const insufficientSellBalance = () => {
    let insufficientBalance: boolean = false;
    try {
      const tradeAmount = sellAmount;
      const sellTradeBalance = tradeData.sellTokenContract?.balance || 0n;
      insufficientBalance = sellTradeBalance < tradeAmount;

      console.debug(`CustomConnectButton.insufficientBalance: sellBalanceOf = "${sellTradeBalance}"`);
      console.debug(`tradeAmount             = "${tradeAmount}"`);
      console.debug(`sellTradeBalance        = "${sellTradeBalance}"`);
      console.debug(`insufficientBalance     = "${insufficientBalance}"`);
    } catch (err: any) {
      console.debug(`ERROR: ExchangeButton.insufficientSellBalance: ${err.message}`)
    }
    return insufficientBalance;
  }

  // ✅ Helper functions to check token requirements
  const tokensRequired = (): boolean => {
    return sellTokenRequired() && buyTokenRequired()
  }

  const sellTokenRequired = (): boolean => {
    return !(tradeData.sellTokenContract)
  }

  const buyTokenRequired = (): boolean => {
    return !(tradeData.buyTokenContract)
  }

  const amountRequired = (): boolean => {
    return sellAmount === 0n && buyAmount === 0n
  }

  // ✅ Determine the button type dynamically
  const getButtonType = (): BUTTON_TYPE => {
    return (
      errorMessage?.status === STATUS.WARNING_HARDHAT ? BUTTON_TYPE.NO_HARDHAT_API :
        errorMessage?.status === STATUS.ERROR_API_PRICE ? BUTTON_TYPE.API_TRANSACTION_ERROR :
          isLoadingPrice ? BUTTON_TYPE.IS_LOADING_PRICE :
            tokensRequired() ? BUTTON_TYPE.TOKENS_REQUIRED :
              sellTokenRequired() ? BUTTON_TYPE.SELL_TOKEN_REQUIRED :
                buyTokenRequired() ? BUTTON_TYPE.BUY_TOKEN_REQUIRED :
                  amountRequired() ? BUTTON_TYPE.ZERO_AMOUNT :
                    insufficientSellBalance() ? BUTTON_TYPE.INSUFFICIENT_BALANCE :
                      BUTTON_TYPE.SWAP)
  }

  // ✅ Get button color based on state
  const getButtonColor = (buttonType: BUTTON_TYPE | undefined) => {
    switch (buttonType) {
      case BUTTON_TYPE.SWAP:
        return "executeColor";
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
      case BUTTON_TYPE.NO_HARDHAT_API:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return "errorColor";
      case BUTTON_TYPE.TOKENS_REQUIRED:
      case BUTTON_TYPE.IS_LOADING_PRICE:
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
      case BUTTON_TYPE.ZERO_AMOUNT:
      default:
        return "standardColor";
    }
  }

  // ✅ Handle button clicks based on type
  const buttonClick = async () => {
    let buttonType: any = getButtonType()
    switch (buttonType) {
      case BUTTON_TYPE.TOKENS_REQUIRED: alert(`Select Buy/Sell Tokens\nFrom The Drop Down Token List`)
        break;
      case BUTTON_TYPE.API_TRANSACTION_ERROR: alert(errorMessage?.msg);
        break;
      case BUTTON_TYPE.ZERO_AMOUNT: alert("Enter An Amount");
        break;
      case BUTTON_TYPE.INSUFFICIENT_BALANCE: alert("Insufficient Sell Balance");
        break;
      case BUTTON_TYPE.NO_HARDHAT_API: alert("No HardHat API Provisioning");
        break;
      case BUTTON_TYPE.SWAP: await validateAndSwap();
        break;
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED: alert("Please select Token to Sell (Required)");
        break;
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED: alert("Please select Token to Buy (Required)");
        break;
      case BUTTON_TYPE.SELL_ERROR_REQUIRED: alert(`Select Sell Tokens\nFrom The Drop Down Token List`)
        break;
      case BUTTON_TYPE.BUY_ERROR_REQUIRED: alert(`Select Buy Tokens\nFrom The Drop Down Token List`)
        break;
      default: alert("Button Type Undefined");
        break;
    }
    // logAlert(exchangeContext);
  }

  // ✅ Validate and perform swap
  const validateAndSwap = async () => {
    swap();
    setResetAmounts(true);
  }

  setButtonType(getButtonType())

  return (
    <div>
      <button
        onClick={buttonClick}
        type="button"
        className={styles["exchangeButton"] + " " + styles[getButtonColor(buttonType)]}>
        {getButtonText(buttonType)}
      </button>
    </div>
  )
}

export default ExchangeButton;
