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
  const [siteExists, setSiteExists] = useState<boolean>(false);

  useEffect(() => {
    if (exchangeContext.recipientWallet !== recipientWallet) {
      exchangeContext.recipientWallet = recipientWallet;
    }
  }, [recipientWallet]);

  const closeRecipientSelect = useCallback(() => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON);
    setRecipientWallet(undefined);
  }, []);

  // Default URL if recipient website does not exist
  const defaultUrl = `Recipient?url=/websites/test-dummy-sites?site=${recipientWallet?.name}&avatar=${recipientWallet?.name}&recipientWallet_JSON=${JSON.stringify(recipientWallet, null, 2)}`;

  // Function to check if the URL is reachable
  useEffect(() => {
    const website = recipientWallet?.website
    let fetchResponse:Response;
    if (recipientWallet?.website && recipientWallet.website !== "N/A" && recipientWallet.website.trim() !== "") {
      fetch(recipientWallet.website, { method: 'HEAD' })
        .then((response) => {
          if (response.ok) {
            setSiteExists(true);
          }
          else {
            setSiteExists(false);
          }
          fetchResponse = response;
        })
        // alert(`RESPONSE_STATUS: $(fetchResponse) = siteExists(${website}) = ${siteExists}`);
    } else {
      setSiteExists(false);
    }
  }, [recipientWallet?.website]);

  return (
    <>
      <div id="recipientContainerDiv_ID" className={classNames(styles.inputs, styles.RecipientContainer)}>
        <div className={styles.lineDivider}>-------------------------------------------------------------------</div>
        <div className={styles.yourRecipient}>You are sponsoring:</div>
        {recipientWallet && siteExists ? (
          <Link href={`Recipient?url=${recipientWallet.website}`} className={styles.recipientName}>
            {recipientWallet.name}
          </Link>
        ) : (
          <Link href={defaultUrl} className={styles.recipientName}>
            {recipientWallet?.name || 'No recipient selected'}
          </Link>
        )}
        <div className={styles.recipientSelect}>
          <RecipientSelect recipientWallet={recipientWallet} callBackWallet={setRecipientWallet} />
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
