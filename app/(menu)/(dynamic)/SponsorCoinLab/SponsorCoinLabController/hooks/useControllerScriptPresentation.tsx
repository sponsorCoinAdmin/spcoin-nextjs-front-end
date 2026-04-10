'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ScriptStepRow from '../../components/ScriptStepRow';
import type { LabScriptParam, LabScriptStep } from '../../scriptBuilder/types';

type Props = {
  selectedScriptStep?: LabScriptStep | null;
  setSelectedScriptStepNumber: React.Dispatch<React.SetStateAction<number | null>>;
  selectedScript?: { id?: string | number; steps: LabScriptStep[] } | null;
  methodSelectionSource: 'dropdown' | 'script';
  selectedScriptStepNumber: number | null;
  editingScriptStepNumber: number | null;
  loadScriptStep: (step: LabScriptStep) => void;
  confirmDeleteSelectedScriptStep: () => void;
  setEditingScriptStepNumber: React.Dispatch<React.SetStateAction<number | null>>;
  setMethodSelectionSource: React.Dispatch<React.SetStateAction<'dropdown' | 'script'>>;
  expandedScriptStepIds: Record<string, boolean>;
  isEditingScriptMethod: boolean;
  scriptStepExecutionErrors: Record<number, boolean>;
  getStepSender: (step: LabScriptStep) => string;
  getStepParamEntries: (step: LabScriptStep) => LabScriptParam[];
  editScriptStepFromBuilder: (step: LabScriptStep) => void;
  toggleScriptStepExpanded: (stepNumber: number) => void;
  toggleScriptStepBreakpoint: (stepNumber: number) => void;
  outputPanelMode: 'execution' | 'formatted' | 'tree' | 'raw_status';
  formattedPanelView: 'script' | 'output';
  selectedScriptDisplay: string;
  formattedOutputDisplay: string;
};

