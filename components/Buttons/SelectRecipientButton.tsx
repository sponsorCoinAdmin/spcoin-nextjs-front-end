import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { exchangeContext } from "@/lib/context";
import { showElement, hideElement } from '@/lib/spCoin/guiControl';

const SelectRecipientButton = () => {

  const show = () => {
    showElement("MainSwapContainer_ID")
    hideElement("RecipientSelect_ID")
    exchangeContext.activeContainerId = "RecipientSelect_ID";
  }

  return (
    <div>
      <button
        onClick={show}
        // disabled={true}
        type="button"
        className={styles["exchangeButton"]}
        >
        Sponsor Your Recipient
      </button>
    </div>
  )
}

export default SelectRecipientButton