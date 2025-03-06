"use client";

import { useEffect } from "react";
import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { displaySpCoinContainers } from "@/lib/spCoin/guiControl";
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import RecipientContainer from "../containers/WalletContainer";

const AddSponsorshipButton = () => {
  const { exchangeContext } = useExchangeContext(); // ✅ Get context

  useEffect(() => {
    // Call function when component mounts with current context data
    displaySpCoinContainers(exchangeContext.spCoinPanels);
  }, [exchangeContext.spCoinPanels]); // ✅ Depend on context state

  return (
    <>
      <div
        id="AddSponsorshipButton_ID"
        className={styles.addSponsorshipDiv}
        onClick={() => displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER)}
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>
      <div id="RecipientSelect_ID" className={styles.hidden}>
        <RecipientContainer />
      </div>
    </>
  );
};

export default AddSponsorshipButton;
