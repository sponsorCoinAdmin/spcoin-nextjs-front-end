import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ERC20_READ_OPTIONS,
  type Erc20ReadMethod,
} from '../../jsonMethods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  type Erc20WriteMethod,
} from '../../jsonMethods/erc20/write';
import type { LabScriptStep, MethodPanelMode } from '../../scriptBuilder/types';
import type { FormattedPanelView, OutputPanelMode } from '../types';
import type { AccessMethodCaller } from '../../hooks/useAccessMethodCaller';

interface DisplayedOutputCall {
  method: string;
  parameters: { label: string; value: string }[];
}

interface ScriptRunResult {
  success: boolean;
  formattedOutput: string;
}
interface ScriptRunOptions {
  formattedOutputBase: string;
  replaceOutputBlockIndex?: number;
  executionSignal?: AbortSignal;
  executionLabel?: string;
  scriptNetwork?: string;
  clearReadCache?: boolean;
}
function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

function parseDisplayedOutputParameters(value: unknown): { label: string; value: string }[] {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const record = entry && typeof entry === 'object' && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};
      return {
        label: toDisplayString(record.label).trim(),
        value: toDisplayString(record.value).trim(),
      };
    });
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).map(([label, entryValue]) => ({
    label: label.trim(),
    value: toDisplayString(entryValue).trim(),
  }));
}

function findDisplayedOutputAccountKey(value: unknown, visited = new WeakSet<object>()): string {
  if (!value || typeof value !== 'object') return '';
  if (visited.has(value)) return '';
  visited.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findDisplayedOutputAccountKey(entry, visited);
      if (found) return found;
    }
    return '';
  }

  const record = value as Record<string, unknown>;
  const direct = toDisplayString(record.accountKey ?? record['Account Key'] ?? record.Account).trim();
  if (direct) return direct;

  for (const entry of Object.values(record)) {
    const found = findDisplayedOutputAccountKey(entry, visited);
    if (found) return found;
  }
  return '';
}

function repairDisplayedOutputParameters(method: string, parameters: { label: string; value: string }[], parsedBlock: unknown) {
  if (method !== 'getAccountRecord' && method !== 'getSummaryRecord') return parameters;
  const existingIndex = parameters.findIndex((entry) => ['Account Key', 'Account', 'accountKey'].includes(entry.label));
  const existingValue = existingIndex >= 0 ? parameters[existingIndex]?.value.trim() : '';
  if (existingValue) return parameters;

  const accountKey = findDisplayedOutputAccountKey(parsedBlock);
  if (!accountKey) return parameters;
  if (existingIndex >= 0) {
    return parameters.map((entry, index) =>
      index === existingIndex ? { label: 'Account Key', value: accountKey } : entry,
    );
  }
  return [{ label: 'Account Key', value: accountKey }, ...parameters];
}

function resolveDisplayedOutputPanel(
  call: DisplayedOutputCall,
  methodDefs: {
    spCoinReadMethodDefs: Record<string, unknown>;
    spCoinWriteMethodDefs: Record<string, unknown>;
    serializationTestMethodDefs: Record<string, unknown>;
  },
): LabScriptStep['panel'] | null {
  if (ERC20_READ_OPTIONS.includes(call.method as Erc20ReadMethod)) return 'ecr20_read';
  if (ERC20_WRITE_OPTIONS.includes(call.method as Erc20WriteMethod)) return 'erc20_write';
  if (Object.prototype.hasOwnProperty.call(methodDefs.spCoinReadMethodDefs, call.method)) return 'spcoin_rread';
  if (Object.prototype.hasOwnProperty.call(methodDefs.serializationTestMethodDefs, call.method)) return 'serialization_tests';
  if (Object.prototype.hasOwnProperty.call(methodDefs.spCoinWriteMethodDefs, call.method)) return 'spcoin_write';
  return null;
}

function buildDisplayedOutputSyntheticStep(
  call: DisplayedOutputCall,
  stepNumber: number,
  panel: LabScriptStep['panel'],
): LabScriptStep {
  const syntheticStepSender = call.parameters.find((entry) => entry.label === 'msg.sender')?.value;
  return {
    step: stepNumber,
    name: call.method,
    panel,
    method: call.method,
    'msg.sender': syntheticStepSender ?? undefined,
    params: call.parameters
      .filter((entry) => entry.label !== 'msg.sender' && entry.label)
      .map((entry) => ({ key: entry.label, value: entry.value })),
  };
}

