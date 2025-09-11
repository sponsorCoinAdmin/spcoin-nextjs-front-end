// File: components/panes/MainTradingPanel.tsx
'use client';

import { useMemo, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';

import {
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
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { TokenSelectPanel, RecipientSelectPanel } from '../containers/AssetSelectPanels';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  // Tree-driven visibility
  const { isVisible, openOverlay, closeOverlays, isTokenScrollVisible } = usePanelTree();

  // Current selections (needed to derive peerAddress)
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const [___, setErrorMessage] = useErrorMessage();

  // Access provider setters for recipient selection
  const { setRecipientAccount } = useExchangeContext();

  const isTradingStationVisible = isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const isRecipientPanel = isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
  const isErrorMessagePanel = isVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);

  // Derive the opposing address for the open token panel
  const peerAddress = useMemo(() => {
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL)) {
      return sellTokenContract?.address;
    }
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL)) {
      return buyTokenContract?.address;
    }
    return undefined;
  }, [
    isVisible,
    sellTokenContract?.address,
    buyTokenContract?.address,
  ]);

  debugLog.log(`🔍 MainTradingPanel render`);
  debugLog.log(
    `💬 isTradingStationVisible=${isTradingStationVisible}, isTokenScrollPanel=${isTokenScrollVisible}, isRecipientPanel=${isRecipientPanel}, isErrorMessagePanel=${isErrorMessagePanel}, peerAddress=${peerAddress ?? 'none'}`
  );

  const closePanelCallback = useCallback(() => {
    debugLog.log('🛑 closePanelCallback → closeOverlays (show trading)');
    closeOverlays();
  }, [closeOverlays]);

  const setAssetTokenCallback = useCallback(
    (tokenContract: TokenContract) => {
      let msg = `✅ MainTradingPanel.setAssetTokenCallback`;
      if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL)) {
        msg += ' 🔻 → setSellTokenContract';
        setSellTokenContract(tokenContract);
      } else if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL)) {
        msg += ' 🔺 → setBuyTokenContract';
        setBuyTokenContract(tokenContract);
      } else {
        msg += ' ⚠️ → no matching panel, skipping';
      }
      msg += `\n🔍 tokenContract → ${stringifyBigInt(tokenContract)}`;
      debugLog.log(msg);

      // Close overlays after selection
      closeOverlays();
    },
    [isVisible, setSellTokenContract, setBuyTokenContract, closeOverlays]
  );

  // When a recipient is picked from the RecipientSelectPanel
  const setRecipientFromPanel = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const isWalletAccount = asset && typeof (asset as any).type === 'string';

      debugLog.log(`👤 setRecipientFromPanel called; isWalletAccount=${isWalletAccount}`);

      if (isWalletAccount) {
        setRecipientAccount(asset as WalletAccount);
      } else {
        debugLog.warn('setRecipientFromPanel received a TokenContract; ignoring for recipient.');
      }

      // Close overlays after selection
      closeOverlays();
    },
    [setRecipientAccount, closeOverlays]
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

      // Open error overlay (radio behavior)
      openOverlay(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
      return errorObj;
    },
    [setErrorMessage, openOverlay]
  );

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader closePanelCallback={closePanelCallback} />

        {/* Trading Station (now gated by tree visibility) */}
        {isTradingStationVisible && <TradingStationPanel />}

        {/* Token selection (sell/buy) */}
        <TokenSelectPanel
          isActive={isTokenScrollVisible}
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
