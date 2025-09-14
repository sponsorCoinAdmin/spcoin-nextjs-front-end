// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useExchangeContext } from '@/lib/context';

const AddSponsorshipButton = () => {
  const { openPanel } = usePanelTree();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const showRecipientContainer =
    (exchangeContext as any)?.settings?.ui?.showRecipientContainer === true;

  // 🔒 If the recipient container is shown, hide this button
  if (showRecipientContainer) return null;

  const openRecipientSelect = () => {
    // 1) flip the inline UI flag so the container renders
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.settings = {
          ...(next.settings ?? {}),
          ui: {
            ...((next.settings as any)?.ui ?? {}),
            showRecipientContainer: true,
          },
        };
        return next;
      },
      'AddSponsorshipButton:openRecipientSelect'
    );

    // 2) ensure Trading is the active main overlay
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  };

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
