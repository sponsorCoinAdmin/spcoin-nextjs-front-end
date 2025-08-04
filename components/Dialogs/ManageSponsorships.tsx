// File: components/containers/ManageSponsorships.tsx
'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useState } from 'react';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';
import info_png from '@/public/assets/miscellaneous/info1.png';
import Image from 'next/image';
import { FEED_TYPE, TokenContract } from '@/lib/structure';
import { isAddress } from 'ethers';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';
import { getTokenDetails } from '@/lib/spCoin/guiUtils';
import DataListSelect from '../views/DataListSelect';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

const TITLE_NAME = 'Select a token to buy';
const INPUT_PLACE_HOLDER = 'Manage Sponsorships';
const ELEMENT_DETAILS =
  'This container allows for the entry selection of a valid token address.\n' +
  'When the address entry is completed and selected, ' +
  'this address will be verified prior to entry acceptance.\n' +
  'Currently, there is no image token lookup, but that is to come.';

type Props = {
  tokenContract: TokenContract | undefined;
  callBackSetter: (listElement: TokenContract) => null;
  showDialog: boolean;
};

export default function Dialog({ showDialog, tokenContract, callBackSetter }: Props) {
  const { chainId } = useAccount();
  const dialogRef = useRef<null | HTMLDialogElement>(null);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenSelect, setTokenSelect] = useState('');
  const [tokenContractState, setTokenContractState] = useState<TokenContract | undefined>();

  useEffect(() => {
    closeDialog();
  }, []);

  useEffect(() => {
    showDialog ? dialogRef.current?.showModal() : dialogRef.current?.close();
  }, [showDialog]);

  useEffect(() => {
    tokenInput === ''
      ? hideElement('buySelectGroup_ID')
      : showElement('buySelectGroup_ID');

    if (isAddress(tokenInput)) {
      setTokenDetails(tokenInput as Address, setTokenContractState);
    } else {
      setTokenSelect('Invalid Token Address');
    }
  }, [tokenInput]);

  useEffect(() => {
    if (tokenContractState?.symbol != undefined) {
      setTokenSelect(tokenContractState.symbol);
    }
  }, [tokenContractState]);

  const setTokenInputField = (event: any) => {
    setTokenInput(event.target.value);
  };

  const setTokenDetails = async (tokenAddr: Address, setFn: any) => {
    if (typeof chainId === 'number') {
      return getTokenDetails(chainId, tokenAddr, setFn);
    } else {
      console.error(`Missing chainId for getTokenDetails(${tokenAddr}, setTokenContract())`);
    }
  };

  const displayElementDetail = async (tokenAddr: any) => {
    try {
      if (!(await setTokenDetails(tokenAddr, setTokenContractState))) {
        alert(
          '*** ERROR *** Invalid Buy Token Address: ' +
            tokenInput +
            '\n\n' +
            ELEMENT_DETAILS
        );
        return;
      }
      alert(
        'displayElementDetail\n' +
          JSON.stringify(tokenContractState, null, 2) +
          '\n\n' +
          ELEMENT_DETAILS
      );
      await getWagmiBalanceOfRec(tokenAddr);
    } catch (e: any) {
      alert('BUY_ERROR:displayElementDetail e.message' + e.message);
    }
  };

  const getSelectedListElement = (listElement: TokenContract | undefined) => {
    if (!listElement) {
      alert('Undefined Token address');
      return;
    }
    if (!isAddress(listElement.address)) {
      alert(`${listElement.name} has invalid token address: ${listElement.address}`);
      return;
    }
    if (listElement.address === tokenContract?.address) {
      alert(`Buy Token cannot be the same as Sell Token (${tokenContract.symbol})`);
      console.log(`Buy Token cannot be the same as Sell Token (${tokenContract.symbol})`);
      return;
    }

    callBackSetter(listElement);
    closeDialog();
  };

  const closeDialog = () => {
    setTokenInput('');
    setTokenSelect('');
    hideElement('buySelectGroup_ID');
    dialogRef.current?.close();
  };

  return (
    <dialog id="manageSponsorshipsDialog" ref={dialogRef} className={styles.baseSelectPanel}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
        <div
          className="cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.modalElementSelect}>
          <div className={styles.leftH}>
            <Image
              src={searchMagGlassGrey_png}
              className={styles.searchImage}
              alt="Search Image Grey"
            />
            <input
              id="tokenInput"
              className={styles.modalElementSelect}
              autoComplete="off"
              placeholder={INPUT_PLACE_HOLDER}
              onChange={setTokenInputField}
              value={tokenInput}
            />
            &nbsp;
          </div>
        </div>
        <div id="buySelectGroup_ID" className={styles.modalInputSelect}>
          <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
            <div
              className="cursor-pointer flex flex-row justify-between"
              onClick={() => getSelectedListElement(tokenContractState)}
            >
              <Image
                id="tokenImage"
                src={customUnknownImage_png}
                className={styles.elementLogo}
                alt="Search Image Grey"
              />
              <div>
                <div className={styles.elementName}>{tokenSelect}</div>
                <div className={styles.elementSymbol}>User Specified Token</div>
              </div>
            </div>
            <div
              className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
              onClick={() => displayElementDetail(tokenInput)}
            >
              <Image src={info_png} className={styles.infoLogo} alt="Info Image" />
            </div>
          </div>
        </div>

        {/* <div className={styles.scrollDataListPanel}>
          <DataListSelect<TokenContract>
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            onClickItem={getSelectedListElement} 
          />
        </div> */}
      </div>
    </dialog>
  );
}
