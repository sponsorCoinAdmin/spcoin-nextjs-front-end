// File: app/(menu)/Exchange/Price/index.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import { MainTradingPanel } from '@/components/views';

import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

export default function PriceView() {
  // UX-relevant side effects
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className={styles.pageWrap}>
      <MainTradingPanel />
    </div>
  );
}
