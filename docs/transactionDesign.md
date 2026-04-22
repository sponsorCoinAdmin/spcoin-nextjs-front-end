# SponsorCoin Transaction Design

## Purpose

This document records the current design direction for SponsorCoin transaction storage and cleanup.

It is written for two audiences:

- developers who will implement the change
- non-developers who need to understand the idea at a high level

The goal is to preserve this discussion so it can be reused in future sessions without having to rediscover the reasoning.

## Short Summary

We plan to change SponsorCoin so that transactions become the main source of truth for sponsorship relationships.

Today, the system mostly relies on traversing the account tree.

More accurately, the structure behaves like this:

- Sponsor
- Recipient
- Recipient Rate
  - Transaction list
- Agent
- Agent Rate
  - Transaction list

That structure works for simple cases, but it becomes hard to manage when:

- the tree gets large
- rewards must be updated correctly
- deletion must fully clean up all child records
- partial or orphaned links appear

The new direction is:

- keep the tree for navigation and display
- store transactions more directly under each rate node
- use a hashed directory key for fast lookup
- use transaction records as the basis for reward settlement and deletion

This should make the system more scalable, more correct, and easier to clean up.

## The Problem We Are Solving

### Current weakness

The current architecture depends heavily on relationship traversal.

For example, to work with an agent branch, the code may need to walk through:

- sponsor account
- recipient account
- recipient rate
  - recipient-rate transaction list
- agent account
- agent rate
  - agent-rate transaction list

This causes several problems:

- deletion logic becomes complex and fragile
- reward logic depends on finding the right branch at the right time
- orphaned links can appear if one part of the tree is cleaned but another is not
- performance gets worse as the tree becomes larger
- large blockchain deployments may become too expensive or too difficult to reason about

### Why this matters

For a small local test tree, traversal can be tolerated.

For a larger or more realistic blockchain implementation, this approach is risky because:

- gas cost grows with tree depth and branch count
- write operations become harder to keep deterministic
- cleanup becomes more likely to fail part-way
- reward accounting becomes harder to trust

## Core Design Decision

### New rule

Transactions should become the practical source of truth.

The account tree should remain useful, but mostly as:

- a read model
- a navigation model
- a display model
- a secondary index

The important business state should live in transactions that are attached directly to the correct rate node.

## Proposed Structure

### High-level idea

Each rate node gets its own transaction directory.

That means:

- each `RecipientRate` has a transaction directory
- each `AgentRate` has a transaction directory

Instead of searching the whole tree to find transactions, the system can go directly to the correct rate bucket and work there.

### Human model

Think of it like this:

- Sponsor
  - Recipient
    - RecipientRate
      - transaction directory
      - Agent
        - AgentRate
          - transaction directory

The transaction directory under each rate contains the transactions for that exact rate scope.

There are effectively two transaction scopes today:

- transactions attached to a recipient rate
- transactions attached to an agent rate

However, a cleaner new design may be:

- keep one global transaction map as the main storage
- let each hashed directory key act as an index into that map

This means:

- if a branch has no agent, then there is no agent-side transaction entry for that branch
- recipient-side transactions can still exist on their own
- agent-side transactions only exist when an actual agent relationship exists

In other words, we do not need to force separate physical transaction storage under both rate types if one side is empty.

## Possible Unified Transaction Storage Model

One strong version of the design is:

```solidity
mapping(uint256 => StakingTransactionStruct) transactionById;
mapping(bytes32 => uint256[]) transactionIdsByHash;
mapping(uint256 => bytes32) transactionHashById;
```

In that model:

- `transactionById` is the real transaction storage
- `transactionIdsByHash` is the directory index for a branch
- `transactionHashById` is an optional reverse lookup

This may be better than storing full transaction records separately under each branch directory because:

- it avoids duplicate storage patterns
- it gives one clear place where a transaction record lives
- it still preserves fast branch lookup through the hashed directory
- it makes it easier to support branches with no agent

This is now considered a strong candidate for the final design.

## Hashed Directory Key

### Why use a hash key

Rather than using very long branch names, each transaction directory should be identified by a deterministic `hashKey`.

Benefits:

- shorter naming
- consistent lookup
- fast access
- less need to repeatedly pass long relationship paths around

### Recipient rate hash

For a recipient rate, the directory key should be based on:

- sponsor key
- recipient key
- recipient rate key

Conceptually:

```solidity
bytes32 recipientRateHash = keccak256(
    abi.encode(
        sponsorKey,
        recipientKey,
        recipientRateKey
    )
);
```

### Agent rate hash

For an agent rate, the directory key should be based on:

- sponsor key
- recipient key
- recipient rate key
- agent key
- agent rate key

Conceptually:

```solidity
bytes32 agentRateHash = keccak256(
    abi.encode(
        sponsorKey,
        recipientKey,
        recipientRateKey,
        agentKey,
        agentRateKey
    )
);
```

## Transaction ID

### Important clarification

The `transactionId` itself does not need to be a long path string.

Because the transaction already lives inside a hashed directory, the `transactionId` can stay simple.

Recommended form:

```solidity
uint256 transactionId;
```

Generated by:

```solidity
uint256 public nextTransactionId = 1;
```

Then:

```solidity
uint256 txId = nextTransactionId;
nextTransactionId += 1;
```

### Why a simple numeric ID is enough

The hashed directory already tells us the branch.

