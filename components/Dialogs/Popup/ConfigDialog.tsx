"use client"
import { useEffect, useRef } from 'react';
import styles from '@/styles/Modal.module.css';
import SlippageBpsRadioButtons from './SlippageBpsRadioButtons';

type Props = {
    showDialog:boolean
}

export default function Dialog({showDialog}:Props) {
    useEffect(() => {
        showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close()
    }, [showDialog])

    const dialogRef = useRef<null | HTMLDialogElement>(null)
    // 
    //   const [errorMessage, setErrorMessage] = useErrorMessage();
    

    // useEffect(() => {
    //     alert(JSON.stringify(errorMessage,null,2))
    // }, [errorMessage])
  
    const closeDialog = () => {
        dialogRef.current?.close();
    }

    const Dialog = (
        <dialog id="onfigDialog" ref={dialogRef} className={styles.popupContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-white">
                <h1 className="text-md indent-39 mt-1 text-bg-txt-ltgry">Settings</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-bg-txt-ltgry"
                    onClick={closeDialog}
                >X</div>
            </div>
            <div >
                <div className={styles.modalScrollBar}>
                <SlippageBpsRadioButtons />
                    {/* <h1>{slippageBps}</h1> */}
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
