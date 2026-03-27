"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinAccessModules = exports.SpCoinOffChainProcessor = exports.SpCoinOnChainProcessor = exports.SpCoinStakingModule = exports.SpCoinRewardsModule = exports.SpCoinReadModule = exports.SpCoinAddModule = exports.SpCoinDeleteModule = exports.SpCoinERC20Module = exports.SpCoinLogger = void 0;
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/index.js
const ethers_1 = require("ethers");
const logging_1 = require("./utils/logging");
const onChain_1 = require("./onChain");
const offChain_1 = require("./offChain");
const spCoinERC20Module_1 = require("./modules/spCoinERC20Module");
const spCoinDeleteModule_1 = require("./modules/spCoinDeleteModule");
const spCoinAddModule_1 = require("./modules/spCoinAddModule");
const spCoinReadModule_1 = require("./modules/spCoinReadModule");
const spCoinRewardsModule_1 = require("./modules/spCoinRewardsModule");
const spCoinStakingModule_1 = require("./modules/spCoinStakingModule");
var logging_2 = require("./utils/logging");
Object.defineProperty(exports, "SpCoinLogger", { enumerable: true, get: function () { return logging_2.SpCoinLogger; } });
var onChain_2 = require("./onChain");
Object.defineProperty(exports, "SpCoinOnChainProcessor", { enumerable: true, get: function () { return onChain_2.SpCoinOnChainProcessor; } });
var offChain_2 = require("./offChain");
Object.defineProperty(exports, "SpCoinOffChainProcessor", { enumerable: true, get: function () { return offChain_2.SpCoinOffChainProcessor; } });
var spCoinERC20Module_2 = require("./modules/spCoinERC20Module");
Object.defineProperty(exports, "SpCoinERC20Module", { enumerable: true, get: function () { return spCoinERC20Module_2.SpCoinERC20Module; } });
var spCoinDeleteModule_2 = require("./modules/spCoinDeleteModule");
Object.defineProperty(exports, "SpCoinDeleteModule", { enumerable: true, get: function () { return spCoinDeleteModule_2.SpCoinDeleteModule; } });
var spCoinAddModule_2 = require("./modules/spCoinAddModule");
Object.defineProperty(exports, "SpCoinAddModule", { enumerable: true, get: function () { return spCoinAddModule_2.SpCoinAddModule; } });
var spCoinReadModule_2 = require("./modules/spCoinReadModule");
Object.defineProperty(exports, "SpCoinReadModule", { enumerable: true, get: function () { return spCoinReadModule_2.SpCoinReadModule; } });
var spCoinRewardsModule_2 = require("./modules/spCoinRewardsModule");
Object.defineProperty(exports, "SpCoinRewardsModule", { enumerable: true, get: function () { return spCoinRewardsModule_2.SpCoinRewardsModule; } });
var spCoinStakingModule_2 = require("./modules/spCoinStakingModule");
Object.defineProperty(exports, "SpCoinStakingModule", { enumerable: true, get: function () { return spCoinStakingModule_2.SpCoinStakingModule; } });
class SpCoinAccessModules {
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
exports.SpCoinAccessModules = SpCoinAccessModules;
