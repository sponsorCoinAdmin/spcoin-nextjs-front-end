# Connection, Network, and Active Account Notes

Date: 2026-06-05

## Problem Summary

The app currently blends several related but different concepts:

- The selected SponsorCoin working account (`accounts.activeAccount`)
- Whether MetaMask has authorized `localhost:3000` to read accounts
- The selected or known blockchain network (`exchangeContext.network`)
- The signer that will actually submit write transactions
- Whether execution is routed through MetaMask or directly through Hardhat JSON-RPC

This can make the UI confusing. For example, MetaMask can show `Connect` / `Not connected` while the app's Exchange Context shows `network.connected: true`.

That state is possible because those flags do not mean the same thing.

## Current Observed Case

Screenshot behavior:

- App active account:
  `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199`
- MetaMask displayed account:
  `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- MetaMask site status:
  `localhost:3000` is `Not connected`
- App network:
  `HH_BASE`, chain/app chain `31337`

The active account did not switch to the MetaMask account because MetaMask had not authorized the site. In that state wagmi may not expose an account address, and MetaMask account events may not contain a usable account list.

## Important Distinction

MetaMask `Connect` means:

> The site is not currently authorized to read MetaMask accounts.

It does not necessarily mean the app has no network selected. Browser wallets can expose network or chain-change information separately from account authorization.

App `network.connected` currently behaves closer to:

> The app has a selected, known, or restored network.

It should not be interpreted as:

> MetaMask is connected and account-authorized.

## Why `network.connected` Can Be True While MetaMask Says Connect

`lib/context/helpers/ExchangeSanitizeHelpers.ts` sets `network.connected = true` when there is a non-zero effective `chainId`.

Relevant behavior:

- A persisted or restored `31337` can make the app network appear connected.
- This does not require MetaMask account authorization.
- This is especially relevant for local Hardhat / Anvil workflows.

`lib/utils/network/hooks/useNetworkController.ts` also listens for wallet `chainChanged` events and updates network state separately from account state.

## Active Account Behavior

`accounts.activeAccount` is intentionally preserved when MetaMask is disconnected or missing an address.

This matters because the app may need a working account for offline or direct Hardhat processing. Clearing `activeAccount` just because MetaMask is not authorized would break that workflow.

Current sync paths in `lib/context/ExchangeProvider.tsx`:

- Wagmi account sync updates `accounts.activeAccount` when `useAccount()` has `isConnected === true` and an `address`.
- A fallback MetaMask `accountsChanged` listener also updates `accounts.activeAccount` when MetaMask emits a non-empty account list.
- When disconnected or missing an address, the provider currently preserves the previous `activeAccount`.

That preservation is useful, but the UI needs to show whether the preserved account is the active signer, a MetaMask account, or an offline/Hardhat-selected account.

## Hardhat Direct Mode

In SponsorCoinLab Hardhat mode, the app is not using MetaMask as the wallet signer.

The Hardhat path is implemented in:

`app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabNetwork.ts`

Key behavior:

- Hardhat accounts are loaded from:
  `/assets/spCoinLab/networks/31337/testAccounts.json`
- Each account can include:
  - `address`
  - `privateKey`
- For writes, the app creates an ethers signer directly:
  `new Wallet(account.privateKey, provider)`
- The provider is a Hardhat JSON-RPC provider created from the configured RPC URL.

So in Hardhat direct mode:

- The selected Hardhat account address is the blockchain address.
- The "wallet" is an ethers `Wallet` object inside the app.
- MetaMask is not required for signing.
- MetaMask can correctly show `Not connected` while Hardhat direct signing still works.

## What Wallet Are We Using?

It depends on execution mode.

### MetaMask Mode

The wallet is MetaMask.

- Account source: MetaMask authorized account
- Signer source: `BrowserProvider(window.ethereum).getSigner()`
- Site authorization required: yes
- User confirmation required for writes: yes, in MetaMask

### Hardhat Direct Mode

The wallet is the app-created ethers wallet.

- Account source: selected Hardhat test account
- Signer source: `new Wallet(privateKey, JsonRpcProvider)`
- Site authorization required: no
- User confirmation required for writes: no MetaMask prompt

In this mode the app is effectively acting as its own wallet client for local development, using a private key from the local Hardhat account list.

## Architecture Issue

The app should separate these concepts explicitly:

- `activeAccount`: current working SponsorCoin account; may be preserved offline
- `walletSource`: `metamask`, `hardhat`, or possibly `offline`
- `signerAddress`: address that will actually sign write transactions
- `walletAuthorized`: whether MetaMask has granted account access
- `networkSource`: `metamask` or `directRpc`
- `network.connected`: whether the app network is selected/usable, not necessarily MetaMask-authorized

Without this separation, a user can see:

- App network connected
- Active account populated
- MetaMask not connected

That may be valid in Hardhat direct mode, but confusing in MetaMask mode.

## Recommended Direction

Do not clear `activeAccount` simply because MetaMask is disconnected. That account may be needed for offline or Hardhat workflows.

Instead, make signer and connection status explicit:

- Show the active working account separately from the signer account.
- Show whether the signer is MetaMask or Hardhat direct.
- Show whether MetaMask is authorized only when the current wallet source is MetaMask.
- Rename or visually clarify `network.connected` so it does not imply MetaMask account connection.

Potential UI labels:

- `Working Account`
- `Signer Source`
- `Signer Address`
- `Network Source`
- `MetaMask Authorized`

Potential state model:

```ts
type WalletSource = 'metamask' | 'hardhat' | 'offline';
type NetworkSource = 'metamask' | 'directRpc' | 'stored';

type ConnectionState = {
  walletSource: WalletSource;
  networkSource: NetworkSource;
  activeAccountAddress?: string;
  signerAddress?: string;
  metamaskAuthorized: boolean;
  appChainId: number;
  walletChainId?: number;
  rpcChainId?: number;
};
```

## Open Questions

- Should Exchange page support Hardhat direct signing, or only SponsorCoinLab?
- Should `activeAccount` always be the signer account, or can it remain a working/offline account while a separate signer is selected?
- Should MetaMask account changes automatically replace `activeAccount`, or only when `walletSource === 'metamask'`?
- Should Hardhat mode write its selected signer into global Exchange Context, or keep it local to SponsorCoinLab?
- Should `network.connected` be renamed, or should a separate `walletAuthorized` field be added first?

## Immediate Takeaway

The app is not necessarily wrong when MetaMask says `Connect` and the app shows `network.connected: true`.

That combination means:

- The app has a selected/known network.
- MetaMask has not authorized account access for the site.
- If Hardhat direct mode is active, the app may still be able to sign with a local ethers `Wallet`.
- If MetaMask mode is active, writes requiring MetaMask should prompt connection before continuing.
