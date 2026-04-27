# SponsorCoin Transaction Design

## Purpose

This document records the current SponsorCoin transaction-storage design direction.

The goals are:

- preserve the reasoning from recent design discussions
- keep the explanation readable for non-developers
- give future implementation sessions a stable reference

## Short Summary

We are moving toward a hybrid model:

- keep the old runnable transaction flow working exactly as it does today
- add a new global transaction map as parallel storage
- store one transaction record per transaction in that master map
- store transaction id key arrays under each rate branch
- store shared update metadata at the set level under each rate branch
- store shared aggregate stake totals at the set level under each rate branch

The most important correction is:

- `lastUpdateTransactionDate` belongs to the transaction set
- `totalStaked` belongs to the transaction set
- it does **not** belong on each individual transaction record

That matters because reward updates act on the totality of the set, not on each transaction independently.

## Current Tree Model

Today the contract behaves roughly like this:

- Sponsor
- Recipient
- Recipient Rate
  - `transactionList`
- Agent
- Agent Rate
  - `transactionList`

This works, but it creates problems:

- deletion logic must walk the tree carefully
- reward logic depends on rediscovering the right branch
- cleanup can leave partial or orphaned links
- the model becomes harder to reason about as the tree grows

## Current Preferred Design

The current preferred design is:

- keep one master transaction record per transaction
- keep branch-local transaction id key arrays
- keep branch-local transaction set metadata
- keep old `transactionList` storage alive during the migration

So the structure becomes:

- Sponsor
  - Recipient
    - RecipientRate
      - `recipientTransactionSet`
      - `recipientTransactionIdKeys`
      - Agent
        - AgentRate
          - `agentTransactionSet`
          - `agentTransactionIdKeys`

and globally:

- `masterTransactionIdMap`

## Why This Is Better

This gives us the best balance we have found so far:

- writes stay much cheaper than rewriting one large grouped bucket
- each rate still has direct access to its transaction ids
- reward updates can use shared set metadata
- future cleanup can still load the branch transaction ids and process them
- we do not need an extra global transaction directory object

## What We Rejected

We considered storing one grouped master bucket per branch and rewriting that bucket on every new transaction.

That was rejected as the primary design because:

- the bucket gets more expensive to rewrite as it grows
- hot branches with many transactions would become increasingly costly
- every add would eventually pay for prior history again

So the preferred model is:

- one master entry per transaction
- one id-array entry per transaction at the branch
- one shared metadata record per transaction set

## Deletion Strategy: Unlink, Don't Delete

The simplest and most robust approach is to never delete data—only unlink it:

- **Master records are immutable**: `masterTransactionIdMap` entries are append-only history
- **Deletes are link removals**: Removing an agent or recipient just removes their ID from the relevant `transactionIdKeys` arrays
- **Orphaned data is intentional**: "Orphaned" master records remain for auditability and recovery
- **Active accounts list**: Maintain a separate active account registry to track current participants

This eliminates expensive cascading deletes and tree walks. The trade-off of minimal extra storage buys massive simplicity, auditability, and performance benefits.

## Account List Strategy

The account-list model should use two account indexes with different meanings:

- `masterAccountList`
- `activeAccountList`

The intended meaning is:

- `masterAccountList` is the complete append-only list of every account ever registered
- `activeAccountList` is the current list of accounts that are still connected to active branches

This is preferred over moving accounts from `masterAccountList` to an archive list.

The reason is:

- `masterAccountList` stays complete for audit, recovery, and historical display
- branch deletes do not rewrite the historical master list
- the active list can shrink and grow as branches are unlinked or re-linked
- no separate `archiveAccountList` is needed unless the UI later needs a direct archive enumeration

Conceptually:

```solidity
address[] masterAccountList;
address[] activeAccountList;

mapping(address => AccountStruct) accountMap;
mapping(address => bool) isKnownAccount;
mapping(address => bool) isActiveAccount;
```

First registration should:

1. add the account to `masterAccountList` once
2. mark the account known
3. add the account to `activeAccountList` when it receives an active role or link

Branch deletion should:

1. remove the relevant branch links
2. check each affected account for remaining active links
3. remove the account from `activeAccountList` only if it has no remaining active links
4. keep the account in `masterAccountList`
5. keep enough account record data for audit and recovery

