// File: components/containers/SponsorRateConfigPanel.tsx

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const MIN_STEP = 2; // matches prior code
const MAX_STEP = 10;

const SponsorRateConfigPanel: React.FC = () => {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // "step" from 2..10 where displayed percentages are step*10 and (100 - step*10)
  const [step, setStep] = useState<number>(5);

  const recipientPct = useMemo(() => step * 10, [step]);
  const sponsorPct = useMemo(() => 100 - step * 10, [step]);

  // Toggle THIS panel (non-main panel) via the cog
  const toggleSelf = useCallback(() => {
    const id = SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL;
    if (isVisible(id)) closePanel(id);
    else openPanel(id);
  }, [isVisible, openPanel, closePanel]);

  // Only render when this panel is visible
  const selfVisible = isVisible(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
  if (!selfVisible) return null;

  return (
    <div id="SponsorRateConfig_ID" className={styles.rateRatioContainer}>
      <div className={styles.inputs}>
        <div id="recipient-config" />
        <div className={styles.lineDivider}></div>

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

        {/* Cog icon toggles this panel’s visibility */}
        <Image
          src={cog_png}
          className={styles.cogImg}
          width={18}
          height={18}
          alt="Toggle Sponsor Rate Config"
          role="button"
          tabIndex={0}
          onClick={toggleSelf}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSelf();
            }
          }}
        />

        <div className={`${styles.assetSelect} ${styles.sponsorRatio}`}>
          Sponsor:
          <div id="sponsorRatio">{sponsorPct}%</div>
        </div>

        {/* Close just hides this non-main panel (no overlay switch) */}
        <div
          id="closeSponsorConfig"
          className={styles.closeSponsorConfig}
          onClick={() => closePanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL)}
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
