// File: lib/hooks/inputValidations/helpers/sinks/localStorageTraceSink.ts
'use client';

import { InputState } from '@/lib/structure/assetSelection';
import type { TraceSink, TraceStartArgs } from '../index';

// heavy helpers — only loaded when this module is imported
import { getPrevTrace, setTrace, appendLines } from './fsmStorage';
import { formatTrace, headerLine, SEP_LINE } from './formatFSM';

export function createLocalStorageTraceSink(): TraceSink {
  let runTrace: InputState[] = [];

  return {
    onStart({ containerType, debouncedHexInput, feedType }: TraceStartArgs) {
      runTrace = [InputState.VALIDATE_ADDRESS];

      const prevTrace = getPrevTrace();
      const prevLast: InputState | undefined = prevTrace.at(-1);

      if (prevLast !== InputState.VALIDATE_ADDRESS) appendLines(SEP_LINE);
      appendLines(headerLine(containerType, debouncedHexInput, feedType));
    },
    onTransition(prev, next) {
      if (next !== prev) runTrace.push(next);
    },
    onFinish() {
      if (runTrace.length === 0) return;

      appendLines(formatTrace(runTrace));

      const prevTrace = getPrevTrace();
      setTrace([...prevTrace, ...runTrace]);

      runTrace = [];
    },
  };
}
