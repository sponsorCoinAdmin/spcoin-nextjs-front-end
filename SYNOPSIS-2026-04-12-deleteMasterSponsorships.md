# SponsorCoinLab Synopsis for 2026-04-12

## Focus

We investigated `deleteMasterSponsorships` in SponsorCoinLab and narrowed the failure from a vague browser/network symptom down to specific delete workflow behavior.

## Current Status

The latest understanding is:

- `getAccountListSize` works
- direct write methods work
- standalone `deleteAccountRecord` works
- `deleteMasterSponsorships` partially works, but fails during leftover account cleanup unless the signer path is correct

This means the issue is not simply "reads fail" or "all deletes fail".

## Important Proof Points

### 1. Direct write success

`addAgentSponsorship` succeeds and returns a valid transaction receipt.

### 2. Standalone delete success

Running `deleteAccountRecord` directly succeeds and removes the root account.

Observed result:

- `status: "1"`
- `message: "Completed successfully."`
- valid `transactionId`
- remaining accounts afterward were the child accounts

This proves `deleteAccountRecord(...)` itself is valid and can succeed.

### 3. `deleteMasterSponsorships` no longer looks like a generic traversal failure

A recent trace showed:

- `loadSponsorAccounts ok []`
- `loadAccountList ok ["root","recipient","agent"]`
- then failure on:
  - `write start deleteAccountRecord(root)`

So the workflow had already finished sponsor-branch discovery and moved into orphan cleanup.

### 4. Traversal is happening

Another trace earlier showed:

- sponsor loaded
- recipient loaded
- recipient rate loaded
- `deleteAgentSponsorship(...)` completed successfully

So the workflow *does* traverse and *does* perform at least some deletes successfully.

## Main Conclusion So Far

The browser `Failed to fetch` symptom was too broad as an explanation.

The better current diagnosis is:

- this is primarily a delete workflow / signer-path issue
- the browser surfaces it as a fetch-style failure
- it is not enough to call it "just a CORS issue"

## Key Code Changes Already Made

### 1. Added deep trace output for serialization test failures

Files:

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts`
- `app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabMethods.ts`

Effect:

- `error.debug.trace` now shows actual execution steps
- trace is visible in Output instead of always showing `[]`

### 2. Reworked `deleteMasterSponsorships`

File:

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts`

Effect:

- no longer depends on vague top-level assumptions
- now traces sponsor discovery, recipient discovery, rate discovery, agent cleanup, remaining recipient checks, remaining account checks, and cleanup writes

### 3. Switched away from `offChain.deleteAccountTree` for this workflow

`deleteMasterSponsorships` now uses the in-file direct delete workflow instead of relying on the helper path.

Reason:

- this made the workflow closer to the known-good direct write execution path
- it removed one extra abstraction layer from the debugging path

### 4. Normalized local delete module methods

Files:

- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinDeleteModule/methods/delRecipient.ts`
- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinDeleteModule/methods/deleteAccountRecord.ts`
- `spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/modules/spCoinDeleteModule/methods/unSponsorRecipient.ts`

Effect:

- local delete methods now use the already signer-bound contract instead of reconnecting it again

### 5. Fixed signer propagation into module access

File:

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes.ts`

Effect:

- signer is attached to module instances too, not only the top-level access object

### 6. Fixed orphan cleanup signer selection

File:

- `app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/serializationTests/index.ts`

Effect:

- orphan cleanup now uses the active selected write signer
- it no longer tries to use each account being deleted as the signer selector

This was the most important recent fix, because standalone `deleteAccountRecord` already proved the contract delete itself works.

## Most Recent Working Theory

Before the latest fix, the cleanup path was likely failing because:

- standalone delete used the active admin/write signer
- scripted cleanup used the account being deleted as signer selector

That mismatch is now corrected.

## Next Step for Tomorrow

Run `deleteMasterSponsorships` again after the cleanup signer fix.

What to inspect:

1. Does it now delete the first remaining account successfully?
2. If it still fails, what does `error.debug.trace` show after:
   - `cleanupSignerAddress ...`
   - `write start deleteAccountRecord(...)`
3. Compare the failing account and signer to the standalone working delete case.

## If It Still Fails

The next targeted checks should be:

1. Trace the exact signer address used for the cleanup write.
2. Compare direct standalone `deleteAccountRecord(root)` versus scripted cleanup `deleteAccountRecord(root)` using the same signer.
3. If both signer and contract call match, inspect whether the script context changes chain/provider state between earlier deletes and the cleanup call.

## Useful Summary Sentence

The investigation has moved from "maybe a browser/CORS problem" to "a specific delete workflow/signer-path mismatch in `deleteMasterSponsorships`, with direct delete methods already proven to work."
