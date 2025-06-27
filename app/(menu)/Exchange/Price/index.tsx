'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';

import { ScrollPanelView, MainSwapView, ErrorView } from '@/components/views';

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
  const { errorDisplay, assetSelectScrollDisplay, spCoinDisplay } = exchangeContext.settings;

  useDisplayStateCorrection();
  useSwapDirectionEffect();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className={styles.pageWrap}>
      {(() => {
        debugLog.log('🧪 PriceView DisplayState Check', {
          errorDisplay,
          assetSelectScrollDisplay,
          spCoinDisplay,
          stringValues: {
            errorDisplay: JSON.stringify(errorDisplay),
            assetSelectScrollDisplay: JSON.stringify(assetSelectScrollDisplay),
            spCoinDisplay: JSON.stringify(spCoinDisplay),
          },
          comparisons: {
            isError: errorDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE,
            isScroll: assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF,
            isSwap: spCoinDisplay === SP_COIN_DISPLAY.EXCHANGE_ROOT,
          },
        });

        if (errorDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE) {
          debugLog.log('🟥 Showing ErrorView');
          return <ErrorView />;
        }

        if (assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF) {
          debugLog.log('🟦 Showing ScrollPanelView');
          return <ScrollPanelView />;
        }

        debugLog.log('🟩 Showing MainSwapView');
        return <MainSwapView />;
      })()}
    </div>
  );
}
