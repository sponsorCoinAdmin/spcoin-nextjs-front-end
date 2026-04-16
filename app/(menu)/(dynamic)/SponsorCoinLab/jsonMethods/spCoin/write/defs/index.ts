// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addSponsorRecipient from './addSponsorRecipient';
import addRecipientRateTransaction from './addRecipientRateTransaction';
import addRecipients from './addRecipients';
import addRecipientAgent from './addRecipientAgent';
import addAgentTransaction from './addAgentTransaction';
import addAgents from './addAgents';
import deleteSponsor from './deleteSponsor';
import deleteSponsorTree from './deleteSponsorTree';
import deleteSponsorRecipient from './deleteSponsorRecipient';
import deleteRecipientRateBranch from './deleteRecipientRateBranch';
import deleteRecipientAgent from './deleteRecipientAgent';
import deleteAgentRateBranch from './deleteAgentRateBranch';
import deleteRecipientSponsorships from './deleteRecipientSponsorships';
import deleteRecipientSponsorshipTree from './deleteRecipientSponsorshipTree';
import deleteAgentSponsorships from './deleteAgentSponsorships';
import deleteRecipientSponsorRate from './deleteRecipientSponsorRate';
import deleteRecipientTransaction from './deleteRecipientTransaction';
import deleteAgent from './deleteAgent';
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
import depositSponsorStakingRewards from './depositSponsorStakingRewards';
import depositRecipientStakingRewards from './depositRecipientStakingRewards';
import depositAgentStakingRewards from './depositAgentStakingRewards';
import setInflationRate from './setInflationRate';
import setLowerRecipientRate from './setLowerRecipientRate';
import setUpperRecipientRate from './setUpperRecipientRate';
import setRecipientRateRange from './setRecipientRateRange';
import setLowerAgentRate from './setLowerAgentRate';
import setUpperAgentRate from './setUpperAgentRate';
import setAgentRateRange from './setAgentRateRange';
import setVersion from './setVersion';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addSponsorRecipient,
  addRecipientRateTransaction,
  addRecipients,
  addRecipientAgent,
  addAgentTransaction,
  addAgents,
  deleteSponsor,
  deleteSponsorTree,
  deleteSponsorRecipient,
  deleteRecipientRateBranch,
  deleteRecipientAgent,
  deleteAgentRateBranch,
  deleteRecipientSponsorships,
  deleteRecipientSponsorshipTree,
  deleteAgentSponsorships,
  deleteRecipientSponsorRate,
  deleteRecipientTransaction,
  deleteAgent,
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
  depositSponsorStakingRewards,
  depositRecipientStakingRewards,
  depositAgentStakingRewards,
  setInflationRate,
  setLowerRecipientRate,
  setUpperRecipientRate,
  setRecipientRateRange,
  setLowerAgentRate,
  setUpperAgentRate,
  setAgentRateRange,
  setVersion,
};
