'use client'
import  React, { ReactNode, useRef, useEffect, useState} from 'react'
import '../Styles/modal.css';
import dataList from '../Resources/data/tokenEthList.json';
import Dialog from '../Dialog';

type ListElement = {
  chainId: number;
  symbol: string;
  img: string;
  name: string;
  address: string;
  decimals: number;
}

type Props = {
  getDlgLstElement: (listElement: ListElement) => void,
  onClose:  () => void,
}

const dialogName ='Select a token';
const selectElement ='Search token name or paste address'; 

// Parent component
function DlgLstBtn({ getDlgLstElement, onClose }: Props) {

  return (
    <>
      <Dialog titleName={dialogName} selectElement={selectElement} dataList={dataList} onClose={onClose} getDlgLstElement={getDlgLstElement}/>

      <div className="ModalButton">
        <button
          className="bluBtn"
          onClick={() => {
              const dialog = document.querySelector("#dialogList")
                dialog?.show()
          }}
        >
        Token List
        </button>
      </div>
    </>
  )
}

export default DlgLstBtn
