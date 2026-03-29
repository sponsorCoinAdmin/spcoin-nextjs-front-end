// @ts-nocheck
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/index.js
import * as ethers_1 from "ethers";
import * as logging_1 from "./utils/logging";
import * as onChain_1 from "./onChain";
import * as offChain_1 from "./offChain";
import * as spCoinERC20Module_1 from "./modules/spCoinERC20Module";
import * as spCoinDeleteModule_1 from "./modules/spCoinDeleteModule";
import * as spCoinAddModule_1 from "./modules/spCoinAddModule";
import * as spCoinReadModule_1 from "./modules/spCoinReadModule";
import * as spCoinRewardsModule_1 from "./modules/spCoinRewardsModule";
import * as spCoinStakingModule_1 from "./modules/spCoinStakingModule";
import * as logging_2 from "./utils/logging";
export { SpCoinLogger as SpCoinLogger } from "./utils/logging";
import * as onChain_2 from "./onChain";
export { SpCoinOnChainProcessor as SpCoinOnChainProcessor } from "./onChain";
import * as offChain_2 from "./offChain";
export { SpCoinOffChainProcessor as SpCoinOffChainProcessor } from "./offChain";
import * as spCoinERC20Module_2 from "./modules/spCoinERC20Module";
export { SpCoinERC20Module as SpCoinERC20Module } from "./modules/spCoinERC20Module";
import * as spCoinDeleteModule_2 from "./modules/spCoinDeleteModule";
export { SpCoinDeleteModule as SpCoinDeleteModule } from "./modules/spCoinDeleteModule";
import * as spCoinAddModule_2 from "./modules/spCoinAddModule";
export { SpCoinAddModule as SpCoinAddModule } from "./modules/spCoinAddModule";
import * as spCoinReadModule_2 from "./modules/spCoinReadModule";
export { SpCoinReadModule as SpCoinReadModule } from "./modules/spCoinReadModule";
import * as spCoinRewardsModule_2 from "./modules/spCoinRewardsModule";
export { SpCoinRewardsModule as SpCoinRewardsModule } from "./modules/spCoinRewardsModule";
import * as spCoinStakingModule_2 from "./modules/spCoinStakingModule";
export { SpCoinStakingModule as SpCoinStakingModule } from "./modules/spCoinStakingModule";
export class SpCoinAccessModules {
    constructor(spCoinABI, spCoinAddress, signer) {
        this.methods = () => {
            return {
                spCoinContractDeployed: this.spCoinContractDeployed,
                spCoinAddMethods: this.spCoinAddMethods,
                spCoinDeleteMethods: this.spCoinDeleteMethods,
                spCoinERC20Methods: this.spCoinERC20Methods,
                spCoinLogger: this.spCoinLogger,
                spCoinOnChainMethods: this.spCoinOnChainMethods,
                spCoinOffChainMethods: this.spCoinOffChainMethods,
                spCoinReadMethods: this.spCoinReadMethods,
                spCoinRewardsMethods: this.spCoinRewardsMethods,
                spCoinStakingMethods: this.spCoinStakingMethods
            };
        };
        // console.debug(`SpCoinAccessModules.constructor.spCoinAddress = ${spCoinAddress}`)
        // console.debug(`SpCoinAccessModules.constructor.spCoinABI = ${JSON.stringify(spCoinABI,null,2)}`)
        console.debug(`SpCoinAccessModules.constructor.signer = ${JSON.stringify(signer, null, 2)}`);
        const signedContract = new ethers_1.ethers.Contract(spCoinAddress, spCoinABI, signer);
        this.spCoinContractDeployed = signedContract;
        this.spCoinOnChainMethods = new onChain_1.SpCoinOnChainProcessor(spCoinABI, spCoinAddress, signer);
        this.spCoinOffChainMethods = new offChain_1.SpCoinOffChainProcessor(this.spCoinOnChainMethods);
        // console.debug(`SpCoinAccessModules.constructor.signedContract = ${JSON.stringify(signedContract,null,2)}`)
        this.spCoinAddMethods = new spCoinAddModule_1.SpCoinAddModule(this.spCoinContractDeployed);
        this.spCoinDeleteMethods = new spCoinDeleteModule_1.SpCoinDeleteModule(this.spCoinContractDeployed);
        this.spCoinERC20Methods = new spCoinERC20Module_1.SpCoinERC20Module(this.spCoinContractDeployed);
        this.spCoinLogger = new logging_1.SpCoinLogger(this.spCoinContractDeployed);
        this.spCoinReadMethods = new spCoinReadModule_1.SpCoinReadModule(this.spCoinContractDeployed);
        this.spCoinRewardsMethods = new spCoinRewardsModule_1.SpCoinRewardsModule(this.spCoinContractDeployed);
        this.spCoinStakingMethods = new spCoinStakingModule_1.SpCoinStakingModule(this.spCoinContractDeployed);
    }
}