interface Params {
  formattedOutputDisplay: string;
  outputPanelMode: OutputPanelMode;
  formattedPanelView: FormattedPanelView;
  activeMethodPanelTab: string;
  methodPanelMode: MethodPanelMode;
  activeSpCoinReadDef: { title: string };
  activeSerializationTestDef: { title: string };
  selectedReadMethod: string;
  showValidationPopup: (
    fieldIds: string[],
    labels: string[],
    message: string,
    options?: {
      title?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm?: () => void;
    },
  ) => void;
  setStatus: (value: string) => void;
  requestRefreshSelectedTreeAccount: () => void;
  runSelectedSpCoinReadMethod: () => Promise<unknown> | void;
  runSelectedSerializationTestMethod: () => Promise<unknown> | void;
  runSelectedReadMethod: () => Promise<unknown> | void;
  setFormattedOutputDisplay: (value: string) => void;
  setIsScriptDebugRunning: (value: boolean) => void;
  setScriptStepExecutionErrors: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  scriptDebugStopRef: React.MutableRefObject<boolean>;
  selectedScript?: { id?: string; name: string; network?: string; steps: LabScriptStep[] } | null;
  selectedScriptStepNumber: number | null;
  runScriptStep: (
    step: LabScriptStep,
    options: ScriptRunOptions,
  ) => Promise<ScriptRunResult>;
  callAccessMethod: AccessMethodCaller;
  resetReadCacheForRefresh?: () => void;
  focusScriptStep: (step: LabScriptStep) => void;
  spCoinReadMethodDefs: Record<string, unknown>;
  spCoinWriteMethodDefs: Record<string, unknown>;
  serializationTestMethodDefs: Record<string, unknown>;
  setSelectedScriptStepNumber: (value: number | null) => void;
}

