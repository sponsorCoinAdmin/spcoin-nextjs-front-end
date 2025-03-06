"use client";

import React, { useEffect, useState } from "react";
import { Address, ChainFees, ChainSerializers, HttpTransport } from "viem";
import { Config, useAccount, useDisconnect } from "wagmi";
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
import { stringifyBigInt } from "../../../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";

import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import InputSelect from "@/components/panes/InputSelect";
import { TokenContract } from "@/lib/structure/types";

const INPUT_PLACE_HOLDER = "Type or paste token to select address";
const USDT_POLYGON_CONTRACT: Address = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const CHKN_ETHEREUM_CONTRACT: Address = "0xD55210Bb6898C021a19de1F58D27b71f095921Ee";
const TON_ETHEREUM_CONTRACT: Address = "0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1";

function App() {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Get context
  const ACTIVE_ACCOUNT = useAccount();

  const USDT_ETHEREUM_CONTRACT: Address = ACTIVE_ACCOUNT.address as Address;
  const [ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress] = useState<Address | undefined>(USDT_ETHEREUM_CONTRACT);
  const [TOKEN_CONTRACT_ADDRESS, setDefaultTokenContractAddress] = useState<Address>(USDT_ETHEREUM_CONTRACT);
  const [EXCHANGE_CONTEXT, setExchangeContextDisplay] = useState<String>("");
  const [DISPLAY_CONTEXT_BUTTON, setContextButton] = useState<boolean>(exchangeContext.test.dumpContextButton);
  const [textInputField, setTokenInput] = useState<Address | undefined>(TON_ETHEREUM_CONTRACT);

  useEffect(() => {
    setContextButton(exchangeContext.test.dumpContextButton);
  }, [exchangeContext.test.dumpContextButton]);

  useEffect(() => {
    switch (ACTIVE_ACCOUNT.chainId) {
      case 1:
        setDefaultTokenContractAddress(USDT_ETHEREUM_CONTRACT);
        break;
      case 137:
        setDefaultTokenContractAddress(USDT_POLYGON_CONTRACT);
        break;
      default:
        setDefaultTokenContractAddress(USDT_ETHEREUM_CONTRACT);
        break;
    }
  }, [ACTIVE_ACCOUNT.chainId]);

  useEffect(() => {
    if (ACTIVE_ACCOUNT.address !== undefined && ACTIVE_ACCOUNT_ADDRESS !== ACTIVE_ACCOUNT.address) {
      setActiveAccountAddress(ACTIVE_ACCOUNT.address);
      setExchangeContext({
        ...exchangeContext,
        activeAccountAddress: ACTIVE_ACCOUNT.address,
      });
    }
  }, [ACTIVE_ACCOUNT.address]);

  // ✅ Show context as a string for debugging
  const show = () => {
    setExchangeContextDisplay(stringifyBigInt(exchangeContext));
  };

  // ✅ Hide the displayed context
  const hide = () => {
    setExchangeContextDisplay("");
  };

  // ✅ Toggle the "Dump Context" button state
  const toggle = () => {
    setExchangeContext({
      ...exchangeContext,
      test: {
        ...exchangeContext.test,
        dumpContextButton: !exchangeContext.test.dumpContextButton,
      },
    });
    setContextButton(exchangeContext.test.dumpContextButton);
  };

  const setTokenContractCallBack = (tokenContract: TokenContract | undefined) => {
    setTokenInput(tokenContract?.address);
  };

  return (
    <>
      <ProviderConfigurationStatus />
      <div>
        <button onClick={show} type="button">
          Dump Context
        </button>
      </div>
      <div>
        <button onClick={hide} type="button">
          Hide Context
        </button>
      </div>

      <p>{EXCHANGE_CONTEXT}</p>

      <DumpContextButton />

      <InputSelect placeHolder={INPUT_PLACE_HOLDER} passedInputField={textInputField} setTokenContractCallBack={setTokenContractCallBack} />

      <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20BalanceOf ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={textInputField} />
      <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={textInputField} />
    </>
  );
}

export default App;
