import React from 'react'
import styles from '@/styles/Exchange.module.css'

function CustomConnectButton() {
  return (
    <div>
      <button
        // onClick={show}
        type="button"
        className={styles["exchangeButton"]}
        >
        {true ? "Insufficient Balance" : "Add Amount"}
      </button>
    </div>
  )
}

export default CustomConnectButton