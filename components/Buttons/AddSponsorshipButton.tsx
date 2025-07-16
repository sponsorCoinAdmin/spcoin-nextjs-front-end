'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSpCoinDisplay } from '@/lib/context/hooks';
import { RecipientSelectPanel } from '../containers/AssetSelectPanels';

const AddSponsorshipButton = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const isContainerVisible =
    spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER ||
    spCoinDisplay === SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON;

  return (
    <>
      <div
        className={styles.addSponsorshipDiv}
        onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER)}
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>

      {isContainerVisible && <RecipientSelectPanel />}
    </>
  );
};

export default AddSponsorshipButton;
