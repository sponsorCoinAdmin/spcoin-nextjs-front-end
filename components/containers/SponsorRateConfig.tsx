// File: components\containers\SponsorRateConfig.tsx
 
'use client';

import React from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useSpCoinDisplay } from '@/lib/context/contextHooks';

function setRateRatios(newRate: string) {
  const numRate = Number(newRate);
  setRecipientRatio(numRate);
  setSponsorRatio(numRate);
}

function setSponsorRatio(newRate: number) {
  const sponsorRatio: HTMLElement | null = document.getElementById('sponsorRatio');
  if (sponsorRatio) sponsorRatio.innerHTML = +(100 - newRate * 10) + '%';
}

function setRecipientRatio(newRate: number) {
  const recipientRatio: HTMLElement | null = document.getElementById('recipientRatio');
  if (recipientRatio) recipientRatio.innerHTML = +(newRate * 10) + '%';
}

const SponsorRateConfig = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // ✅ Only render if the current panel is active
  if (spCoinDisplay !== SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG) return null;

  const closeConfigPanel = () => {
    setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER);
  };

  return (
    <div className={styles.rateRatioContainer}>
      <div className={styles.inputs}>
        <div id="recipient-config" />
        <div className={styles.lineDivider}>
          -------------------------------------------------------------------
        </div>
        <div className={styles.rewardRatio}>Staking Reward Ratio:</div>
        <Image
          src={info_png}
          className={styles.infoImg}
          width={18}
          height={18}
          alt="Info"
          onClick={() => alert('rateInfo')}
        />
        <div className={`${styles.assetSelect} ${styles.sponsorRatio}`}>
          Sponsor:
          <div id="sponsorRatio">50%</div>
        </div>
        <div
          className={styles.closeSponsorConfig}
          onClick={closeConfigPanel}
        >
          X
        </div>
        <div className={`${styles.assetSelect} ${styles.recipientRatio}`}>
          Recipient:
          <div id="recipientRatio">50%</div>
        </div>
        <input
          type="range"
          className={styles['range-slider']}
          min="2"
          max="10"
          onChange={(e) => setRateRatios(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SponsorRateConfig;
