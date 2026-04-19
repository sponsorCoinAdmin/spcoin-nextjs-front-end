# SponsorCoin Token API and Naming Synopsis for 2026-04-19

## Focus

This captures the discussion around the recently modified on-chain SponsorCoin token, especially:

- which methods are exported by the active token
- what the token now represents architecturally
- where naming should be normalized next
- when the suffix `Record` is useful and when it is noise

The active token source reviewed here is under `spCoinAccess/contracts/spCoin`.

## Current Assessment

The current `SPCoin` contract is no longer only an ERC-20 token. It is an ERC-20 token plus an on-chain sponsorship, recipient, agent, staking, reward, and unsubscribe protocol.

That gives the contract a rich domain model, but it also means the public API surface is large. The main risk is no longer missing capability. The main risk is API clarity: methods with overlapping terms such as `Record`, `Transaction`, `Rate`, `Reward`, `Core`, and `List` need a consistent naming system.

The strongest parts of the current design are:

- core tuple getters exist for app-side reconstruction
- sponsor, recipient, agent, rate, transaction, and reward concepts are represented on-chain
- delete and unsubscribe paths are explicit
- reward totals are available through a direct token getter

The main concerns are:

- the token exposes application/protocol methods beside ERC-20 methods
- some public names still look like old internal helper names
- some reward methods and parser helpers are too generic
- `Record` and `Transaction` are still mixed for concepts that should be distinct
- there is a typo in `updateRecipietAccountRewards`
- `init` and `initToken` are public in the active source and should be reviewed carefully before deployment assumptions are made

## Active Token Inheritance Chain

The working model discussed was:

`SPCoin -> Token -> UnSubscribe -> Transactions -> RewardsManager -> StakingManager -> AgentRates -> Agent -> RecipientRates -> Recipient -> Sponsor -> Account -> StructSerialization -> Utils -> Security -> SpCoinDataTypes`

Because of that inheritance chain, the callable token API includes ERC-20 methods, protocol mutators, protocol readers, reward methods, delete methods, and Solidity-generated getters for public state.

## Token-Exported Method Groups

### Auto-Generated Public Getters

These come from public state variables:

- `balanceOf(address)`
- `allowance(address,address)`
- `name()`
- `symbol()`
- `decimals()`
- `totalSupply()`
- `creationTime()`
- `totalStakedSPCoins()`
- `totalStakingRewards()`
- `totalUnstakedSpCoins()`

### SPCoin / ERC-20

- `getVersion()`
- `setVersion(string)`
- `init()`
- `initToken(string,string,uint,uint)`
- `transfer(address,uint256)`
- `approve(address,uint256)`
- `transferFrom(address,address,uint256)`

### Security / Config

- `owner()`
- `isAccountInserted(address)`
- `getInflationRate()`
- `setInflationRate(uint256)`
- `getLowerRecipientRate()`
- `getUpperRecipientRate()`
- `getRecipientRateRange()`
- `setRecipientRateRange(uint256,uint256)`
- `getLowerAgentRate()`
- `getUpperAgentRate()`
- `getAgentRateRange()`
- `setAgentRateRange(uint256,uint256)`
- `getInitialTotalSupply()`

### Account / Sponsor / Recipient / Agent Reads

- `getMasterAccountKeys()`
- `getMasterAccountKeyAt(uint256)`
- `getAccountKeyCount()`
- `getAccountCore(address)`
- `getAccountLinks(address)`
- `getRecipientKeys(address)`
- `getAgentKeys(address)`
- `getRecipientKeyCount(address)`
- `getAgentKeyCount(address)`
- `getRecipientRecord(address,address)`
- `getRecipientRecordByKeys(address,address)`
- `getRecipientRecordCore(address,address)`
- `getRecipientRateList(address,address)`
- `getRecipientRateRecord(address,address,uint)`
- `getRecipientRateRecord(address,address,uint,uint)`
- `getRecipientRateRecordByKeys(address,address,uint)`
- `getRecipientRateRecordCore(address,address,uint256)`
- `getAgentRecord(address,address,uint,address)`
- `getAgentRecordByKeys(address,address,uint,address)`
- `getRecipientRateAgentList(address,address,uint256)`
- `getAgentTotalRecipient(address,address,uint,address)`
- `getAgentRateList(address,address,uint,address)`
- `getAgentRateRecord(address,address,uint,address,uint,uint)`
- `getAgentRateRecordByKeys(address,address,uint,address,uint)`
- `getAgentRateRecordCore(address,address,uint,address,uint)`
- `getSponsorAccountRecord(address)`

### Account / Recipient / Agent Mutators

- `addSponsorRecipient(address,address)`
- `addRecipientAgent(address,address,uint,address)`

### Rewards / Staking

- `depositStakingRewards(uint,address,address,uint,address,uint,uint)`
- `getAccountRewardTotals(address)`
- `updateAccountStakingRewards(address)`
- `updateSponsorAccountRewards(address)`
- `updateAgentAccountRewards(address)`
- `updateRecipietAccountRewards(address)`

