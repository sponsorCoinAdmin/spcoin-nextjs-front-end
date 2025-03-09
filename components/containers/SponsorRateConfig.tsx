import React, { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import { displaySpCoinContainers, hideElement } from '@/lib/spCoin/guiControl';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Updated import

function setRateRatios(newRate: string) {
  var numRate = Number(newRate)
  setRecipientRatio(numRate);
  setSponsorRatio(numRate);
}

function setSponsorRatio(newRate: number) {
  let sponsorRatio: any = document.getElementById("sponsorRatio");
  sponsorRatio.innerHTML = +(100-(newRate*10))+"%";
}

function setRecipientRatio(newRate: number) {
  let recipientRatio: any = document.getElementById("recipientRatio");
  recipientRatio.innerHTML = +(newRate*10)+"%";
}

type Props = {
}

const SponsorRateConfig = ({}:Props) => {
  const { exchangeContext } = useExchangeContext(); // ✅ Using `useExchangeContext()` instead of `exchangeContext`
  
  return (
    <div id="SponsorRateConfig_ID" className={styles.rateRatioContainer}>
      {/* <div id="SponsorRateConfig_ID"> */}
      <div className={styles["inputs"]}>
      <div id="recipient-config"/>
      <div className={styles["lineDivider"]}>
          -------------------------------------------------------------------
      </div>
      <div className={styles["rewardRatio"]}>
        Staking Reward Ratio:
      </div>
      <Image src={info_png} className={styles["infoImg"]} width={18} height={18} alt="Info Image" onClick={() => alert("rateInfo")}/>
      <div className={styles["assetSelect"] + " " + styles["sponsorRatio"]}>
        Sponsor:
        <div id="sponsorRatio">
          50%
        </div>
      </div>
      <div id="closeSponsorConfig" className={styles["closeSponsorConfig"]} onClick={() => displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER, exchangeContext)}>
        X
      </div>
      <div className={styles["assetSelect"] + " " + styles["recipientRatio"]}>
        Recipient:
        <div id="recipientRatio">
          50%
        </div>
      </div>
      <input type="range" className={styles["range-slider"]} min="2" max="10" 
      onChange={(e) => setRateRatios((e.target.value))}></input>
    </div>
  </div>
  );
}

export default SponsorRateConfig;
