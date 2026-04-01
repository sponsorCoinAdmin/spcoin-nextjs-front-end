// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addRecipient from './addRecipient';
import addSponsor from './addSponsor';
import addRecipients from './addRecipients';
import addOffChainRecipients from './addOffChainRecipients';
import addAgent from './addAgent';
import addAgents from './addAgents';
import addOffChainAgents from './addOffChainAgents';
import deleteAccountTree from './deleteAccountTree';
import addAgentSponsorship from './addAgentSponsorship';
import deleteAgentSponsorship from './deleteAgentSponsorship';
import addBackDatedSponsorship from './addBackDatedSponsorship';
import addBackDatedAgentSponsorship from './addBackDatedAgentSponsorship';
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
import setLowerRecipientRate from './setLowerRecipient';
import setUpperRecipientRate from './setUpperRecipient';
import setRecipientRateRange from './setRecipientRateRange';
import setLowerAgentRate from './setLowerAgent';
import setUpperAgentRate from './setUpperAgent';
import setAgentRateRange from './setAgentRateRange';
import setVersion from './setVersion';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addRecipient,
  addSponsor,
  addRecipients,
  addOffChainRecipients,
  addAgent,
  addAgents,
  addOffChainAgents,
  deleteAccountTree,
  addAgentSponsorship,
  deleteAgentSponsorship,
  addBackDatedSponsorship,
  addBackDatedAgentSponsorship,
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
  setLowerRecipientRate,
  setUpperRecipientRate,
  setRecipientRateRange,
  setLowerAgentRate,
  setUpperAgentRate,
  setAgentRateRange,
  setVersion,
};
