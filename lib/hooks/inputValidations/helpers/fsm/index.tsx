// File: lib/hooks/inputValidations/helpers/fsm/index.ts

// Public API for the FSM input-validation module.

// Client orchestrator (uses env flags, optional trace sink, logging)
export { startFSM } from './startFSM';
export type { StartFSMArgs, StartFSMResult } from './startFSM';
