// File: components\Buttons\AddSponsorship.tsx

'use client';

import { useEffect, useState } from "react";
import styles from "@/styles/Exchange.module.css";
import { SP_COIN_DISPLAY } from "@/lib/structure/types";
import { useSpCoinDisplay } from '@/lib/context/contextHooks';
import AccountSelectContainer from "../containers/AccountSelectContainer";

const AddSponsorship = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  useEffect(() => {
    switch (spCoinDisplay) {
      case SP_COIN_DISPLAY.OFF:
        setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON); // ✅ already logs due to hook change
        return;
      case SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON:
        break;
      case SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER:
      case SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG:
      default:
        break;
    }
  }, [spCoinDisplay, setSpCoinDisplay]);

  return (
    <>
      {spCoinDisplay === SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON && (
        <div
          // id="AddSponsorshipButton_ID"
          className={styles.addSponsorshipDiv}
          onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER)}
        >
          <div className={styles.centerTop}>Add</div>
          <div className={styles.centerBottom}>Sponsorship</div>
        </div>
      )}
      {(spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER ||
      spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG) && (
        <div id="RecipientSelect_ID">
          <AccountSelectContainer />
        </div>
      )}
    </>
  );
};

export default AddSponsorship;
