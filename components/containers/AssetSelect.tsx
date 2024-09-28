import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { openDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { TokenContract } from '@/lib/structure/types';

type Props = {
    tokenContract: TokenContract|undefined, 
    altTokenContract: TokenContract|undefined, 
    setDecimalAdjustedContract: (tokenContract:TokenContract) => void,
  }

const AssetSelect = ({tokenContract, altTokenContract, setDecimalAdjustedContract}:Props) => {
    const [showDialog, setShowDialog ] = useState<boolean>(false)
    const openDialog = () => {
        setShowDialog(true)
    }
    
    return (
        tokenContract?
        <>
            <TokenSelectDialog showDialog={showDialog} setShowDialog={setShowDialog} altTokenContract={altTokenContract} callBackSetter={setDecimalAdjustedContract} />
            <div className={styles["assetSelect"]}>
                <img alt={tokenContract?.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={tokenContract?.img} onClick={() => alert("sellTokenContract " + JSON.stringify(tokenContract.address,null,2))}/>
                {tokenContract?.symbol}
                <DownOutlined onClick={() => openDialog()}/>
            </div>
        </> :
        <>
            <TokenSelectDialog parent={parent} showDialog={showDialog} setShowDialog={setShowDialog} altTokenContract={altTokenContract} callBackSetter={setDecimalAdjustedContract} />
            <div className={styles["assetSelect"]}>
                &nbsp; Select Token:
                <DownOutlined onClick={() => openDialog()}/>
            </div>
        </>
    );
}

export default AssetSelect;
