'use client';

import React, { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import { useDisplaySpCoinContainers } from '@/lib/spCoin/guiControl';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useSpCoinDisplay } from '@/lib/context/contextHooks';

function setRateRatios(newRate: string) {
  var numRate = Number(newRate)
  setRecipientRatio(numRate);
  setSponsorRatio(numRate);
}

function setSponsorRatio(newRate: number) {
  let sponsorRatio: any = document.getElementById("sponsorRatio");
  sponsorRatio.innerHTML = +(100 - (newRate * 10)) + "%";
}

function setRecipientRatio(newRate: number) {
  let recipientRatio: any = document.getElementById("recipientRatio");
  recipientRatio.innerHTML = +(newRate * 10) + "%";
}

const SponsorRateConfig = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // 🧩 Sync DOM visibility with spCoinDisplay
  useDisplaySpCoinContainers(spCoinDisplay);

  return (
    <div id="SponsorRateConfig_ID" className={styles.rateRatioContainer}>
      <div className={styles["inputs"]}>
        <div id="recipient-config" />
        <div className={styles.lineDivider}></div>
        <div className={styles["rewardRatio"]}>
          Staking Reward Ratio:
        </div>
        <Image
          src={info_png}
          className={styles["infoImg"]}
          width={18}
          height={18}
          alt="Info Image"
          onClick={() => alert("rateInfo")}
        />
        <div className={styles["assetSelect"] + " " + styles["sponsorRatio"]}>
          Sponsor:
          <div id="sponsorRatio">
            50%
          </div>
        </div>
        <div
          id="closeSponsorConfig"
          className={styles["closeSponsorConfig"]}
          onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER)}
        >
          X
        </div>
        <div className={styles["assetSelect"] + " " + styles["recipientRatio"]}>
          Recipient:
          <div id="recipientRatio">
            50%
          </div>
        </div>
        <input
          type="range"
          className={styles["range-slider"]}
          min="2"
          max="10"
          onChange={(e) => setRateRatios((e.target.value))}
        />
      </div>
    </div>
  );
};

export default SponsorRateConfig;
