# spCoinWallet Task

Date: 2026-06-05

## Goal

Create a first-class SponsorCoin wallet module that owns wallet/source selection, signer selection, and account selection.

Working name:

`spCoinWallet`

The goal is to simplify connection and account selection by moving the current scattered account dropdowns and signer-source logic into one wallet-style popup.

## Current Problem

The app currently mixes several concepts across multiple screens:

- MetaMask connection state
- Hardhat direct RPC state
- Active working account
- Selected signer account
- Account-list dropdowns inside method forms
- Account display in the top navigation
- Hardhat account/private-key signing inside SponsorCoinLab

This causes confusing states, such as:

- MetaMask says `Connect`, but the app has `network.connected: true`
- The app has an `activeAccount`, but no MetaMask account authorization
- SponsorCoinLab has Hardhat account dropdowns, but Exchange does not clearly expose the same wallet/source model
- Account selection lists appear inline inside method forms instead of coming from one wallet/account source

## Proposed Simplification

Build an in-app SponsorCoin wallet popup.

Any account selection should open the wallet. The account list should live in the wallet, not inside every screen that needs an account.

The wallet should own:

- Wallet source selection
- Network source selection
- Active working account
- Signer account
- Hardhat account list
- MetaMask authorization status
- Direct Hardhat signer status
- Account metadata display

This should reduce duplicate account-selection logic and make the UI easier to understand.

## Recommended Module Shape

Do not make one massive file.

Use a module folder with a small facade file:

```txt
lib/spCoinWallet/
  spCoinWallet.ts
  types.ts
  accountSelection.ts
  signerSession.ts
  hardhatWallet.ts
  metamaskWallet.ts
  walletState.ts
```

The requested `spCoinWallet.ts` can be the public entry point:

```ts
export * from './types';
export * from './walletState';
export * from './accountSelection';
export * from './signerSession';
```

This keeps the API simple while avoiding a file that becomes too large to maintain.

## UI Shape

The top-right wallet button should open the SponsorCoin wallet popup.

The popup should feel similar to the existing app style:

- Dark app panel
- SponsorCoin/chain logo
- Compact account rows
- Clear selected state
- Close button
- Source tabs or segmented control

Suggested sections:

- Header: `SponsorCoin Wallet`
- Wallet source: `MetaMask` / `Hardhat Wallet`
- Network: chain name, chain ID, RPC source
- Working account
- Signer account
- Account list
- Balances / status
- Action buttons

## Account Selection Flow

Today, account selection appears inline in forms, for example the SponsorCoinLab method form dropdown.

Target behavior:

1. User clicks any account field.
2. The `spCoinWallet` popup opens.
3. The wallet receives a selection request context:
   - field name
   - allowed account roles
   - current value
   - desired source
4. User selects an account from the wallet.
5. Wallet returns the selected account to the caller.
6. Caller updates its field.

This makes account selection reusable everywhere.

## Selection Request Model

```ts
type SpCoinWalletSource = 'metamask' | 'hardhat' | 'offline';
type SpCoinNetworkSource = 'metamask' | 'directRpc' | 'stored';

type SpCoinWalletAccountRole =
  | 'active'
  | 'sponsor'
  | 'recipient'
  | 'agent'
  | 'owner'
  | 'signer';

type SpCoinWalletSelectionRequest = {
  requestId: string;
  label: string;
  currentAddress?: string;
  allowedRoles?: SpCoinWalletAccountRole[];
  preferredSource?: SpCoinWalletSource;
  requirePrivateKeySigner?: boolean;
};

type SpCoinWalletSelectionResult = {
  address: string;
  source: SpCoinWalletSource;
  role?: SpCoinWalletAccountRole;
  label?: string;
};
```

## Wallet Session Model

```ts
type SpCoinWalletSession = {
  walletSource: SpCoinWalletSource;
  networkSource: SpCoinNetworkSource;
  appChainId: number;
  walletChainId?: number;
  rpcChainId?: number;
  metamaskAuthorized: boolean;
  activeAccountAddress?: string;
  signerAddress?: string;
  signerAvailable: boolean;
};
```

## Hardhat Wallet Behavior

Hardhat Wallet mode should use the current direct signing model, but make it explicit.

Current implementation already creates an ethers wallet with:

```ts
new Wallet(account.privateKey, provider)
```

The new wallet module should formalize that behavior:

- Load Hardhat accounts from the known network account list
- Track selected Hardhat account
- Hide private keys by default
- Show clear `Local Dev Only` labels
- Use a direct JSON-RPC provider
- Confirm writes in an app popup before signing
- Never require MetaMask authorization

## MetaMask Wallet Behavior

MetaMask mode should use:

```ts
new BrowserProvider(window.ethereum)
```

It should track:

- Whether MetaMask is installed
- Whether the site is authorized
- Current MetaMask account
- Current MetaMask chain
- Whether the chain matches app expectations

If MetaMask is not authorized, the wallet popup should show a clear `Connect MetaMask` action.

## How This Simplifies the App

This is a major simplification because it creates a single source for:

- What account is selected
- What account will sign
- Which wallet source is active
- Whether MetaMask connection matters
- Whether Hardhat direct signing is available

Screens should stop inventing their own account dropdowns. They should request account selection from `spCoinWallet`.

## First Implementation Pass

Recommended order:

1. Add `lib/spCoinWallet` types and session model.
2. Add wallet popup UI shell.
3. Move Hardhat account list display into the popup.
4. Add a wallet selection request/response mechanism.
5. Wire the top-right wallet button to open the popup.
6. Wire one existing SponsorCoinLab account field to use the popup.
7. After that works, replace other account dropdowns.

## Guardrails

- Keep private keys dev-only.
- Do not store private keys in browser localStorage.
- Do not log private keys.
- Do not send private keys to server APIs.
- Clearly label Hardhat Wallet as local/test only.
- Keep MetaMask and Hardhat signer state separate.

## Open Questions

- Should `spCoinWallet` live under `lib/spCoinWallet` or `app/(menu)/(dynamic)/SpCoinWallet`?
- Should the popup be global across the whole app or scoped to Exchange/SponsorCoinLab first?
- Should Exchange support Hardhat direct signing immediately?
- Should account roles come from local account metadata, contract records, or both?
- Should a selected Hardhat signer automatically become `accounts.activeAccount`?
- Should account selection support multi-select later?

## Take

This is likely the right simplification.

The key is to make the wallet popup the only place where account selection happens. Then Exchange, SponsorCoinLab, and future screens can all ask the same module for an account instead of each screen building its own account selector.

The module should start as an in-app popup wallet, not a browser extension. But the state model should be clean enough that a browser extension or external wallet adapter could be added later.
