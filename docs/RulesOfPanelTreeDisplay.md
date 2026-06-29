# Rules of Panel Tree Display

Governing rules for how the spCoin panel tree controls visibility across the Merit Wallet UI.

---

## Core Data Model

### Rule 1 — One Enum Per Panel
Every node in the panel tree maps 1-to-1 to a `SP_COIN_DISPLAY` enum value. There are no anonymous or ad-hoc panels. Adding a new visual section requires a new enum entry, a registry definition, and a node in the tree.

### Rule 2 — Child Visibility Is Independent of Parent
A parent panel's visibility change does **not** cascade to its children. Each panel's `visible` flag is stored independently in the flat panel tree. When a parent closes, its children retain their current state. When the parent reopens, children are already in whatever state they were left in.

### Rule 12 — Missing Panels Are Hydrated on Boot
If a panel is absent from a persisted tree (e.g., an older saved state predating that panel), it is injected on application mount via the `MUST_INCLUDE_ON_BOOT` list, using the `defaultVisible` value declared in the panel registry. This prevents stale persisted state from breaking the UI.

---

## Open / Close Behaviour

### Rule 3 — `openPanel` for Radio Members Closes All Siblings
`openPanel(panel)` shows the target panel. For panels that are members of `MAIN_RADIO_OVERLAY_PANELS`, it additionally closes every other member of that group atomically (`applyGlobalRadio`). For non-radio panels it simply sets `visible: true` on the one panel.

### Rule 4 — `closePanel` Is Always Single-Panel
`closePanel(panel)` sets `visible: false` on exactly one panel. It never cascades to children, never affects siblings, and has no radio behavior.

### Rule 8 — Radio Group Panels Are Mutually Exclusive
`MAIN_RADIO_OVERLAY_PANELS` is a defined set of top-level overlays (e.g., `ACCOUNT_PANEL`, `SEND_PANEL`, `WALLET_ACCOUNTS_COMPONENT`). At most one member may be visible at any time. Attempting to open two simultaneously always results in the most recently opened one winning and all others closing.

### Rule 9 — `setPanelVisible` Bypasses Radio Logic
`setPanelVisible(panel, true/false)` is a direct write that sets exactly one panel without any radio enforcement. Use it for sub-panels (e.g., `ACCOUNT_LOGO`, `ACCOUNT_META_DATA`) that are not part of a radio group. Misuse on a radio group member will produce an illegal multi-visible state until the reactive radio enforcer corrects it on the next render.

---

## Visibility Sources

### Rule 9 — Two Sources of Truth, Kept in Sync
Panel visibility lives in two places:

| Source | Where | Who reads it |
|--------|-------|--------------|
| React state | `exchangeContext.settings.spCoinPanelTree` | Panel tree debug viewer, persistence, SSR |
| `panelStore` singleton | In-memory `Map<PanelId, boolean>` | `usePanelVisible`, `PanelGate` |

The `publishVisibility` effect fires after every render and copies the React state into `panelStore`. `setPanelVisible` writes to `panelStore` synchronously (for instant read-back) and schedules a React state update. These two sources should never diverge for more than one render cycle.

---

## DOM Contract

### Rule 5 — Tree Hierarchy Must Mirror DOM Container Hierarchy
The parent-child relationships in the panel tree must precisely reflect the nesting of their corresponding DOM containers in the GUI. If the tree says B is a child of A, then B's container element must be a descendant of A's container element in the DOM. Mismatches cause the panel tree debug viewer to show an incorrect structure and can break layout rules that depend on containment.

### Rule 13 — Enum Name = DOM Anchor Attribute
The string name of a `SP_COIN_DISPLAY` enum value (e.g., `"ACCOUNT_PANEL"`) must be discoverable in the DOM via **either**:

- An explicit `id` attribute: `<div id="ACCOUNT_PANEL">`, or
- A `data-panel` attribute added automatically by `PanelGate`: `<div data-panel="ACCOUNT_PANEL">`

Both satisfy Rule 13. Prefer explicit `id=` for panels whose container is authored directly in JSX. `data-panel` is acceptable for panels whose container is the `PanelGate` wrapper itself. Panels with neither (no DOM anchor at all) violate this rule unless they are `kind: 'flag'` mode flags, which are exempt under Rule 15.

---

## PanelGate

### Rule 10 — PanelGate Lazy-Mounts by Default
`<PanelGate panel={...}>` with default `lazyLoad={true}` returns `null` when its panel is closed — the children are **not mounted in the DOM at all**. With `lazyLoad={false}`, children remain mounted and are hidden via the CSS `hidden` class. Choose `lazyLoad={false}` only when DOM state (scroll position, input focus, animation state) must survive visibility toggles.