There are also internal reward calculation/update helpers in `RewardsManager`, but those are not part of the external token API.

### Transaction Methods

- `addSponsorship(address,uint,address,uint,string,string)`
- `addRecipientRateTransaction(address,address,uint,string,string)`
- `addAgentTransaction(address,address,uint,address,uint,string,string)`
- `backDateTransactionDate(address,address,uint256,address,uint256,uint256,uint256)`
- `getAgentRateTransactionCount(address,address,uint256,address,uint256)`
- `getRecipientRateTransactionCount(address,address,uint256)`
- `getAgentRateTransactionAt(address,address,uint256,address,uint256,uint256)`

### Delete / Unsubscribe

- `deleteSponsor(address)`
- `deleteSponsorRecipient(address,address)`
- `deleteRecipientRateBranch(address,address,uint256)`
- `deleteRecipientAgent(address,address,uint256,address)`
- `deleteAgentRateBranch(address,address,uint256,address,uint256)`
- `unSponsorRecipient(address)`
- `delRecipient(address,address)`
- `deleteAccountRecord(address)`

## Important Correction From Discussion

Earlier discussion mixed token-exposed methods with app/module serializer methods.

These are app/module serializer style methods, not necessarily token-exported methods:

- `getSerializedSPCoinHeader`
- `getSerializedAccountRecord`
- `getSerializedAccountRewards`
- `getSerializedRecipientRecordList`
- `getSerializedRecipientRateList`
- `serializeAgentRateRecordStr`
- `getSerializedRateTransactionList`

Reward-related token methods currently include:

- `getAccountRewardTotals(address)`
- `updateAccountStakingRewards(address)`
- `updateSponsorAccountRewards(address)`
- `updateAgentAccountRewards(address)`
- `updateRecipietAccountRewards(address)`

The earlier mention of `getRewardAccounts(...)` and token-level `getSerializedAccountRewards(...)` should not be treated as active token API unless those methods are reintroduced in the Solidity contract.

## Naming Guidance

The highest-value naming fixes are semantic, not cosmetic.

Use `Record` for entity/state snapshots:

- account record
- recipient relationship record
- agent relationship record
- account reward record, if the method returns a reward account object

Use `Transaction` for event-like staking or rate entries:

- recipient rate transaction
- agent rate transaction
- reward rate transaction

Use `Core` for low-level tuple getters that are meant to be reconstructed by the app:

- `getAccountCore`
- `getRecipientRecordCore`
- `getRecipientRateRecordCore`
- `getAgentRateRecordCore`

Use `List` only for collections and `Count` only for scalar collection sizes.

## Suggested Rename Map

High priority:

- `updateRecipietAccountRewards` -> `updateRecipientAccountRewards`
- `delRecipient` -> `deleteRecipientLink` or `deleteSponsorRecipientLink`
- `getAgentTotalRecipient` -> `getAgentRecipientStakeTotal` or `getAgentTotalStakedSPCoins`

Reward parser/helper names:

- `getAccountRewardTransactionRecord` -> `getRewardAccountRecord`
- `getAccountRateRecordList` -> `getRewardRateRecordList` or `getAccountRewardRateList`
- `getRateTransactionList` -> `getRewardRateTransactionList`

Recipient/agent rate names, if the domain should consistently use transaction terminology:

- `getRecipientRateRecord` -> `getRecipientRateTransaction`
- `getRecipientRateRecordList` -> `getRecipientRateTransactionList`
- `getAgentRateRecord` -> `getAgentRateTransaction`
- `getAgentRateRecordList` -> `getAgentRateTransactionList`

Core getter names can stay as-is for now because they communicate raw tuple access clearly:

- `getAccountCore`
- `getAccountLinks`
- `getRecipientRecordCore`
- `getRecipientRateRecordCore`
- `getAgentRateRecordCore`

## Rule for the `Record` Suffix

`Record` is not needed everywhere.

Keep `Record` when a method returns an entity/state object and there are nearby list, count, core, or transaction methods that could otherwise make the noun ambiguous.

Drop `Record` when:

- the noun already clearly implies the thing being returned
- the method returns a scalar, list, or count
- the method is really returning an event-like transaction
- the method is a raw tuple getter, where `Core` is the better suffix

The clean naming rule:

- entity snapshot -> `Record`
- event-like staking/rate item -> `Transaction`
- raw tuple getter -> `Core`
- collection -> `List`
- collection size -> `Count`
- scalar config/value -> no suffix

## Recommended Next Step

Before renaming implementation starts, create a single canonical method map with:

- current Solidity method
- desired Solidity method
- app/module wrapper name
- ABI compatibility risk
- migration status

That map should drive contract edits, module wrapper edits, read-method definition edits, tests, and any UI labels together.
