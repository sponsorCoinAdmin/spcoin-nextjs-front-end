'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSpCoinDisplay } from '@/lib/context/hooks';
import { RecipientSelectPanel } from '../containers/AssetSelectPanels';

const AddSponsorshipButton = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const isContainerVisible =
    spCoinDisplay === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL ||
    spCoinDisplay === SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL;

  return (
    <>
      <div
        className={styles.addSponsorshipDiv}
        onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL)}
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>

      {isContainerVisible && <RecipientSelectPanel />}
    </>
  );
};

export default AddSponsorshipButton;
