"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png'
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png'
import info_png from '@/public/assets/miscellaneous/info1.png'
import Image from 'next/image'
import { FEED_TYPE, AccountRecord } from '@/lib/structure/types';
import { isAddress } from 'ethers'; // ethers v6
import DataList from './Resources/DataList';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';
import { Account } from 'viem';
import { exchangeContext } from '@/lib/context';

const TITLE_NAME = "Select a Recipient";
const INPUT_PLACE_HOLDER = 'Type or paste recipient wallet address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid recipient address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."

// ToDo Read in data List remotely
type Props = {
    callBackRecipientAccount: (accountRecord:AccountRecord) => void,
    setShowDialog: (showDialog:boolean) => void,
    showDialog:boolean
}

export default function Dialog({showDialog, setShowDialog, callBackRecipientAccount }: Props) {
    const dialogRef = useRef<null | HTMLDialogElement>(null);
    const [recipientInput, setRecipientInput] = useState("");
    const [walletSelect, setWalletSelect] = useState("");
    const [walletElement, setWalletElement] = useState<AccountRecord| undefined>();
    const agentAccount = exchangeContext.agentAccount;

    useEffect(() => {
        showDialog ? openDialog() : closeDialog();
    }, [showDialog])

    const closeDialog = () => {
        setRecipientInput("")
        setWalletSelect("");
        setShowDialog(false);
        dialogRef.current?.close();
    }

    const openDialog = () => {
        setShowDialog(true);
        dialogRef.current?.showModal();
    }

    useEffect( () => {
        // alert("recipientInput Changed to "+recipientInput)
        recipientInput === "" ? hideElement('recipientSelectGroup_ID') : showElement('recipientSelectGroup_ID')
        if (isAddress(recipientInput)) {
            setWalletDetails(recipientInput)
        }
        else
            setWalletSelect("Invalid Wallet Address");
    }, [recipientInput]);

    useEffect( () => {
        // alert("walletElement Changed to "+recipientInput)
        if (walletElement?.symbol != undefined)
            setWalletSelect(walletElement.symbol);
    }, [walletElement]);
    
    const setRecipientInputField = (event:any) => {
        setRecipientInput(event.target.value)
    }

    const setWalletDetails = async(walletAddr:any) => {
        try {
            if (isAddress(walletAddr)) {
                let retResponse:any = await getWagmiBalanceOfRec (walletAddr)
                // console.debug("retResponse = " + JSON.stringify(retResponse))
                // alert(JSON.stringify(retResponse,null,2))
                let td:AccountRecord = {
                    address: recipientInput,
                    symbol: retResponse.symbol,
                    img: '/assets/miscellaneous/QuestionWhiteOnRed.png',
                    name: '',
                    url: "ToDo add AccountRecord URL"
                }
                setWalletElement(td);
                return true
            }
       // return ELEMENT_DETAILS
        } catch (e:any) {
            alert("ERROR:setWalletDetails e.message" + e.message)
        }
        return false
    }

    const displayElementDetail = async(elementAddress:any) => {
        let x = setWalletDetails(elementAddress)
         if (!(await setWalletDetails(elementAddress))) {
            alert("*** ERROR *** Invalid Wallet Address: " + recipientInput + "\n\n" + ELEMENT_DETAILS)
            return false
        }
        alert("displayElementDetail\n" + JSON.stringify(walletElement, null, 2) + "\n\n" + ELEMENT_DETAILS)
        return true
    }

    const getSelectedListElement = (listElement: AccountRecord | undefined) => {
        // console.debug("getSelectedListElement:listElement     : " +JSON.stringify(listElement,null,2))
        // console.debug("getSelectedListElement:agentAccount: " +JSON.stringify(agentAccount,null,2))
        if (listElement === undefined) {
            alert("Invalid Wallet address : " + recipientInput)
            return false;
        }
        if (listElement?.address === agentAccount?.address) {
            alert("Recipient cannot be the same as Recipient("+agentAccount.symbol+")")
            console.log("Recipient cannot be the same as Recipient("+agentAccount.symbol+")");
            return false;
        }
        let urlParms:string = `/Recipient/${listElement.address}`

        listElement.url = `/Recipient/${listElement.address}?url=${listElement.url}`

        callBackRecipientAccount(listElement)
        closeDialog()
    }

     const Dialog = (
        <dialog id="recipientDialog" ref={dialogRef} className={styles.modalContainer}>
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
                        <input id="recipientInput" className={styles.modalElementSelect} autoComplete="off" placeholder={INPUT_PLACE_HOLDER} onChange={setRecipientInputField} value={recipientInput}/>
                        &nbsp;
                    </div>
                </div>
                <div id="recipientSelectGroup_ID" className={styles.modalInputSelect}>
                    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                        <div className="cursor-pointer flex flex-row justify-between" onClick={() => getSelectedListElement(walletElement)} >
                            <Image id="walletImage" src={customUnknownImage_png} className={styles.elementLogo} alt="Search Image Grey" />
                            <div>
                                <div className={styles.elementName}>{walletSelect}</div>
                                <div className={styles.elementSymbol}>{"User Specified Wallet"}</div> 
                            </div>
                        </div>
                        <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => displayElementDetail(recipientInput)}>
                            <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                        </div>
                    </div>
                </div>
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.RECIPIENT_WALLETS} updateTokenCallback={getSelectedListElement}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
