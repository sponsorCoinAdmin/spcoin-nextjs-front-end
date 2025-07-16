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

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_VIEW === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const { errorDisplay, spCoinDisplay } = exchangeContext.settings;

  useDisplayStateCorrection();
  useSwapDirectionEffect();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className={styles.pageWrap}>
      {(() => {
        debugLog.log('🧪 PriceView DisplayState Check', {
          errorDisplay,
          spCoinDisplay,
          stringValues: {
            errorDisplay: JSON.stringify(errorDisplay),
            spCoinDisplay: JSON.stringify(spCoinDisplay),
          },
          comparisons: {
            isError: errorDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE,
            isSwap: spCoinDisplay === SP_COIN_DISPLAY.TRADING_STATION_PANEL,
          },
        });

        debugLog.log('🟩 Price Showing MainSwapView');
        return <MainSwapView />;
      })()}
    </div>
  );
}
