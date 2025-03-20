'use client';

import React, { useEffect, useState } from "react";

// External Libraries
import { ethers } from "ethers";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";

// Context & Styles
import { useBuyAmount, useExchangeContext, useSellAmount } from "@/lib/context/ExchangeContext";  // ✅ Use Hook
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelect from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { BURN_ADDRESS, delay, isWrappingTransaction } from "@/lib/network/utils";
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin } from "@/lib/spCoin/utils";
import { formatDecimals, useWagmiERC20TokenBalanceOf } from "@/lib/wagmi/wagmiERC20ClientRead";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

// Types & Constants
import { CONTAINER_TYPE, TokenContract, TradeData, TRADE_DIRECTION } from "@/lib/structure/types";

import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'
import { useBalanceInWei } from "@/lib/hooks/useBalanceInWei";

type Props = {
  containerType: CONTAINER_TYPE;
  activeContract: TokenContract | undefined;
  updateAmount: bigint;
  setTransactionType: (transactionType: TRADE_DIRECTION) => void;
  setCallbackAmount: (amount: bigint) => void;
  setTokenContractCallback: (tokenContract: TokenContract | undefined) => void;
  slippageBps: number;
};

const tokenSelectContainer = ({
  containerType,
  activeContract,
  updateAmount,
  setTransactionType,
  setCallbackAmount,
  setTokenContractCallback,
  slippageBps,
}: Props) => {

  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;
  const signer = tradeData.signer;
  const provider = signer?.provider;

  // Determine initial state based on price input type
  const initialAmount: bigint | undefined =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? tradeData?.sellAmount : tradeData?.buyAmount;

      const [sellAmount, setSellAmount] = useSellAmount();
      const [buyAmount, setBuyAmount] = useBuyAmount();
      
  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? tradeData?.sellTokenContract : tradeData?.buyTokenContract
  );

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address || BURN_ADDRESS as Address;
  const debouncedAmount = useDebounce(amount);

  useEffect(() => {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount);
  }, []);

  // useEffect(() => {
  //   if (tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN)
  //     alert(`TRADE_DIRECTION.BUY_EXACT_IN -> AssetContainer:sellAmount = ${sellAmount}`)
  //   else
  //     alert(`TRADE_DIRECTION.BUY_EXACT_OUT -> AssetContainer:buyAmount  = ${buyAmount}`)
  // }, [sellAmount, buyAmount]);

  useEffect(() => {
    console.debug(`***tokenSelectContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      tradeData.sellTokenContract = tokenContract :
      tradeData.buyTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() => {
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect(() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      tradeData.sellAmount = debouncedAmount :
      tradeData.buyAmount = debouncedAmount;
    setCallbackAmount(debouncedAmount)
  }, [debouncedAmount])

  useEffect(() => {
    const decimals: number = activeContract?.decimals || 0;
    const stringValue: string = getValidBigIntToFormattedPrice(updateAmount, decimals)
    if (stringValue !== "") {
      setFormattedAmount(stringValue);
    }
    setAmount(updateAmount);
  }, [updateAmount]);

  // const bigIntBalanceOf: bigint | undefined = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  // useEffect(() => {
  //   if (bigIntBalanceOf) {
  //     alert(`bigIntBalanceOf: ${bigIntBalanceOf}`)
  //   }
  // }, [bigIntBalanceOf]);
  
  // const getBalanceInWei = async () => {
  //   if (isActiveNetworkAddress(exchangeContext, TOKEN_CONTRACT_ADDRESS)) {
  //     await delay(400);
  //     const newBal = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
  //     setBalanceInWei(newBal);
  //   } else {
  //     if (TOKEN_CONTRACT_ADDRESS && TOKEN_CONTRACT_ADDRESS !== BURN_ADDRESS && signer) {
  //       const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
  //       const newBal: bigint = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
  //       setBalanceInWei(newBal);
  //     } else {
  //       setBalanceInWei(undefined);
  //     }
  //   }
  // };

  useEffect(() => {
    if (activeContract) {
      activeContract.balance = balanceInWei || 0n;
    }
  }, [balanceInWei]);

  useEffect(() => {
    if (activeContract) {
      // activeContract.balance = useBalanceInWei || 0n;
      alert(`useBalanceInWei = ${stringifyBigInt()}`)
    }
  }, [useBalanceInWei]);

  useEffect(() => {
    // const balanceInWei = useBalanceInWei(TOKEN_CONTRACT_ADDRESS, provider, signer)
    // setBalanceInWei(balanceInWei);
    setBalanceInWei(9999999n);
    // getBalanceInWei();
  }, [ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS, amount]);

  useEffect(() => {
    if (tokenContract) {
      const decimals: number = tokenContract.decimals || 0;
      tokenContract.balance = balanceInWei || 0n;
      const formattedBalance = ethers.formatUnits(balanceInWei || 0n, decimals);
      setFormattedBalance(formattedBalance);
    } else {
      setFormattedBalance("Undefined");
    }
  }, [balanceInWei, activeContract?.balance]);

  const setDecimalAdjustedContract = (newTokenContract: TokenContract | undefined) => {
    const decimalAdjustedAmount: bigint = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    setAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract);
  };

  const setTextInputValue = (stringValue: string) => {
    setStringToBigIntStateValue(stringValue);
    setTransactionType(containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      TRADE_DIRECTION.SELL_EXACT_OUT :
      TRADE_DIRECTION.BUY_EXACT_IN);
  };

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  };

  const buySellText = isWrappingTransaction(exchangeContext) ?
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? "You Exactly Pay" : "You Exactly Receive" :
    tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT ?
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? "You Exactly Pay" : `You Receive +-${slippageBps * 100}%` :
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? `You Pay +-${slippageBps * 100}%` : "You Exactly Receive";

      const dumpParms = (
        // tradeData: any,
        // sellAmount: bigint,
        // buyAmount: bigint,
        // formattedAmount: string,
        cType?: CONTAINER_TYPE // Optional parameter
      ) => {
      
        // Ensure cType is either undefined or matches tradeData.containerType
        if (cType === undefined || containerType === cType) {
          let msg = `tokenSelectContainer ${buySellText}\n`;
    
          msg += `TransSelectContainer Type = ${containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER 
            ? 'SELL_SELECT_CONTAINER' : 'BUY_SELECT_CONTAINER'}\n`;
    
          msg += `TRADE_DIRECTION           = ${tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN
            ? 'BUY_EXACT_IN' : 'SELL_EXACT_OUT'}\n`;
    
          msg += `sellAmount                  = ${sellAmount}\n`;
          msg += `buyAmount                   = ${buyAmount}\n`;
          msg += `formattedAmount             = ${formattedAmount}\n`;
      
          alert(msg);
        }
      };
    
      useEffect(() => {
        dumpParms(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
        dumpParms(CONTAINER_TYPE.BUY_SELECT_CONTAINER);
      // }, [debouncedAmount]);
    }, [sellAmount, buyAmount]);

  return (
    <div className={styles["inputs"] + " " + styles["tokenSelectContainer"]}>
      <input className={styles.priceInput} placeholder="0" disabled={!activeContract} value={formattedAmount || ""}
        onChange={(e) => { setTextInputValue(e.target.value) }}
        onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()) }}
      />
      <TokenSelect exchangeContext={exchangeContext} containerType={containerType} tokenContract={tokenContract} setDecimalAdjustedContract={setDecimalAdjustedContract} />
      <div className={styles["buySell"]}>{buySellText}</div>
      <div className={styles["assetBalance"]}> Balance: {formattedBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? <ManageSponsorsButton tokenContract={tokenContract} /> : <AddSponsorButton />) : null}
    </div>
  );
};

export default tokenSelectContainer;
