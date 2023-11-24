import React from "react";
import styles from "../../styles/App.module.css";
import moralis_png from '../images/moralis.png'
import eth_png from '../../images/eth.png'
import Image from 'next/image'
// import Link from 'next/link'

function MoralisHeader(address: string, isConnected: any, connect: React.MouseEventHandler<HTMLDivElement> | undefined) {
  return (
    <>
      {/* <div className={styles.modal} id="modal>
        <div className={styles.modal-header">
          <div className={styles.title}>Example Modal</div>
          <button data-close-button>&times;</button>
        </div> */}

        <div className={styles.rightH}> 
          <div className={styles.headerItem}>
          <Image src={eth_png} width={25} height={25} alt="Ethereum Logo" />
          &nbsp;&nbsp;Ethereum
          </div>
          <div className={styles.connectButton} onClick={connect}>
            {isConnected ? (address.slice(0,4) +"..." +address.slice(38)) : "Connect"}
          </div>
        </div>
    </>
  );
}

export default MoralisHeader;
