// File: @/lib/hooks/inputValidations/helpers/fsmConstants.ts

// Keep this in sync with fsmRunner.ts
export const LOCAL_TRACE_KEY = 'latestFSMTrace';

// Debugging options for FSM
export const LOG_TIME = false;
export const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
