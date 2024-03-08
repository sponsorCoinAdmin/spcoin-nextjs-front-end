import React, { useState, useEffect } from 'react';
import styles from '../../styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenElement } from '@/app/lib/structure/types';
import { hideElement, showElement, showSponsorRecipientConfig } from '@/app/lib/spCoin/guiControl';

type Props = {
  buyAmount: string,
  buyBalance: string,
  buyTokenElement: TokenElement, 
  setBuyAmount: any,
  disabled:boolean,
  showSponsorButtonStatus:boolean
}

const BuyContainer = ({buyAmount, buyBalance, buyTokenElement, setBuyAmount, disabled, showSponsorButtonStatus} : Props) => {
  const isSpCoin = (buyTokenElement:TokenElement) => {
    let isSpCoin = buyTokenElement.symbol === "SpCoin" ? true:false
    // console.debug(`%%%%%%%%%%%%%%%%%%%% isSpCoin = ${isSpCoin}`)
    return isSpCoin
  }
  const [spCoin, setSpCoin] = useState<boolean>(isSpCoin(buyTokenElement))
  const [showSponsorButton, setShowSponsorButton] = useState<boolean>(spCoin)
  const [jj, setJj] = useState<boolean>(false)
  
  useEffect(() => {
    setShowSponsorButton(showSponsorButtonStatus)
    setJj(true)

    // setSpCoinContainers()
  },[])
  useEffect(() => {
    if (isSpCoin(buyTokenElement)) {
      setSpCoin(true)
      setShowSponsorButton(showSponsorButtonStatus)
    }
  },[buyTokenElement])

  const showButton = () => {
    console.debug(`AAAAAAAAAAAAAAAAAAAA setSpCoinContainers:showButton`)
    setShowSponsorButton(true)
  }

  const hideButton = () => {
    console.debug(`BBBBBBBBBBBBBBBBBBBB setSpCoinContainers:hideButton`)
    setShowSponsorButton(false)
  }

  const showRecipientSelect = () => {
    console.debug(`CCCCCCCCCCCCCCCCCCCC setSpCoinContainers:showRecipientSelect`)
    showElement("recipientSelectDiv")
  }

  const hideRecipientDivs = () => {
    console.debug(`DDDDDDDDDDDDDDDDDDDD setSpCoinContainers:hideRecipientDivs`)
    hideElement("recipientSelectDiv")
    hideElement("recipientConfigDiv")
  }

  const toggleSpCoinContainers = () => {
    console.debug("%%%%%%%%%%%%%%%%%%%% BEFORE TOGGLE jj ="+jj)
    console.debug(`%%%%%%%%%%%%%%%%%%%% BEFORE TOGGLE showSponsorButton = ${showSponsorButton}`)
    setJj(true)
    setShowSponsorButton(!showSponsorButton)
    console.debug(`%%%%%%%%%%%%%%%%%%%% AFTER TOGGLE showSponsorButton = ${showSponsorButton}`)
    console.debug("%%%%%%%%%%%%%%%%%%%% AFTER TOGGLE AAjj ="+jj)
    setSpCoinContainers()
   }

  const setSpCoinContainers = () => {
    console.debug(`spCoin = ${spCoin}  showSponsorButton = ${showSponsorButton}`)

    if (!spCoin){
      hideButton()
      hideRecipientDivs()
    } else {
      if (!showSponsorButton){
        hideRecipientDivs()
        hideButton()
      } else {
        hideButton()
        showRecipientSelect()
      }
    }
  }

  const getButtonStatus = () => {
    let buttonStatus = showSponsorButton ? 'visible' : 'hidden'
    // setSpCoinContainers()
    console.debug(`%%%%%%%%%%%%%%%%%%%% getButtonStatus:buttonStatus  = ${buttonStatus}`)
    return buttonStatus
  }

  return (
    <div className={styles.inputs}>
      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)} />
      <AssetSelect tokenElement={buyTokenElement} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
      <div className={styles["buySell"]}>You receive </div>
      <div className={styles["assetBalance"]}>Balance: {buyBalance}</div>
      <div className={styles[`addSponsorshipDiv`]+" "+styles[`${getButtonStatus()}`]} onClick={() => setSpCoinContainers()}>
        <div className={styles["centerContainer"]} >Add Sponsorship</div>
      </div>
    </div>
  );
}

export default BuyContainer;
