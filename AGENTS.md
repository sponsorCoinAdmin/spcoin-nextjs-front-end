# Project AI Instructions

This repository is a Next.js 15 front-end app built in TypeScript. It is focused on sponsor coin access, web3 wallet integration, and custom HardHat/local blockchain workflows.

## Key project facts

- Framework: `next` using the App Router (`app/` directory)
- Language: `TypeScript` with `eslint` and `tailwindcss`
- Web3 libraries: `wagmi`, `ethers`, `viem`, `@wagmi/connectors`, `connectkit`
- Custom contract access: `@sponsorcoin/spcoin-access-modules` plus a local `spCoinAccess/` package tree
- Main domains:
  - `app/(menu)/(dynamic)/SponsorCoinLab/` for sponsor coin lab UI and JSON method wiring
  - `app/api/spCoin/` for server-backed spCoin routes
  - `lib/` and `components/` for reusable hooks, wrappers, and utility components
- The repository includes diagnostic and recovery docs such as `RECOVERY-2026-04-12-hardhat-deploy-debug.md`

## Useful commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run build:strict`
- `npm run lint`
- `npm run typecheck`
- `npm run cleanup:scan`
- `npm run cleanup:fix`

## Development guidance for AI

- Prefer editing files in `app/`, `components/`, `lib/`, and `spCoinAccess/` when fixing feature or bug work.
- Respect the existing Next.js App Router structure and `@/` import alias.
- Do not assume tests exist; the repo currently has no test runner configured.
- When code changes affect blockchain or contract access behavior, check for related server API routes under `app/api/spCoin/`.
- Keep changes limited to the repository unless the user explicitly asks to modify external package sources or global environment files.

## Notes for AI agents

- There is no existing `.github/` or workspace agent customization file in this repository.
- `AGENTS.md` is the primary workspace instruction file for AI coding agents.
- If adding new guidance, keep it concise and link to existing docs rather than copying large sections.
