import type { SpCoinAddModule } from "../modules/spCoinAddModule";
import type { SpCoinDeleteModule } from "../modules/spCoinDeleteModule";
import type { SpCoinERC20Module } from "../modules/spCoinERC20Module";
import type { SpCoinReadModule } from "../modules/spCoinReadModule";
import type { SpCoinRewardsModule } from "../modules/spCoinRewardsModule";
import type { SpCoinStakingModule } from "../modules/spCoinStakingModule";
export type SpCoinOnChainMethods = {
    contract: any;
    add: SpCoinAddModule;
    delete: SpCoinDeleteModule;
    erc20: SpCoinERC20Module;
    read: SpCoinReadModule;
    rewards: SpCoinRewardsModule;
    staking: SpCoinStakingModule;
};
export declare class SpCoinOnChainProcessor {
    contract: any;
    add: SpCoinAddModule;
    delete: SpCoinDeleteModule;
    erc20: SpCoinERC20Module;
    read: SpCoinReadModule;
    rewards: SpCoinRewardsModule;
    staking: SpCoinStakingModule;
    constructor(spCoinABI: any, spCoinAddress: any, signer: any);
    methods(): SpCoinOnChainMethods;
}
