'use client'
import styles from '@/styles/Exchange.module.css'
import { dumpContext } from '@/lib/spCoin/utils';
import { exchangeContext } from "@/lib/context";
import { BUTTON_TYPE, ErrorMessage, ExchangeContext, STATUS, SWAP_TYPE, TRANSACTION_TYPE, TokenContract, TradeData } from '@/lib/structure/types';
import swap from '@/lib/spCoin/swap';
import { isActiveAccountAddress, isWrappedNetworkAddress } from '@/lib/network/utils';

// import { stringifyBigInt } from '@sponsorcoin/spcoin-lib-es6'

const tradeData: TradeData = exchangeContext.tradeData;
const transactionType: string = tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ?
  "EXACT OUT " : "EXACT IN "

type Props = {
  isLoadingPrice: boolean,
  errorMessage: ErrorMessage | undefined,
  setErrorMessage: (errorMessage: ErrorMessage | undefined) => void,
  setResetAmounts: (resetAmounts: boolean) => void,
  toggleButton: boolean
}

const ExchangeButton = ({ isLoadingPrice, errorMessage, setErrorMessage, setResetAmounts, toggleButton }: Props) => {
  const tokenContract: TokenContract | undefined = tradeData.sellTokenContract as TokenContract | undefined;
  // const {balance:sellBalance} = useERC20WagmiBalances("ExchangeButton", tokenContract?.address);
  let buttonType: BUTTON_TYPE = BUTTON_TYPE.UNDEFINED;

  const setButtonType = (_buttonType: BUTTON_TYPE): BUTTON_TYPE => {
    buttonType = _buttonType;
    return buttonType;
  }

  const getSwapType = () => {
    const buyTokenContract = tradeData.buyTokenContract;
    const sellTokenContract = tradeData.sellTokenContract;
    if (isActiveAccountAddress(sellTokenContract?.address))
      if (isWrappedNetworkAddress(buyTokenContract?.address))
        return "SWAP WRAP ( ETH -> WETH )"
      else
        return transactionType + `( WRAP ETH -> WETH ) -> ${buyTokenContract?.symbol}`
    else
      if (isActiveAccountAddress(buyTokenContract?.address))
        if (isWrappedNetworkAddress(sellTokenContract?.address))
          return "SWAP UN-WRAP\n( WETH -> ETH )"
        else
          return transactionType + ( `${sellTokenContract?.symbol} -> ( WETH -> ETH )` )
      else return transactionType + "SWAP"
  }

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
      case BUTTON_TYPE.SWAP: return getSwapType();
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

  const insufficientSellBalance = () => {
    let insufficientBalance: boolean = false;
    try {
      // console.debug(`EXCHANGE_BUTTON.exchangeContext = \n${stringifyBigInt(exchangeContext)}`);
      const tradeAmount = tradeData.sellAmount;
      const sellTradeBalance = tradeData.sellTokenContract?.balance || 0n;
      insufficientBalance = sellTradeBalance < tradeAmount

      console.debug(`CustomConnectButton.insufficientBalance: sellBalanceOf = "${sellTradeBalance}"`);
      console.debug(`tradeAmount             = "${tradeAmount}"`);
      console.debug(`sellTradeBalance        = "${sellTradeBalance}"`);
      console.debug(`insufficientBalance     = "${insufficientBalance}"`);

    } catch (err: any) {
      console.debug(`ERROR: ExchangeButton.insufficientSellBalance: ${err.message}`)
    }
    return insufficientBalance;
  }

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
    return tradeData.sellAmount === 0n && tradeData.buyAmount === 0n
  }

  const getButtonType = (): BUTTON_TYPE => {
    // alert(`"getButtonType()\n
    // errorMessage = ${errorMessage}\n
    // isLoadingPrice = ${isLoadingPrice}\n
    // insufficientSellAmount() = ${insufficientSellAmount()}\n
    // insufficientSellBalance() = ${insufficientSellBalance()}`)
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
    dumpContext();
  }

  const validateAndSwap = async () => {
    // if (!tradeData.sellAmount)
    //   setButtonType(BUTTON_TYPE.SELL_TOKEN_REQUIRED)
    // else if (!tradeData.buyAmount)
    //   setButtonType(BUTTON_TYPE.SELL_TOKEN_REQUIRED)
    // else
    await swap();
    setResetAmounts(true);
    // setButtonType(BUTTON_TYPE.TOKENS_REQUIRED)
  }

  setButtonType(getButtonType())
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