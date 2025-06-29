// File: lib/hooks/inputValidations/helpers/debugSetInputState.ts

import { InputState, getInputStateString } from '@/lib/structure';
import { debugLog } from './debugLogInstance';

export function debugSetInputState(
  nextState: InputState,
  currentState: InputState,
  setState: (s: InputState) => void
): void {
  if (nextState === currentState) return;

  const prevStateStr = getInputStateString(currentState);
  const nextStateStr = getInputStateString(nextState);
  const stateSymbol = '⚠️'.repeat(nextState);

  debugLog.log(`${stateSymbol} STATE CHANGE: ${prevStateStr} (${currentState}) → ${nextStateStr} (${nextState})`);
  setState(nextState);
}
