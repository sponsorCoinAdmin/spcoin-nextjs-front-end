'use client';

import { useEffect, useState, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDown } from 'lucide-react';
import * as React from 'react';
import { useBuyTokenContract, useSellTokenContract, useSpCoinDisplay } from '@/lib/context/contextHooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';

let sharedState = false;
let subscribers: ((val: boolean) => void)[] = [];

export function useBuySellSwap(): [boolean, (val: boolean) => void] {
  const [value, setValue] = useState(sharedState);

  useEffect(() => {
    const cb = setValue;
    subscribers.push(cb);

    return () => {
      const i = subscribers.indexOf(cb);
      if (i !== -1) subscribers.splice(i, 1);
    };
  }, []);

  const updateState = (val: boolean) => {
    sharedState = val;
    subscribers.forEach((cb) => cb(sharedState));
  };

  return [value, updateState];
}

// ✅ New: watch for both tokens to resolve after swap
export function useSyncSpCoinDisplay() {
  const [buyTokenContract] = useBuyTokenContract();
  const [sellTokenContract] = useSellTokenContract();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const prevBuy = useRef(buyTokenContract);
  const prevSell = useRef(sellTokenContract);

  useEffect(() => {
    const buyChanged = prevBuy.current?.address !== buyTokenContract?.address;
    const sellChanged = prevSell.current?.address !== sellTokenContract?.address;

    if (!buyTokenContract || !sellTokenContract) return;
    if (!buyChanged && !sellChanged) return;

    const isSellSp = isSpCoin(sellTokenContract);
    const isBuySp = isSpCoin(buyTokenContract);

    let next = SP_COIN_DISPLAY.OFF;
    if (isSellSp) next = SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON;
    else if (isBuySp) next = SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON;

    if (next !== spCoinDisplay) {
      console.debug(`🔁 spCoinDisplay change (finalized): ${spCoinDisplay} → ${next}`);
      setSpCoinDisplay(next);
    }

    prevBuy.current = buyTokenContract;
    prevSell.current = sellTokenContract;
  }, [buyTokenContract, sellTokenContract]);
}

const BuySellSwapArrowButton = () => {
  const [, setSwapTriggered] = useBuySellSwap();

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setSwapTriggered(true);
  };

  return (
    <div className={styles.switchButton}>
      <ArrowDown
        size={20}
        className={styles.switchArrow}
        onClick={handleClick}
      />
    </div>
  );
};

export default BuySellSwapArrowButton;
