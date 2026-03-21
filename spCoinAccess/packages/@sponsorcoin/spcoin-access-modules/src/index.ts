// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/index.js
import { ethers } from "ethers";
import { SpCoinLogger } from "./utils/logging";
import { SpCoinERC20Module } from "./modules/spCoinERC20Module";
import { SpCoinDeleteModule } from "./modules/spCoinDeleteModule";
import { SpCoinAddModule } from "./modules/spCoinAddModule";
import { SpCoinReadModule } from "./modules/spCoinReadModule";
import { SpCoinRewardsModule } from "./modules/spCoinRewardsModule";
import { SpCoinStakingModule } from "./modules/spCoinStakingModule";

export { SpCoinLogger } from "./utils/logging";
export { SpCoinERC20Module } from "./modules/spCoinERC20Module";
export { SpCoinDeleteModule } from "./modules/spCoinDeleteModule";
export { SpCoinAddModule } from "./modules/spCoinAddModule";
export { SpCoinReadModule } from "./modules/spCoinReadModule";
export { SpCoinRewardsModule } from "./modules/spCoinRewardsModule";
export { SpCoinStakingModule } from "./modules/spCoinStakingModule";

export type SpCoinAccessMethods = {
    spCoinContractDeployed: any;
    spCoinAddMethods: SpCoinAddModule;
    spCoinDeleteMethods: SpCoinDeleteModule;
    spCoinERC20Methods: SpCoinERC20Module;
    spCoinLogger: SpCoinLogger;
    spCoinReadMethods: SpCoinReadModule;
    spCoinRewardsMethods: SpCoinRewardsModule;
    spCoinStakingMethods: SpCoinStakingModule;
};

export class SpCoinAccessModules {
    spCoinContractDeployed: any;
    spCoinAddMethods: SpCoinAddModule;
    spCoinDeleteMethods: SpCoinDeleteModule;
    spCoinERC20Methods: SpCoinERC20Module;
    spCoinLogger: SpCoinLogger;
    spCoinReadMethods: SpCoinReadModule;
    spCoinRewardsMethods: SpCoinRewardsModule;
    spCoinStakingMethods: SpCoinStakingModule;
    methods: () => SpCoinAccessMethods;

    constructor(spCoinABI, spCoinAddress, signer) {
        this.methods = () => {
            return {
                spCoinContractDeployed: this.spCoinContractDeployed,
                spCoinAddMethods: this.spCoinAddMethods,
                spCoinDeleteMethods: this.spCoinDeleteMethods,
                spCoinERC20Methods: this.spCoinERC20Methods,
                spCoinLogger: this.spCoinLogger,
                spCoinReadMethods: this.spCoinReadMethods,
                spCoinRewardsMethods: this.spCoinRewardsMethods,
                spCoinStakingMethods: this.spCoinStakingMethods
            };
        };
        // console.debug(`SpCoinAccessModules.constructor.spCoinAddress = ${spCoinAddress}`)
        // console.debug(`SpCoinAccessModules.constructor.spCoinABI = ${JSON.stringify(spCoinABI,null,2)}`)
        console.debug(`SpCoinAccessModules.constructor.signer = ${JSON.stringify(signer, null, 2)}`);
        const signedContract = new ethers.Contract(spCoinAddress, spCoinABI, signer);
        this.spCoinContractDeployed = signedContract;
        // console.debug(`SpCoinAccessModules.constructor.signedContract = ${JSON.stringify(signedContract,null,2)}`)
        this.spCoinAddMethods = new SpCoinAddModule(this.spCoinContractDeployed);
        this.spCoinDeleteMethods = new SpCoinDeleteModule(this.spCoinContractDeployed);
        this.spCoinERC20Methods = new SpCoinERC20Module(this.spCoinContractDeployed);
        this.spCoinLogger = new SpCoinLogger(this.spCoinContractDeployed);
        this.spCoinReadMethods = new SpCoinReadModule(this.spCoinContractDeployed);
        this.spCoinRewardsMethods = new SpCoinRewardsModule(this.spCoinContractDeployed);
        this.spCoinStakingMethods = new SpCoinStakingModule(this.spCoinContractDeployed);
    }
}

