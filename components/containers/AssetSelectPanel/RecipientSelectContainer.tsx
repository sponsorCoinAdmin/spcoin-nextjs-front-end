//File: components/containers/AssetSelectPanel/RecipientSelectContainer.tsx

'use client';

import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/Exchange.module.css";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure";
import { useExchangeContext } from '@/lib/context/hooks';
import { useSpCoinDisplay } from '@/lib/context/hooks';
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";
import { useDisplaySpCoinContainers } from "@/lib/spCoin/guiControl";
import RecipientSelectDropDown from "../AssetSelectDropDown/RecipientSelectDropDown";
import SponsorRateConfig from "../SponsorRateConfig";

const RecipientSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const [recipientAccount, setRecipientAccount] = useState<WalletAccount | undefined>(
    exchangeContext.accounts.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // 🧩 Ensure DOM elements match spCoinDisplay state
  useDisplaySpCoinContainers(spCoinDisplay);

  useEffect(() => {
    if (exchangeContext.accounts.recipientAccount !== recipientAccount) {
      setExchangeContext(prev => {
        const cloned = structuredClone(prev);
        cloned.accounts.recipientAccount = recipientAccount;
        return cloned;
      });
    }
  }, [recipientAccount, exchangeContext, setExchangeContext]);

  const closeRecipientSelectDropDown = useCallback(() => {
    setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER);
    setRecipientAccount(undefined);
  }, [setSpCoinDisplay]);

  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientAccount?.address?.trim() ? `siteKey=${recipientAccount.address.trim()}` : "";
  let defaultStaticFileUrl = `/RecipientSite?url=${baseURL}?${sitekey}`;

  useEffect(() => {
    const website = recipientAccount?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true);
          console.log(`Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`ERROR: WalletContainer.Fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientAccount?.website]);

  const toggleSponsorRateConfig = () => {
    if (spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG) {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
    } else {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG);
    }
  };

  return (
    <>
      <div
        id="recipientContainerDiv_ID"
        className={clsx(
          styles.inputs,
          styles.AccountSelectContainer,
          spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG
            ? styles.noBottomRadius
            : styles.withBottomRadius
        )}
      >
        <div className={styles.lineDivider}></div>
        <div className={styles.yourRecipient}>You are sponsoring:</div>
        {recipientAccount && siteExists ? (
          <Link href={`/RecipientSite?url=${recipientAccount.website}`} className={styles.recipientName}>
            {recipientAccount.name}
          </Link>
        ) : (
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
            {recipientAccount?.name || "No recipient selected"}
          </Link>
        )}
        <div className={styles.recipientSelect}>
          <RecipientSelectDropDown recipientAccount={recipientAccount} callBackAccount={setRecipientAccount} />
        </div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={toggleSponsorRateConfig}
          />
        </div>
        <div id="clearSponsorSelect" className={styles.clearSponsorSelect} onClick={closeRecipientSelectDropDown}>
          X
        </div>
      </div>

      {spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG && (
        <div>
          <SponsorRateConfig />
        </div>
      )}
    </>
  );
};

export default RecipientSelectContainer;
