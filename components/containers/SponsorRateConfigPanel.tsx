// File: components/containers/SponsorRateConfigPanel.tsx

'use client';

import React, { useState, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const MIN_STEP = 2; // matches prior code
const MAX_STEP = 10;

const SponsorRateConfigPanel: React.FC = () => {
  const { openPanel } = usePanelTree();

  // "step" from 2..10 where displayed percentages are step*10 and (100 - step*10)
  const [step, setStep] = useState<number>(5);

  const recipientPct = useMemo(() => step * 10, [step]);
  const sponsorPct = useMemo(() => 100 - step * 10, [step]);

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
          alt="Info"
          onClick={() => alert('rateInfo')}
        />

        <div className={`${styles.assetSelect} ${styles.sponsorRatio}`}>
          Sponsor:
          <div id="sponsorRatio">{sponsorPct}%</div>
        </div>

        <div
          id="closeSponsorConfig"
          className={styles.closeSponsorConfig}
          onClick={() => openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL)}
        >
          X
        </div>

        <div className={`${styles.assetSelect} ${styles.recipientRatio}`}>
          Recipient:
          <div id="recipientRatio">{recipientPct}%</div>
        </div>

        <input
          type="range"
          title="Adjust reward ratio"
          className={styles['range-slider']}
          min={MIN_STEP}
          max={MAX_STEP}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default SponsorRateConfigPanel;
