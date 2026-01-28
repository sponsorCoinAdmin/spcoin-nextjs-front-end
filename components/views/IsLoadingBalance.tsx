// File: @/components/views/IsLoadingBalance

import React from 'react';
import styles from '@/styles/Exchange.module.css';

type Props = {
    isLoadingBalance: boolean
  }

const IsLoadingBalance = ({isLoadingBalance}:Props) => {
  return (
    <div className={styles["agentRateFee"]}>
        {isLoadingBalance && (<div className="text-center mt-2">Fetching the best Balance...</div>)}
    </div>

  );
}

export default IsLoadingBalance;
