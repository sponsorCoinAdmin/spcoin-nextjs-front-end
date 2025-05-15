import { useEffect } from "react";
import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY, TokenContract } from "@/lib/structure/types";
import { displaySpCoinContainers } from "@/lib/spCoin/guiControl";
import { useExchangeContext, useSpCoinDisplay } from '@/lib/context/contextHooks'
import AccountSelectContainer from "../containers/AccountSelectContainer";

const AddSponsorshipButton = () => {
  const { exchangeContext } = useExchangeContext();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  useEffect(() => {
    // Call function when component mounts
    displaySpCoinContainers(spCoinDisplay, exchangeContext);
  }, [spCoinDisplay]); // Ensure dependency array includes exchangeContext

  return (
    <>
      <div
        id="AddSponsorshipButton_ID"
        className={styles.addSponsorshipDiv}
        onClick={() => displaySpCoinContainers(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER, exchangeContext)}
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
