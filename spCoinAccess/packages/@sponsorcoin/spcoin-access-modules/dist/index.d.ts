export { SpCoinLogger as SpCoinLogger } from "./utils/logging";
export { SpCoinOnChainProcessor as SpCoinOnChainProcessor } from "./onChain";
export { SpCoinOffChainProcessor as SpCoinOffChainProcessor } from "./offChain";
export { SpCoinERC20Module as SpCoinERC20Module } from "./modules/spCoinERC20Module/index";
export { SpCoinDeleteModule as SpCoinDeleteModule } from "./modules/spCoinDeleteModule/index";
export { SpCoinAddModule as SpCoinAddModule } from "./modules/spCoinAddModule/index";
export { SpCoinReadModule as SpCoinReadModule } from "./modules/spCoinReadModule/index";
export { SpCoinRewardsModule as SpCoinRewardsModule } from "./modules/spCoinRewardsModule/index";
export { SpCoinStakingModule as SpCoinStakingModule } from "./modules/spCoinStakingModule/index";
export declare class SpCoinAccessModules {
    constructor(spCoinABI: any, spCoinAddress: any, signer: any);
}