### Rule 5a — PanelGate Wrapper Divs Are Structural
When a `PanelGate` is visible it renders a `<div>` wrapper around its children. That wrapper becomes a real DOM node and a participant in whatever flex/grid layout contains it. The wrapper carries no layout classes by default. If the parent is a flex column and children need `shrink-0`, apply it to the **inner** div passed as children — not to the PanelGate itself — or use direct `usePanelVisible` conditionals instead of PanelGate when the extra wrapper would break the layout.

---

## Navigation

### Rule 11 — Opened Overlays Push onto `displayStack`
When a radio overlay is opened, it is recorded on `displayStack` inside `exchangeContext.settings`. This stack enables back-navigation: closing the top entry restores the previous overlay. Panels opened as sub-panels (not top-level radio members) do not push to the stack and are not part of history navigation.

---

## Duplicate Panels

### Rule 14 — No Duplicate Enum Values in the Tree
Each `SP_COIN_DISPLAY` enum value may appear **at most once** in the panel tree. If the same logical UI element (e.g., `ADD_SPONSORSHIP_PANEL`) needs to appear under multiple parent contexts (e.g., trading and staking), each instance must have its own distinct enum value with a context suffix:

```
ADD_SPONSORSHIP_PANEL          // trading context (original)
ADD_SPONSORSHIP_PANEL_STAKING  // staking context
```

Related instances should be grouped in a companion `const` array for easy enumeration. Suffixes should reflect the parent context (`_TRADING`, `_STAKING`, `_SEND`, etc.). The underlying component should accept the panel id as a prop so a single implementation serves both instances.

---

## Mode Flags

### Rule 15 — Mode Flags Are Headless Panel Tree Entries
Some `SP_COIN_DISPLAY` enum values represent **mode flags** — reactive boolean state stored in the panel tree that does not correspond to any visible DOM container. Mode flags are legitimate and intentional; they use the panel store as a lightweight pub/sub mechanism so any component can set them remotely via `openPanel` / `closePanel` without needing direct access to `setExchangeContext`.

Examples: `ACTIVE_ACCOUNT`, `SPONSOR_ACCOUNT`, `RECIPIENT_ACCOUNT`, `AGENT_ACCOUNT` (account mode radio group inside `ACCOUNT_PANEL`), `CHEVRON_DOWN_OPEN_PENDING`.

Mode flags must be:
- Declared with `kind: 'flag'` in the panel registry
- Listed in `MUST_INCLUDE_ON_BOOT` so they exist in older persisted trees
- **Not** wrapped in `PanelGate` — they have no renderable children
- **Not** expected to satisfy Rule 13 (no DOM `id` required)

---

## Debug Viewer Conventions

### Rule 6 — `[+]` Means Closed Branch
A panel node prefixed with `[+]` is closed (`visible: false`). Its children are not shown in the debug viewer.

### Rule 7 — `[-]` Means Open Branch
A panel node prefixed with `[-]` is open (`visible: true`). Its children are listed beneath it in the viewer, each with their own `[+]`/`[-]` prefix.

---

## Quick Reference

| # | Rule |
|---|------|
| 1 | Every panel node maps 1-to-1 to a `SP_COIN_DISPLAY` enum value |
| 2 | Child visibility is independent — closing a parent does not cascade |
| 3 | `openPanel` shows target; for radio members it also closes all siblings |
| 4 | `closePanel` hides exactly one panel, no cascade, no radio side-effects |
| 5 | Panel tree hierarchy must precisely mirror the DOM container hierarchy |
| 5a | PanelGate's wrapper `<div>` is a real DOM node; it participates in flex/grid layout |
| 6 | `[+]` = closed branch; children hidden in debug viewer |
| 7 | `[-]` = open branch; children shown in debug viewer |
| 8 | `MAIN_RADIO_OVERLAY_PANELS` members are mutually exclusive — at most one visible |
| 9 | Two visibility sources (`panelStore` + React state) kept in sync by `publishVisibility` |
| 9b | `setPanelVisible` is a direct write that bypasses radio group logic |
| 10 | `PanelGate` lazy-mounts by default — closed panels have zero DOM presence |
| 11 | Radio overlay `openPanel` pushes to `displayStack` for back-navigation |
| 12 | Missing panels are hydrated on boot using `defaultVisible` from the registry |
| 13 | Enum name must be discoverable in DOM via `id=` (explicit) or `data-panel=` (via PanelGate); `kind: 'flag'` panels exempt |
| 14 | No duplicate enum values in the tree; panels in multiple contexts get context-suffixed variants (`_TRADING`, `_STAKING`) grouped in companion arrays |
| 15 | Mode flags (`kind: 'flag'`) are headless panel tree entries — reactive boolean state with no DOM container; exempt from Rule 13 |
