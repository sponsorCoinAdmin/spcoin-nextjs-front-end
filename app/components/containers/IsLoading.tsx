import React from 'react';
import styles from '../../styles/Exchange.module.css';

type Props = {
    isLoadingPrice: boolean
  }

const IsLoading = ({isLoadingPrice} : Props) => {
  return (
    <div className={styles["agentRateFee"]}>
        {isLoadingPrice && (<div className="text-center mt-2">Fetching the best price...</div>)}
    </div>

  );
}

export default IsLoading;
