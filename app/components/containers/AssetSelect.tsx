import React from 'react';
import styles from '../../styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";

const AssetSelect = ({tokenElement, id}:any) => {
    return (
        <div className={styles["assetSelect"]}>
            <img alt={tokenElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={tokenElement.img} onClick={() => alert("sellTokenElement " + JSON.stringify(tokenElement,null,2))}/>
            {tokenElement.symbol}
            <DownOutlined onClick={() => openDialog(id)}/>
        </div>
    );
}

export default AssetSelect;
