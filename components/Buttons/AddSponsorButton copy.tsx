import { useEffect } from "react";
import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY, TokenContract } from "@/lib/structure/types";
import { displaySpCoinContainers } from "@/lib/spCoin/guiControl";
import { useExchangeContext } from "@/lib/context/ExchangeContext";
import RecipientContainer from "../containers/WalletContainer";

const AddSponsorshipButton = () => {
  const { exchangeContext } = useExchangeContext();

  useEffect(() => {
    // Call function when component mounts
    displaySpCoinContainers(exchangeContext.spCoinPanels);
  }, []); // Empty dependency array ensures this runs only once on mount

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
