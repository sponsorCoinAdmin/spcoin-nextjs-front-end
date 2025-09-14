// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const AddSponsorshipButton = () => {
  const { openPanel } = usePanelTree();

  const openSponsorConfig = () => {
    openPanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      className={styles.addSponsorshipDiv}
      onClick={openSponsorConfig}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSponsorConfig();
        }
      }}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
};

export default AddSponsorshipButton;
