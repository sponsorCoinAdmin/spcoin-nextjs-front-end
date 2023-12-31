'use client'
import '../Styles/modal.css';
import dataList from '../Resources/data/mainNetTokenList.json';
import Dialog from '../AgentDlgLst';

type ListElement = {
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

const dialogName ='Select an agent';
const selectElement ='Search agent name or paste address';

// Parent component
function DlgLstBtn({ getDlgLstElement, onClose }: Props) {

  return (
    <>
      <Dialog titleName={dialogName} selectElement={selectElement} dataList={dataList} onClose={onClose} getDlgLstElement={getDlgLstElement}/>

      <div className="ModalButton">
        <button
          className="bluBtn"
          onClick={() => {
              const dialog = document.querySelector("#AgentDialogList")
              dialog?.show()
          }}
        >
          Agent List
        </button>
      </div>
    </>
  )
}

export default DlgLstBtn