The numeric transaction ID only needs to identify one transaction inside that branch.

This gives us:

- simple IDs
- clean lookup
- easier debugging
- no need to encode all branch meaning into the ID itself

## Proposed Storage Shape

### Main concept

The current preferred direction is:

- store all transactions in one global transaction map
- use the hashed branch key as a directory index

Conceptually:

```solidity
mapping(uint256 => StakingTransactionStruct) transactionById;
mapping(bytes32 => uint256[]) transactionIdsByHash;
mapping(uint256 => bytes32) transactionHashById;
```

This would allow:

- transaction ID -> exact transaction record
- hash key -> transaction directory
- transaction ID -> hash key

## Example Transaction Record

The transaction record should be practical and easy to understand.

Conceptually:

```solidity
struct StakingTransactionStruct {
    uint256 transactionId;
    address sponsorKey;
    address recipientKey;
    uint256 recipientRateKey;
    address agentKey;
    uint256 agentRateKey;
    uint256 principal;
    uint256 creationTime;
    uint256 lastUpdateTime;
    bool active;
}
```

This record should tell us:

- who the transaction belongs to
- what branch it belongs to
- how much is staked
- when it started
- when rewards were last updated
- whether it is still active

## Reward Design Direction

### Current issue

Reward calculation currently depends too much on walking the tree.

This makes it harder to guarantee that:

- all rewards are calculated
- rewards are updated before deletion
- no branch is missed

### New direction

Rewards should be calculated from the transactions stored under the correct rate directory.

That means:

- rate nodes own their transaction history
- deletions can settle transactions before removing structure
- reward logic can work on concrete transaction records instead of rediscovering them

### Practical result

Before deleting:

- load transaction directory by hash
- settle rewards for those transactions
- mark or remove transactions
- then remove empty rate, agent, recipient, or sponsor links

This is much more reliable than broad traversal.

## Delete Method Direction

We discussed updating the delete methods so that they become more direct and trustworthy.

Likely target methods:

- `deleteAgent`
- `deleteRecipient`
- `deleteSponsor`

Even if some of these names are wrappers around current methods, the design intent is:

- the delete methods should act against transaction records first
- the tree should be cleaned only after transactions are settled and removed

This would make the delete methods much closer to a single source of truth model.

## Storage Size Concerns

### Will storage get larger?

Probably yes, at least somewhat.

Why:

- we will store explicit transaction records
- we will store transaction IDs in directories
- we may store reverse lookups or small helper indexes

### Is that a problem?

Probably not for our main concern.

The bigger issue today is not raw storage size.

The bigger issues are:

- traversal complexity
- cleanup correctness
- reward consistency
- scalability on larger deployments

In other words:

- slightly larger storage is acceptable
- incorrect or fragile cleanup is not acceptable

### Main warning

The new model should not create two competing sources of truth.

Bad outcome:

- old tree remains fully authoritative
- new transaction model is also treated as authoritative
- both must always match

Good outcome:

- transactions become authoritative
- tree data becomes an index, navigation layer, or view layer

## Benefits of the New Design

If implemented carefully, this architecture should provide:

- more reliable deletion
- easier reward settlement
- fewer orphaned links
- better scalability
- simpler reasoning about correctness
- clearer debugging
- cleaner future API design

## Tradeoffs

This is not free.

Costs include:

- a structural refactor
- some increase in storage
- transition work while old and new logic coexist
- additional testing needs

Still, we believe this is the correct long-term direction.

## Implementation Plan

### Phase 1: Structure change

Start with the structural change first.

This means:

- add hashed transaction directories under each rate
- add transaction IDs
- add transaction records
- keep the current tree readable while introducing the new structure

### Phase 2: Test with deletions

After the structure exists, begin testing deletion flows against it.

Primary focus:

- `deleteAgent`
- `deleteRecipient`
- sponsor-level cleanup

The first goal is to prove that deletions become simpler and more correct with the new structure.

### Phase 3: Extend reward integration

Once deletion works reliably:

- move reward settlement to transaction-based logic
- reduce tree traversal where possible
- make delete methods settle transactions before removing structure

### Phase 4: Reduce old traversal dependence

Later, once the new model is proven:

- remove unnecessary traversal-heavy logic
- reduce duplicate representations
- simplify the cleanup path

## Layman Explanation

If we explain this in plain English:

Today, the system behaves like a filing cabinet where the only way to find a document is to open many nested folders and hope every folder is still organized correctly.

The new plan is to keep the folder system, but add a proper transaction filing index inside each important folder.

That means:

- every important rate section has its own transaction drawer
- each drawer has a short key
- each transaction has its own ID
- deletes and reward updates can work directly on the transaction drawer instead of searching through the whole cabinet

This makes the system:

- faster to access
- easier to clean up
- safer to maintain

## Current Working Decision

We have agreed on this starting direction:

- create transaction directories under each rate
- use hashed keys for the directory names
- use simple numeric transaction IDs
- begin with structure changes
- then test deletion behavior

This is the working plan unless a better design appears during implementation.

## Notes for Future Sessions

If this document is used in a future session, the key context is:

- the current tree-first design is considered too fragile for large-scale use
- transaction-based storage is considered the correct long-term direction
- the chosen shape is local transaction directories under each rate node
- hashed directory keys are preferred for lookup
- simple numeric transaction IDs are preferred inside those directories
- implementation should begin with structure changes, then deletion testing
