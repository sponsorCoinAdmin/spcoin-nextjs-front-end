"use client"
import { ErrorMessage } from '@/lib/structure/types';
import styles from '@/styles/Modal.module.css';

import { useEffect, useRef, useState } from 'react'

type Props = {
    errMsg: ErrorMessage|undefined,
    showDialog:boolean
}

export default function Dialog({showDialog, errMsg}:Props) {
    useEffect(() => {
        showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close()
    }, [showDialog])

    const dialogRef = useRef<null | HTMLDialogElement>(null)

    // useEffect(() => {
    //     alert(JSON.stringify(errorMessage,null,2))
    // }, [errorMessage])
  
    const closeDialog = () => {
        dialogRef.current?.close();
    }

    const Dialog = (
        <dialog id="errorDialog" ref={dialogRef} className={styles.modalContainer}>
            <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
                <h1 className="text-sm indent-9 mt-1">{errMsg?.source}</h1>
                <div className="cursor-pointer rounded border-none w-5 text-xl text-white"
                    onClick={closeDialog}
                >X</div>
            </div>

            <div className={styles.modalBox}>
                <div className={styles.modalScrollBar}>
                    <h1>SourceCode:{errMsg?.source}</h1>
                    <div>
                        ErrorMessage:{errMsg?.errCode}
                    </div>
                    <div>
                        ErrorMessage:{errMsg?.msg}
                    </div>
                </div>
            </div>
        </dialog>
    )
    return Dialog
}