Reactivation should:

1. avoid adding the account to `masterAccountList` again
2. add the account back to `activeAccountList`
3. mark it active again

The active-link test should distinguish parent links from child links.

In the current account structure:

- `sponsorKeys` are parent links for an account acting as a recipient
- `parentRecipientKeys` are parent links for an account acting as an agent
- `recipientKeys` are child links for an account acting as a sponsor
- `agentKeys` are child links for an account acting as a recipient

So an account should remain active if any of these lists still has active entries:

```solidity
function hasActiveLinks(address accountKey) internal view returns (bool) {
    AccountStruct storage account = accountMap[accountKey];

    return account.sponsorKeys.length > 0
        || account.parentRecipientKeys.length > 0
        || account.recipientKeys.length > 0
        || account.agentKeys.length > 0;
}
```

That means:

- a recipient is active while it still has sponsor parents
- an agent is active while it still has recipient parents
- a sponsor is active while it still has recipient children
- a recipient is also active while it still has agent children
- an account with no active parent or child links can be removed from `activeAccountList`

The array membership checks should eventually be backed by mappings or index maps so the contract does not need repeated sequential scans just to know whether an account is known or active.

## Online Delete Policy

The on-chain delete methods should be shallow unlink methods.

That means:

- do not recursively traverse descendant branches during a delete call
- do not physically delete master account records
- do not physically delete master transaction records
- do not clear transaction history as part of normal online deletion
- unlink only the directly addressed branch or account relationship
- update active account bookkeeping for the accounts directly touched by that unlink

The current implementation direction uses active link counters:

```solidity
uint256 activeParentLinkCount;
uint256 activeChildLinkCount;
```

These counters let the contract decide whether an account still belongs in `activeAccountList` without scanning every relationship array.

For direct unlink calls:

- unlinking a recipient decrements the sponsor child count and recipient parent count
- unlinking an agent decrements the recipient child count and agent parent count
- unlinking a sponsor clears that sponsor's active child count without walking every recipient

The tradeoff is intentional:

- online deletes stay bounded and gas-predictable
- descendant records may still contain historical references to now-inactive branches
- deeper cleanup, reconciliation, or audit views can be handled by later explicit calls or off-chain tooling

So "delete" means "remove from active reachability," not "erase all historical storage."

## Transaction ID

The transaction id should stay simple:

```solidity
uint256 transactionId;
```

Generated by:

```solidity
uint256 nextTransactionId = 1;
```

Then:

```solidity
uint256 txId = nextTransactionId;
nextTransactionId += 1;
```

## Master Transaction Map

The master map is the real storage for transaction records:

```solidity
mapping(uint256 => TransactionRecordStruct) masterTransactionIdMap;
```

This means:

- one transaction = one master map entry
- direct recipient transactions have one recipient branch array entry
- agent transactions use the same master id in both the recipient-rate branch array and the agent-rate branch array

## Branch-Level Transaction Id Arrays

The branch arrays store keys into the master map.

Preferred naming:

- `recipientTransactionIdKeys`
- `agentTransactionIdKeys`

Each array holds:

- one entry for every transaction on that exact branch

For an agent transaction, the same `transactionId` is intentionally stored in both places:

- `recipientTransactionIdKeys`
- `agentTransactionIdKeys`

The recipient-rate side owns the master record lifetime. Agent-side deletes remove the id from the agent branch, but they should not delete `masterTransactionIdMap[transactionId]` while the recipient-rate list still references it.

Example:

```solidity
recipientTransactionIdKeys = [101, 102, 103];
```

means:

- this recipient-rate branch has three transactions
- the real records live in:
  - `masterTransactionIdMap[101]`
  - `masterTransactionIdMap[102]`
  - `masterTransactionIdMap[103]`

## Transaction Set Metadata

This is the most important part of the new design.

The set metadata lives on the rate branch, not on each transaction record.

Recommended concept:

```solidity
struct RecipientTransactionSetStruct {
    uint256 lastUpdateTransactionDate;
    uint256 totalStaked;
    uint256 transactionCount;
}

struct AgentTransactionSetStruct {
    uint256 lastUpdateTransactionDate;
    uint256 totalStaked;
    uint256 transactionCount;
}
```

