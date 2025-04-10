"use client";

import React, { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

// Components
import ReadWagmiERC20Fields from "@/components/ERC20/ReadWagmiERC20Fields";
import ReadWagmiERC20RecordFields from "@/components/ERC20/ReadWagmiERC20RecordFields";
import ProviderConfigurationStatus from "@/components/ERC20/ProviderConfigurationStatus";
import ReadWagmiERC20Records from "@/components/ERC20/ReadWagmiERC20Records";
import ReadWagmiERC20ContractFields from "@/components/ERC20/ReadWagmiERC20ContractFields";
import ReadWagmiERC20BalanceOf from "@/components/ERC20/ReadWagmiERC20BalanceOf";
import ReadWagmiERC20ContractName from "@/components/ERC20/ReadWagmiERC20ContractName";
import ReadWagmiERC20ContractSymbol from "@/components/ERC20/ReadWagmiERC20ContractSymbol";
import ReadWagmiERC20ContractDecimals from "@/components/ERC20/ReadWagmiERC20ContractDecimals";
import ReadWagmiERC20ContractTotalSupply from "@/components/ERC20/ReadWagmiERC20ContractTotalSupply";
import DumpContextButton from "@/components/Buttons/DumpContextButton";

// Utilities & Context
import { useExchangeContext } from "@/lib/context/contextHooks"; // ✅ Updated import
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { TokenContract } from "@/lib/structure/types";

function App() {
  const { address, chainId } = useAccount(); // ✅ Using `useAccount` properly
  const { exchangeContext } = useExchangeContext(); // ✅ Using `useExchangeContext()` instead of `exchangeContext`
  
  const [activeAccountAddress, setActiveAccountAddress] = useState<Address | undefined>(address);
  const [exchangeContextData, setExchangeContextData] = useState<string>("");
  const [textInputField, setTokenInput] = useState<Address | undefined>();

  // ✅ Update active account address
  useEffect(() => {
    if (address && activeAccountAddress !== address) {
      setActiveAccountAddress(address);
    }
  }, [address]);

  // ✅ Context Management Functions
  const showContext = () => setExchangeContextData(stringifyBigInt(exchangeContext));
  const hideContext = () => setExchangeContextData("");

  // ✅ Token Contract Callback
  const setTokenContractCallBack = (tokenContract: TokenContract | undefined) => {
    setTokenInput(tokenContract?.address);
  };

  return (
    <>
      <ProviderConfigurationStatus />

      {/* Context Dump Controls */}
      <div>
        <button onClick={showContext} type="button">
          Dump Context
        </button>
      </div>
      <div>
        <button onClick={hideContext} type="button">
          Hide Context
        </button>
      </div>

      <p>{exchangeContextData}</p>
      <DumpContextButton />

      {/* ERC20 Read Operations */}
      <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20BalanceOf
        ACTIVE_ACCOUNT_ADDRESS={activeAccountAddress}
        TOKEN_CONTRACT_ADDRESS={textInputField}
      />
      <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={textInputField} />
    </>
  );
}

export default App;
