'use client';

import styles from '@/styles/Exchange.module.css';
import { CONTAINER_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';

import { MainSwapView, ErrorView } from '@/components/views';
import RecipientSelectPanel from '@/components/containers/AssetSelectPanels/RecipientSelectPanel';
import TokenSelectPanel from '@/components/containers/AssetSelectPanels/TokenSelectPanel';
import SponsorRateConfig from '@/components/containers/SponsorRateConfig';

import { useDisplayStateCorrection } from '@/lib/hooks/useDisplayStateCorrection';
import { useSwapDirectionEffect } from '@/lib/hooks/useSwapDirectionEffect';
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  getActiveDisplayString,
  isErrorDisplay,
  isTradingStationPanel,
} from '@/lib/context/helpers/activeDisplayHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_VIEW === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay } = exchangeContext.settings;

  useDisplayStateCorrection();
  useSwapDirectionEffect();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  const isError = isErrorDisplay(activeDisplay);
  const isSwap = isTradingStationPanel(activeDisplay);

  debugLog.log('🧪 PriceView DisplayState Check', {
    activeDisplay,
    stringValue: getActiveDisplayString(activeDisplay),
    isError,
    isSwap,
  });

  return (
    <div className={styles.pageWrap}>
      {isError ? (
        <>
          {debugLog.log('🟥 PriceView → Showing ErrorView')}
          <ErrorView />
        </>
      ) : isSwap ? (
        <>
          {debugLog.log('🟩 PriceView → Showing MainSwapView')}
          <MainSwapView />
        </>
      ) : activeDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER ? (
        <>
          {debugLog.log('📦 PriceView → Showing RecipientSelectPanel')}
          <RecipientSelectPanel />
        </>
) : activeDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER ? (
  <>
    {debugLog.log('📦 PriceView → Showing TokenSelectPanel')}
    <TokenSelectPanel containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
  </>
) : activeDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG ? (
  <>
    {debugLog.log('⚙️ PriceView → Showing SponsorRateConfig')}
    <SponsorRateConfig />
  </>

      ) : (
        <>
          {debugLog.warn('⚠️ PriceView → Unknown display, showing nothing')}
          {/* ⏪ Uncomment this to fallback only to MainSwapView:
          <MainSwapView />
          */}
        </>
      )}
    </div>
  );
}
