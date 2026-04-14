// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addSponsorRecipientBranch from './addRecipient';
import addRecipientRateBranchAmount from './addRecipientRateBranchAmount';
import addRecipients from './addRecipients';
import addRecipientAgentBranch from './addRecipientAgentBranch';
import addAgentRateBranchAmount from './addAgentRateBranchAmount';
import addAgents from './addAgents';
import deleteSponsor from './deleteSponsor';
import deleteSponsorTree from './deleteSponsorTree';
import deleteSponsorRecipientBranch from './deleteSponsorRecipientBranch';
import deleteRecipientRateBranch from './deleteRecipientRateBranch';
import deleteRecipientAgentBranch from './deleteRecipientAgentBranch';
import deleteAgentRateBranch from './deleteAgentRateBranch';
import deleteRecipientSponsorships from './deleteRecipientSponsorships';
import deleteRecipientSponsorshipTree from './deleteRecipientSponsorshipTree';
import deleteAgentSponsorships from './deleteAgentSponsorships';
import deleteRecipientRateSponsorship from './deleteRecipientRate';
import deleteRecipientRateAmount from './deleteRecipientRateAmount';
import deleteAgent from './deleteAgent';
import unSponsorAgent from './deleteAgentSponsorship';
import addBackDatedRecipientRateAmount from './addBackDatedRecipientRateAmount';
import addBackDatedRecipientAgentRateAmount from './addBackDatedRecipientAgentRateAmount';
import backDateRecipientTransactionDate from './backDateRecipientTransactionDate';
import backDateAgentTransactionDate from './backDateAgentTransactionDate';
import deleteRecipientSponsorship from './delRecipient';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import updateAccountStakingRewards from './updateAccountStakingRewards';
import updateMasterStakingRewards from './updateMasterStakingRewards';
import depositSponsorStakingRewards from './depositSponsorStakingRewards';
import depositRecipientStakingRewards from './depositRecipientStakingRewards';
import depositAgentStakingRewards from './depositAgentStakingRewards';
import setInflationRate from './setInflationRate';
import setLowerRecipientRate from './setLowerRecipient';
import setUpperRecipientRate from './setUpperRecipient';
import setRecipientRateRange from './setRecipientRateRange';
import setLowerAgentRate from './setLowerAgent';
import setUpperAgentRate from './setUpperAgent';
import setAgentRateRange from './setAgentRateRange';
import setVersion from './setVersion';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addSponsorRecipientBranch,
  addRecipientRateBranchAmount,
  addRecipients,
  addRecipientAgentBranch,
  addAgentRateBranchAmount,
  addAgents,
  deleteSponsor,
  deleteSponsorTree,
  deleteSponsorRecipientBranch,
  deleteRecipientRateBranch,
  deleteRecipientAgentBranch,
  deleteAgentRateBranch,
  deleteRecipientSponsorships,
  deleteRecipientSponsorshipTree,
  deleteAgentSponsorships,
  deleteRecipientRateSponsorship,
  deleteRecipientRateAmount,
  deleteAgent,
  unSponsorAgent,
  addBackDatedRecipientRateAmount,
  addBackDatedRecipientAgentRateAmount,
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
