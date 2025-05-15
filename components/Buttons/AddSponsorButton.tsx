// File: components\Buttons\AddSponsorButton.tsx

'use client';

import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { useSpCoinDisplay } from "@/lib/context/contextHooks";

const AddSponsorshipButton = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // ✅ Only show when SELECT_RECIPIENT_BUTTON is active
  if (spCoinDisplay !== SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON) return null;

  const openRecipientPanel = () => {
    setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER);
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
