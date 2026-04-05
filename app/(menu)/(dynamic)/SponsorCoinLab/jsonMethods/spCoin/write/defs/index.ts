// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addAccountRecipient from './addRecipient';
import addAccountRecipientRate from './addRecipientRateAmount';
import addAccountSponsor from './addSponsor';
import addRecipients from './addRecipients';
import addAgent from './addAgent';
import addAccountAgentRate from './addAgentRateAmount';
import addAgents from './addAgents';
import delAccountTree from './deleteAccountTree';
import delAccountSponsor from './deleteSponsor';
import delAccountRecipient from './deleteRecipient';
import delAccountRecipientRate from './deleteRecipientRate';
import delAccountRecipientRateAmount from './deleteRecipientRateAmount';
import delAccountAgent from './deleteAgent';
import delAccountAgentRate from './deleteAgentRate';
import delAccountAgentRateAmount from './deleteAgentRateAmount';
import delAccountAgentSponsorship from './deleteAgentSponsorship';
import addAccountRecipientRateBackdated from './addBackDatedSponsorship';
import addAccountAgentRateBackdated from './addBackDatedAgentSponsorship';
import unSponsorRecipient from './unSponsorRecipient';
import delRecipient from './delRecipient';
import delAccountRecord from './deleteAccountRecord';
import delAccountRecords from './deleteAccountRecords';
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
  addAccountRecipient,
  addAccountRecipientRate,
  addAccountSponsor,
  addRecipients,
  addAgent,
  addAccountAgentRate,
  addAgents,
  delAccountTree,
  delAccountSponsor,
  delAccountRecipient,
  delAccountRecipientRate,
  delAccountRecipientRateAmount,
  delAccountAgent,
  delAccountAgentRate,
  delAccountAgentRateAmount,
  delAccountAgentSponsorship,
  addAccountRecipientRateBackdated,
  addAccountAgentRateBackdated,
  unSponsorRecipient,
  delRecipient,
  delAccountRecord,
  delAccountRecords,
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
