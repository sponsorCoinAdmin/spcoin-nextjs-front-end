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

type DisplayedOutputCall = {
  method: string;
  parameters: Array<{ label: string; value: string }>;
};

function parseDisplayedOutputParameters(value: unknown): Array<{ label: string; value: string }> {
  if (Array.isArray(value)) {
    return value.map((entry) => ({
      label: String(entry?.label || '').trim(),
      value: String(entry?.value || '').trim(),
    }));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).map(([label, entryValue]) => ({
    label: String(label || '').trim(),
    value: String(entryValue ?? '').trim(),
  }));
}

type Params = {
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
  selectedScript?: { id?: string; name: string; steps: LabScriptStep[] } | null;
  selectedScriptStepNumber: number | null;
  runScriptStep: (
    step: LabScriptStep,
    options: { formattedOutputBase: string },
  ) => Promise<{ success: boolean; formattedOutput: string }>;
  focusScriptStep: (step: LabScriptStep) => void;
  spCoinReadMethodDefs: Record<string, unknown>;
  spCoinWriteMethodDefs: Record<string, unknown>;
  serializationTestMethodDefs: Record<string, unknown>;
  setSelectedScriptStepNumber: (value: number | null) => void;
};

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
  focusScriptStep,
  spCoinReadMethodDefs,
  spCoinWriteMethodDefs,
  serializationTestMethodDefs,
  setSelectedScriptStepNumber,
}: Params) {
  const refreshFormattedOutputSequenceRef = useRef<(() => void) | null>(null);
  const isRefreshingDisplayedOutputRef = useRef(false);

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
          const method = String(parsed?.call?.method || '').trim();
          if (!method) return null;
          const parameters = parseDisplayedOutputParameters(parsed?.call?.parameters);
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

          const result = await runScriptStep(step, { formattedOutputBase: accumulatedOutput });
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
      runScriptStep,
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

    let accumulatedOutput = '(no output yet)';
    setFormattedOutputDisplay(accumulatedOutput);
    setIsScriptDebugRunning(true);

    try {
      for (const [index, call] of displayedOutputCalls.entries()) {
        const panel: LabScriptStep['panel'] | null = ERC20_READ_OPTIONS.includes(call.method as Erc20ReadMethod)
          ? 'ecr20_read'
          : ERC20_WRITE_OPTIONS.includes(call.method as Erc20WriteMethod)
            ? 'erc20_write'
            : Object.prototype.hasOwnProperty.call(spCoinReadMethodDefs, call.method)
              ? 'spcoin_read'
              : Object.prototype.hasOwnProperty.call(serializationTestMethodDefs, call.method)
                ? 'serialization_tests'
                : Object.prototype.hasOwnProperty.call(spCoinWriteMethodDefs, call.method)
                  ? 'spcoin_write'
                  : null;
        if (!panel) {
          setStatus(`Unable to refresh Console Display output for ${call.method}.`);
          return;
        }
        const syntheticStep: LabScriptStep = {
          step: index + 1,
          name: call.method,
          panel,
          method: call.method,
          'msg.sender': call.parameters.find((entry) => entry.label === 'msg.sender')?.value || undefined,
          params: call.parameters
            .filter((entry) => entry.label !== 'msg.sender' && entry.label)
            .map((entry) => ({ key: entry.label, value: entry.value })),
        };
        const result = await runScriptStep(syntheticStep, { formattedOutputBase: accumulatedOutput });
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
    runScriptStep,
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
      requestRefreshSelectedTreeAccount();
      return;
    }
    if (activeMethodPanelTab === 'admin_utils') {
      if (methodPanelMode === 'spcoin_read') {
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
    if (activeMethodPanelTab === 'spcoin_read') {
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
      if (methodPanelMode === 'spcoin_read') {
        refreshItems = [`Run SPCOIN read method: ${activeSpCoinReadDef.title}`];
      } else if (methodPanelMode === 'serialization_tests') {
        refreshItems = [`Run serialization test: ${activeSerializationTestDef.title}`];
      }
    } else if (activeMethodPanelTab === 'erc20') {
      if (methodPanelMode === 'ecr20_read') {
        refreshItems = [`Run ERC20 read method: ${selectedReadMethod}`];
      }
    } else if (activeMethodPanelTab === 'spcoin_read') {
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

  const runSelectedScriptStep = useCallback(async () => {
    if (!selectedScript || selectedScript.steps.length === 0 || selectedScriptStepNumber === null) {
      setStatus('Select a script step to run.');
      return;
    }

    const selectedIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
    if (selectedIndex < 0) {
      setStatus('Unable to resolve the selected script step.');
      return;
    }

    await runScriptDebugSequence({
      startIndex: selectedIndex,
      emptyScriptStatus: 'Select a script step to run.',
      initialOutput: formattedOutputDisplay,
      stopAfterCurrentStep: true,
    });
  }, [formattedOutputDisplay, runScriptDebugSequence, selectedScript, selectedScriptStepNumber, setStatus]);

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
    runSelectedScriptStep,
    runRemainingScriptSteps,
  };
}
