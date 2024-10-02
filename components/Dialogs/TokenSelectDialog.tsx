"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import customUnknownImage_png from '/public/resources/images/miscellaneous/QuestionWhiteOnBlue.png'
import info_png from '@/public/resources/images/info1.png'
import Image from 'next/image'
import { FEED_TYPE, TokenContract } from '@/lib/structure/types';
import { isAddress } from 'ethers';
import { getTokenDetails, fetchTokenDetails, stringifyBigInt } from '@/lib/spCoin/utils';
import DataList from './Resources/DataList';
import { useAccount } from 'wagmi';
import InputSelect from '../panes/InputSelect';
import { Address } from 'viem';

const TITLE_NAME = "Select a token to select";
const INPUT_PLACE_HOLDER = 'Type or paste token to select address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

type Props = {
    showDialog:boolean,
    setShowDialog:(bool:boolean) => void,
    altTokenContract: TokenContract|undefined,
    callBackSetter: (tokenContract:TokenContract) => void,
}

// ToDo Read in data List remotely
export default function Dialog({showDialog, setShowDialog, altTokenContract, callBackSetter }: Props) {
    const ACTIVE_ACCOUNT = useAccount();
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenAddress, setTokenAddress] = useState<Address|undefined>();
    const [tokenName, setTokenName] = useState<string|undefined>();
    const [tokenSymbol, setTokenSymbol] = useState<string|undefined>();
    let tokenContract:TokenContract|undefined;

     useEffect(() => {
        showDialog ? openDialog() : closeDialog()
    }, [showDialog])

    const setTokenContract = (_tokenContract:TokenContract) => {
        tokenContract = _tokenContract;
        setTokenAddress(tokenContract.address)
        if (isAddress(tokenContract.address)) {
            // alert(`TokenSelectDialog.tokenContract = ${stringifyBigInt(tokenContract)}`)
            setTokenName(tokenContract.name);
            setTokenSymbol(tokenContract.symbol);
        }
        else
            if (tokenAddress) {
                setTokenName("Invalid Token Address");
                setTokenSymbol("Please Enter Valid Token Address");
            }
            else {
                setTokenName(undefined)
                setTokenSymbol(undefined)
            }
    }

    const setTokenContractCallBack = (_tokenContract:TokenContract) => {
        // alert(`TestSelectDialog.setTokenContractCallBack = ${stringifyBigInt(tokenContract)}`)
        setTokenContract(_tokenContract);
    }

    const closeDialog = () => {
        setTokenAddress(undefined)
        setTokenSymbol(undefined);
        setShowDialog(false);
        dialogRef.current?.close()
    }

    const openDialog = () => {
        // alert(`tokenSymbol = ${tokenSymbol}`)
        setShowDialog(true);
        dialogRef.current?.showModal();
    }

    const displayElementDetail = async(tokenAddr:any) => {
        if (!(await setTokenDetails(tokenAddr))) {
            alert("SELECT_ERROR:displayElementDetail Invalid Token Address: " + tokenAddress + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        // alert("displayElementDetail\n" + JSON.stringify(tokenAddress, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const setTokenDetails = async(tokenAddr: any) => {
        const tokenDetails = getTokenDetails(ACTIVE_ACCOUNT.address, ACTIVE_ACCOUNT.chainId, tokenAddr, setTokenContract)
        console.debug(`tokenDetails = ${tokenDetails}`);
        return tokenDetails
    }

     const getSelectedListElement = (listElement: TokenContract | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        try {
            if (listElement === undefined) {
                alert("SELECT_ERROR: Invalid Token address : " + tokenAddress)
                return false;
            }
            if (!isAddress(listElement.address)) {
                alert(`SELECT_ERROR: ${listElement.name} has invalid token address : ${listElement.address}`)
                return false;
            }
            if (listElement.address === altTokenContract?.address) {
                alert("SELECT_ERROR: Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")")
                console.log("ERROR: Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")");
                return false;
            }
            callBackSetter(listElement)
            closeDialog()
        } catch (e:any) {
            alert("SELECT_ERROR:getSelectedListElement e.message" + e.message)
        }
        return false
    }

    const Dialog = (
        <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>
            <div className={styles.modalBox} >
                <InputSelect placeHolder={INPUT_PLACE_HOLDER}
                             textInputField={tokenAddress}
                             setTokenContractCallBack={setTokenContractCallBack}/>

                {(tokenSymbol && 
                    <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
                        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                            <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(tokenContract)} >
                                <Image id="tokenImage" 
                                       src='/resources/images/miscellaneous/QuestionWhiteOnBlue.png' 
                                       height={40}
                                       width={40}
                                       alt="Search Image" />
                                    {/* className={styles.elementLogo}  */}
                                <div>
                                    <div className={styles.elementName}>{tokenName}</div>
                                    <div className={styles.elementSymbol}>{tokenSymbol}</div> 
                                </div>
                            </div>
                            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(tokenAddress)}>
                                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                            </div>
                        </div>
                    </div>
                )}
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