These set records are useful because:

- reward calculation acts on the complete transaction set
- a new transaction joins that set
- the shared update timestamp should be written once at the set level
- the shared current staked total should be written once at the set level
- we avoid rewriting every transaction record during a reward update

## Important Rule About Update Time

The authoritative shared update time should be:

- `lastUpdateTransactionDate` on the set
- `totalStaked` on the set for the branch aggregate

It should **not** be stored as the authoritative shared value on each transaction record.

Each transaction record should keep things like:

- `transactionId`
- `insertionTime`
- `stakingRewards`
- sponsor / recipient / rate / agent identity

But the set carries the shared reward update state.

## Important Rule About Total Staked

The authoritative branch aggregate should be:

- `totalStaked` on the transaction set

This field represents the live total stake for that exact rate branch.

That means:

- when a new transaction is added, increment `totalStaked`
- when stake is reduced or a transaction is removed later, decrement `totalStaked`
- reward calculations can read the set total directly instead of adding every transaction again

This is one of the main performance improvements in the new design.

## Example Transaction Record

Conceptually:

```solidity
struct TransactionRecordStruct {
    uint256 transactionId;
    uint256 insertionTime;
    uint256 stakingRewards;
    address sponsorKey;
    address recipientKey;
    uint256 recipientRateKey;
    address agentKey;
    uint256 agentRateKey;
    address[] sourceList;
    bool inserted;
}
```

Notice:

- no `lastUpdateTime` field on the individual transaction record

That field belongs to the set, not the individual record.

## Reward Design Direction

When a new transaction is added:

1. rewards are recalculated using the current transaction set
2. the set receives a new `lastUpdateTransactionDate`
3. the set increments `totalStaked`
4. the new transaction joins the set
5. future updates continue working against the shared set metadata

This is important because:

- the new entry becomes part of the existing reward context
- the whole set moves forward together
- the branch aggregate stake stays available without a full transaction scan
- the contract does not need to rewrite every individual transaction record

## Cleanup Tradeoff

This design means:

- writes are cheaper than grouped bucket rewrites
- cleanups are more expensive than deleting one grouped bucket

That tradeoff is currently acceptable because:

- normal transaction adds happen more often than branch cleanup
- growing write cost is usually the more dangerous long-term scaling problem

So we prefer:

- cheap normal writes
- more expensive but manageable cleanup

instead of:

- progressively heavier writes for active branches

## Transitional Implementation Strategy

To reduce risk, the migration path should be:

1. keep all old runnable behavior unchanged
2. keep old `transactionList` storage untouched
3. dual-write all new transactions into the new structures
4. dual-write the set-level metadata in parallel
5. compare old and new representations
6. switch delete cleanup to the new branch structure in layers
7. only later switch runtime reads and rewards to the new source of truth

## What “Do Not Change Old Runnable Functionality” Means

During this phase:

- old transaction add methods must still run as before
- old reward logic must still run as before
- old `transactionList` arrays must still be populated

The new structures are parallel scaffolding for reads/rewards, but delete cleanup is now being migrated to the new layered branch model.

They are being filled now so that later phases can safely switch over once we trust the new model.

## Current Delete Method Model

The exported token delete methods should represent tree levels:

- `deleteSponsor(address sponsorKey)`
- `deleteRecipient(address sponsorKey, address recipientKey)`
- `deleteRecipientRate(address sponsorKey, address recipientKey, uint256 recipientRateKey)`
- `deleteAgent(address sponsorKey, address recipientKey, uint256 recipientRateKey, address agentKey)`
- `deleteAgentRate(address sponsorKey, address recipientKey, uint256 recipientRateKey, address agentKey, uint256 agentRateKey)`
- `deleteAccountRecord(address accountKey)`

Each exported method should delegate downward instead of reimplementing lower-level cleanup.

The intended call shape is:

```text
deleteSponsor
  -> deleteSponsorRecipients
      -> deleteRecipientTree
          -> deleteRecipientRates
              -> deleteRecipientRate
                  -> deleteAgent
                      -> deleteAgentRates
                          -> deleteAgentRate
                              -> deleteAgentTransactions
                  -> deleteRecipientTransactions
```

## Delete Responsibility Rules

The delete method names should mean exactly what they say:

