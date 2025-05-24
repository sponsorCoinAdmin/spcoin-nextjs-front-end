'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDown } from 'lucide-react';
import React from 'react';

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
