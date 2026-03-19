# Serialization Migration Workspace

Temporary workspace for comparing legacy Solidity serialization methods against
new access-layer rebuilds.

Usage:

`npm run compare:serialization -- --contract <address> [--rpc <url>] [--abi <path>] [--json]`

Defaults:

- `--rpc` defaults to `http://127.0.0.1:8545`
- `--abi` defaults to `resources/data/ABIs/spcoinABI.json` from the repo root

This tool currently:

- compares methods that can already be rebuilt from non-serialization getters
- reports blocked methods when the contract does not yet expose enough raw data

Once all methods are reproducible from raw getters, this workspace can be removed.
