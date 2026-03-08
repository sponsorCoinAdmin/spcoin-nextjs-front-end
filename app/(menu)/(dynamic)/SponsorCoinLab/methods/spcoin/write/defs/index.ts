// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addRecipient from './addRecipient';
import addRecipients from './addRecipients';
import addAgent from './addAgent';
import addAgents from './addAgents';
import addAccountRecord from './addAccountRecord';
import addAccountRecords from './addAccountRecords';
import addSponsorship from './addSponsorship';
import addAgentSponsorship from './addAgentSponsorship';
import addBackDatedSponsorship from './addBackDatedSponsorship';
import addBackDatedAgentSponsorship from './addBackDatedAgentSponsorship';
import unSponsorRecipient from './unSponsorRecipient';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import deleteAgentRecord from './deleteAgentRecord';
import updateAccountStakingRewards from './updateAccountStakingRewards';
import depositSponsorStakingRewards from './depositSponsorStakingRewards';
import depositRecipientStakingRewards from './depositRecipientStakingRewards';
import depositAgentStakingRewards from './depositAgentStakingRewards';
import depositStakingRewards from './depositStakingRewards';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addRecipient,
  addRecipients,
  addAgent,
  addAgents,
  addAccountRecord,
  addAccountRecords,
  addSponsorship,
  addAgentSponsorship,
  addBackDatedSponsorship,
  addBackDatedAgentSponsorship,
  unSponsorRecipient,
  deleteAccountRecord,
  deleteAccountRecords,
  deleteAgentRecord,
  updateAccountStakingRewards,
  depositSponsorStakingRewards,
  depositRecipientStakingRewards,
  depositAgentStakingRewards,
  depositStakingRewards,
};
