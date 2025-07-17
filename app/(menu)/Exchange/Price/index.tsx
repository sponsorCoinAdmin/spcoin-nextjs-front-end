'use client';

import styles from '@/styles/Exchange.module.css';
import { useExchangeContext } from '@/lib/context/hooks';

import { TradingStationPanel, ErrorMessagePanel } from '@/components/views';
import SponsorRateConfigPanel from '@/components/containers/SponsorRateConfigPanel';

import { useDisplayStateCorrection } from '@/lib/hooks/useDisplayStateCorrection';
import { useSwapDirectionEffect } from '@/lib/hooks/useSwapDirectionEffect';
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

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

  debugLog.log('🧪 PriceView DisplayState Check', {
    activeDisplay,
    stringValue: getActiveDisplayString(activeDisplay),
  });

  return (
    <div className={styles.pageWrap}>
      <TradingStationPanel />
      <ErrorMessagePanel />
      <SponsorRateConfigPanel />
    </div>
  );
}
