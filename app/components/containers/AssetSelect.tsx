import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { TokenContract } from '@/app/lib/structure/types';
import { hideElement, showElement } from '@/app/lib/spCoin/guiControl';

type Props = {
    TokenContract: TokenContract, 
    id: string,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }

const AssetSelect = ({TokenContract, id, disabled}:Props) => {
    let selectId = id + "Select"
    useEffect(() => {
        if (disabled) {
            console.debug(`disabled = ${disabled} hideElement(${selectId})`)
            hideElement(selectId)
        } else {
            console.debug(`disabled = ${disabled} showElement(${selectId})`)
            showElement(selectId)
        }
      },[]);
  
    return (
        <div className={styles["assetSelect"]}>
            <img alt={TokenContract.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={TokenContract.img} onClick={() => alert("sellTokenContract " + JSON.stringify(TokenContract,null,2))}/>
            {TokenContract.symbol}
            <DownOutlined id={selectId} onClick={() => openDialog("#"+id)}/>
        </div>
    );
}

export default AssetSelect;
