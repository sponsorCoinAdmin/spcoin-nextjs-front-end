'use client';

import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/Exchange.module.css";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";

import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure/types";
import SponsorRateConfig from "./SponsorRateConfig";
import { useExchangeContext, useSpCoinPanels } from '@/lib/context/contextHooks';
import RecipientSelect from "./AccountSelectDropDown";
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";

const AccountSelectContainer: React.FC = () => {
  const [spCoinPanels, setSpCoinPanels] = useSpCoinPanels();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const [siteExists, setSiteExists] = useState<boolean>(false);

  const recipientAccount = exchangeContext.recipientAccount;

  const setRecipientAccount = useCallback((wallet: WalletAccount | undefined) => {
    if (wallet?.address !== exchangeContext.recipientAccount?.address) {
      setExchangeContext(prev => ({
        ...prev,
        recipientAccount: wallet,
      }));
    }
  }, [exchangeContext.recipientAccount?.address, setExchangeContext]);

  const closeRecipientSelect = useCallback(() => {
    setExchangeContext(prev => ({
      ...prev,
      recipientAccount: undefined,
    }));
    setSpCoinPanels(SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON);
  }, [setExchangeContext, setSpCoinPanels]);

  const baseURL = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientAccount?.address?.trim() ? `siteKey=${recipientAccount.address.trim()}` : "";
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  useEffect(() => {
    const website = recipientAccount?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true);
          console.log(`✅ Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`❌ ERROR fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientAccount?.website]);

  const toggleRateConfig = () => {
    const next = spCoinPanels === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG
      ? SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER
      : SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG;
    setSpCoinPanels(next);
  };

  if (spCoinPanels !== SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER) return null;

  return (
    <>
      <div className={classNames(styles.inputs, styles.AccountSelectContainer)}>
        <div className={styles.lineDivider}>-------------------------------------------------------------------</div>
        <div className={styles.yourRecipient}>You are sponsoring:</div>
        {recipientAccount && siteExists ? (
          <Link href={`Recipient?url=${recipientAccount.website}`} className={styles.recipientName}>
            {recipientAccount.name}
          </Link>
        ) : (
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
            {recipientAccount?.name || "No recipient selected"}
          </Link>
        )}
        <div className={styles.recipientSelect}>
          <RecipientSelect recipientAccount={recipientAccount} callBackWallet={setRecipientAccount} />
        </div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={toggleRateConfig}
          />
        </div>
        <div className={styles.clearSponsorSelect} onClick={closeRecipientSelect}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>
  );
};

export default AccountSelectContainer;
