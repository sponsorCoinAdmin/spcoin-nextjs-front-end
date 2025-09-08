// File: components/panes/MainTradingPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';

import {
  useActiveDisplay,
  useSellTokenContract,
  useBuyTokenContract,
  useErrorMessage,
  useExchangeContext,
} from '@/lib/context/hooks';

import {
  SP_COIN_DISPLAY,
  STATUS,
  TokenContract,
  ErrorMessage,
  WalletAccount,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { TokenSelectPanel, RecipientSelectPanel } from '../containers/AssetSelectPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  // Current selections (needed to derive peerAddress)
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const [___, setErrorMessage] = useErrorMessage();

  // Access provider setters for recipient selection
  const { setRecipientAccount } = useExchangeContext();

  const isTokenScrollPanel = useMemo(
    () =>
      activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ||
      activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,
    [activeDisplay]
  );

  const isRecipientPanel = useMemo(
    () => activeDisplay === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
    [activeDisplay]
  );

  const isErrorMessagePanel = useMemo(
    () => activeDisplay === SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
    [activeDisplay]
  );

  // Derive the opposing address for the open panel
  const peerAddress = useMemo(() => {
    if (activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) {
      return sellTokenContract?.address;
    }
    if (activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
      return buyTokenContract?.address;
    }
    return undefined;
  }, [activeDisplay, sellTokenContract?.address, buyTokenContract?.address]);

  debugLog.log(`🔍 MainTradingPanel render`);
  debugLog.log(`🧩 activeDisplay = ${getActiveDisplayString(activeDisplay)}`);
  debugLog.log(
    `💬 isTokenScrollPanel=${isTokenScrollPanel}, isRecipientPanel=${isRecipientPanel}, isErrorMessagePanel=${isErrorMessagePanel}, peerAddress=${peerAddress ?? 'none'}`
  );

  const closePanelCallback = useCallback(() => {
    debugLog.log(
      `🛑 closePanelCallback called source=${SP_COIN_DISPLAY[activeDisplay]} → switching to TRADING_STATION_PANEL`
    );
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [activeDisplay, setActiveDisplay]);

  const setAssetTokenCallback = useCallback(
    (tokenContract: TokenContract) => {
      let msg = `✅ MainTradingPanel.setAssetTokenCallback`;
      if (activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
        msg += ' 🔻 → setSellTokenContract';
        setSellTokenContract(tokenContract);
      } else if (activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) {
        msg += ' 🔺 → setBuyTokenContract';
        setBuyTokenContract(tokenContract);
      } else {
        msg += ' ⚠️ → no matching panel, skipping';
      }
      msg += `\n🔍 tokenContract → ${stringifyBigInt(tokenContract)}`;
      debugLog.log(msg);
    },
    [activeDisplay, setSellTokenContract, setBuyTokenContract]
  );

  // When a recipient is picked from the RecipientSelectPanel
  const setRecipientFromPanel = useCallback(
    (asset: TokenContract | WalletAccount) => {
      // Heuristic: WalletAccount has a "type" field in your types; TokenContract doesn't.
      const isWalletAccount =
        asset && typeof (asset as any).type === 'string';

      debugLog.log(
        `👤 setRecipientFromPanel called; isWalletAccount=${isWalletAccount}`
      );

      if (isWalletAccount) {
        setRecipientAccount(asset as WalletAccount);
      } else {
        debugLog.warn('setRecipientFromPanel received a TokenContract; ignoring for recipient.');
      }

      setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    },
    [setRecipientAccount, setActiveDisplay]
  );

  const setErrorCallback = useCallback(
    (errorMsg: string, source: string = 'MainTradingPanel', errCode: number = 500): ErrorMessage => {
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
    },
    [setErrorMessage, setActiveDisplay]
  );

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader closePanelCallback={closePanelCallback} />
        <TradingStationPanel />

        {/* Token selection (sell/buy) */}
        <TokenSelectPanel
          isActive={isTokenScrollPanel}
          closePanelCallback={closePanelCallback}
          setTradingTokenCallback={setAssetTokenCallback}
          /** 👇 provide the opposing address so duplicate check works */
          peerAddress={peerAddress}
        />

        {/* Recipient selection panel */}
        <RecipientSelectPanel
          isActive={isRecipientPanel}
          closePanelCallback={closePanelCallback}
          setTradingTokenCallback={setRecipientFromPanel}
        />

        {/* Error panel */}
        <ErrorMessagePanel isActive={isErrorMessagePanel} />
      </div>
    </div>
  );
}
