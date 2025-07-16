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

import {
  getActiveDisplayString,
  isActiveMainPanel,
  isActiveScrollPanel,
  isActiveErrorPanel,
} from '@/lib/context/helpers/activeDisplayHelpers';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_VIEW === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay, errorDisplay, spCoinDisplay } = exchangeContext.settings;

  useDisplayStateCorrection();
  useSwapDirectionEffect();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  const activeDisplayStr = getActiveDisplayString(activeDisplay);

  debugLog.log('🧪 PriceView DisplayState Check', {
    activeDisplay,
    activeDisplayStr,
    legacy: {
      errorDisplay,
      spCoinDisplay,
      errorDisplayStr: SP_COIN_DISPLAY[errorDisplay],
      spCoinDisplayStr: SP_COIN_DISPLAY[spCoinDisplay],
    },
    comparisons: {
      isError: isActiveErrorPanel(activeDisplay),
      isSwap: isActiveMainPanel(activeDisplay),
      isScrollPanel: isActiveScrollPanel(activeDisplay),
    },
  });

  return (
    <div className={styles.pageWrap}>
      {(() => {
        if (isActiveErrorPanel(activeDisplay)) {
          debugLog.log('🟥 Price Showing ErrorView');
          return <ErrorView />;
        }

        if (isActiveScrollPanel(activeDisplay)) {
          debugLog.log('🟦 Price Showing ScrollPanel (hooked elsewhere)');
          return null; // scroll panels are handled in other components, so no main render here
        }

        if (isActiveMainPanel(activeDisplay)) {
          debugLog.log('🟩 Price Showing MainSwapView');
          return <MainSwapView />;
        }

        debugLog.warn('⚠️ Unknown activeDisplay, falling back to MainSwapView');
        return <MainSwapView />;
      })()}
    </div>
  );
}
