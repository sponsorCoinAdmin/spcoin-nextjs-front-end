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
import InputSelect from "@/components/panes/InputSelect";

// Utilities & Context
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Updated import
import { stringifyBigInt } from "../../../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";
import { TokenContract } from "@/lib/structure/types";

// Constants
const INPUT_PLACE_HOLDER = "Type or paste token to select address";
const USDT_POLYGON_CONTRACT: Address = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const CHKN_ETHEREUM_CONTRACT: Address = "0xD55210Bb6898C021a19de1F58d27b71f095921Ee";
const TON_ETHEREUM_CONTRACT: Address = "0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1";

function App() {
  const { address, chainId } = useAccount(); // ✅ Using `useAccount` properly
  const { exchangeContext } = useExchangeContext(); // ✅ Using `useExchangeContext()` instead of `exchangeContext`
  
  const [activeAccountAddress, setActiveAccountAddress] = useState<Address | undefined>(address);
  const [tokenContractAddress, setTokenContractAddress] = useState<Address>(address || TON_ETHEREUM_CONTRACT);
  const [exchangeContextData, setExchangeContextData] = useState<string>("");
  const [displayContextButton, setDisplayContextButton] = useState<boolean>(exchangeContext.test.dumpContextButton);
  const [textInputField, setTokenInput] = useState<Address | undefined>(TON_ETHEREUM_CONTRACT);

  // ✅ Update token contract based on active chain
  useEffect(() => {
    if (!chainId) return;
    switch (chainId) {
      case 1:
        setTokenContractAddress(address || CHKN_ETHEREUM_CONTRACT);
        break;
      case 137:
        setTokenContractAddress(USDT_POLYGON_CONTRACT);
        break;
      default:
        setTokenContractAddress(address || TON_ETHEREUM_CONTRACT);
        break;
    }
  }, [chainId, address]);

  // ✅ Update active account address
  useEffect(() => {
    if (address && activeAccountAddress !== address) {
      setActiveAccountAddress(address);
    }
  }, [address]);

  // ✅ Context Management Functions
  const showContext = () => setExchangeContextData(stringifyBigInt(exchangeContext));
  const hideContext = () => setExchangeContextData("");
  const toggleContextButton = () => {
    exchangeContext.test.dumpContextButton = !exchangeContext.test.dumpContextButton;
    setDisplayContextButton(exchangeContext.test.dumpContextButton);
  };

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

      {/* Token Input Selection */}
      <InputSelect
        placeHolder={INPUT_PLACE_HOLDER}
        passedInputField={textInputField}
        setTokenContractCallBack={setTokenContractCallBack}
      />

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
