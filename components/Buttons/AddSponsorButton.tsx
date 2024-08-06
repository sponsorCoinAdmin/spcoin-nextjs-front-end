import styles from '@/styles/Exchange.module.css';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { useERC20WagmiClientBalanceOfStr } from '@/lib/wagmi/erc20WagmiClientRead';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract, 
  setDisplayState:(displayState:DISPLAY_STATE) => void,
}

const AddSponsorshipButton = ({activeAccount, buyTokenContract, setDisplayState} : Props) => {

  try {
  const balanceOf = (useERC20WagmiClientBalanceOfStr(activeAccount.address, buyTokenContract.address || "") || "0");
    return (
      <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
        <div className={styles["centerTop"]} >Add</div>
        <div className={styles["centerBottom"]} >Sponsorship</div>
      </div>
    );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
