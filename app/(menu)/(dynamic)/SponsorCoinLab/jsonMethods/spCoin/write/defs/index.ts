// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addRecipient from './addRecipient';
import addRecipientTransaction from './addRecipientRateTransaction';
import addRecipients from './addRecipients';
import addAgent from './addAgent';
import addAgentTransaction from './addAgentTransaction';
import addAgents from './addAgents';
import deleteAccountTree from './deleteAccountTree';
import deleteRecipient from './deleteRecipient';
import deleteRecipientRate from './deleteRecipientRate';
import deleteAgent from './deleteAgent';
import deleteAgentNode from './deleteAgentNode';
import deleteAgentRate from './deleteAgentRate';
import deleteRecipientSponsorships from './deleteRecipientSponsorships';
import deleteRecipientSponsorshipTree from './deleteRecipientSponsorshipTree';
import deleteAgentSponsorships from './deleteAgentSponsorships';
import deleteRecipientSponsorRate from './deleteRecipientSponsorRate';
import deleteRecipientTransaction from './deleteRecipientTransaction';
import unSponsorAgent from './unSponsorAgent';
import addBackDatedRecipientTransaction from './addBackDatedRecipientTransaction';
import addBackDatedAgentTransaction from './addBackDatedAgentTransaction';
import backDateRecipientTransactionDate from './backDateRecipientTransactionDate';
import backDateAgentTransactionDate from './backDateAgentTransactionDate';
import deleteRecipientSponsorship from './deleteRecipientSponsorship';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import updateAccountStakingRewards from './updateAccountStakingRewards';
import updateMasterStakingRewards from './updateMasterStakingRewards';
import setInflationRate from './setInflationRate';
import setLowerRecipientRate from './setLowerRecipientRate';
import setUpperRecipientRate from './setUpperRecipientRate';
import setRecipientRateRange from './setRecipientRateRange';
import setLowerAgentRate from './setLowerAgentRate';
import setUpperAgentRate from './setUpperAgentRate';
import setAgentRateRange from './setAgentRateRange';
import setVersion from './setVersion';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addRecipient,
  addRecipientTransaction,
  addRecipients,
  addAgent,
  addAgentTransaction,
  addAgents,
  deleteAccountTree,
  deleteRecipient,
  deleteRecipientRate,
  deleteAgent,
  deleteAgentNode,
  deleteAgentRate,
  deleteRecipientSponsorships,
  deleteRecipientSponsorshipTree,
  deleteAgentSponsorships,
  deleteRecipientSponsorRate,
  deleteRecipientTransaction,
  unSponsorAgent,
  addBackDatedRecipientTransaction,
  addBackDatedAgentTransaction,
  backDateRecipientTransactionDate,
  backDateAgentTransactionDate,
  deleteRecipientSponsorship,
  deleteAccountRecord,
  deleteAccountRecords,
  updateAccountStakingRewards,
  updateMasterStakingRewards,
  setInflationRate,
  setLowerRecipientRate,
  setUpperRecipientRate,
  setRecipientRateRange,
  setLowerAgentRate,
  setUpperAgentRate,
  setAgentRateRange,
  setVersion,
};
