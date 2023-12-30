'use client'
import  React, { ReactNode, useRef, useEffect, useState} from 'react'
import '../Styles/modal.css';
import dataList from '../Resources/data/tokens/tokenEthList.json';
import Dialog from '../TokenDialog';

type TokenElement = {
  chainId: number;
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
              const dialog = document.querySelector("#tokenList")
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
