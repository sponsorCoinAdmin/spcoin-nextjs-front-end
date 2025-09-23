// File: components/Sponsorships/SponsorshipsConfigPanel.tsx
'use client';

import styles from '@/styles/Modal.module.css';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { isAddress, Address } from 'viem';

import searchMagGlassGrey_png from '@/public/assets/miscellaneous/SearchMagGlassGrey.png';
import customUnknownImage_png from '@/public/assets/miscellaneous/QuestionWhiteOnRed.png';
import info_png from '@/public/assets/miscellaneous/info1.png';

import { TokenContract, SP_COIN_DISPLAY } from '@/lib/structure';
import { getTokenDetails } from '@/lib/spCoin/guiUtils';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const INPUT_PLACE_HOLDER = 'Manage Sponsorships';
const ELEMENT_DETAILS =
  'This container allows for the entry selection of a valid token address.\n' +
  'When the address entry is completed and selected, this address will be verified prior to entry acceptance.\n' +
  'Currently, there is no image token lookup, but that is to come.';

type Props = {
  tokenContract: TokenContract | undefined;
  callBackSetter: (listElement: TokenContract) => void; // void (not null)
  /** Deprecated – visibility is controlled by panel-tree (SPONSORSHIPS_CONFIG_PANEL). */
  showPanel?: boolean;
};

/** Root overlay version of the Sponsorships Config panel (acts like Error overlay). */
export default function SponsorshipsConfigPanel({
  // showPanel is ignored for visibility; panel-tree controls it
  showPanel,
  tokenContract,
  callBackSetter,
}: Props) {
  const { chainId } = useAccount();

  // Panel-tree visibility control (radio overlay)
  const { isVisible, openPanel } = usePanelTree();
  const show = isVisible(SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL);

  // Local input state
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
      alert(`Buy Token cannot be the same as Sell Token (${tokenContract?.symbol})`);
      return;
    }

    callBackSetter(listElement);
    handleClose();
  };

  const handleClose = () => {
    setTokenInput('');
    setTokenSelect('');
    setTokenContractState(undefined);
    // Switch the radio overlay back to Trading Station
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  };

  // Hide entirely when not the active overlay
  if (!show) return null;

  return (
    <div
      id="sponsorshipsConfigPanel"
      className={styles.baseSelectPanel}
      role="region"
      aria-label="Manage Sponsorships"
    >
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

        {/* Optional list mode
        <div className={styles.scrollDataListPanel}>
          <DataListSelect<TokenContract>
            dataFeedType={FEED_TYPE.TOKEN_LIST}
            onClickItem={getSelectedListElement}
          />
        </div> */}
      </div>
    </div>
  );
}
