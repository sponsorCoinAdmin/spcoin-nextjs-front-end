"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import customUnknownImage_png from '@/public/resources/images/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '@/public/resources/images/info1.png'
import Image from 'next/image'
import { AccountRecord, FEED_TYPE, TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
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
    const [tokenInput, setTokenInput] = useState<Address>();
    const [tokenSelect, setTokenSelect] = useState("");
    const [tokenContract, setTokenContract] = useState<TokenContract>();

     useEffect(() => {
        showDialog ? openDialog() : closeDialog()
    }, [showDialog])

    const closeDialog = () => {
        setTokenInput(undefined)
        setTokenSelect("");
        setShowDialog(false);
        dialogRef.current?.close()
    }

    const openDialog = () => {
        setShowDialog(true);
        dialogRef.current?.showModal();
    }

    useEffect( () => {
        // alert(`ZZZZZZZZZZZZZZZZZZZ tokenInput = "${tokenInput}"`)

        // tokenInput === "" ? hideElement('inputSelectGroup_ID') : showElement('inputSelectGroup_ID')
        if (isAddress(tokenInput)) {
            setTokenDetails(tokenInput)
        }
        else
            if (tokenInput)
                setTokenSelect("Invalid Token Address");
            else
                setTokenSelect("")
    }, [tokenInput]);

    useEffect( () => {
        // alert("TokenContract Changed "+tokenInput)
        if (tokenContract?.symbol != undefined)
            setTokenSelect(tokenContract.symbol);
    }, [tokenContract]);

    const displayElementDetail = async(tokenAddr:any) => {
        if (!(await setTokenDetails(tokenAddr))) {
            alert("SELECT_ERROR:displayElementDetail Invalid Token Address: " + tokenInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        // alert("displayElementDetail\n" + JSON.stringify(tokenInput, null, 2) + "\n\n" + ELEMENT_DETAILS)
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
                alert("Invalid Token address : " + tokenInput)
                return false;
            }
            if (!isAddress(listElement.address)) {
                alert(`${listElement.name} has invalid token address : ${listElement.address}`)
                return false;
            }
            if (listElement.address === altTokenContract?.address) {
                alert("Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")")
                console.log("Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")");
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
                <InputSelect placeHolder={INPUT_PLACE_HOLDER} setTokenInput={setTokenInput} textInputField={tokenInput}/>

                {(tokenSelect !== "" && 
                    <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
                        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                            <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(tokenContract)} >
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
                )}

                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} getSelectedListElement={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
