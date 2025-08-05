// File: components/views/MainTradingPanel.tsx

'use client';

import { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';
import { TokenSelectPanel } from '@/components/containers/AssetSelectScrollPanels';

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
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

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

  // 🔍 Detect Strict Mode mount/unmount
  useEffect(() => {
    console.log('🟢 MainTradingPanel mounted');
    return () => {
      console.log('🔴 MainTradingPanel unmounted');
    };
  }, []);

  // 📌 TRACE when TokenSelectPanel will render
  if (isTokenScrollPanel) {
    debugLog.log('🔁 [TRACE] TokenSelectPanel render triggered');
  }

  debugLog.log(`🔍 MainTradingPanel render triggered`);
  debugLog.log(`🧩 Current activeDisplay = ${getActiveDisplayString(activeDisplay)}`);
  debugLog.log(`💬 isTokenScrollPanel = ${isTokenScrollPanel}, isErrorMessagePanel = ${isErrorMessagePanel}`);

  function closeCallback() {
    debugLog.log(`🛑 closeCallback called source=${SP_COIN_DISPLAY[activeDisplay]} → switching to TRADING_STATION_PANEL`);
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }

  function setAssetTokenCallback(tokenContract: TokenContract) {
    let msg = `✅ setAssetTokenCallback`;
    if (activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
      msg += '🔻 → setSellTokenContract';
      setSellTokenContract(tokenContract);
    } else if (activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) {
      msg += '🔺 → setBuyTokenContract';
      setBuyTokenContract(tokenContract);
    } else {
      msg += '⚠️ → no matching panel, skipping';
    }
    msg += `\n🔍 tokenContract → ${stringifyBigInt(tokenContract)}`;
    debugLog.log(msg);
  }

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
        <TradeContainerHeader closeCallback={closeCallback} />
        <TradingStationPanel />
        <TokenSelectPanel
          isActive={isTokenScrollPanel}
          closeCallback={closeCallback}
          setTradingTokenCallback={setAssetTokenCallback}
        />
        <ErrorMessagePanel
          isActive={isErrorMessagePanel}
          closeCallback={closeCallback}
        />
      </div>
    </div>
  );
}
