// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
// import { SP_COIN_DISPLAY } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const AddSponsorshipButton = () => {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Only show the button if its node is visible
  if (!isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON)) return null;

  const openRecipientSelect = () => {
    // hide the button…
    closePanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON);
    // …and show the inline recipient config panel
    openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
    // If you need Trading active, this is safe (radio behavior handled by the hook):
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  };

  console.log('[AddSponsorshipButton] ids', {
    RECIPIENT_SELECT_CONFIG_BUTTON: SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON,
    RECIPIENT_SELECT_PANEL: SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
    TRADING_STATION_PANEL: SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      className={styles.addSponsorshipDiv}
      onClick={openRecipientSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRecipientSelect();
        }
      }}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
};

export default AddSponsorshipButton;
