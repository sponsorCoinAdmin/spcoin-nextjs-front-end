import React, { useEffect } from 'react';
import styles from '../../styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { TokenElement } from '@/app/lib/structure/types';
import { hideElement, showElement } from '@/app/lib/spCoin/guiControl';

type Props = {
    tokenElement: TokenElement, 
    id: string,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }

const AssetSelect = ({tokenElement, id, disabled}:Props) => {
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
            <img alt={tokenElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={tokenElement.img} onClick={() => alert("sellTokenElement " + JSON.stringify(tokenElement,null,2))}/>
            {tokenElement.symbol}
            <DownOutlined id={selectId} onClick={() => openDialog("#"+id)}/>
        </div>
    );
}

export default AssetSelect;
