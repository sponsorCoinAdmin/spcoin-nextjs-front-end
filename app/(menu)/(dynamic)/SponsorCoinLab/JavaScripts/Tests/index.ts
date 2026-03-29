import type { LabJavaScriptScript } from '../../scriptBuilder/types';
import { firstUtilScript } from '../Utils';

const ACCESS_MODULES_TYPESCRIPT_ROOT = 'spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src';
const OFFCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/offChain`;
const ONCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/onChain`;

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
    id: 'builtin-typescript-onchain-processor-class',
    name: 'spCoinOnChainProcessor.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/spCoinOnChainProcessor.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-add',
    name: 'add.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/add.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-delete',
    name: 'delete.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/delete.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-erc20',
    name: 'erc20.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/erc20.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-read',
    name: 'read.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/read.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-rewards',
    name: 'rewards.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/rewards.ts`,
    isSystemScript: true,
  },
  {
    id: 'builtin-typescript-onchain-staking',
    name: 'staking.ts',
    filePath: `${ONCHAIN_TYPESCRIPT_ROOT}/staking.ts`,
    isSystemScript: true,
  },
  firstUtilScript,
];
