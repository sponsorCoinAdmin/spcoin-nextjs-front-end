// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addRecipient from './addRecipient';
import addRecipients from './addRecipients';
import addAgent from './addAgent';
import addAgents from './addAgents';
import addSponsor from './addSponsor';
import addSponsorship from './addSponsorship';
import addAgentSponsorship from './addAgentSponsorship';
import addBackDatedSponsorship from './addBackDatedSponsorship';
import addBackDatedAgentSponsorship from './addBackDatedAgentSponsorship';
import deleteAccountFromMaster from './deleteAccountFromMaster';
import unSponsorRecipient from './unSponsorRecipient';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import updateAccountStakingRewards from './updateAccountStakingRewards';
import updateAgentAccountRewards from './updateAgentAccountRewards';
import updateRecipietAccountRewards from './updateRecipietAccountRewards';
import updateSponsorAccountRewards from './updateSponsorAccountRewards';
import depositSponsorStakingRewards from './depositSponsorStakingRewards';
import depositRecipientStakingRewards from './depositRecipientStakingRewards';
import depositAgentStakingRewards from './depositAgentStakingRewards';
import depositStakingRewards from './depositStakingRewards';
import setInflationRate from './setInflationRate';
import setLowerRecipient from './setLowerRecipient';
import setUpperRecipient from './setUpperRecipient';
import setRecipientRateRange from './setRecipientRateRange';
import setLowerAgent from './setLowerAgent';
import setUpperAgent from './setUpperAgent';
import setAgentRateRange from './setAgentRateRange';
import setVersion from './setVersion';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addRecipient,
  addRecipients,
  addAgent,
  addAgents,
  addSponsor,
  addSponsorship,
  addAgentSponsorship,
  addBackDatedSponsorship,
  addBackDatedAgentSponsorship,
  deleteAccountFromMaster,
  unSponsorRecipient,
  deleteAccountRecord,
  deleteAccountRecords,
  updateAccountStakingRewards,
  updateAgentAccountRewards,
  updateRecipietAccountRewards,
  updateSponsorAccountRewards,
  depositSponsorStakingRewards,
  depositRecipientStakingRewards,
  depositAgentStakingRewards,
  depositStakingRewards,
  setInflationRate,
  setLowerRecipient,
  setUpperRecipient,
  setRecipientRateRange,
  setLowerAgent,
  setUpperAgent,
  setAgentRateRange,
  setVersion,
};
