// File: AddSponsorshipButton.tsx
'use client';

import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { useSpCoinHandlers } from "@/lib/spCoin/guiControl"; // ✅ correct usage
import AccountSelectContainer from "../containers/AccountSelectContainer"; // ✅ still needed

const AddSponsorshipButton = () => {
  const { displaySpCoinContainers } = useSpCoinHandlers(); // ✅ use handler from hook

  return (
    <>
      <div
        id="AddSponsorshipButton_ID"
        className={styles.addSponsorshipDiv}
        onClick={() =>
          displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER)
        }
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>
      <div id="RecipientSelect_ID" className={styles.hidden}>
        <AccountSelectContainer />
      </div>
    </>
  );
};

export default AddSponsorshipButton;
