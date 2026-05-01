import { useCallback, useMemo, useRef, useState } from 'react';
import {
  callAccessMethod as runAccessMethod,
  type AccessMethodCaller as SharedAccessMethodCaller,
  type AccessMethodRunState,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/callAccessMethod';
import { recordSponsorCoinLabAccountTrace } from '@/lib/spCoinLab/accountPopupTrace';

export type {
  AccessMethodCallOptions,
  AccessMethodCaller,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/callAccessMethod';

interface UseAccessMethodCallerOptions {
  traceEnabled?: boolean;
}

interface RunningMethodState {
  runId: number;
  methodName: string;
  startedAt: number;
  isOpen: boolean;
  isCancelling: boolean;
}

export function useAccessMethodCaller({ traceEnabled = false }: UseAccessMethodCallerOptions = {}) {
  const nextMethodRunIdRef = useRef(1);
  const activeMethodRunRef = useRef<AccessMethodRunState | null>(null);
  const [runningMethodState, setRunningMethodState] = useState<RunningMethodState | null>(null);
  const recordTrace = useCallback(
    (line: string) => {
      if (!traceEnabled) return;
      recordSponsorCoinLabAccountTrace(line, 'useAccessMethodCaller');
    },
    [traceEnabled],
  );

  const reopenRunningMethodPopup = useCallback(() => {
    recordTrace('[ACCOUNT_POPUP_TRACE] running method popup reopen while another method is active');
    setRunningMethodState((current) => (current ? { ...current, isOpen: true } : current));
  }, [recordTrace]);

  const cancelAccessMethod = useCallback(() => {
    recordTrace('[ACCOUNT_POPUP_TRACE] running method popup cancel requested');
    activeMethodRunRef.current?.controller.abort();
    setRunningMethodState((current) => (current ? { ...current, isCancelling: true } : current));
  }, [recordTrace]);

  const callAccessMethod = useCallback<SharedAccessMethodCaller>(
    (methodName, runner) =>
      runAccessMethod(methodName, runner, {
        isActive: () => Boolean(activeMethodRunRef.current),
        onAlreadyActive: reopenRunningMethodPopup,
        nextRunId: () => nextMethodRunIdRef.current++,
        onStart: (runState) => {
          recordTrace(
            `[ACCOUNT_POPUP_TRACE] running method popup open runId=${runState.runId} method=${runState.methodName}`,
          );
          activeMethodRunRef.current = runState;
          setRunningMethodState({
            runId: runState.runId,
            methodName: runState.methodName,
            startedAt: runState.startedAt,
            isOpen: true,
            isCancelling: false,
          });
        },
        onFinish: (runState) => {
          recordTrace(
            `[ACCOUNT_POPUP_TRACE] running method popup close runId=${runState.runId} method=${runState.methodName}`,
          );
          if (activeMethodRunRef.current === runState) {
            activeMethodRunRef.current = null;
          }
          setRunningMethodState(null);
        },
      }),
    [recordTrace, reopenRunningMethodPopup],
  );

  const runningMethodPopup = useMemo(
    () => ({
      isOpen: Boolean(runningMethodState?.isOpen),
      methodName: runningMethodState?.methodName ?? '',
      startedAt: runningMethodState?.startedAt ?? Date.now(),
      isCancelling: Boolean(runningMethodState?.isCancelling),
      onCancel: cancelAccessMethod,
    }),
    [cancelAccessMethod, runningMethodState],
  );

  return {
    callAccessMethod,
    runningMethodPopup,
  };
}
