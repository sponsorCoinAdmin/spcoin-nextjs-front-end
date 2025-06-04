'use client';

import React from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useSpCoinDisplay } from '@/lib/context/hooks/contextHooks';

function setRateRatios(newRate: string) {
  const numRate = Number(newRate);
  setRecipientRatio(numRate);
  setSponsorRatio(numRate);
}

function setSponsorRatio(newRate: number) {
  const sponsorRatio: any = document.getElementById("sponsorRatio");
  if (sponsorRatio) sponsorRatio.innerHTML = +(100 - (newRate * 10)) + "%";
}

function setRecipientRatio(newRate: number) {
  const recipientRatio: any = document.getElementById("recipientRatio");
  if (recipientRatio) recipientRatio.innerHTML = +(newRate * 10) + "%";
}

const SponsorRateConfig = () => {
  const [, setSpCoinDisplay] = useSpCoinDisplay(); // only use setter

  return (
    <div id="SponsorRateConfig_ID" className={styles.rateRatioContainer}>
      <div className={styles.inputs}>
        <div id="recipient-config" />
        <div className={styles.lineDivider}></div>
        <div className={styles.rewardRatio}>Staking Reward Ratio:</div>
        <Image
          src={info_png}
          className={styles.infoImg}
          width={18}
          height={18}
          alt="Info Image"
          onClick={() => alert("rateInfo")}
        />
        <div className={`${styles.assetSelect} ${styles.sponsorRatio}`}>
          Sponsor:
          <div id="sponsorRatio">50%</div>
        </div>
        <div
          id="closeSponsorConfig"
          className={styles.closeSponsorConfig}
          onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG)}
        >
          X
        </div>
        <div className={`${styles.assetSelect} ${styles.recipientRatio}`}>
          Recipient:
          <div id="recipientRatio">50%</div>
        </div>
        <input
          type="range"
          className={styles["range-slider"]}
          min="2"
          max="10"
          onChange={(e) => setRateRatios(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SponsorRateConfig;
