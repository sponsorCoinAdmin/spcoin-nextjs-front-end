"use client";

import React, { useState, useCallback, useMemo } from "react";
import styles from "@/styles/Exchange.module.css";
import { TokenSelectDialog } from "../Dialogs/Dialogs";
import { DownOutlined } from "@ant-design/icons";
import { CONTAINER_TYPE, TokenContract } from "@/lib/structure/types";
import { stringifyBigInt } from "@/lib/spCoin/utils";
import {
    defaultMissingImage,
    getBlockChainAvatar,
    getTokenAvatar,
    isBlockChainToken
} from "@/lib/network/utils";
import { useExchangeContext } from "@/lib/context/ExchangeContext";

type Props = {
    priceInputContainerType: CONTAINER_TYPE;
    tokenContract: TokenContract | undefined;
    setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
};

const AssetSelect = ({ priceInputContainerType, tokenContract, setDecimalAdjustedContract }: Props) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const { exchangeContext } = useExchangeContext();

    /** 📌 Extract values from context to avoid re-accessing on every render */
    const { tradeData, activeAccountAddress } = exchangeContext;
    const chainId = tradeData.chainId;
    const tokenAddress = tokenContract?.address;

    /** 📌 Memoized function to get the token avatar */
    const avatarSrc = useMemo(() => {
        if (!tokenContract || !tokenContract.address) return defaultMissingImage;
        return isBlockChainToken(tokenContract)
            ? getBlockChainAvatar(tokenContract.chainId || 1)
            : getTokenAvatar(tokenContract);
    }, [tokenContract]);

    /** 📌 Function to handle missing avatars */
    const handleMissingAvatar = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.src = defaultMissingImage;
        if (tokenContract) {
            tokenContract.img = `***ERROR: MISSING AVATAR FILE*** -> ${tokenContract.img}`;
        }
    }, [tokenContract]);

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
                            src={avatarSrc}
                            onClick={() => alert("sellTokenContract " + stringifyBigInt(tokenContract))}
                            onError={handleMissingAvatar}
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

export default AssetSelect;
