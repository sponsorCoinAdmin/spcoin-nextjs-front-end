"use client";

import React, { useEffect, useState } from "react";
import CustomConnectButton from "./CustomConnectButton";
import ExchangeButton from "./ExchangeButton";
import DumpContextButton from "./DumpContextButton";
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import { useAccount } from "wagmi";
import { Address } from "viem";
import { ErrorMessage } from "@/lib/structure/types";

type Props = {
  isLoadingPrice: boolean;
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (errorMessage: ErrorMessage | undefined) => void;
  setResetAmounts: (resetAmounts: boolean) => void;
  toggleButton: boolean;
};

const PriceButton = ({ isLoadingPrice, errorMessage, setErrorMessage, setResetAmounts, toggleButton }: Props) => {
  const { exchangeContext } = useExchangeContext(); // ✅ Use global context
  const ACTIVE_ACCOUNT = useAccount();
  
  // Local state derived from global context
  const [displayDumpContextButton, setDisplayDumpContextButton] = useState<boolean>(
    exchangeContext.test.dumpContextButton
  );
  const [walletAccount, setWalletAccount] = useState<Address | undefined>(undefined);

  /**
   * Updates local state when `dumpContextButton` changes in the global context.
   */
  useEffect(() => {
    setDisplayDumpContextButton(exchangeContext.test.dumpContextButton);
  }, [exchangeContext.test.dumpContextButton]);

  /**
   * Updates the wallet account when the active account changes.
   */
  useEffect(() => {
    setWalletAccount(ACTIVE_ACCOUNT?.address);
  }, [ACTIVE_ACCOUNT?.address]);

  return (
    <div>
      {!walletAccount ? (
        <CustomConnectButton />
      ) : (
        <ExchangeButton
          isLoadingPrice={isLoadingPrice}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          setResetAmounts={setResetAmounts}
          toggleButton={toggleButton}
        />
      )}
      {displayDumpContextButton && <DumpContextButton />}
    </div>
  );
};

export default PriceButton;
