import styles from '@/styles/Exchange.module.css';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { useERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import { showElement } from '@/lib/spCoin/guiControl';
import { openDialog } from '../Dialogs/Dialogs';

type Props = {
  activeAccount: any,
  tokenContract: TokenContract, 
  setDisplayState:(displayState:DISPLAY_STATE) => void,
}

const ManageSponsorsButton = ({activeAccount, tokenContract, setDisplayState} : Props) => {

  try {
  const balanceOf = (useERC20WagmiClientBalanceOf(activeAccount.address, tokenContract.address || "") || "0");
    return (
        <div id="manageSponsorshipsDiv" className={styles[`manageSponsorshipsDiv`]} onClick={() => openDialog("#manageSponsorshipsDialog")}>
          <div className={styles["centerTop"]} >Manage</div>
          <div className={styles["centerBottom"]} >Sponsorships</div>
        </div>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}`)
  }
}

export default ManageSponsorsButton;
