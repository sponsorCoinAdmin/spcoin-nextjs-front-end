import type { LabJavaScriptScript } from '../../scriptBuilder/types';
import { firstUtilScript } from '../Utils';

const ACCESS_MODULES_TYPESCRIPT_ROOT = 'spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src';
const OFFCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/offChain`;
const ONCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/onChain`;
const MODULES_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/modules`;

export const BUILTIN_JAVASCRIPT_TEST_SCRIPTS: LabJavaScriptScript[] = [
  {
    id: 'builtin-typescript-offchain-processor',
    name: 'index.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/index.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-add-recipients',
    name: 'addRecipients.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/addRecipients.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-add-agents',
    name: 'addAgents.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/addAgents.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-offchain-delete-account-tree',
    name: 'deleteAccountTree.ts',
    filePath: `${OFFCHAIN_TYPESCRIPT_ROOT}/deleteAccountTree.ts`,
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
    id: 'builtin-typescript-onchain-add-module',
    name: 'spCoinAddModule.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinAddModule.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-read-module',
    name: 'spCoinReadModule.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinReadModule.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-rewards-module',
    name: 'spCoinRewardsModule.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinRewardsModule.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-staking-module',
    name: 'spCoinStakingModule.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinStakingModule.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-delete-module',
    name: 'spCoinDeleteModule.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinDeleteModule.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-erc20-module',
    name: 'spCoinERC20Module.ts',
    filePath: `${MODULES_TYPESCRIPT_ROOT}/spCoinERC20Module.ts`,
    isSystemScript: true,
  },
  firstUtilScript,
];
