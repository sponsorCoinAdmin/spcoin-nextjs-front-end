// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import { useCallback, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const AddSponsorshipButton = () => {
  const { isVisible, openPanel, closePanel } = usePanelTree();
  const busyRef = useRef(false);

  // Only render when this button is meant to be visible.
  if (!isVisible(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON)) return null;

  const openRecipientSelect = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      // 1) Hide the config button if it's still visible.
      if (isVisible(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON)) {
        closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON);
      }

      // 2) Show the inline recipient config panel (idempotent guard).
      if (!isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL)) {
        openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
      }

      // (Optional) Keep Trading Station visible if your UX expects it on screen.
      // This does not enforce radio behavior; it simply ensures visibility.
      if (!isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL)) {
        openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
      }

      // Debug trace (safe to keep)
      console.log('[AddSponsorshipButton] toggled:', {
        hidConfigButton: true,
        showedRecipientPanel: true,
        ensuredTradingVisible: true,
      });
    } finally {
      busyRef.current = false;
    }
  }, [isVisible, openPanel, closePanel]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      aria-pressed="false"
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
