// File: components/views/MainTradingPanel.tsx

'use client';

import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';
import { TokenSelectPanel } from '../containers/AssetSelectScrollPanels';

import {
  useActiveDisplay,
  useSellTokenContract,
  useBuyTokenContract,
  useErrorMessage,
} from '@/lib/context/hooks';

import {
  SP_COIN_DISPLAY,
  STATUS,
  TokenContract,
  ErrorMessage,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();
  const [_, setSellTokenContract] = useSellTokenContract();
  const [__, setBuyTokenContract] = useBuyTokenContract();
  const [___, setErrorMessage] = useErrorMessage();

  const isTokenScrollPanel =
    activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ||
    activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL;

  const isErrorMessagePanel = activeDisplay === SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;

  debugLog.log(`🔍 MainTradingPanel render triggered`);
  debugLog.log(`🧩 Current activeDisplay = ${getActiveDisplayString(activeDisplay)}`);
  debugLog.log(`💬 isTokenScrollPanel = ${isTokenScrollPanel}, isErrorMessagePanel = ${isErrorMessagePanel}`);

  // ✅ closeCallback
  function closeCallback(fromUser: boolean) {
    debugLog.log(`🛑 closeCallback called (fromUser=${fromUser}) → switching to TRADING_STATION_PANEL`);
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }

  // ✅ setTradingTokenCallback
  function setTradingTokenCallback(tokenContract: TokenContract) {
    if (activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
      debugLog.log('🔻 setTradingTokenCallback → setSellTokenContract');
      setSellTokenContract(tokenContract);
    } else if (activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) {
      debugLog.log('🔺 setTradingTokenCallback → setBuyTokenContract');
      setBuyTokenContract(tokenContract);
    } else {
      debugLog.warn('⚠️ setTradingTokenCallback → no matching panel, skipping');
    }
  }

  // ✅ setErrorCallback
  function setErrorCallback(
    errorMsg: string,
    source: string = 'MainTradingPanel',
    errCode: number = 500
  ): ErrorMessage {
    const errorObj: ErrorMessage = {
      errCode,
      msg: errorMsg,
      source,
      status: STATUS.FAILED,
    };
    debugLog.error(`🚨 setErrorCallback → ${JSON.stringify(errorObj)}`);
    setErrorMessage(errorObj);
    setActiveDisplay(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
    return errorObj;
  }

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader containerType={activeDisplay} />
        <TradingStationPanel />
        <TokenSelectPanel
          isActive={isTokenScrollPanel}
          closeCallback={closeCallback}
          setTradingTokenCallback={setTradingTokenCallback}
          setErrorCallback={setErrorCallback}
        />
        <ErrorMessagePanel
          isActive={isErrorMessagePanel}
          closeCallback={closeCallback}
        />
        {/* <SponsorRateConfigPanel /> */}
      </div>
    </div>
  );
}