export function useControllerScriptExecution({
  formattedOutputDisplay,
  outputPanelMode,
  formattedPanelView,
  activeMethodPanelTab,
  methodPanelMode,
  activeSpCoinReadDef,
  activeSerializationTestDef,
  selectedReadMethod,
  showValidationPopup,
  setStatus,
  requestRefreshSelectedTreeAccount,
  runSelectedSpCoinReadMethod,
  runSelectedSerializationTestMethod,
  runSelectedReadMethod,
  setFormattedOutputDisplay,
  setIsScriptDebugRunning,
  setScriptStepExecutionErrors,
  scriptDebugStopRef,
  selectedScript,
  selectedScriptStepNumber,
  runScriptStep,
  callAccessMethod,
  resetReadCacheForRefresh,
  focusScriptStep,
  spCoinReadMethodDefs,
  spCoinWriteMethodDefs,
  serializationTestMethodDefs,
  setSelectedScriptStepNumber,
}: Params) {
  const refreshFormattedOutputSequenceRef = useRef<(() => void) | null>(null);
  const isRefreshingDisplayedOutputRef = useRef(false);

  const runScriptStepWithPopup = useCallback(
    async (step: LabScriptStep, options: { formattedOutputBase: string; clearReadCache?: boolean }) =>
      callAccessMethod(step.name || step.method, ({ executionSignal, executionLabel }) =>
        runScriptStep(step, {
          ...options,
          scriptNetwork: selectedScript?.network,
          executionSignal,
          executionLabel,
        }),
      ),
    [callAccessMethod, runScriptStep, selectedScript?.network],
  );

  const runScriptStepWithPopupAtOutputBlock = useCallback(
    async (step: LabScriptStep, options: { formattedOutputBase: string; replaceOutputBlockIndex: number; clearReadCache?: boolean }) =>
      callAccessMethod(step.name || step.method, ({ executionSignal, executionLabel }) =>
        runScriptStep(step, {
          ...options,
          scriptNetwork: selectedScript?.network,
          executionSignal,
          executionLabel,
        }),
      ),
    [callAccessMethod, runScriptStep, selectedScript?.network],
  );

  const displayedOutputCalls = useMemo(() => {
    const blocks = String(formattedOutputDisplay || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    if (blocks.length === 0) return [];

    const parsedCalls = blocks
      .map((block) => {
        try {
          const parsed = JSON.parse(block) as {
            call?: { method?: unknown; parameters?: unknown };
          };
          const method = toDisplayString(parsed?.call?.method).trim();
          if (!method) return null;
          const parameters = repairDisplayedOutputParameters(
            method,
            parseDisplayedOutputParameters(parsed?.call?.parameters),
            parsed,
          );
          return { method, parameters };
        } catch {
          return null;
        }
      })
      .filter(
        (entry): entry is DisplayedOutputCall => entry !== null,
      );

    return parsedCalls;
  }, [formattedOutputDisplay]);

  const runScriptDebugSequence = useCallback(
    async (options: {
      startIndex: number;
      emptyScriptStatus: string;
      initialOutput: string;
      stopAfterCurrentStep?: boolean;
    }) => {
      if (!selectedScript || selectedScript.steps.length === 0) {
        setStatus(options.emptyScriptStatus);
        return;
      }

      const { startIndex, initialOutput, stopAfterCurrentStep = false } = options;
      const activeStep = selectedScript.steps[startIndex];
      if (!activeStep) {
        setStatus('Unable to resolve the requested script step.');
        return;
      }

      scriptDebugStopRef.current = false;
      if (initialOutput === '(no output yet)') {
        setFormattedOutputDisplay(initialOutput);
      }
      setIsScriptDebugRunning(true);

      let accumulatedOutput = initialOutput;
      try {
        for (let idx = startIndex; idx < selectedScript.steps.length; idx += 1) {
          const step = selectedScript.steps[idx];
          focusScriptStep(step);

          const result = await runScriptStepWithPopup(step, { formattedOutputBase: accumulatedOutput });
          if (!result) return;
          setScriptStepExecutionErrors((prev) => {
            const nextHasError = !result.success;
            if (prev[step.step] === nextHasError) return prev;
            return {
              ...prev,
              [step.step]: nextHasError,
            };
          });
          accumulatedOutput = result.formattedOutput;
          if (!result.success) return;

          if (scriptDebugStopRef.current) {
            setStatus(`Stopped ${selectedScript.name} at step ${step.step}.`);
            return;
          }

          const nextStep = selectedScript.steps[idx + 1];
          if (!nextStep) {
            setSelectedScriptStepNumber(null);
            setStatus(`Completed ${selectedScript.name}.`);
            return;
          }

          if (stopAfterCurrentStep) {
            focusScriptStep(nextStep);
            setStatus(`Completed step ${step.step}. Ready for step ${nextStep.step}.`);
            return;
          }

          if (nextStep.breakpoint) {
            focusScriptStep(nextStep);
            setStatus(`Paused at breakpoint before step ${nextStep.step}.`);
            return;
          }
        }
      } finally {
        setIsScriptDebugRunning(false);
      }
    },
    [
      focusScriptStep,
      runScriptStepWithPopup,
      scriptDebugStopRef,
      selectedScript,
      setFormattedOutputDisplay,
      setIsScriptDebugRunning,
      setScriptStepExecutionErrors,
      setSelectedScriptStepNumber,
      setStatus,
    ],
  );

  const runDisplayedOutputSequence = useCallback(async () => {
    if (displayedOutputCalls.length === 0) {
      setStatus('No Console Display output steps are available to refresh.');
      return;
    }
    if (isRefreshingDisplayedOutputRef.current) {
      setStatus('Console Display refresh already running.');
      return;
    }

    isRefreshingDisplayedOutputRef.current = true;
    scriptDebugStopRef.current = true;
    setIsScriptDebugRunning(false);
    setScriptStepExecutionErrors({});
    resetReadCacheForRefresh?.();

    let accumulatedOutput = '(no output yet)';
    setFormattedOutputDisplay(accumulatedOutput);
    setIsScriptDebugRunning(true);

    try {
      for (const [index, call] of displayedOutputCalls.entries()) {
        const panel = resolveDisplayedOutputPanel(call, {
          spCoinReadMethodDefs,
          spCoinWriteMethodDefs,
          serializationTestMethodDefs,
        });
        if (!panel) {
          setStatus(`Unable to refresh Console Display output for ${call.method}.`);
          return;
        }
        const syntheticStep = buildDisplayedOutputSyntheticStep(call, index + 1, panel);
        const result = await runScriptStepWithPopup(syntheticStep, {
          formattedOutputBase: accumulatedOutput,
          clearReadCache: index === 0,
        });
        if (!result) return;
        setScriptStepExecutionErrors((prev) => ({
          ...prev,
          [syntheticStep.step]: !result.success,
        }));
        accumulatedOutput = result.formattedOutput;
        if (!result.success) return;
      }

      setStatus(
        displayedOutputCalls.length === 1
          ? 'Refreshed 1 Console Display output step.'
          : `Refreshed ${displayedOutputCalls.length} Console Display output steps.`,
      );
    } finally {
      isRefreshingDisplayedOutputRef.current = false;
      setIsScriptDebugRunning(false);
    }
  }, [
    isRefreshingDisplayedOutputRef,
    displayedOutputCalls,
    runScriptStepWithPopup,
    resetReadCacheForRefresh,
    serializationTestMethodDefs,
    setFormattedOutputDisplay,
    setIsScriptDebugRunning,
    setScriptStepExecutionErrors,
    setStatus,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
    scriptDebugStopRef,
  ]);

  useEffect(() => {
    refreshFormattedOutputSequenceRef.current =
      displayedOutputCalls.length > 0
        ? () => {
            void runDisplayedOutputSequence();
          }
        : null;
  }, [displayedOutputCalls.length, runDisplayedOutputSequence]);

  const executeRefreshActiveOutput = useCallback(() => {
    if (
      outputPanelMode === 'formatted' &&
      formattedPanelView === 'output' &&
      displayedOutputCalls.length > 0
    ) {
      refreshFormattedOutputSequenceRef.current?.();
      return;
    }
    if (outputPanelMode === 'tree') {
      resetReadCacheForRefresh?.();
      requestRefreshSelectedTreeAccount();
      return;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') {
        resetReadCacheForRefresh?.();
        void runSelectedSpCoinReadMethod();
        return;
      }
      if (methodPanelMode === 'serialization_tests') {
        void runSelectedSerializationTestMethod();
        return;
      }
      setStatus('Refresh is available for read/test/tree commands only.');
      return;
    }
    if (activeMethodPanelTab === 'erc20') {
      if (methodPanelMode === 'ecr20_read') {
        void runSelectedReadMethod();
        return;
      }
      setStatus('Refresh is available for read/test/tree commands only.');
      return;
    }
    if (activeMethodPanelTab === 'spcoin_rread') {
      resetReadCacheForRefresh?.();
      void runSelectedSpCoinReadMethod();
      return;
    }
    setStatus('Refresh is available for read/test/tree commands only.');
  }, [
    activeMethodPanelTab,
    displayedOutputCalls.length,
    formattedPanelView,
    methodPanelMode,
    outputPanelMode,
    requestRefreshSelectedTreeAccount,
    resetReadCacheForRefresh,
    runSelectedReadMethod,
    runSelectedSerializationTestMethod,
    runSelectedSpCoinReadMethod,
    setStatus,
  ]);

  const refreshActiveOutput = useCallback(() => {
    let refreshItems: string[] = [];

    if (
      outputPanelMode === 'formatted' &&
      formattedPanelView === 'output' &&
      displayedOutputCalls.length > 0
    ) {
      refreshItems = displayedOutputCalls.map(
        (call, index) => `Run output step ${index + 1}: ${call.method}`,
      );
    } else if (outputPanelMode === 'tree') {
      refreshItems = [
        'Clear the cached data for the selected tree account',
        'Run a fresh tree dump for the active account',
      ];
    } else if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_rread') {
        refreshItems = [`Run SPCOIN read method: ${activeSpCoinReadDef.title}`];
      } else if (methodPanelMode === 'serialization_tests') {
        refreshItems = [`Run serialization test: ${activeSerializationTestDef.title}`];
      }
    } else if (activeMethodPanelTab === 'erc20') {
      if (methodPanelMode === 'ecr20_read') {
        refreshItems = [`Run ERC20 read method: ${selectedReadMethod}`];
      }
    } else if (activeMethodPanelTab === 'spcoin_rread') {
      refreshItems = [`Run SPCOIN read method: ${activeSpCoinReadDef.title}`];
    }

    if (refreshItems.length === 0) {
      setStatus('Refresh is available for read/test/tree commands only.');
      return;
    }

    showValidationPopup([], refreshItems, 'The following action(s) will be run:', {
      title: 'Refresh Output Confirm',
      confirmLabel: 'Run Refresh',
      cancelLabel: 'Cancel',
      onConfirm: () => executeRefreshActiveOutput(),
    });
  }, [
    activeMethodPanelTab,
    activeSerializationTestDef.title,
    activeSpCoinReadDef.title,
    displayedOutputCalls,
    executeRefreshActiveOutput,
    formattedPanelView,
    methodPanelMode,
    outputPanelMode,
    selectedReadMethod,
    setStatus,
    showValidationPopup,
  ]);

  const restartScriptAtStart = useCallback(async () => {
    scriptDebugStopRef.current = true;
    setIsScriptDebugRunning(false);
    await runScriptDebugSequence({
      startIndex: 0,
      emptyScriptStatus: 'Selected script has no steps to restart.',
      initialOutput: '(no output yet)',
    });
  }, [runScriptDebugSequence, scriptDebugStopRef, setIsScriptDebugRunning]);

  const runScriptStepByNumber = useCallback(async (stepNumber: number) => {
    if (!selectedScript || selectedScript.steps.length === 0) {
      setStatus('Select a script step to run.');
      return;
    }

    const selectedIndex = selectedScript.steps.findIndex((step) => step.step === stepNumber);
    if (selectedIndex < 0) {
      setStatus(`Unable to resolve script step ${String(stepNumber)}.`);
      return;
    }

    const step = selectedScript.steps[selectedIndex];
    if (!step) {
      setStatus(`Unable to resolve script step ${String(stepNumber)}.`);
      return;
    }

    const result = await runScriptStepWithPopupAtOutputBlock(step, {
      formattedOutputBase: formattedOutputDisplay,
      replaceOutputBlockIndex: selectedIndex,
    });
    if (!result) return;
    setScriptStepExecutionErrors((prev) => {
      const nextHasError = !result.success;
      if (prev[step.step] === nextHasError) return prev;
      return {
        ...prev,
        [step.step]: nextHasError,
      };
    });
    if (result.success) {
      setStatus(`Completed step ${step.step}.`);
    }
  }, [formattedOutputDisplay, runScriptStepWithPopupAtOutputBlock, selectedScript, setScriptStepExecutionErrors, setStatus]);

  const rerunDisplayedOutputStepByNumber = useCallback(async (stepNumber: number) => {
    const outputIndex = stepNumber - 1;
    const call = Number.isInteger(outputIndex) && outputIndex >= 0 ? displayedOutputCalls[outputIndex] : null;
    if (!call) {
      setStatus(`Unable to resolve Console Display step ${String(stepNumber)}.`);
      return;
    }

    const panel = resolveDisplayedOutputPanel(call, {
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
      serializationTestMethodDefs,
    });
    if (!panel) {
      setStatus(`Unable to refresh Console Display output for ${call.method}.`);
      return;
    }

    const syntheticStep = buildDisplayedOutputSyntheticStep(call, stepNumber, panel);
    const result = await runScriptStepWithPopupAtOutputBlock(syntheticStep, {
      formattedOutputBase: formattedOutputDisplay,
      replaceOutputBlockIndex: outputIndex,
    });
    if (!result) return;
    setScriptStepExecutionErrors((prev) => {
      const nextHasError = !result.success;
      if (prev[syntheticStep.step] === nextHasError) return prev;
      return {
        ...prev,
        [syntheticStep.step]: nextHasError,
      };
    });
    if (result.success) {
      setStatus(`Refreshed Console Display step ${String(stepNumber)}.`);
    }
  }, [
    displayedOutputCalls,
    formattedOutputDisplay,
    runScriptStepWithPopupAtOutputBlock,
    serializationTestMethodDefs,
    setScriptStepExecutionErrors,
    setStatus,
    spCoinReadMethodDefs,
    spCoinWriteMethodDefs,
  ]);

  const runSelectedScriptStep = useCallback(async () => {
    if (selectedScriptStepNumber === null) {
      setStatus('Select a script step to run.');
      return;
    }
    await runScriptStepByNumber(selectedScriptStepNumber);
  }, [runScriptStepByNumber, selectedScriptStepNumber, setStatus]);

  const runRemainingScriptSteps = useCallback(async () => {
    const selectedIndex = selectedScript?.steps.findIndex((step) => step.step === selectedScriptStepNumber) ?? -1;
    await runScriptDebugSequence({
      startIndex: selectedIndex >= 0 ? selectedIndex : 0,
      emptyScriptStatus: 'Selected script has no steps to run.',
      initialOutput: formattedOutputDisplay,
    });
  }, [formattedOutputDisplay, runScriptDebugSequence, selectedScript?.steps, selectedScriptStepNumber]);

  return {
    displayedOutputCalls,
    refreshActiveOutput,
    runScriptDebugSequence,
    restartScriptAtStart,
    runScriptStepByNumber,
    rerunDisplayedOutputStepByNumber,
    runSelectedScriptStep,
    runRemainingScriptSteps,
  };
}
