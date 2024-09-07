import styles from '@/styles/Exchange.module.css';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { getERC20WagmiClientBalanceOfStr } from '@/lib/wagmi/erc20WagmiClientRead';
import { showElement } from '@/lib/spCoin/guiControl';
import { openDialog } from '../Dialogs/Dialogs';
import ManageSponsorships from '../Dialogs/ManageSponsorships';

type Props = {
  activeAccount: any,
  tokenContract: TokenContract
}

const ManageSponsorsButton = ({activeAccount, tokenContract} : Props) => {
  const junkManageSponsorshipCallback = (tokenContract:TokenContract) => {
    return null;
  }

  try {
  const balanceOf = (getERC20WagmiClientBalanceOfStr(activeAccount.address, tokenContract.address || "") || "0");
    return (
      <>
        <ManageSponsorships tokenContract={tokenContract} callBackSetter={junkManageSponsorshipCallback}  />
        <div id="manageSponsorshipsDiv" className={styles[`manageSponsorshipsDiv`]} onClick={() => openDialog("#manageSponsorshipsDialog")}>
          <div className={styles["centerTop"]} >Manage</div>
          <div className={styles["centerBottom"]} >Sponsorships</div>
        </div>
      </>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}`)
  }
}

export default ManageSponsorsButton;
