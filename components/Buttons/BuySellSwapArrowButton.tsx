"use client";

import { useState } from "react";
import styles from '@/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";
import * as React from 'react';

let sharedState = false;
let subscribers: ((val: boolean) => void)[] = [];

export function useBuySellSwap(): [boolean, (val: boolean) => void] {
  const [value, setValue] = useState(sharedState);

  const updateState = (val: boolean) => {
    sharedState = val;
    subscribers.forEach((cb) => cb(sharedState));
  };

  if (!subscribers.includes(setValue)) {
    subscribers.push(setValue);
  }

  return [value, updateState];
}

const BuySellSwapArrowButton = () => {
  const [, setContainerSwap] = useBuySellSwap();

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    setContainerSwap(true);
  };

  return (
    <div className={styles.switchButton}>
      <ArrowDownOutlined className={styles.switchArrow} onClick={handleClick} />
    </div>
  );
};

export default BuySellSwapArrowButton;
