# Trading Station Panel Navigation

This document explains how the SponsorCoin Trading Station panel system works in the current app.
It maps directly to the tree panel in image 1 and the `displayStack` idea in image 2.

The UI has three ideas that work together:

1. The panel tree
2. The radio panel group
3. The `displayStack`

The tree decides what can exist. The radio group decides which major overlay is active. The `displayStack` records the current navigation path through stack-capable panels.

## Panel Tree

The canonical tree is authored in:

- [lib/panels/panelConfig.ts](../lib/panels/panelConfig.ts)
- [lib/structure/exchangeContext/registry/panelRegistry.ts](../lib/structure/exchangeContext/registry/panelRegistry.ts)

The tree defines parent/child structure and default visibility. It does not just describe the UI visually; it also tells the store what can be opened, what belongs under a parent, and what should be treated as a structural container.

In the test view, the tree is rendered on the left side and the GUI on the right side:

- [app/(menu)/Test/Tabs/ExchangeContext/index.tsx](../app/(menu)/Test/Tabs/ExchangeContext/index.tsx)

## Main Radio Panel Group

The main radio group is the set of top-level overlays where only one member should be visible at a time.

The code calls this `MAIN_RADIO_OVERLAY_PANELS`:

- [lib/structure/exchangeContext/constants/spCoinDisplay.ts](../lib/structure/exchangeContext/constants/spCoinDisplay.ts)

The important members are:

1. `TRADING_STATION_PANEL`
2. `TOKEN_LIST_SELECT_PANEL`
3. `ACCOUNT_LIST_SELECT_PANEL`
4. `ERROR_MESSAGE_PANEL`
5. `MANAGE_SPONSORSHIPS_PANEL`
6. `STAKING_SPCOINS_PANEL`
7. `ACCOUNT_LIST_REWARDS_PANEL`
8. `ACCOUNT_PANEL`
9. `TOKEN_PANEL`

In the tree authoring layer these are wired under `MAIN_TRADING_PANEL` and `TRADE_CONTAINER_HEADER`:

- [lib/panels/panelConfig.ts](../lib/panels/panelConfig.ts)

The radio behavior is enforced when a radio member is opened:

- [lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts](../lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts)

That code applies global radio selection so opening one radio member hides the others in the group.

## Display Stack

The `displayStack` is the navigation history for stack-capable panels.

It lives in:

- `exchangeContext.settings.displayStack`

The provider explicitly treats that as the single source of truth:

- [lib/context/ExchangeProvider.tsx](../lib/context/ExchangeProvider.tsx)

The stack is built from visible panels during boot, then filtered so only stack-eligible overlays stay in it:

- [lib/context/helpers/panelBootstrap.ts](../lib/context/helpers/panelBootstrap.ts)
- [lib/structure/exchangeContext/constants/spCoinDisplay.ts](../lib/structure/exchangeContext/constants/spCoinDisplay.ts)

The important rule is:

- opening a stack-capable panel can push it onto the stack
- closing a stack-capable panel can pop back to the previous stack item
- closing a non-stack panel just hides that panel

The stack is not the same thing as visibility. A panel can be present in the tree, visible or hidden, and either included or excluded from the stack depending on whether it is stack-eligible.

## Visibility Versus Navigation

There are two related but different mechanisms:

1. `setPanelVisible(...)`
2. `openPanel(...)` / `closePanel(...)`

`setPanelVisible(...)` is a direct visibility toggle. It updates the tree state and the panel store, but it does not perform radio-group switching or stack restoration on its own.

`openPanel(...)` and `closePanel(...)` are the navigation actions. They are what enforce the higher-level behavior:

- radio exclusivity for the main overlay group
- stack push and pop behavior for stack panels
- special handling for manage/rewards branches

The implementation lives in:

- [lib/context/exchangeContext/hooks/usePanelTree.ts](../lib/context/exchangeContext/hooks/usePanelTree.ts)
- [lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts](../lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts)

## How The Test Page Uses It

The test page is a good way to see the whole system at once.

On the left:

- the exchange context tree
- the current `displayStack`
- the list of visible panel tree members

On the right:

- the actual GUI panels that the tree controls

That means the tree is the model, and the GUI is the rendered result.

## Practical Reading Of The System

When a panel opens, ask two questions:

1. Is this panel part of the main radio group?
2. Is this panel stack-capable?

If the answer to the first question is yes, the app will treat it as one of the mutually exclusive top-level overlays.

If the answer to the second question is yes, the app may push it onto `displayStack` and restore the previous panel when it is closed.

If neither is true, then the panel is usually just a structural child or a local visibility toggle inside a parent panel.

## Short Version

- The tree describes what exists.
- The radio group controls which main overlay is active.
- The `displayStack` controls back/forward style navigation across stack-capable panels.
- `setPanelVisible(...)` toggles visibility.
- `openPanel(...)` and `closePanel(...)` perform the real navigation work.