export function useControllerScriptPresentation({
  selectedScriptStep,
  setSelectedScriptStepNumber,
  selectedScript,
  methodSelectionSource,
  selectedScriptStepNumber,
  editingScriptStepNumber,
  loadScriptStep,
  confirmDeleteSelectedScriptStep,
  setEditingScriptStepNumber,
  setMethodSelectionSource,
  expandedScriptStepIds,
  isEditingScriptMethod,
  scriptStepExecutionErrors,
  getStepSender,
  getStepParamEntries,
  editScriptStepFromBuilder,
  toggleScriptStepExpanded,
  toggleScriptStepBreakpoint,
  outputPanelMode,
  formattedPanelView,
  selectedScriptDisplay,
  formattedOutputDisplay,
}: Props) {
  const selectScriptStep = useCallback(
    (step: LabScriptStep) => {
      if (selectedScriptStep?.step === step.step) {
        setSelectedScriptStepNumber(null);
        return;
      }
      setSelectedScriptStepNumber(step.step);
    },
    [selectedScriptStep?.step, setSelectedScriptStepNumber],
  );

  useEffect(() => {
    if (!selectedScript || selectedScript.steps.length === 0) return;
    if (methodSelectionSource !== 'script') return;
    if (selectedScriptStepNumber !== null) return;
    if (editingScriptStepNumber !== null) return;
    loadScriptStep(selectedScript.steps[0]);
  }, [editingScriptStepNumber, loadScriptStep, methodSelectionSource, selectedScript, selectedScriptStepNumber]);

  const handleConfirmDeleteSelectedScriptStep = useCallback(() => {
    confirmDeleteSelectedScriptStep();
    setEditingScriptStepNumber(null);
    setMethodSelectionSource('dropdown');
  }, [confirmDeleteSelectedScriptStep, setEditingScriptStepNumber, setMethodSelectionSource]);

  const renderScriptStepRow = useCallback(
    (step: LabScriptStep) => {
      const isExpanded = Boolean(expandedScriptStepIds[String(step.step)]);
      const isSelected = selectedScriptStep?.step === step.step;
      const isEditingStep = isEditingScriptMethod && editingScriptStepNumber === step.step;
      return (
        <ScriptStepRow
          key={`step-${step.step}`}
          step={step}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isEditingStep={isEditingStep}
          hasExecutionError={Boolean(scriptStepExecutionErrors[step.step])}
          getStepSender={getStepSender}
          getStepParamEntries={getStepParamEntries}
          selectScriptStep={selectScriptStep}
          editScriptStep={editScriptStepFromBuilder}
          toggleScriptStepExpanded={toggleScriptStepExpanded}
          toggleScriptStepBreakpoint={toggleScriptStepBreakpoint}
        />
      );
    },
    [
      editingScriptStepNumber,
      expandedScriptStepIds,
      editScriptStepFromBuilder,
      getStepParamEntries,
      getStepSender,
      isEditingScriptMethod,
      scriptStepExecutionErrors,
      selectedScriptStep?.step,
      selectScriptStep,
      toggleScriptStepBreakpoint,
      toggleScriptStepExpanded,
    ],
  );

  useEffect(() => {
    if (editingScriptStepNumber === null) return;
    const editedStepStillExists = Boolean(selectedScript?.steps.some((step) => step.step === editingScriptStepNumber));
    if (editedStepStillExists) return;
    setEditingScriptStepNumber(null);
    setMethodSelectionSource('dropdown');
  }, [editingScriptStepNumber, selectedScript?.steps, setEditingScriptStepNumber, setMethodSelectionSource]);

  const highlightedFormattedOutputLines = useMemo(() => {
    if (
      outputPanelMode !== 'formatted' ||
      formattedPanelView !== 'script' ||
      selectedScriptStepNumber === null
    ) {
      return null;
    }
    const lines = String(selectedScriptDisplay || '').split('\n');
    const selectedStepText = String(selectedScriptStepNumber);
    const targetLineIndex = lines.findIndex((line) => {
      const match = line.match(/"step"\s*:\s*"?([^",]+)"?/);
      return Boolean(match?.[1] && match[1] === selectedStepText);
    });
    if (targetLineIndex < 0) return null;

    let startIndex = targetLineIndex;
    if (targetLineIndex > 0 && lines[targetLineIndex - 1].trim().startsWith('{')) {
      startIndex = targetLineIndex - 1;
    }

    let depth = 0;
    let endIndex = targetLineIndex;
    for (let idx = startIndex; idx < lines.length; idx += 1) {
      const line = lines[idx];
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      endIndex = idx;
      if (idx > startIndex && depth <= 0) break;
    }

    return lines.map((line, idx) => ({
      line,
      active: idx >= startIndex && idx <= endIndex,
    }));
  }, [formattedPanelView, outputPanelMode, selectedScriptDisplay, selectedScriptStepNumber]);

  const highlightedFormattedResultLines = useMemo(() => {
    if (
      outputPanelMode !== 'formatted' ||
      formattedPanelView !== 'output' ||
      selectedScriptStepNumber === null
    ) {
      return null;
    }

    const blocks = String(formattedOutputDisplay || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (blocks.length === 0) return null;

    const targetBlockIndex =
      selectedScriptStepNumber > 0 && selectedScriptStepNumber <= blocks.length
        ? selectedScriptStepNumber - 1
        : blocks.length - 1;

    return blocks.flatMap((block, blockIndex) => {
      const lines = block.split('\n');
      const mapped = lines.map((line) => ({
        line,
        active: blockIndex === targetBlockIndex,
      }));
      return blockIndex < blocks.length - 1 ? [...mapped, { line: '', active: false }] : mapped;
    });
  }, [formattedOutputDisplay, formattedPanelView, outputPanelMode, selectedScriptStepNumber]);

  return {
    selectScriptStep,
    handleConfirmDeleteSelectedScriptStep,
    renderScriptStepRow,
    highlightedFormattedOutputLines,
    highlightedFormattedResultLines,
  };
}
