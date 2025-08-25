// File: components/Sponsorships/ManageSponsorships.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';
import info_png from '@/public/assets/miscellaneous/info1.png';
import Image from 'next/image';
import { FEED_TYPE, TokenContract } from '@/lib/structure';
import { isAddress, Address } from 'viem';
import { getTokenDetails } from '@/lib/spCoin/guiUtils';
import DataListSelect from '../views/DataListSelect';
import { useAccount } from 'wagmi';

const TITLE_NAME = 'Select a token to buy';
const INPUT_PLACE_HOLDER = 'Manage Sponsorships';
const ELEMENT_DETAILS =
  'This container allows for the entry selection of a valid token address.\n' +
  'When the address entry is completed and selected, this address will be verified prior to entry acceptance.\n' +
  'Currently, there is no image token lookup, but that is to come.';

type Props = {
  tokenContract: TokenContract | undefined;
  callBackSetter: (listElement: TokenContract) => null;
  /** Parent may set this true to (re)open. User can close locally. */
  showPanel: boolean;
};

/** Panel (not a <dialog/>) version of ManageSponsorships. */
export default function ManageSponsorshipsPanel({
  showPanel,
  tokenContract,
  callBackSetter,
}: Props) {
  const { chainId } = useAccount();

  // Local visibility to allow user-initiated close (parity with previous dialog.close()).
  const [isOpen, setIsOpen] = useState<boolean>(!!showPanel);
  useEffect(() => {
    if (showPanel) setIsOpen(true);
    // if parent sets false, we also respect it
    if (!showPanel) setIsOpen(false);
  }, [showPanel]);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenSelect, setTokenSelect] = useState('');
  const [tokenContractState, setTokenContractState] = useState<TokenContract | undefined>();

  // Resolve token details when user inputs an address
  useEffect(() => {
    if (!tokenInput) {
      setTokenSelect('');
      setTokenContractState(undefined);
      return;
    }
    if (isAddress(tokenInput)) {
      setTokenDetails(tokenInput as Address, setTokenContractState);
    } else {
      setTokenSelect('Invalid Token Address');
      setTokenContractState(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInput]);

  useEffect(() => {
    if (tokenContractState?.symbol != undefined) {
      setTokenSelect(tokenContractState.symbol);
    }
  }, [tokenContractState]);

  const setTokenInputField = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenInput(event.target.value);
  };

  const setTokenDetails = async (tokenAddr: Address, setFn: (t?: TokenContract) => void) => {
    if (typeof chainId === 'number') {
      return getTokenDetails(chainId, tokenAddr, setFn);
    } else {
      console.error(`Missing chainId for getTokenDetails(${tokenAddr}, setTokenContract())`);
    }
  };

  const displayElementDetail = async (tokenAddr: string) => {
    try {
      if (!(await setTokenDetails(tokenAddr as Address, setTokenContractState))) {
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
      alert('BUY_ERROR:displayElementDetail e.message ' + e.message);
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
    closePanel();
  };

  const closePanel = () => {
    setTokenInput('');
    setTokenSelect('');
    setTokenContractState(undefined);
    setIsOpen(false);
  };

  // Hide entirely when not open (like the old dialog would be closed)
  if (!isOpen) return null;

  return (
    <div
      id="manageSponsorshipsPanel"
      className={styles.baseSelectPanel}
      role="region"
      aria-label="Manage Sponsorships"
    >
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{TITLE_NAME}</h1>
        <button
          type="button"
          className="cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closePanel}
          aria-label="Close panel"
        >
          X
        </button>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.modalElementSelect}>
          <div className={styles.leftH}>
            <Image
              src={searchMagGlassGrey_png}
              className={styles.searchImage}
              alt="Search"
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

        {/* Conditionally render suggestion row when there is input */}
        {tokenInput !== '' && (
          <div className={styles.modalInputSelect}>
            <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
              <button
                type="button"
                className="cursor-pointer flex flex-row justify-between"
                onClick={() => getSelectedListElement(tokenContractState)}
                aria-label="Select token"
              >
                <Image
                  id="tokenImage"
                  src={customUnknownImage_png}
                  className={styles.elementLogo}
                  alt="Unknown token"
                />
                <div className="text-left">
                  <div className={styles.elementName}>{tokenSelect}</div>
                  <div className={styles.elementSymbol}>User Specified Token</div>
                </div>
              </button>

              <button
                type="button"
                className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
                onClick={() => displayElementDetail(tokenInput)}
                aria-label="Show token details"
                title="Show token details"
              >
                <Image src={info_png} className={styles.infoLogo} alt="Info" />
              </button>
            </div>
          </div>
        )}

        {/* If you want the data list mode back, un-comment and wire the callback */}
        {/* <div className={styles.scrollDataListPanel}>
          <DataListSelect<TokenContract>
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            onClickItem={getSelectedListElement}
          />
        </div> */}
      </div>
    </div>
  );
}
