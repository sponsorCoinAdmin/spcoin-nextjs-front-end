"use client"
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react'
import info_png from '@/public/resources/images/info1.png'
import Image from 'next/image'
import { FEED_TYPE, TokenContract } from '@/lib/structure/types';
import { isAddress } from 'ethers';
import { defaultMissingImage, fetchIconResource, getTokenDetails, getValidAddress, stringifyBigInt } from '@/lib/spCoin/utils';
import DataList from './Resources/DataList';
import { useAccount } from 'wagmi';
import InputSelect from '../panes/InputSelect';
import { Address, getAddress } from 'viem';
import { useErc20ClientContract } from '@/lib/wagmi/erc20WagmiClientRead';

const TITLE_NAME = "Select a token to select";
const INPUT_PLACE_HOLDER = 'Type or paste token to select address';
const ELEMENT_DETAILS = "This container allows for the entry selection of a valid token address.\n"+
    "When the address entry is completed and selected, "+
    "this address will be verified prior to entry acceptance.\n"+
    "Currently, there is no image token lookup, but that is to come."
const INVALID_TOKEN_NAME = "Invalid Token Address";
const INVALID_TOKEN_SYMBOL = "Please Enter Valid Token Address";

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
    const [inputField, setInputField] = useState<any>();
    const [validAddress, setValidAddress] = useState<Address>();
    const [tokenName, setTokenName] = useState<string|undefined>();
    const [tokenSymbol, setTokenSymbol] = useState<string|undefined>();
    const [tokenIconPath, setTokenIconPath] = useState<string|undefined>()
    const tokenContract = useErc20ClientContract(validAddress);

    useEffect(() => {
        showDialog ? openDialog() : closeDialog()
    }, [showDialog])

    useEffect(() => {
        if (tokenContract && tokenIconPath) {
            // alert(`TokenSelectDialog:useEffect:tokenIconPath = (${tokenIconPath})`)
            tokenContract.img = tokenIconPath;
        }
    }, [tokenIconPath])

    useEffect(() => {
        // alert(`BEFORE: TokenSelectDialog:useEffect[inputField] = ${inputField}`)
        let chainId:number|undefined = ACTIVE_ACCOUNT.chainId;
        const contractAddress:Address|undefined = getValidAddress(inputField, chainId);
        // alert(`AFTER:  TokenSelectDialog:useEffect[contractAddress] = ${contractAddress}`)
        if (contractAddress) {
            fetchIconResource(contractAddress, setTokenIconPath);
            setValidAddress(contractAddress)
        }
        else{
            setTokenName(INVALID_TOKEN_NAME);
            setTokenSymbol(INVALID_TOKEN_SYMBOL);
        }
    }, [inputField])

    useEffect(() => {
        if (tokenContract) {
            // alert(`TokenSelectDialog:useEffect[tokenContract] = ${stringifyBigInt(tokenContract)}`)
            setTokenName(tokenContract.name || INVALID_TOKEN_NAME);
            setTokenSymbol(tokenContract.symbol || INVALID_TOKEN_SYMBOL);
            tokenContract.img = tokenIconPath;
        }
    }, [tokenContract])

    const closeDialog = () => {
        setInputField(undefined)
        setShowDialog(false);
        dialogRef.current?.close()
    }

    const openDialog = () => {
        // alert(`openDialog:tokenSymbol = ${tokenSymbol}`)
        setShowDialog(true);
        dialogRef.current?.showModal();
    }

    const updateTokenCallback = (tokenContract: TokenContract | undefined) => {
        // alert(`**************updateTokenCallback(tokenContract) = ${stringifyBigInt(tokenContract)}`)
        try {
            if (!tokenContract) {
                alert("SELECT_ERROR: Invalid Token address : " + inputField);
                return false;
            }
            if (!isAddress(tokenContract.address)) {
                alert(`SELECT_ERROR: ${tokenContract.name} has invalid token address : ${tokenContract.address}`);
                return false;
            }
            if (tokenContract.address === altTokenContract?.address) {
                alert("SELECT_ERROR: Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")")
                console.log("ERROR: Sell Token cannot be the same as Buy Token("+altTokenContract?.symbol+")");
                return false;
            }
            callBackSetter(tokenContract)
            closeDialog()
        } catch (e:any) {
            alert("SELECT_ERROR:updateTokenCallback e.message" + e.message)
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
                             inputField={inputField || ""}
                             setInputField={setInputField}/>

                {(inputField &&
                    <div id="inputSelectGroup_ID" className={styles.modalInputSelect}>
                        <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900" >
                            <div className="cursor-pointer flex flex-row justify-between" onClick={() => updateTokenCallback(tokenContract)} >
                                <Image id="tokenImage" 
                                       src={tokenIconPath || defaultMissingImage }
                                       height={40}
                                       width={40}
                                       alt="Search Image" />
                                    {/* className={styles.elementLogo}  */}
                                <div>
                                    <div className={styles.elementName}>{tokenName}</div>
                                    <div className={styles.elementSymbol}>{tokenSymbol}</div> 
                                </div>
                            </div>
                            <div className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"  onClick={() => alert(stringifyBigInt(tokenContract))}>
                                <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
                            </div>
                        </div>
                    </div>
                )}
                {/* <div>FTM 0x4e15361fd6b4bb609fa63c81a2be19d873717870</div>
                <div>FLOK 0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E</div>
                <div>AAVI 0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9</div>
                <div>CHKN 0xD55210Bb6898C021a19de1F58d27b71f095921Ee</div> */}
                <div className={styles.modalScrollBar}>
                    <DataList dataFeedType={FEED_TYPE.TOKEN_LIST} updateTokenCallback={updateTokenCallback}/>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
