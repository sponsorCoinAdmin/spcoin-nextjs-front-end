'use client'

import React, { useEffect, useState } from "react";

import styles from '@/styles/Modal.module.css';
// import searchMagGlassBlack_png from './assets/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './assets/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../assets/SearchMagGlassGrey.png'
// import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import { fetchIconResource, getValidAddress, invalidTokenContract, stringifyBigInt } from '@/lib/spCoin/utils';
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import Image from 'next/image'
import { TokenContract, useErc20NetworkContract, useErc20TokenContract } from "@/lib/wagmi/wagmiERC20ClientRead";
import { Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { isActiveAccountAddress } from "@/lib/network/utils";

type Props = {
  placeHolder:string,
  passedInputField:any,
  setTokenContractCallBack:(tokenContract:TokenContract|undefined) => void 
}

function InputSelect({ placeHolder, passedInputField, setTokenContractCallBack }:Props) {
  const chainId = useChainId();
  const [ textInputField, setTextInputField ] = useState<any>();
  const [ validAddress, setValidAddress ] = useState<Address|undefined>();
  const [ tokenAddress, setTokenAddress ] = useState<Address|undefined>();
  const [ networkAddress, setNetworkAddress ] = useState<Address|undefined>();
  const tokenContract:TokenContract|undefined = useErc20TokenContract(tokenAddress);
  const networkContract:TokenContract|undefined = useErc20NetworkContract(networkAddress);
  // const ACTIVE_ACCOUNT_ADDRESS = useAccount().address;
  const debouncedText = useDebounce(textInputField);

  // const getActiveAccountAddress = () => {
  //   return ACTIVE_ACCOUNT_ADDRESS;
  // }
  
  const isActiveNetworkAddress = (address:Address|undefined) => {
    return isActiveAccountAddress(address)
    // return (address === getActiveAccountAddress());
  }
    
  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    if (tokenContract?.address) {
      // alert(`tokenContract = ${stringifyBigInt(tokenContract)}`)
      fetchIconResource(tokenContract, setTokenContractCallBack)
    }
    else {
      setTokenContractCallBack(tokenContract);
    }
  }, [tokenContract?.name, tokenContract?.symbol, tokenContract?.decimals, tokenContract?.totalSupply])

  useEffect(() => {
    if (networkContract?.address) {
      // alert(`networkContract = ${stringifyBigInt(networkContract)}`)
      fetchIconResource(networkContract, setTokenContractCallBack)
    }
    else {
      setTokenContractCallBack(networkContract);
      // alert (`Empty Contract(${stringifyBigInt(networkContract)})`)
    }
  }, [networkContract?.name, networkContract?.symbol, networkContract?.decimals, networkContract?.totalSupply])

  useEffect(() => {
    const validAddress = getValidAddress(debouncedText);

    if (validAddress) {
      setContractType(validAddress)
    } else {
      const invalidToken:TokenContract|undefined = invalidTokenContract(debouncedText, chainId)
      setTokenContractCallBack(invalidToken);
    }
  }, [debouncedText])

  useEffect(() => {
    if (validAddress) {
      isActiveNetworkAddress(validAddress) ? setNetworkAddress(validAddress) : setTokenAddress(validAddress);
    }
  }, [validAddress])

  const setContractType = ( passedValidAddress:Address | undefined ) => {
    if (!isActiveNetworkAddress(validAddress)) {
      if (passedValidAddress === validAddress) {
        setTokenContractCallBack(tokenContract);
      } else {
        setValidAddress(passedValidAddress)
      }
    }
  }

  return (
    <div className={styles.modalElementSelect}>
      <div className={styles.leftH}>
        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
        <input className={styles.modalElementSelect} 
               autoComplete="off" 
               placeholder={placeHolder} 
               value={textInputField || ""} 
               onChange={(e) => setTextInputField(e.target.value)}/>
      </div>
    </div>
  );
}

export default InputSelect;
