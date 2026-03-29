// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/onChain/index.js
 * Role: On-chain processor facade that wires contract access modules together.
 */
import * as ethers_1 from "ethers";
import * as spCoinAddModule_1 from "../modules/spCoinAddModule";
import * as spCoinDeleteModule_1 from "../modules/spCoinDeleteModule";
import * as spCoinERC20Module_1 from "../modules/spCoinERC20Module";
import * as spCoinReadModule_1 from "../modules/spCoinReadModule";
import * as spCoinRewardsModule_1 from "../modules/spCoinRewardsModule";
import * as spCoinStakingModule_1 from "../modules/spCoinStakingModule";
export class SpCoinOnChainProcessor {
    constructor(spCoinABI, spCoinAddress, signer) {
        const contract = new ethers_1.ethers.Contract(spCoinAddress, spCoinABI, signer);
        this.contract = contract;
        this.add = new spCoinAddModule_1.SpCoinAddModule(contract);
        this.delete = new spCoinDeleteModule_1.SpCoinDeleteModule(contract);
        this.erc20 = new spCoinERC20Module_1.SpCoinERC20Module(contract);
        this.read = new spCoinReadModule_1.SpCoinReadModule(contract);
        this.rewards = new spCoinRewardsModule_1.SpCoinRewardsModule(contract);
        this.staking = new spCoinStakingModule_1.SpCoinStakingModule(contract);
    }
    methods() {
        return {
            contract: this.contract,
            add: this.add,
            delete: this.delete,
            erc20: this.erc20,
            read: this.read,
            rewards: this.rewards,
            staking: this.staking,
        };
    }
}
