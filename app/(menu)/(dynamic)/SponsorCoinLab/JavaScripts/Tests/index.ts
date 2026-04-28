import type { LabJavaScriptScript } from '../../scriptBuilder/types';
import { firstUtilScript } from '../Utils';
import { SPCOIN_OFFCHAIN_READ_METHODS, getSpCoinReadOptions } from '../../jsonMethods/spCoin/read';

const ACCESS_MODULES_TYPESCRIPT_ROOT = 'spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src';
const OFFCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/offChain`;
const ONCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/onChain`;
const OFFCHAIN_READ_METHODS_ROOT = `${OFFCHAIN_TYPESCRIPT_ROOT}/readMethods`;
const ONCHAIN_READ_METHODS_ROOT = `${ONCHAIN_TYPESCRIPT_ROOT}/readMethods`;
const ADD_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinAddModule`;
const DELETE_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinDeleteModule`;
const ERC20_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinERC20Module`;
const READ_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinReadModule`;
const READ_MODULE_METHODS_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinReadModule/methods`;
const REWARDS_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinRewardsModule`;
const STAKING_MODULE_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules/spCoinStakingModule`;

const builtinSpCoinReadMethodScripts: LabJavaScriptScript[] = getSpCoinReadOptions(false).map((method) => ({
  id: `builtin-typescript-spcoin-read-${method}`,
  name: `${method}.ts`,
  filePath: `${
    SPCOIN_OFFCHAIN_READ_METHODS.includes(method) ? OFFCHAIN_READ_METHODS_ROOT : ONCHAIN_READ_METHODS_ROOT
  }/${method}.ts`,
  displayFilePath: `${READ_MODULE_METHODS_ROOT}/${method}.ts`,
  executionFilePath: `${
    SPCOIN_OFFCHAIN_READ_METHODS.includes(method) ? OFFCHAIN_READ_METHODS_ROOT : ONCHAIN_READ_METHODS_ROOT
  }/${method}.ts`,
  isSystemScript: true,
}));

export const BUILTIN_JAVASCRIPT_TEST_SCRIPTS: LabJavaScriptScript[] = [
  {
    id: 'builtin-typescript-offchain-processor',
    name: 'index.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/index.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-set-lower-recipient-rate',
    name: 'setLowerRecipientRate.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/setLowerRecipientRate.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-set-upper-recipient-rate',
    name: 'setUpperRecipientRate.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/setUpperRecipientRate.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-set-lower-agent-rate',
    name: 'setLowerAgentRate.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/setLowerAgentRate.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-set-upper-agent-rate',
    name: 'setUpperAgentRate.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/setUpperAgentRate.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-processor',
    name: 'index.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/index.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-processor-class',
    name: 'spCoinOnChainProcessor.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/spCoinOnChainProcessor.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-add',
    name: 'add.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/add.ts`,
    displayFilePath: `${ADD_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/add.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-delete',
    name: 'delete.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/delete.ts`,
    displayFilePath: `${DELETE_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/delete.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-erc20',
    name: 'erc20.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/erc20.ts`,
    displayFilePath: `${ERC20_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/erc20.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-read',
    name: 'read.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/read.ts`,
    displayFilePath: `${READ_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/read.ts`,
    isSystemScript: true,
  },
  ...builtinSpCoinReadMethodScripts,
  {
    id: 'builtin-typescript-onchain-rewards',
    name: 'rewards.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/rewards.ts`,
    displayFilePath: `${REWARDS_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/rewards.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-staking',
    name: 'staking.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/staking.ts`,
    displayFilePath: `${STAKING_MODULE_ROOT}/index.ts`,
    executionFilePath: `${ONCHAIN_TYPESCRIPT_ROOT}/staking.ts`,
    isSystemScript: true,
  },
  firstUtilScript,
];
