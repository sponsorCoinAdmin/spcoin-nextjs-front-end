// File: components/containers/RecipientConfigPanel.tsx
'use client';

import React, { useState, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const MIN_STEP = 2; // matches prior code
const MAX_STEP = 10;

const RecipientConfigPanel: React.FC = () => {
  const { isVisible, closePanel } = usePanelTree();

  // "step" from 2..10 where displayed percentages are step*10 and (100 - step*10)
  const [step, setStep] = useState<number>(5);

  const recipientPct = useMemo(() => step * 10, [step]);
  const sponsorPct = useMemo(() => 100 - step * 10, [step]);

  // Only render when this panel is visible
  const selfVisible = isVisible(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL);
  if (!selfVisible) return null;

  return (
    <div
      id="SponsorRateConfig_ID"
      className="bg-[#1f2639] text-[#94a3b8] border-0 h-[57px] rounded-b-[12px]"
      // minimal: ensure a positioning context
    >      
      <div className={`${styles.inputs} relative`}>
        <div id="recipient-config" />

        {/*this is a Tailwind Line Divider */}
        <div className="  absolute -top-[7px] left-[11px] right-[11px]  h-px bg-[#94a3b8] opacity-20 " />

        <div className={styles.rewardRatio}>Staking Reward Ratio:</div>

        {/* Info icon (kept as-is) */}
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

        {/* Close just hides this non-main panel (no overlay switch) */}
        <div
          id="closeSponsorConfig"
          className={styles.closeSponsorConfig}
          onClick={() => closePanel(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL)}
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

export default RecipientConfigPanel;
