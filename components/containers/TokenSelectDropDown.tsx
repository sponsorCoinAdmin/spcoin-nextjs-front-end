"use client";

import React, { useState, useCallback, useMemo } from "react";
import styles from "@/styles/Exchange.module.css";
import { TokenSelectDialog } from "../Dialogs/Dialogs";
import { DownOutlined } from "@ant-design/icons";
import { CONTAINER_TYPE, ExchangeContext, TokenContract } from "@/lib/structure/types";
import {
    defaultMissingImage,
    getNativeAvatar,
    getTokenAvatar,
    isBlockChainToken
} from "@/lib/network/utils";

type Props = {
    containerType: CONTAINER_TYPE;
    tokenContract: TokenContract | undefined;
    setDecimalAdjustedContract: (tokenContract: TokenContract) => void;
    exchangeContext: ExchangeContext; // ✅ Pass exchangeContext from parent
};

function AssetSelect({ containerType, tokenContract, setDecimalAdjustedContract, exchangeContext }: Props) {    /** ✅ Always call hooks in the same order */
    const [showDialog, setShowDialog] = useState<boolean>(false);

    // console.debug("🛠 AssetSelect is rendering on:", typeof window !== "undefined" ? "Client ✅" : "Server ❌");
    // console.debug("🛠 exchangeContext in AssetSelect:", stringifyBigInt(exchangeContext));

    /** ✅ Hooks must always execute in the same order */
    const { tradeData } = exchangeContext;

    /** 📌 Memoized function to get the token avatar */
    const avatarSrc = useMemo(() => {
        if (!tokenContract || !tokenContract.address) return defaultMissingImage;
        return isBlockChainToken(exchangeContext, tokenContract)
            ? getNativeAvatar(tokenContract.chainId || 1 )
            : getTokenAvatar(tokenContract);
    }, [tokenContract]);

    /** 📌 Function to handle missing avatars */
    const handleMissingAvatar = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.src = defaultMissingImage;
        if (tokenContract) {
            tokenContract.img = `***ERROR: MISSING AVATAR FILE*** -> ${tokenContract.img}`;
        }
    }, [tokenContract]);

    /** ✅ Ensure `setDecimalAdjustedContract` is always called safely */
    const handleTokenSelect = useCallback(() => {
        if (tokenContract) {
            setDecimalAdjustedContract(tokenContract);
        } else {
            console.warn("No token contract selected");
        }
    }, [tokenContract, setDecimalAdjustedContract]);

    return (
        <>
            <TokenSelectDialog
                containerType={containerType}
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
                            onClick={handleTokenSelect}
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
}

export default AssetSelect;
