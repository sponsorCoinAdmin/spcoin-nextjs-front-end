// File: @/lib/hooks/inputValidations/helpers/sinks/localStorageTraceSink.ts
'use client';

import { InputState } from '@/lib/structure/assetSelection';
import type { TraceSink, TraceStartArgs } from '../index';

// heavy helpers - only loaded when this module is imported
import { getPrevLines, appendLines, setFirstLine } from './fsmStorage';
import { formatTrace, headerLine, SEP_LINE } from './formatFSM';

let lastPersistedInput = '';

function formatAttemptGroups(attempts: InputState[][]): string {
  if (!attempts.length) return '[]';
  return attempts.map((a) => JSON.stringify(a)).join(',');
}

function parseAttemptGroupsFromLines(linesRaw: string): InputState[][] {
  const lines = (linesRaw ?? '').replace(/\r\n/g, '\n').split('\n');
  if ((lines[0] ?? '').trim() !== 'FSM State Transitions') return [];

  const attemptLine = (lines[1] ?? '').trim();
  if (!attemptLine) return [];

  try {
    const parsed = JSON.parse(`[${attemptLine}]`) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((group) => Array.isArray(group))
      .map((group) =>
        (group as unknown[])
          .filter((s) => typeof s === 'number')
          .map((s) => s as InputState),
      )
      .filter((group) => group.length > 0);
  } catch {
    return [];
  }
}

export function createLocalStorageTraceSink(): TraceSink {
  let runTrace: InputState[] = [];
  let shouldPersistRun = false;

  return {
    onStart({ containerType, debouncedHexInput, feedType }: TraceStartArgs) {
      const normalizedInput = (debouncedHexInput ?? '').trim().toLowerCase();
      shouldPersistRun = normalizedInput !== lastPersistedInput;

      if (!shouldPersistRun) {
        runTrace = [];
        return;
      }

      runTrace = [InputState.VALIDATE_ADDRESS];

      if (getPrevLines().trim().length > 0) appendLines(SEP_LINE);
      appendLines(headerLine(containerType, debouncedHexInput, feedType));
      lastPersistedInput = normalizedInput;
    },
    onTransition(prev, next) {
      if (!shouldPersistRun) return;
      if (next !== prev) runTrace.push(next);
    },
    onFinish() {
      if (!shouldPersistRun) return;
      if (runTrace.length === 0) return;

      appendLines(formatTrace(runTrace));

      const prevAttempts = parseAttemptGroupsFromLines(getPrevLines());
      const nextTrace = [...prevAttempts, runTrace];
      setFirstLine(`FSM State Transitions\n${formatAttemptGroups(nextTrace)}`);

      runTrace = [];
      shouldPersistRun = false;
    },
  };
}
