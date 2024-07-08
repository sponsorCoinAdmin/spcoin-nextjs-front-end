import styles from '@/styles/Exchange.module.css';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract, 
  setDisplayState:(displayState:DISPLAY_STATE) => void,
}

const ManageSponsorsButton = ({activeAccount, buyTokenContract, setDisplayState} : Props) => {

  try {
  const balanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address || "") || "0");
    return (
      <>
        <div id="manageSponsorshipsDiv" className={styles[`manageSponsorshipsDiv`]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
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
