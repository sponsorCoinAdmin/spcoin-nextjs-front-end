import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { openDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { TRANSACTION_TYPE, TokenContract } from '@/lib/structure/types';

type Props = {
    transActionType: TRANSACTION_TYPE,
    tokenContract: TokenContract|undefined, 
    setDecimalAdjustedContract: (tokenContract:TokenContract) => void,
  }

const AssetSelect = ({transActionType, tokenContract, setDecimalAdjustedContract}:Props) => {
    const [showDialog, setShowDialog ] = useState<boolean>(false)
    const openDialog = () => {
        setShowDialog(true)
    }
    
    return (
        <>
            <TokenSelectDialog transActionType={transActionType} showDialog={showDialog} setShowDialog={setShowDialog} callBackSetter={setDecimalAdjustedContract} />
            {tokenContract?
            <>
                <div className={styles["assetSelect"]}>
                    <img alt={tokenContract?.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={tokenContract?.img} onClick={() => alert("sellTokenContract " + JSON.stringify(tokenContract,null,2))}/>
                    {tokenContract?.symbol}
                    <DownOutlined onClick={() => openDialog()}/>
                </div>
            </> :
            <>
                <div className={styles["assetSelect"]}>
                    &nbsp; Select Token:
                    <DownOutlined onClick={() => openDialog()}/>
                </div>
            </>}
        </>
        );
}

export default AssetSelect;
