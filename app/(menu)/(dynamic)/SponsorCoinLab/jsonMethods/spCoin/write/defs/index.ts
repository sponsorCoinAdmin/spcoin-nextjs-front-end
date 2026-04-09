// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addAccountRecipient from './addRecipient';
import addSponsorship from './addRecipientRateAmount';
import addAccountSponsor from './addSponsor';
import addRecipients from './addRecipients';
import addAgent from './addAgent';
import addAgentSponsorship from './addAgentRateAmount';
import addAgents from './addAgents';
import deleteSponsor from './deleteSponsor';
import deleteRecipientSponsorships from './deleteRecipientSponsorships';
import deleteRecipientSponsorshipTree from './deleteRecipientSponsorshipTree';
import deleteAgentSponsorships from './deleteAgentSponsorships';
import deleteRecipientRateSponsorship from './deleteRecipientRate';
import deleteRecipientRateAmount from './deleteRecipientRateAmount';
import deleteAgent from './deleteAgent';
import deleteAgentSponsorship from './deleteAgentSponsorship';
import addBackDatedSponsorship from './addBackDatedSponsorship';
import addBackDatedAgentSponsorship from './addBackDatedAgentSponsorship';
import deleteRecipientSponsorship from './delRecipient';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import updateAccountStakingRewards from './updateAccountStakingRewards';
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
  addAccountRecipient,
  addSponsorship,
  addAccountSponsor,
  addRecipients,
  addAgent,
  addAgentSponsorship,
  addAgents,
  deleteSponsor,
  deleteRecipientSponsorships,
  deleteRecipientSponsorshipTree,
  deleteAgentSponsorships,
  deleteRecipientRateSponsorship,
  deleteRecipientRateAmount,
  deleteAgent,
  deleteAgentSponsorship,
  addBackDatedSponsorship,
  addBackDatedAgentSponsorship,
  deleteRecipientSponsorship,
  deleteAccountRecord,
  deleteAccountRecords,
  updateAccountStakingRewards,
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
