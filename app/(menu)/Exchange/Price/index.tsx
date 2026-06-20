// File: app/(menu)/Exchange/Price/index.tsx
'use client';

import MeritWalletComponent from '@/components/views/MeritWalletComponent';

import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

export default function PriceView() {
  // UX-relevant side effects
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className="flex items-center justify-center p-4">
      <MeritWalletComponent />
    </div>
  );
}
