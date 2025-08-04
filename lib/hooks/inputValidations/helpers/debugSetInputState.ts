// File: lib/hooks/inputValidations/helpers/debugSetInputState.ts

import { InputState, getInputStateString } from '@/lib/structure';
import { debugLog } from './debugLogInstance';

export function debugSetInputState(
  source: string,
  nextState: InputState,
  currentState: InputState,
  setState: (s: InputState) => void
): void {
  if (nextState === currentState) return;

  const prevStateStr = getInputStateString(currentState);
  const nextStateStr = getInputStateString(nextState);
  const stateSymbol = '⏩'.repeat(nextState);
  const debugMsg = `${source}{STATE CHANGE): ${prevStateStr}(${currentState}) → ${nextStateStr}(${nextState})`;
  alert(`${debugMsg}`);
  debugLog.log(`${debugMsg}`);
  setState(nextState);
}
