// File: components/buttons/AddSponsorshipButton.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';
import { useActiveDisplay } from '@/lib/context/hooks';
import { RecipientSelectPanel } from '../containers/AssetSelectPanels';

const AddSponsorshipButton = () => {
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  const isContainerVisible =
    activeDisplay === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL ||
    activeDisplay === SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL;

  return (
    <>
      <div
        className={styles.addSponsorshipDiv}
        onClick={() => setActiveDisplay(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL)}
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>

      {isContainerVisible && <RecipientSelectPanel isActive={false} closePanelCallback={function (): void {
        throw new Error('Function not implemented.');
      } } setTradingTokenCallback={function (wallet: WalletAccount): void {
        throw new Error('Function not implemented.');
      } } />}
    </>
  );
};

export default AddSponsorshipButton;
