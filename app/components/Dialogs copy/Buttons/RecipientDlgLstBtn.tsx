'use client'
import  React, { ReactNode, useRef, useEffect, useState} from 'react'
import '../Styles/Modal.module.css';
import dataList from '../Resources/data/tokens/mainNetTokenList.json';
import Dialog from '../RecipientDlgLst';

type TokenElement = {
  symbol: string;
  img: string;
  name: string;
  address: string;
  decimals: number;
}

type Props = {
  getDlgLstElement: (listElement: TokenElement) => void,
  onClose:  () => void,
}

const dialogName ='Sponsor a recipient';
const selectElement ='Search recipient Name or paste Address';
  
// Parent component
function DlgLstBtn({ getDlgLstElement, onClose }: Props) {

  return (
    <>
      <Dialog titleName={dialogName} selectElement={selectElement} dataList={dataList} onClose={onClose} getDlgLstElement={getDlgLstElement} />

      <div className="ModalButton">
        <button
          className="bluBtn"
          onClick={() => {
              const dialog = document.querySelector("#RecipientDialogList")
                dialog?.show()
          }}
        >
        Recipient List
        </button>
      </div>
    </>
  )
}

export default DlgLstBtn
