// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/defs/index.ts
import addRecipientTransaction from './addRecipientTransaction';
import addAgentTransaction from './addAgentTransaction';
import deleteAccountTree from './deleteAccountTree';
import deleteSponsor from './deleteSponsor';
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
import backDateRecipientTransaction from './backDateRecipientTransaction';
import backDateAgentTransaction from './backDateAgentTransaction';
import deleteRecipientSponsorship from './deleteRecipientSponsorship';
import deleteAccountRecord from './deleteAccountRecord';
import deleteAccountRecords from './deleteAccountRecords';
import runPendingRewards from './runPendingRewards';
import claimOnChainTotalRewards from './claimOnChainTotalRewards';
import claimOnChainSponsorRewards from './claimOnChainSponsorRewards';
import claimOnChainRecipientRewards from './claimOnChainRecipientRewards';
import claimOnChainAgentRewards from './claimOnChainAgentRewards';
import updateMasterStakingRewards from './updateMasterStakingRewards';
import setInflationRate from './setInflationRate';
import setLowerRecipientRate from './setLowerRecipientRate';
import setUpperRecipientRate from './setUpperRecipientRate';
import setRecipientRateRange from './setRecipientRateRange';
import setRecipientRateIncrement from './setRecipientRateIncrement';
import setLowerAgentRate from './setLowerAgentRate';
import setUpperAgentRate from './setUpperAgentRate';
import setAgentRateRange from './setAgentRateRange';
import setAgentRateIncrement from './setAgentRateIncrement';

export const SPCOIN_WRITE_METHOD_DEFS = {
  addRecipientTransaction,
  addAgentTransaction,
  deleteAccountTree,
  deleteSponsor,
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
  backDateRecipientTransaction,
  backDateAgentTransaction,
  deleteRecipientSponsorship,
  deleteAccountRecord,
  deleteAccountRecords,
  runPendingRewards,
  claimOnChainTotalRewards,
  claimOnChainSponsorRewards,
  claimOnChainRecipientRewards,
  claimOnChainAgentRewards,
  updateMasterStakingRewards,
  setInflationRate,
  setLowerRecipientRate,
  setUpperRecipientRate,
  setRecipientRateRange,
  setRecipientRateIncrement,
  setLowerAgentRate,
  setUpperAgentRate,
  setAgentRateRange,
  setAgentRateIncrement,
};