- `deleteSponsor` deletes the sponsor branch.
- `deleteRecipient` deletes one recipient branch under a sponsor.
- `deleteRecipientRate` deletes one recipient-rate branch.
- `deleteAgent` deletes one agent branch under a recipient-rate.
- `deleteAgentRate` deletes one agent-rate branch.
- `deleteRecipientTransactions` deletes transaction ids and metadata for one recipient-rate branch.
- `deleteAgentTransactions` deletes transaction ids and metadata for one agent-rate branch.

Transaction cleanup helpers should not remove parent branch nodes. Branch delete methods should call transaction cleanup first, then remove the branch node.

The recipient-rate side owns `masterTransactionIdMap` cleanup. This matters because agent transactions are indexed in both `recipientTransactionIdKeys` and `agentTransactionIdKeys`. Agent cleanup removes the agent-side reference only; recipient-rate cleanup removes the master transaction records.

## Current Naming Preference

The naming currently preferred is:

- `masterTransactionIdMap`
- `recipientTransactionSet`
- `agentTransactionSet`
- each transaction set should hold:
- `lastUpdateTransactionDate`
- `totalStaked`
- `transactionCount`
- `recipientTransactionIdKeys`
- `agentTransactionIdKeys`

This keeps the model simple:

- branch holds shared metadata
- branch holds transaction id keys
- master map holds actual transaction records

## Longer-Term Map-First Access Goal

The longer-term goal is:

- maps are for access
- tree/index arrays are for display

The contract should not need to walk the sponsor -> recipient -> rate -> agent -> rate tree in order to find a record. Each real branch component should have a stable direct map key.

The current logical layout is:

```text
sponsorKey
recipientKey
recipientRateKey
agentKey
agentRateKey
transactionIndex or transactionId
```

The gas-efficient version should use fixed `bytes32` ids, not string concatenation.

Recommended key chain:

```solidity
// Sponsor access can stay address-based.
// mapping(address => SponsorNode) sponsors;

bytes32 recipientId = keccak256(
    abi.encode(sponsorKey, recipientKey)
);

bytes32 recipientRateId = keccak256(
    abi.encode(recipientId, recipientRateKey)
);

bytes32 agentId = keccak256(
    abi.encode(recipientRateId, agentKey)
);

bytes32 agentRateId = keccak256(
    abi.encode(agentId, agentRateKey)
);

bytes32 transactionEntryId = keccak256(
    abi.encode(agentRateId, transactionId)
);
```

This gives direct access without tree walking:

```solidity
mapping(address => SponsorNode) sponsors;
mapping(bytes32 => RecipientNode) recipients;
mapping(bytes32 => RecipientRateNode) recipientRates;
mapping(bytes32 => AgentNode) agents;
mapping(bytes32 => AgentRateNode) agentRates;
mapping(uint256 => TransactionRecordStruct) masterTransactionIdMap;
```

For display, keep child-id arrays:

```solidity
mapping(address => bytes32[]) sponsorRecipientIds;
mapping(bytes32 => bytes32[]) recipientRateIds;
mapping(bytes32 => bytes32[]) recipientRateAgentIds;
mapping(bytes32 => bytes32[]) agentRateIds;
mapping(bytes32 => uint256[]) branchTransactionIds;
```

So:

- direct contract access uses maps
- UI/tree display uses id arrays
- transaction records still live once in `masterTransactionIdMap`
- branch records hold ids and set-level metadata

Important gas notes:

- use `bytes32` ids
- use `abi.encode(...)` for unambiguous hashing
- avoid dynamic string keys
- avoid storing duplicate data unless it saves meaningful lookup or recomputation
- keep arrays only where enumeration/display is required

This map-first model is the eventual direction. The current migration should still be incremental: add maps and ids in parallel, dual-write them, compare against the old tree, and only then move reads/deletes/rewards to the map-first source of truth.

## Summary

The design we now prefer is:

- one master transaction record per transaction
- one branch transaction id array entry per transaction
- one set-level metadata record per rate branch
- shared update time on the set
- no shared update time on the individual transaction record
- `masterAccountList` as the append-only complete account registry
- `activeAccountList` as the current active/reachable account registry
- old runnable behavior unchanged during migration

This is the design that should guide the next implementation steps.
