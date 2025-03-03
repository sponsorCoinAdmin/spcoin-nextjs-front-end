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
import { getPublicFileUrl } from '@/lib/spCoin/utils';

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

  const baseURL: string = getPublicFileUrl(`assets/wallets/site-info.html`);
  const sitekey = recipientWallet?.address?.trim() ? `siteKey=${recipientWallet.address.trim()}` : "";
  // const sitename = recipientWallet?.name?.trim() ? `sitename=${recipientWallet.name.trim()}` : "";
  // const imgUrl = `/assets/wallets/${recipientWallet?.address}/avatar.png`;
  // const img = getPublicFileUrl(imgUrl) ? `img=${getPublicFileUrl(imgUrl).trim()}` : "";   
  // const website = recipientWallet?.website?.trim() ? `website=${recipientWallet.website.trim()}` : "";
  
  // let defaultStaticFileUrl = `${baseURL}?${sitename}&${img}&${website}`;
  let defaultStaticFileUrl = `${baseURL}?${sitekey}`;
  defaultStaticFileUrl = `Recipient?url=${defaultStaticFileUrl}`

  // Function to check if the URL is reachable
   useEffect(() => {
    const website = recipientWallet?.website    
    if (website && website !== "N/A" && website.trim() !== "") {
        fetch(website, { method: 'HEAD', mode: 'no-cors' }) // <-- Added mode: 'no-cors'
            .then(() => {
                setSiteExists(true); // Assume the site exists since we can't check response.ok
                console.log(`Site ${website} is reachable.`);
            })
            .catch((error) => {
                console.error(`ERROR: WalletContainer.Fetching ${website}:`, error);
                setSiteExists(false);
            });
    } else {
        setSiteExists(false);
    }
}, [recipientWallet?.website]); // Keep dependency array unchanged

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
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
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
