// File: components/views/PriceView.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';

import { MainSwapView, ErrorView } from '@/components/views';

import { useDisplayStateCorrection } from '@/lib/hooks/useDisplayStateCorrection';
import { useSwapDirectionEffect } from '@/lib/hooks/useSwapDirectionEffect';
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString, isErrorDisplay, isTradingStationPanel } from '@/lib/context/helpers/activeDisplayHelpers';

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
      ) : (
        <>
          {debugLog.warn('⚠️ PriceView → Unknown display, showing nothing')}
        </>
      )}
    </div>
  );
}
