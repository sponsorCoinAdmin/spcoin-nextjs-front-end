// File: components/containers/RecipientSelectContainer.tsx
'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import styles from '@/styles/Exchange.module.css';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext, useActiveDisplay } from '@/lib/context/hooks';
import { RecipientSelectDropDown } from '../containers/AssetSelectDropDowns';

const RecipientSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { setActiveDisplay } = useActiveDisplay();

  const recipient = exchangeContext?.accounts?.recipientAccount;

  // Fallback link for recipient info page
  const baseURL = getPublicFileUrl('assets/accounts/site-info.html');
  const sitekey = recipient?.address ? `siteKey=${recipient.address}` : '';
  const fallbackUrl = `Recipient?url=${baseURL}?${sitekey}`;
  const linkHref = recipient?.website && recipient.website.trim() !== ''
    ? `Recipient?url=${recipient.website}`
    : fallbackUrl;

  // Clear recipient in global context and return to main panel
  const clearRecipient = useCallback(() => {
    setExchangeContext(prev => {
      const next = structuredClone(prev);
      next.accounts.recipientAccount = undefined;
      return next;
    }, 'RecipientSelectContainer:clearRecipient');
    setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [setExchangeContext, setActiveDisplay]);

  // Open ratio config panel
  const openSponsorRateConfig = useCallback(() => {
    setActiveDisplay(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
  }, [setActiveDisplay]);

  // Open recipient selection panel (the dropdown should call this on click)
  const openRecipientPanel = useCallback(() => {
    setActiveDisplay(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
  }, [setActiveDisplay]);

  return (
    <div
      id="recipientContainerDiv_ID"
      className={clsx(styles.inputs, styles.AccountSelectContainer)}
    >
      <div className={styles.lineDivider}>-------------------------------------------------------------------</div>

      <div className={styles.yourRecipient}>You are sponsoring:</div>

      <Link href={linkHref} className={styles.recipientName}>
        {recipient?.name || 'No recipient selected'}
      </Link>

      <div className={styles.recipientSelect}>
        {/* Keep the dropdown UI, but it should open the panel instead of mutating state locally */}
        <RecipientSelectDropDown
          recipientAccount={recipient}
          // kept for backward compat; panel handles selection now
          callBackAccount={() => {}}
          // ensure your dropdown triggers openRecipientPanel on click internally
        />
      </div>

      <div>
        <Image
          src={cog_png}
          className={styles.cogImg}
          width={20}
          height={20}
          alt="Settings"
          onClick={openSponsorRateConfig}
        />
      </div>

      <div
        id="clearSponsorSelect"
        className={styles.clearSponsorSelect}
        onClick={clearRecipient}
      >
        X
      </div>
    </div>
  );
};

export default RecipientSelectContainer;
