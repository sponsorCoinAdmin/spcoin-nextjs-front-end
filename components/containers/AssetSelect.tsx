'use client';
import React, { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import { openDialog as openDialogUtil, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { CONTAINER_TYPE, ExchangeContext, FEED_TYPE, TokenContract } from '@/lib/structure/types';
import { stringifyBigInt } from '@/lib/spCoin/utils';
import { defaultMissingImage, getBlockChainAvatar, getTokenAvatar, isBlockChainToken, isBurnTokenAddress, isNativeTokenAddress, useIsActiveAccountAddress } from '@/lib/network/utils';
import { Address } from 'viem';
import { useExchangeContext } from "@/lib/context/ExchangeContext";

const getAvatar = (tokenContract?: TokenContract): string => {
    if (!tokenContract || !tokenContract.address) return defaultMissingImage;

    const avatar = isBlockChainToken(tokenContract) ? 
        getBlockChainAvatar(tokenContract.chainId || 1) :
        getTokenAvatar(tokenContract);

    alert(`avatar = ${avatar}`);
    return avatar;
};

type Props = {
    priceInputContainerType: CONTAINER_TYPE;
    tokenContract: TokenContract | undefined; 
    setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
};

const TokenSelect = ({ priceInputContainerType, tokenContract, setDecimalAdjustedContract }: Props) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const { exchangeContext } = useExchangeContext();
    const chainId = exchangeContext.tradeData.chainId;
    const activeAccountAddress = exchangeContext.activeAccountAddress;
    const tokenAddress = tokenContract?.address;

    // Avoid function recreation on every render
    const setMissingAvatar = useCallback((event: React.SyntheticEvent<HTMLImageElement>, tokenContract: TokenContract) => {
        event.currentTarget.src = defaultMissingImage;
        tokenContract.img = `***ERROR: MISSING AVATAR FILE*** -> ${tokenContract.img}`;
    }, []);

    return (
        <>
            <TokenSelectDialog 
                priceInputContainerType={priceInputContainerType} 
                showDialog={showDialog} 
                setShowDialog={setShowDialog} 
                callBackSetter={setDecimalAdjustedContract} 
            />
            <div className={styles["assetSelect"]}>
                {tokenContract ? (
                    <>
                        <img
                            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
                            alt={`${tokenContract?.name} Token Avatar`} 
                            src={getAvatar(tokenContract)}
                            onClick={() => alert("sellTokenContract " + stringifyBigInt(tokenContract))}
                            onError={(event) => setMissingAvatar(event, tokenContract)}
                        />
                        {tokenContract.symbol}
                    </>
                ) : (
                    <>Select Token:</>
                )}
                <DownOutlined onClick={() => setShowDialog(true)} />
            </div>
        </>
    );
};

export default TokenSelect;
