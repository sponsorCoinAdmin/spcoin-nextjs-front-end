// File: app/(menu)/Exchange/Price/index.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { useExchangeContext } from '@/lib/context/hooks';

import { MainTradingPanel } from '@/components/views';

// Removed: useDisplayStateCorrection (redundant after sanitize + enum coercion)
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { useSwapTokens } from '@/lib/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_VIEW === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay } = exchangeContext.settings;

  // keep side-effects that matter for UX
  useSwapTokens();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  debugLog.log('🧪 PriceView DisplayState Check', {
    activeDisplay,
    stringValue: getActiveDisplayString(activeDisplay),
  });

  return (
    <div className={styles.pageWrap}>
      <MainTradingPanel />
    </div>
  );
}
