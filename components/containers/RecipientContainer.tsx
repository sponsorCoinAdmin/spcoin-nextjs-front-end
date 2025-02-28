import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import classNames from 'classnames';

import styles from '@/styles/Exchange.module.css';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from './WalletSelect';
import { displaySpCoinContainers, toggleSponsorRateConfig } from '@/lib/spCoin/guiControl';

const RecipientContainer: React.FC = () => {
  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(exchangeContext.recipientWallet);

  useEffect(() => {
    if (exchangeContext.recipientWallet !== recipientWallet) {
      exchangeContext.recipientWallet = recipientWallet;
    }
  }, [recipientWallet]);

  const closeRecipientSelect = useCallback(() => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON);
    setRecipientWallet(undefined);
  }, []);

  return (
    <>
      <div id="recipientContainerDiv_ID" className={classNames(styles.inputs, styles.RecipientContainer)}>
        <div className={styles.lineDivider}>-------------------------------------------------------------------</div>
        <div className={styles.yourRecipient}>You are sponsoring:</div>
        {recipientWallet?.website ? (
          <Link href={recipientWallet.website} className={styles.recipientName}>
            {recipientWallet.name}
          </Link>
        ) : (
          <div className={styles.recipientName}>No recipient selected</div>
        )}
        <div className={styles.recipientSelect}>
          <RecipientSelect recipientWallet={recipientWallet} callBackRecipientAccount={setRecipientWallet} />
        </div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={() => toggleSponsorRateConfig('SponsorRateConfig_ID')}
          />
        </div>
        <div id="clearSponsorSelect" className={styles.clearSponsorSelect} onClick={closeRecipientSelect}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>
  );
};

export default RecipientContainer;
