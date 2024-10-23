'use client'

import React, { useEffect, useState } from "react";

import styles from '@/styles/Modal.module.css';
// import searchMagGlassBlack_png from './Resources/images/searchMagGlassBlack.png'
// import searchMagGlassWhite_png from './Resources/images/searchMagGlassWhite.png'
// import searchMagGlassGrey_png from '../../../resources/images/SearchMagGlassGrey.png'
// import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import { fetchIconResource, getValidAddress, invalidTokenContract, stringifyBigInt } from '@/lib/spCoin/utils';
import searchMagGlassGrey_png from '@/public/resources/images/SearchMagGlassGrey.png'
import Image from 'next/image'
import { TokenContract, useErc20NetworkContract, useErc20TokenContract } from "@/lib/wagmi/erc20WagmiClientRead";
import { Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useDebounce } from "@/lib/hooks/useDebounce";

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
  const ACTIVE_ACCOUNT_ADDRESS = useAccount().address;
  const debouncedText = useDebounce(textInputField);

  const getActiveAccountAddress = () => {
    return ACTIVE_ACCOUNT_ADDRESS;
  }
  
  const isActiveNetworkAddress = (address:Address|undefined) => {
    return (address === getActiveAccountAddress());
  }
    
  useEffect(() => {
    setTextInputField(passedInputField)
  }, [passedInputField])

  useEffect(() => {
    if (tokenContract?.address) {
      // alert(`tokenContract = ${stringifyBigInt(tokenContract)}`)
      fetchIconResource(tokenContract, setTokenContractCallBack)
      // console.debug(`HERE 1 tokenContract = ${stringifyBigInt(tokenContract)}`)
    }
    else {
      setTokenContractCallBack(tokenContract);
      // console.debug(`HERE 2 tokenContract = ${stringifyBigInt(tokenContract)}`)
      // alert (`Empty Contract(${stringifyBigInt(tokenContract)})`)
    }
  }, [tokenContract?.name, tokenContract?.symbol, tokenContract?.decimals, tokenContract?.totalSupply])

  useEffect(() => {
    if (networkContract?.address) {
      // alert(`networkContract = ${stringifyBigInt(networkContract)}`)
      fetchIconResource(networkContract, setTokenContractCallBack)
      // console.debug(`HERE 1 networkContract = ${stringifyBigInt(networkContract)}`)
    }
    else {
      setTokenContractCallBack(networkContract);
      // console.debug(`HERE 2 networkContract = ${stringifyBigInt(networkContract)}`)
      // alert (`Empty Contract(${stringifyBigInt(networkContract)})`)
    }
  }, [networkContract?.name, networkContract?.symbol, networkContract?.decimals, networkContract?.totalSupply])

  useEffect(() => {
    const validAddress = getValidAddress(debouncedText);

    if (validAddress) {
      setContractType(validAddress)
      console.debug(`HERE 4 Valid Token  debouncedText = ${debouncedText}`)
    } else {
      const invalidToken:TokenContract|undefined = invalidTokenContract(debouncedText, chainId)
      setTokenContractCallBack(invalidToken);
      console.debug(`HERE 3 Invalid Token  debouncedText = ${stringifyBigInt(invalidToken)}`)
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
