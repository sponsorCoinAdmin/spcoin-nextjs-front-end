"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinOnChainProcessor = void 0;
const ethers_1 = require("ethers");
const spCoinAddModule_1 = require("../modules/spCoinAddModule");
const spCoinDeleteModule_1 = require("../modules/spCoinDeleteModule");
const spCoinERC20Module_1 = require("../modules/spCoinERC20Module");
const spCoinReadModule_1 = require("../modules/spCoinReadModule");
const spCoinRewardsModule_1 = require("../modules/spCoinRewardsModule");
const spCoinStakingModule_1 = require("../modules/spCoinStakingModule");
class SpCoinOnChainProcessor {
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
exports.SpCoinOnChainProcessor = SpCoinOnChainProcessor;
