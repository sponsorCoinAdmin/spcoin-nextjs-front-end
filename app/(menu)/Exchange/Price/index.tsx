// File: app/(menu)/Exchange/Price/index.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';

import { ScrollPanelView, MainSwapView, ErrorView } from '@/components/views';

import { useDisplayStateCorrection } from '@/lib/hooks/useDisplayStateCorrection';
import { useSwapDirectionEffect } from '@/lib/hooks/useSwapDirectionEffect';
import { usePriceErrorEffect } from '@/lib/hooks/usePriceErrorEffect';
import { useResetAmountsOnTokenChange } from '@/lib/hooks/useResetAmountsOnTokenChange';

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const { errorDisplay, assetSelectScrollDisplay, spCoinDisplay } = exchangeContext.settings;

  useDisplayStateCorrection();
  useSwapDirectionEffect();
  usePriceErrorEffect();
  useResetAmountsOnTokenChange();

  return (
    <div className={styles.pageWrap}>
      {errorDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE ? 
        (<ErrorView />)                                               /* SHOW ERROR PANEL */
        : assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF ? 
        (<ScrollPanelView />)                                         /* SHOW SELECTION SCROLL */
        : (<MainSwapView />)                                          /* SHOW SWAP PANEL */
      }
    </div>
  );
}
