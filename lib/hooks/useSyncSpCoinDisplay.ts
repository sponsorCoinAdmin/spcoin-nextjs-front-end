import { useEffect, useRef } from 'react';
import { SP_COIN_DISPLAY, TokenContract } from '@/lib/structure/types';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { useSellTokenContract, useBuyTokenContract, useSpCoinDisplay } from '@/lib/context/contextHooks';

/**
 * Automatically syncs spCoinDisplay with current token state.
 */
export const useSyncSpCoinDisplay = () => {
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // Used to force initial sync even if display is "correct"
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    console.debug('🧩 [useSyncSpCoinDisplay] Running effect');
    // console.debug('   sellTokenContract:', sellTokenContract);
    // console.debug('   buyTokenContract:', buyTokenContract);

    const isSellSp = isSpCoin(sellTokenContract);
    const isBuySp = isSpCoin(buyTokenContract);

    let nextDisplay: SP_COIN_DISPLAY = SP_COIN_DISPLAY.OFF;
    if (isSellSp) nextDisplay = SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON;
    else if (isBuySp) nextDisplay = SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON;

    // console.debug('   isSellSp:', isSellSp, '→', SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON);
    // console.debug('   isBuySp:', isBuySp, '→', SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON);
    // console.debug('   current spCoinDisplay:', spCoinDisplay, '→ next:', nextDisplay);

    const shouldForceSync = !hasSyncedRef.current;
    const isChanged = spCoinDisplay !== nextDisplay;

    if (shouldForceSync || isChanged) {
      // console.debug(`🔁 spCoinDisplay update: ${spCoinDisplay} → ${nextDisplay}`);
      hasSyncedRef.current = true;
      setSpCoinDisplay(nextDisplay);
    } else {
      // console.debug('⚠️ spCoinDisplay unchanged');
    }
  }, [sellTokenContract, buyTokenContract, spCoinDisplay, setSpCoinDisplay]);
};
