'use client';
import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { openDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { CONTAINER_TYPE, TokenContract } from '@/lib/structure/types';
import { stringifyBigInt } from '@/lib/spCoin/utils';
import { getTokenAvatar } from '@/lib/network/utils';

type Props = {
    priceInputContainerType: CONTAINER_TYPE,
    tokenContract: TokenContract|undefined, 
    setDecimalAdjustedContract: (tokenContract:TokenContract) => void,
  }

const AssetSelect = ({priceInputContainerType, tokenContract, setDecimalAdjustedContract}:Props) => {
    const [showDialog, setShowDialog ] = useState<boolean>(false)
    const openDialog = () => {
        setShowDialog(true)
    }
    
    return (
        <>
            <TokenSelectDialog priceInputContainerType={priceInputContainerType} showDialog={showDialog} setShowDialog={setShowDialog} callBackSetter={setDecimalAdjustedContract} />
            {tokenContract ?
                <>
                    <div className={styles["assetSelect"]}>
                        <img alt={tokenContract?.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={getTokenAvatar(tokenContract)} onClick={() => alert("sellTokenContract " + stringifyBigInt(tokenContract))} />
                        {tokenContract?.symbol}
                        <DownOutlined onClick={() => openDialog()} />
                    </div>
                </> :
                <>
                    <div className={styles["assetSelect"]}>
                        &nbsp; Select Token:
                        <DownOutlined onClick={() => openDialog()} />
                    </div>
                </>}
        </>
        );
}

export default AssetSelect;
