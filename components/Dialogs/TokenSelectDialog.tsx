"use client"
import styles from './Resources/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import searchMagGlassGrey_png from '../../public/resources/images/SearchMagGlassGrey.png'
import customUnknownImage_png from '../../public/resources/images/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '../../public/resources/images/info1.png'
import Image from 'next/image'
import { FEED_TYPE, TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6
import { hideElement, showElement } from '@/lib/spCoin/guiControl';
import { getTokenDetails, fetchTokenDetails, stringifyBigInt } from '@/lib/spCoin/utils';
import DataList from './Resources/DataList';
import { BURN_ADDRESS } from '@/lib/network/utils';
import { useAccount } from 'wagmi';

const TITLE_NAME = "Select a token to select";
const INPUT_PLACE_HOLDER = 'Type or paste token to select address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

type Props = {
    // title: string,
    // onClose: () => void,
    // onOk: () => void,
    showDialog:boolean,
    setShowDialog:(bool:boolean) => void,
    altTokenContract: TokenContract,
    callBackSetter: (tokenContract:TokenContract) => void,
    // children: React.ReactNode,
}

// ToDo Read in data List remotely
export default function Dialog({showDialog, setShowDialog, altTokenContract, callBackSetter }: Props) {
    const ACTIVE_ACCOUNT = useAccount();
    const dialogRef = useRef<null | HTMLDialogElement>(null)
    const [tokenInput, setTokenInput] = useState("");
    const [tokenSelect, setTokenSelect] = useState("");
    const [TokenContract, setTokenContract] = useState<TokenContract| undefined>();
    const chainId = altTokenContract.chainId;
    const connectedAccountAddr = ACTIVE_ACCOUNT.address || BURN_ADDRESS;

    useEffect(() => {
        // alert(`Dialog.altTokenContract = ${stringifyBigInt(altTokenContract)}`)
      }, []);

      useEffect(() => {
        if (showDialog === true) {
            dialogRef.current?.showModal()
        } else {
            dialogRef.current?.close()
        }
    }, [showDialog])

    useEffect( () => {
        // alert("tokenInput Changed "+tokenInput)
        tokenInput === "" ? hideElement('selectTokenDialog_ID') : showElement('selectTokenDialog_ID')
        if (isAddress(tokenInput)) {
            setTokenDetails(tokenInput, setTokenContract)
        }
        else
            setTokenSelect("Invalid Token Address");
    }, [tokenInput]);

    useEffect( () => {
        // alert("TokenContract Changed "+tokenInput)
        if (TokenContract?.symbol != undefined)
            setTokenSelect(TokenContract.symbol);
    }, [TokenContract]);

    const closeDialog = () => {
        setTokenInput("")
        setTokenSelect("");
        setShowDialog(false);
    //     hideElement('selectTokenDialog_ID')
    //     dialogRef.current?.close()
    }



    const setTokenInputField = (event:any) => {
        setTokenInput(event.target.value)
    }

    const setTokenDetails = async(tokenAddr: any, setTokenContract:any) => {
        return getTokenDetails(connectedAccountAddr, chainId, tokenAddr, setTokenContract)
    }

    const displayElementDetail = async(tokenAddr:any) => {
        if (!(await setTokenDetails(tokenAddr, setTokenContract))) {
            alert("SELECT_ERROR:displayElementDetail Invalid Token Address: " + tokenInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        // alert("displayElementDetail\n" + JSON.stringify(tokenInput, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: TokenContract | undefined) => {
        // alert("getSelectedListElement: " +JSON.stringify(listElement,null,2))
        try {
            if (listElement === undefined) {
                alert("Invalid Token address : " + tokenInput)
                return false;
            }
            if (!isAddress(listElement.address)) {
                alert(`${listElement.name} has invalid token address : ${listElement.address}`)
                return false;
            }
            if (listElement.address === altTokenContract.address) {
                alert("Sell Token cannot be the same as Buy Token("+altTokenContract.symbol+")")
                console.log("Sell Token cannot be the same as Buy Token("+altTokenContract.symbol+")");
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
                <div className={styles.modalElementSelect}>
                    <div className={styles.leftH}>
                        <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
                        <input id="tokenInput" className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setTokenInputField} value={tokenInput}/>
                        &nbsp;
                    </div>
                </div>
                    <div id="selectTokenDialog_ID" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(TokenContract)} >
                            <Image id="tokenImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Search Image Grey" />
                            <div>
                                <div className={styles.elementName}>{tokenSelect}</div>
                                <div className={styles.elementSymbol}>{"User Specified Token"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(tokenInput)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
