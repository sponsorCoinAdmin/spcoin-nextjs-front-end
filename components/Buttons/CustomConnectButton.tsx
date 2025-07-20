import React from 'react'
import styles from '@/styles/Exchange.module.css'
import { ConnectKitButton } from "connectkit";

const CustomConnectButton = () => {    
  return (
    <div id="CustomConnectButton" >
      { (
        <ConnectKitButton.Custom>
          {({
            isConnected,
            isConnecting,
            show,
            hide,
            address,
            ensName,
            chain,
          }) => {
            return (
              <button
                onClick={show}
                type="button"
                className={styles["exchangeButton"]}
                >
                {"Connect Wallet"}
              </button>
            );
          }}
        </ConnectKitButton.Custom>
      )}
    </div>
  )
}

export default CustomConnectButton

