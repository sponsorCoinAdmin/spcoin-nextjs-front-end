// File: lib/hooks/inputValidations/helpers/fsm/index.ts

// Public API for the FSM input-validation module.

// Client orchestrator (uses env flags, optional trace sink, logging)
export { startFSM } from './startFSM';
export type { StartFSMArgs, StartFSMResult } from './startFSM';

// Pure runner (isomorphic, no env/storage/logging). Handy for tests or custom drivers.
export { runFSM } from './runFSM';

// Intentionally DO NOT re-export sinks/guards/debug utilities to keep the surface minimal.
