'use client'

import styles from '@/styles/Exchange.module.css';
import {
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount
} from '@/lib/context/hooks';
import {
  BUTTON_TYPE,
  STATUS,
  TRADE_DIRECTION,
  TokenContract,
  TradeData,
  ExchangeContext
} from '@/lib/structure';
import swap from '@/lib/spCoin/swap';
import {
  isActiveAccountBuyToken,
  isActiveAccountSellToken,
} from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_BUTTON === 'true';
const debugLog = createDebugLogger('ExchangeButton', DEBUG_ENABLED, LOG_TIME);

type Props = {
  isLoadingPrice: boolean;
};

const ExchangeButton = ({ isLoadingPrice }: Props) => {
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;
  const [sellAmount] = useSellAmount();
  const [buyAmount] = useBuyAmount();
  const [errorMessage] = useErrorMessage();

  const tokenContract: TokenContract | undefined = tradeData.sellTokenContract;
  const tradeDirection =
    tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
      ? 'EXACT OUT '
      : 'EXACT IN ';

  const buttonTypeString = (type: BUTTON_TYPE): string => BUTTON_TYPE[type];

  const getSwapTypeInfo = (exchangeContext: ExchangeContext) => {
    const buyTokenContract = tradeData.buyTokenContract;
    const sellTokenContract = tradeData.sellTokenContract;

    return `${tradeDirection} SWAP`;
  };

  const getButtonText = (buttonType: BUTTON_TYPE) => {
    switch (buttonType) {
      case BUTTON_TYPE.TOKENS_REQUIRED:
        return 'Select Trading Pair';
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        return 'API Transaction Error';
      case BUTTON_TYPE.IS_LOADING_PRICE:
        return 'Fetching Best Price...';
      case BUTTON_TYPE.NO_HARDHAT_API:
        return 'No Hardhat API Provisioning..';
      case BUTTON_TYPE.ZERO_AMOUNT:
        return 'Enter an Amount';
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return `Insufficient ${tradeData.sellTokenContract?.symbol} Balance`;
      case BUTTON_TYPE.SWAP:
        return getSwapTypeInfo(exchangeContext);
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return 'Sell Token Required';
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
        return 'Buy Token Required';
      default:
        return 'Button Type Undefined';
    }
  };

  const insufficientSellBalance = () => {
    try {
      const tradeAmount = sellAmount;
      const sellTradeBalance = tradeData.sellTokenContract?.balance || 0n;
      const insufficient = sellTradeBalance < tradeAmount;
      debugLog.log('Sell Balance Check', { tradeAmount, sellTradeBalance, insufficient });
      return insufficient;
    } catch (err: any) {
      debugLog.error('insufficientSellBalance Error', err.message);
      return false;
    }
  };

  const tokensRequired = () => !tradeData.sellTokenContract && !tradeData.buyTokenContract;
  const sellTokenRequired = () => !tradeData.sellTokenContract;
  const buyTokenRequired = () => !tradeData.buyTokenContract;
  const amountRequired = () => sellAmount === 0n && buyAmount === 0n;

  const getButtonType = (): BUTTON_TYPE => {
    const result =
      errorMessage?.status === STATUS.WARNING_HARDHAT
        ? BUTTON_TYPE.NO_HARDHAT_API
        : errorMessage?.status === STATUS.ERROR_API_PRICE
        ? BUTTON_TYPE.API_TRANSACTION_ERROR
        : isLoadingPrice
        ? BUTTON_TYPE.IS_LOADING_PRICE
        : tokensRequired()
        ? BUTTON_TYPE.TOKENS_REQUIRED
        : sellTokenRequired()
        ? BUTTON_TYPE.SELL_TOKEN_REQUIRED
        : buyTokenRequired()
        ? BUTTON_TYPE.BUY_TOKEN_REQUIRED
        : amountRequired()
        ? BUTTON_TYPE.ZERO_AMOUNT
        : insufficientSellBalance()
        ? BUTTON_TYPE.INSUFFICIENT_BALANCE
        : BUTTON_TYPE.SWAP;

    debugLog.log(`ExchangeButton Resolved Button Type, ${buttonTypeString(result)}`);
    return result;
  };

  const getButtonColor = (buttonType: BUTTON_TYPE | undefined) => {
    switch (buttonType) {
      case BUTTON_TYPE.SWAP:
        return 'executeColor';
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
      case BUTTON_TYPE.NO_HARDHAT_API:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return 'errorColor';
      default:
        return 'standardColor';
    }
  };

  const buttonClick = async () => {
    const currentType = getButtonType();
    debugLog.log(`Click Detected for ExchangeButton, ${buttonTypeString(currentType)}`);

    switch (currentType) {
      case BUTTON_TYPE.TOKENS_REQUIRED:
        alert('Select Buy/Sell Tokens\nFrom The Drop Down Token List');
        break;
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        alert(errorMessage?.msg);
        break;
      case BUTTON_TYPE.ZERO_AMOUNT:
        alert('Enter An Amount');
        break;
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        alert('Insufficient Sell Balance');
        break;
      case BUTTON_TYPE.NO_HARDHAT_API:
        alert('No HardHat API Provisioning');
        break;
      case BUTTON_TYPE.SWAP:
        await validateAndSwap();
        break;
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
        alert('Please select Token to Sell (Required)');
        break;
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
        alert('Please select Token to Buy (Required)');
        break;
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        alert('Select Sell Tokens\nFrom The Drop Down Token List');
        break;
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
        alert('Select Buy Tokens\nFrom The Drop Down Token List');
        break;
      default:
        alert('Button Type Undefined');
        break;
    }
  };

  const validateAndSwap = async () => {
    debugLog.log('Initiating Swap');
    swap();
  };

  const buttonType = getButtonType();

  return (
    <div id="ExchangeButtonContext">
      <button
        id="ExchangeButton"
        onClick={buttonClick}
        type="button"
        className={styles.exchangeButton + ' ' + styles[getButtonColor(buttonType)]}>
        {getButtonText(buttonType)}
      </button>
    </div>
  );
};

export default ExchangeButton;
