// File: components/views/MainSwapView.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import {
  CONTAINER_TYPE,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { TokenSelectPanel } from '../containers/AssetSelectPanels';

import {
  SellTokenPanelProvider,
  BuyTokenPanelProvider,
  TokenPanelProvider,
} from '@/lib/context/TradePanelProviders';


import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SharedPanelProvider } from '@/lib/context/ScrollSelectPanels/SharedPanelProvider';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainSwapView', DEBUG_ENABLED, LOG_TIME);

export default function MainSwapView() {
  const { exchangeContext } = useExchangeContext();
  const { assetSelectScrollDisplay } = exchangeContext.settings;

  debugLog.log(`🔍 MainSwapView render triggered`);
  debugLog.log(`🧩 Current assetSelectScrollDisplay = ${assetSelectScrollDisplay}`);
  debugLog.log(`🏂 Enum Comparisons:`, {
    SHOW_TOKEN_SCROLL_CONTAINER: SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER,
    SHOW_RECIPIENT_SCROLL_CONTAINER: SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER,
    DISPLAY_OFF: SP_COIN_DISPLAY.DISPLAY_OFF,
    isTokenPanel: assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER,
    isRecipientPanel: assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER,
    isOff: assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF,
  });

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  return (
    <div id="MainPage_ID">
      <div id="MainSwapContainer_ID" className={styles.mainSwapContainer}>
        <TradeContainerHeader />

        {/* ✅ Add SharedPanelProvider around both to satisfy old hooks */}
        <SharedPanelProvider>
          <TokenPanelProvider>
            <SellTokenPanelProvider>
              <TokenSelectPanel containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
            </SellTokenPanelProvider>
          </TokenPanelProvider>

          <TokenPanelProvider>
            <BuyTokenPanelProvider>
              <TokenSelectPanel containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER} />
            </BuyTokenPanelProvider>
          </TokenPanelProvider>
        </SharedPanelProvider>

        <BuySellSwapArrowButton />
        <PriceButton isLoadingPrice={isLoadingPrice} />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </div>
  );
}
