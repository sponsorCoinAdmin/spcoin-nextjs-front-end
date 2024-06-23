import React from 'react';
import styles from '@/app/styles/Exchange.module.css';
import { hideElement } from '@/lib/spCoin/guiControl';
import Image from 'next/image';
import info_png from '../../../public/resources/images/info1.png';
import { DISPLAY_STATE } from '@/app/lib/structure/types';

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
  setDisplayState:(displayState:DISPLAY_STATE) => void
}

const SponsorRateConfig = ({setDisplayState}:Props) => {
  return (
    <div id="recipientConfigDiv" className={styles.rateRatioContainer}>
    <div className={styles["inputs"]}>
      <div id="recipient-config" className={styles.rateRatioContainer2}/>
      <div className={styles["lineDivider"]}>
      -------------------------------------------------------
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
      <div id="closeSponsorConfig" className={styles["closeSponsorConfig"]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
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
