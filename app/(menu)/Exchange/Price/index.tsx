// File: app/(menu)/Exchange/Price/index.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { useExchangeContext } from '@/lib/context/hooks';

import { MainTradingPanel } from '@/components/views';

// Removed: useDisplayStateCorrection (redundant after sanitize + enum coercion)
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_VIEW === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();

  // keep side-effects that matter for UX
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className={styles.pageWrap}>
      <MainTradingPanel />
    </div>
  );
}
