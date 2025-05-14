// File: components\Buttons\AddSponsorButton.tsx

'use client';

import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { useSpCoinPanels } from "@/lib/context/contextHooks";

const AddSponsorshipButton = () => {
  const [spCoinPanels, setSpCoinPanels] = useSpCoinPanels();

  // ✅ Only show when SELECT_RECIPIENT_BUTTON is active
  if (spCoinPanels !== SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON) return null;

  const openRecipientPanel = () => {
    setSpCoinPanels(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER);
  };

  return (
    <div
      className={styles.addSponsorshipDiv}
      onClick={openRecipientPanel}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
};

export default AddSponsorshipButton;
