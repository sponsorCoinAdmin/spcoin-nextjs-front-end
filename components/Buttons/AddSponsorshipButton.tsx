// File: components/buttons/AddSponsorshipButton.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useActiveDisplay } from '@/lib/context/hooks';

const AddSponsorshipButton = () => {
  const { setActiveDisplay } = useActiveDisplay();

  const openRecipientPanel = () =>
    setActiveDisplay(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);

  return (
    // Use a <div> so existing CSS (targeting this class) still applies
    <div
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      className={styles.addSponsorshipDiv}
      onClick={openRecipientPanel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRecipientPanel();
        }
      }}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
};

export default AddSponsorshipButton;
