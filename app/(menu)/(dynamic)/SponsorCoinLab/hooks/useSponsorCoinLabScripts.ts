import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getErc20ReadLabels,
  type Erc20ReadMethod,
} from '../methods/erc20/read';
import {
  getErc20WriteLabels,
  type Erc20WriteMethod,
} from '../methods/erc20/write';
import type { SpCoinReadMethod } from '../methods/spcoin/read';
import type { SpCoinWriteMethod } from '../methods/spcoin/write';
import type { MethodDef } from '../methods/shared/types';
import type {
  ConnectionMode,
  LabScript,
  LabScriptParam,
  LabScriptStep,
  MethodPanelMode,
} from '../scriptBuilder/types';
import {
  buildDefaultScriptName,
  formatScriptCreatedDate,
  inferScriptCreatedDate,
} from '../scriptBuilder/utils';

type Tone = 'neutral' | 'invalid' | 'valid';

type Entry = { id: string; label: string };

type ReadLabels = {
  title: string;
  addressALabel: string;
  addressBLabel: string;
  requiresAddressA: boolean;
  requiresAddressB: boolean;
};

type WriteLabels = {
  title: string;
  addressALabel: string;
  addressBLabel: string;
  requiresAddressB: boolean;
};

type Params = {
  activeNetworkName: string;
  mode: ConnectionMode;
  methodPanelMode: MethodPanelMode;
  selectedReadMethod: Erc20ReadMethod;
  readAddressA: string;
  readAddressB: string;
  activeReadLabels: ReadLabels;
  selectedWriteMethod: Erc20WriteMethod;
  selectedWriteSenderAddress: string;
  writeAddressA: string;
  writeAddressB: string;
  writeAmountRaw: string;
  activeWriteLabels: WriteLabels;
  selectedSpCoinReadMethod: SpCoinReadMethod;
  spReadParams: string[];
  activeSpCoinReadDef: MethodDef;
  spCoinReadMethodDefs: Record<string, MethodDef>;
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  spWriteParams: string[];
  activeSpCoinWriteDef: MethodDef;
  spCoinWriteMethodDefs: Record<string, MethodDef>;
  editingScriptStepNumber: number | null;
  erc20ReadMissingEntries: Entry[];
  erc20WriteMissingEntries: Entry[];
  spCoinReadMissingEntries: Entry[];
  spCoinWriteMissingEntries: Entry[];
  showValidationPopup: (
    fieldIds: string[],
    labels: string[],
    message?: string,
    options?: {
      confirmLabel?: string;
      onConfirm?: () => void | Promise<void>;
    },
  ) => void;
  setStatus: (value: string) => void;
  setOutputPanelMode: (value: 'execution' | 'formatted' | 'tree' | 'raw_status') => void;
  setFormattedOutputDisplay: (value: string) => void;
  setMode: (value: ConnectionMode) => void;
  setMethodPanelMode: (value: MethodPanelMode) => void;
  setSelectedReadMethod: (value: Erc20ReadMethod) => void;
  setReadAddressA: (value: string) => void;
  setReadAddressB: (value: string) => void;
  setSelectedWriteMethod: (value: Erc20WriteMethod) => void;
  setSelectedWriteSenderAddress: (value: string) => void;
  setWriteAddressA: (value: string) => void;
  setWriteAddressB: (value: string) => void;
  setWriteAmountRaw: (value: string) => void;
  setSelectedSpCoinReadMethod: (value: SpCoinReadMethod) => void;
  setSpReadParams: (value: string[]) => void;
  setSelectedSpCoinWriteMethod: (value: SpCoinWriteMethod) => void;
  setSpWriteParams: (value: string[]) => void;
};

export function useSponsorCoinLabScripts({
  activeNetworkName,
  mode,
  methodPanelMode,
  selectedReadMethod,
  readAddressA,
  readAddressB,
  activeReadLabels,
  selectedWriteMethod,
  selectedWriteSenderAddress,
  writeAddressA,
  writeAddressB,
  writeAmountRaw,
  activeWriteLabels,
  selectedSpCoinReadMethod,
  spReadParams,
  activeSpCoinReadDef,
  spCoinReadMethodDefs,
  selectedSpCoinWriteMethod,
  spWriteParams,
  activeSpCoinWriteDef,
  spCoinWriteMethodDefs,
  editingScriptStepNumber,
  erc20ReadMissingEntries,
  erc20WriteMissingEntries,
  spCoinReadMissingEntries,
  spCoinWriteMissingEntries,
  showValidationPopup,
  setStatus,
  setOutputPanelMode,
  setFormattedOutputDisplay,
  setMode,
  setMethodPanelMode,
  setSelectedReadMethod,
  setReadAddressA,
  setReadAddressB,
  setSelectedWriteMethod,
  setSelectedWriteSenderAddress,
  setWriteAddressA,
  setWriteAddressB,
  setWriteAmountRaw,
  setSelectedSpCoinReadMethod,
  setSpReadParams,
  setSelectedSpCoinWriteMethod,
  setSpWriteParams,
}: Params) {
  const [scripts, setScripts] = useState<LabScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [scriptNameInput, setScriptNameInput] = useState('');
  const [isScriptOptionsOpen, setIsScriptOptionsOpen] = useState(false);
  const [isNewScriptHovered, setIsNewScriptHovered] = useState(false);
  const [isDeleteScriptHovered, setIsDeleteScriptHovered] = useState(false);
  const [newScriptHoverTone, setNewScriptHoverTone] = useState<Tone>('neutral');
  const [deleteScriptHoverTone, setDeleteScriptHoverTone] = useState<'invalid' | 'valid'>('invalid');
  const [selectedScriptStepNumber, setSelectedScriptStepNumber] = useState<number | null>(null);
  const [expandedScriptStepIds, setExpandedScriptStepIds] = useState<Record<string, boolean>>({});
  const [isDeleteStepPopupOpen, setIsDeleteStepPopupOpen] = useState(false);

  const selectedScript = useMemo(
    () => scripts.find((script) => script.id === selectedScriptId) || null,
    [scripts, selectedScriptId],
  );
  const scriptNameMatch = useMemo(() => {
    const name = String(scriptNameInput || '').trim();
    if (!name) return null;
    return scripts.find((script) => script.name.trim() === name) || null;
  }, [scriptNameInput, scripts]);
  const scriptNameValidation = useMemo(() => {
    const name = String(scriptNameInput || '').trim();
    if (!name) return { tone: 'neutral' as const, message: 'Enter a script name.' };
    if (scriptNameMatch) return { tone: 'invalid' as const, message: 'Script Name Exists' };
    return { tone: 'valid' as const, message: 'Valid script name' };
  }, [scriptNameInput, scriptNameMatch]);
  const deleteScriptValidation = useMemo(() => {
    if (!scriptNameMatch) return { tone: 'invalid' as const, message: 'Script Not Found' };
    return { tone: 'valid' as const, message: `Delete ${scriptNameMatch.name}` };
  }, [scriptNameMatch]);
  const selectedScriptStep = useMemo(
    () => selectedScript?.steps.find((step) => step.step === selectedScriptStepNumber) || null,
    [selectedScript, selectedScriptStepNumber],
  );

  useEffect(() => {
    if (selectedScript) {
      setScriptNameInput(selectedScript.name);
      return;
    }
    setScriptNameInput(buildDefaultScriptName(scripts.length + 1));
  }, [scripts.length, selectedScript]);

  const getStepNetwork = useCallback(
    (step: LabScriptStep): string =>
      String(step.network || '').trim() ||
      ((step.mode || '') === 'hardhat' ? 'Hardhat Ec2-BASE' : activeNetworkName || 'MetaMask'),
    [activeNetworkName],
  );

  const getScriptNetwork = useCallback(
    (script: LabScript): string =>
      String(script.network || '').trim() ||
      (Array.isArray(script.steps) && script.steps[0] ? getStepNetwork(script.steps[0]) : activeNetworkName || 'MetaMask'),
    [activeNetworkName, getStepNetwork],
  );

  const getStepMode = useCallback(
    (step: LabScriptStep, scriptNetwork?: string): ConnectionMode =>
      String(scriptNetwork || '').trim() === 'Hardhat Ec2-BASE' ||
      getStepNetwork(step) === 'Hardhat Ec2-BASE' ||
      step.mode === 'hardhat'
        ? 'hardhat'
        : 'metamask',
    [getStepNetwork],
  );

  const getStepSender = useCallback((step: LabScriptStep): string => {
    const directSender = String(step['msg.sender'] || '').trim();
    if (directSender) return directSender;

    if (
      Array.isArray(step.params) &&
      step.params.every(
        (param) =>
          param &&
          typeof param === 'object' &&
          'key' in param &&
          'value' in param &&
          typeof (param as { key?: unknown }).key === 'string',
      )
    ) {
      const match = (step.params as LabScriptParam[]).find((param) => param.key === 'msg.sender');
      return String(match?.value || '').trim();
    }

    const legacyValues = Array.isArray(step.params) ? (step.params as unknown[]).map((value) => String(value || '')) : [];
    if (step.panel === 'erc20_write' && legacyValues.length >= 4) return legacyValues[0] || '';
    return '';
  }, []);

  const getStepParamEntries = useCallback(
    (step: LabScriptStep): LabScriptParam[] => {
      if (
        Array.isArray(step.params) &&
        step.params.every(
          (param) =>
            param &&
            typeof param === 'object' &&
            'key' in param &&
            'value' in param &&
            typeof (param as { key?: unknown }).key === 'string',
        )
      ) {
        return (step.params as LabScriptParam[])
          .map((param) => ({ key: String(param.key || ''), value: String(param.value || '') }))
          .filter((param) => param.key !== 'msg.sender' && param.value.trim().length > 0);
      }

      const legacyValues = Array.isArray(step.params) ? (step.params as unknown[]).map((value) => String(value || '')) : [];

      if (step.panel === 'ecr20_read') {
        const labels = getErc20ReadLabels(step.method as Erc20ReadMethod);
        const keys = [labels.addressALabel, labels.addressBLabel].filter(Boolean);
        return legacyValues
          .map((value, idx) => ({ key: keys[idx] || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      if (step.panel === 'erc20_write') {
        const labels = getErc20WriteLabels(step.method as Erc20WriteMethod);
        const hasLegacySender = legacyValues.length >= 4;
        const entries: LabScriptParam[] = [];
        entries.push({ key: labels.addressALabel, value: legacyValues[hasLegacySender ? 1 : 0] || '' });
        if (labels.requiresAddressB) entries.push({ key: labels.addressBLabel, value: legacyValues[hasLegacySender ? 2 : 1] || '' });
        entries.push({
          key: 'Amount',
          value: legacyValues[hasLegacySender ? 3 : labels.requiresAddressB ? 2 : 1] || '',
        });
        return entries.filter((param) => param.value.trim().length > 0);
      }

      if (step.panel === 'spcoin_rread') {
        const def = spCoinReadMethodDefs[step.method as SpCoinReadMethod];
        return legacyValues
          .map((value, idx) => ({ key: def?.params[idx]?.label || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      const writeDef = spCoinWriteMethodDefs[step.method as SpCoinWriteMethod];
      return legacyValues
        .map((value, idx) => ({ key: writeDef?.params[idx]?.label || `param${idx + 1}`, value }))
        .filter((param) => param.value.trim().length > 0);
    },
    [spCoinReadMethodDefs, spCoinWriteMethodDefs],
  );
  const hasStepMissingRequiredParams = useCallback(
    (step: LabScriptStep): boolean => {
      const params = getStepParamEntries(step);
      const sender = getStepSender(step);
      const findParamValue = (label: string) =>
        String(params.find((param) => param.key === label)?.value || '').trim();
      const stepMode = getStepMode(step, selectedScript?.network);

      if (step.panel === 'ecr20_read') {
        const labels = getErc20ReadLabels(step.method as Erc20ReadMethod);
        if (labels.requiresAddressA && !findParamValue(labels.addressALabel)) return true;
        if (labels.requiresAddressB && !findParamValue(labels.addressBLabel)) return true;
        return false;
      }

      if (step.panel === 'erc20_write') {
        const labels = getErc20WriteLabels(step.method as Erc20WriteMethod);
        if (stepMode === 'hardhat' && !sender) return true;
        if (!findParamValue(labels.addressALabel)) return true;
        if (labels.requiresAddressB && !findParamValue(labels.addressBLabel)) return true;
        if (!findParamValue('Amount')) return true;
        return false;
      }

      if (step.panel === 'spcoin_rread') {
        const def = spCoinReadMethodDefs[step.method as SpCoinReadMethod];
        return (def?.params || []).some((param) => !findParamValue(param.label));
      }

      const def = spCoinWriteMethodDefs[step.method as SpCoinWriteMethod];
      if (stepMode === 'hardhat' && !sender) return true;
      return (def?.params || []).some((param) => param.type !== 'date' && !findParamValue(param.label));
    },
    [getStepMode, getStepParamEntries, getStepSender, selectedScript?.network, spCoinReadMethodDefs, spCoinWriteMethodDefs],
  );

  const normalizeScriptStep = useCallback(
    (step: LabScriptStep, index: number): LabScriptStep => {
      const hasMissingRequiredParams = hasStepMissingRequiredParams(step);
      return {
        step: index + 1,
        name: step.name,
        panel: step.panel,
        method: step.method,
        'msg.sender': getStepSender(step) || undefined,
        params: getStepParamEntries(step),
        breakpoint: Boolean(step.breakpoint) || hasMissingRequiredParams,
        hasMissingRequiredParams,
      };
    },
    [getStepParamEntries, getStepSender, hasStepMissingRequiredParams],
  );

  const normalizeScript = useCallback(
    (script: LabScript): LabScript => {
      const normalizedSteps = Array.isArray(script.steps) ? script.steps.map((step, idx) => normalizeScriptStep(step, idx)) : [];
      return {
        id: String(script.id || '').trim(),
        name: String(script.name || '').trim(),
        'Date Created': inferScriptCreatedDate(script),
        network: getScriptNetwork(script),
        steps: normalizedSteps,
      };
    },
    [getScriptNetwork, normalizeScriptStep],
  );

  useEffect(() => {
    setScripts((prev) => {
      let changed = false;
      const next = prev.map((script) => {
        const normalizedScript = normalizeScript(script);
        if (JSON.stringify(normalizedScript) !== JSON.stringify(script)) {
          changed = true;
          return normalizedScript;
        }
        return script;
      });
      return changed ? next : prev;
    });
  }, [normalizeScript]);

  useEffect(() => {
    if (!selectedScript) {
      setSelectedScriptStepNumber(null);
    }
  }, [selectedScript, selectedScriptStepNumber]);

  const loadScriptStep = useCallback(
    (step: LabScriptStep) => {
      const paramEntries = getStepParamEntries(step);
      const stepSender = getStepSender(step);
      const findParamValue = (keys: string[]) => {
        const match = paramEntries.find((param) => keys.includes(param.key));
        return String(match?.value || '');
      };

      setSelectedScriptStepNumber(step.step);
      setMode(getStepMode(step, selectedScript?.network));
      setMethodPanelMode(step.panel);

      if (step.panel === 'ecr20_read') {
        setSelectedReadMethod(step.method as Erc20ReadMethod);
        const labels = getErc20ReadLabels(step.method as Erc20ReadMethod);
        setReadAddressA(findParamValue([labels.addressALabel]));
        setReadAddressB(findParamValue([labels.addressBLabel]));
        return;
      }

      if (step.panel === 'erc20_write') {
        const labels = getErc20WriteLabels(step.method as Erc20WriteMethod);
        setSelectedWriteMethod(step.method as Erc20WriteMethod);
        setSelectedWriteSenderAddress(stepSender);
        setWriteAddressA(findParamValue([labels.addressALabel]));
        setWriteAddressB(findParamValue([labels.addressBLabel]));
        setWriteAmountRaw(findParamValue(['Amount']));
        return;
      }

      if (step.panel === 'spcoin_rread') {
        setSelectedSpCoinReadMethod(step.method as SpCoinReadMethod);
        const def = spCoinReadMethodDefs[step.method as SpCoinReadMethod];
        setSpReadParams(
          Array.from({ length: 7 }, (_, idx) => findParamValue([def?.params[idx]?.label || `param${idx + 1}`])),
        );
        return;
      }

      setSelectedSpCoinWriteMethod(step.method as SpCoinWriteMethod);
      setSelectedWriteSenderAddress(stepSender);
      const def = spCoinWriteMethodDefs[step.method as SpCoinWriteMethod];
      setSpWriteParams(
        Array.from({ length: 7 }, (_, idx) => findParamValue([def?.params[idx]?.label || `param${idx + 1}`])),
      );
    },
    [
      getStepMode,
      getStepParamEntries,
      getStepSender,
      selectedScript?.network,
      setMethodPanelMode,
      setMode,
      setReadAddressA,
      setReadAddressB,
      setSelectedReadMethod,
      setSelectedSpCoinReadMethod,
      setSelectedSpCoinWriteMethod,
      setSelectedWriteMethod,
      setSelectedWriteSenderAddress,
      setSpReadParams,
      setSpWriteParams,
      setWriteAddressA,
      setWriteAddressB,
      setWriteAmountRaw,
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
    ],
  );

  const toggleScriptStepExpanded = useCallback((stepNumber: number) => {
    const key = String(stepNumber);
    setExpandedScriptStepIds((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const goToAdjacentScriptStep = useCallback(
    (direction: -1 | 1) => {
      if (!selectedScript || selectedScript.steps.length === 0) return;
      const currentIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextStep = selectedScript.steps[startIndex + direction];
      if (!nextStep) return;
      loadScriptStep(nextStep);
    },
    [loadScriptStep, selectedScript, selectedScriptStepNumber],
  );

  const moveSelectedScriptStep = useCallback(
    (direction: -1 | 1) => {
      if (!selectedScriptId || !selectedScript || selectedScriptStepNumber === null) return;
      const currentIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
      if (currentIndex < 0) return;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= selectedScript.steps.length) return;

      setScripts((prev) =>
        prev.map((script) => {
          if (script.id !== selectedScriptId) return script;
          const nextSteps = [...script.steps];
          [nextSteps[currentIndex], nextSteps[targetIndex]] = [nextSteps[targetIndex], nextSteps[currentIndex]];
          return { ...script, steps: nextSteps.map((step, idx) => ({ ...step, step: idx + 1 })) };
        }),
      );
      setExpandedScriptStepIds((prev) => {
        const reorderedSteps = [...selectedScript.steps];
        [reorderedSteps[currentIndex], reorderedSteps[targetIndex]] = [reorderedSteps[targetIndex], reorderedSteps[currentIndex]];
        const nextExpanded: Record<string, boolean> = {};
        reorderedSteps.forEach((step, idx) => {
          nextExpanded[String(idx + 1)] = Boolean(prev[String(step.step)]);
        });
        return nextExpanded;
      });
      setSelectedScriptStepNumber(targetIndex + 1);
    },
    [selectedScriptId, selectedScript, selectedScriptStepNumber],
  );

  const deleteSelectedScriptStep = useCallback(() => {
    if (!selectedScriptId || selectedScriptStepNumber === null) return;
    setScripts((prev) =>
      prev.map((script) => {
        if (script.id !== selectedScriptId) return script;
        const remainingSteps = script.steps
          .filter((step) => step.step !== selectedScriptStepNumber)
          .map((step, idx) => ({ ...step, step: idx + 1 }));
        return { ...script, steps: remainingSteps };
      }),
    );
    setExpandedScriptStepIds((prev) => {
      const currentSteps = Array.isArray(selectedScript?.steps) ? selectedScript.steps : [];
      const remainingSteps = currentSteps.filter((step) => step.step !== selectedScriptStepNumber);
      const nextExpanded: Record<string, boolean> = {};
      remainingSteps.forEach((step, idx) => {
        nextExpanded[String(idx + 1)] = Boolean(prev[String(step.step)]);
      });
      return nextExpanded;
    });
    setSelectedScriptStepNumber((prev) => {
      if (!prev) return null;
      const remainingCount = Math.max((selectedScript?.steps.length || 0) - 1, 0);
      if (remainingCount === 0) return null;
      return Math.min(prev, remainingCount);
    });
  }, [selectedScript?.steps, selectedScriptId, selectedScriptStepNumber]);

  const requestDeleteSelectedScriptStep = useCallback(() => {
    if (selectedScriptStepNumber === null) return;
    setIsDeleteStepPopupOpen(true);
  }, [selectedScriptStepNumber]);

  const confirmDeleteSelectedScriptStep = useCallback(() => {
    deleteSelectedScriptStep();
    setIsDeleteStepPopupOpen(false);
  }, [deleteSelectedScriptStep]);

  const toggleScriptStepBreakpoint = useCallback(
    (stepNumber: number) => {
      if (!selectedScriptId) return;
      setScripts((prev) =>
        prev.map((script) =>
          script.id === selectedScriptId
            ? {
                ...script,
                steps: script.steps.map((step) =>
                  step.step === stepNumber ? { ...step, breakpoint: !step.breakpoint } : step,
                ),
              }
            : script,
        ),
      );
    },
    [selectedScriptId],
  );

  const createNewScript = useCallback(() => {
    if (scriptNameValidation.tone !== 'valid') {
      setStatus(scriptNameValidation.message);
      return;
    }
    const nextIndex = scripts.length + 1;
    const nextId = `script-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextName = String(scriptNameInput || '').trim() || buildDefaultScriptName(nextIndex);
    const nextScript: LabScript = {
      id: nextId,
      name: nextName,
      'Date Created': formatScriptCreatedDate(new Date()),
      network: mode === 'hardhat' ? 'Hardhat Ec2-BASE' : activeNetworkName || 'MetaMask',
      steps: [],
    };
    setScripts((prev) => [...prev, nextScript]);
    setSelectedScriptId(nextId);
    setFormattedOutputDisplay(JSON.stringify(nextScript, null, 2));
    setOutputPanelMode('formatted');
    setStatus(`Created ${nextScript.name}.`);
  }, [activeNetworkName, mode, scriptNameInput, scriptNameValidation.message, scriptNameValidation.tone, scripts.length, setFormattedOutputDisplay, setOutputPanelMode, setStatus]);

  const deleteSelectedScript = useCallback(
    (targetScriptId: string) => {
      if (!targetScriptId) return;
      setScripts((prev) => {
        const remaining = prev.filter((script) => script.id !== targetScriptId);
        const canKeepSelected =
          selectedScriptId && selectedScriptId !== targetScriptId && remaining.some((script) => script.id === selectedScriptId);
        const nextSelectedId = canKeepSelected ? selectedScriptId : remaining[0]?.id || '';
        setSelectedScriptId(nextSelectedId);
        setFormattedOutputDisplay(
          nextSelectedId
            ? JSON.stringify(remaining.find((script) => script.id === nextSelectedId) || { scripts: [] }, null, 2)
            : JSON.stringify({ scripts: [] }, null, 2),
        );
        return remaining;
      });
      setOutputPanelMode('formatted');
      setStatus('Deleted selected script.');
    },
    [selectedScriptId, setFormattedOutputDisplay, setOutputPanelMode, setStatus],
  );

  const handleDeleteScriptClick = useCallback(() => {
    if (deleteScriptValidation.tone !== 'valid') {
      setStatus(deleteScriptValidation.message);
      return;
    }
    deleteSelectedScript(scriptNameMatch?.id || '');
  }, [deleteScriptValidation.message, deleteScriptValidation.tone, deleteSelectedScript, scriptNameMatch?.id, setStatus]);

  const addCurrentMethodToScript = useCallback((options?: { skipValidation?: boolean }) => {
    if (!selectedScriptId) {
      setStatus('Select or create a script first.');
      setOutputPanelMode('raw_status');
      return false;
    }

    const activeMissingEntries =
      methodPanelMode === 'ecr20_read'
        ? erc20ReadMissingEntries
        : methodPanelMode === 'erc20_write'
          ? erc20WriteMissingEntries
        : methodPanelMode === 'spcoin_rread'
          ? spCoinReadMissingEntries
          : spCoinWriteMissingEntries;
    const isUpdatingExistingStep =
      editingScriptStepNumber !== null &&
      Array.isArray(selectedScript?.steps) &&
      selectedScript.steps.some((step) => step.step === editingScriptStepNumber);
    if (!options?.skipValidation && activeMissingEntries.length > 0) {
      showValidationPopup(
        activeMissingEntries.map((entry) => entry.id),
        activeMissingEntries.map((entry) => entry.label),
        isUpdatingExistingStep
          ? 'Fill in the following fields before updating the script step:'
          : 'Fill in the following fields before adding the method to the script:',
        {
          confirmLabel: isUpdatingExistingStep ? 'Update Anyway' : 'Run Anyway',
          onConfirm: () => {
            addCurrentMethodToScript({ skipValidation: true });
          },
        },
      );
      return false;
    }

    let method = '';
    let params: LabScriptParam[] = [];
    let name = '';

    switch (methodPanelMode) {
      case 'ecr20_read':
        method = selectedReadMethod;
        params = [
          activeReadLabels.requiresAddressA ? { key: activeReadLabels.addressALabel, value: String(readAddressA || '').trim() } : null,
          activeReadLabels.requiresAddressB ? { key: activeReadLabels.addressBLabel, value: String(readAddressB || '').trim() } : null,
        ].filter((value): value is LabScriptParam => value !== null && value.value.length > 0);
        name = activeReadLabels.title;
        break;
      case 'erc20_write':
        method = selectedWriteMethod;
        params = [
          { key: activeWriteLabels.addressALabel, value: String(writeAddressA || '').trim() },
          ...(activeWriteLabels.requiresAddressB ? [{ key: activeWriteLabels.addressBLabel, value: String(writeAddressB || '').trim() }] : []),
          { key: 'Amount', value: String(writeAmountRaw || '').trim() },
        ].filter((param) => param.value.length > 0);
        name = activeWriteLabels.title;
        break;
      case 'spcoin_rread':
        method = selectedSpCoinReadMethod;
        params = spReadParams
          .slice(0, activeSpCoinReadDef.params.length)
          .map((value, idx) => ({
            key: activeSpCoinReadDef.params[idx]?.label || `param${idx + 1}`,
            value: String(value || '').trim(),
          }))
          .filter((param) => param.value.length > 0);
        name = activeSpCoinReadDef.title;
        break;
      case 'spcoin_write':
        method = selectedSpCoinWriteMethod;
        params = spWriteParams
          .slice(0, activeSpCoinWriteDef.params.length)
          .map((value, idx) => ({
            key: activeSpCoinWriteDef.params[idx]?.label || `param${idx + 1}`,
            value: String(value || '').trim(),
          }))
          .filter((param) => param.value.length > 0);
        name = activeSpCoinWriteDef.title;
        break;
      default:
        break;
    }

    if (!method) {
      setStatus('No active method is available to add.');
      setOutputPanelMode('raw_status');
      return false;
    }

    const nextStep: LabScriptStep = {
      step: 0,
      name,
      panel: methodPanelMode,
      method,
      breakpoint: activeMissingEntries.length > 0 ? true : undefined,
      hasMissingRequiredParams: activeMissingEntries.length > 0,
      'msg.sender':
        methodPanelMode === 'erc20_write' || methodPanelMode === 'spcoin_write'
          ? String(selectedWriteSenderAddress || '').trim() || undefined
          : undefined,
      params,
    };

    setScripts((prev) =>
      prev.map((script) =>
        script.id === selectedScriptId
          ? (() => {
              const currentSteps = Array.isArray(script.steps) ? script.steps : [];
              const nextSteps = isUpdatingExistingStep
                ? currentSteps.map((step) =>
                    step.step === editingScriptStepNumber
                      ? {
                          ...nextStep,
                          step: step.step,
                          breakpoint: activeMissingEntries.length > 0 ? true : step.breakpoint,
                        }
                      : step,
                  )
                : (() => {
                    const activeIndex =
                      selectedScriptStepNumber === null
                        ? currentSteps.length - 1
                        : currentSteps.findIndex((step) => step.step === selectedScriptStepNumber);
                    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : currentSteps.length;
                    return [...currentSteps.slice(0, insertIndex), nextStep, ...currentSteps.slice(insertIndex)].map(
                      (step, idx) => ({ ...step, step: idx + 1 }),
                    );
                  })();
              return {
                ...script,
                network: String(script.network || '').trim()
                  ? script.network
                  : mode === 'hardhat'
                    ? 'Hardhat Ec2-BASE'
                    : activeNetworkName || 'MetaMask',
                steps: nextSteps,
              };
            })()
          : script,
      ),
    );

    if (isUpdatingExistingStep && editingScriptStepNumber !== null) {
      setSelectedScriptStepNumber(editingScriptStepNumber);
    } else {
      const insertedStepNumber =
        selectedScriptStepNumber !== null && Array.isArray(selectedScript?.steps)
          ? (() => {
              const activeIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
              return (activeIndex >= 0 ? activeIndex : selectedScript.steps.length - 1) + 2;
            })()
          : (selectedScript?.steps.length || 0) + 1;

      setSelectedScriptStepNumber(insertedStepNumber);
      setExpandedScriptStepIds((prev) => {
        const currentSteps = Array.isArray(selectedScript?.steps) ? selectedScript.steps : [];
        const activeIndex =
          selectedScriptStepNumber === null
            ? currentSteps.length - 1
            : currentSteps.findIndex((step) => step.step === selectedScriptStepNumber);
        const insertIndex = activeIndex >= 0 ? activeIndex + 1 : currentSteps.length;
        const nextExpanded: Record<string, boolean> = {};
        currentSteps.forEach((step, idx) => {
          const nextStepNumber = idx < insertIndex ? idx + 1 : idx + 2;
          nextExpanded[String(nextStepNumber)] = Boolean(prev[String(step.step)]);
        });
        nextExpanded[String(insertIndex + 1)] = false;
        return nextExpanded;
      });
    }
    const savedStepNumber =
      isUpdatingExistingStep && editingScriptStepNumber !== null
        ? editingScriptStepNumber
        : selectedScriptStepNumber !== null && Array.isArray(selectedScript?.steps)
          ? (() => {
              const activeIndex = selectedScript.steps.findIndex((step) => step.step === selectedScriptStepNumber);
              return (activeIndex >= 0 ? activeIndex : selectedScript.steps.length - 1) + 2;
            })()
          : (selectedScript?.steps.length || 0) + 1;
    setOutputPanelMode('formatted');
    setStatus(
      isUpdatingExistingStep && editingScriptStepNumber !== null
        ? `Updated script step ${editingScriptStepNumber}.`
        : activeMissingEntries.length > 0
          ? `Added ${name} with missing required parameters.`
          : `Added ${name} to the selected script.`,
    );
    return savedStepNumber;
  }, [
    activeNetworkName,
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    activeReadLabels.title,
    activeSpCoinReadDef.params,
    activeSpCoinReadDef.title,
    activeSpCoinWriteDef.params,
    activeSpCoinWriteDef.title,
    activeWriteLabels.addressALabel,
    activeWriteLabels.addressBLabel,
    activeWriteLabels.requiresAddressB,
    activeWriteLabels.title,
    editingScriptStepNumber,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    methodPanelMode,
    mode,
    readAddressA,
    readAddressB,
    selectedReadMethod,
    selectedScript?.steps,
    selectedScriptId,
    selectedScriptStepNumber,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    setOutputPanelMode,
    setStatus,
    showValidationPopup,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    spReadParams,
    spWriteParams,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);

  const buildCurrentScriptStepDraft = useCallback((): Omit<LabScriptStep, 'step'> | null => {
    const activeMissingEntries =
      methodPanelMode === 'ecr20_read'
        ? erc20ReadMissingEntries
        : methodPanelMode === 'erc20_write'
          ? erc20WriteMissingEntries
          : methodPanelMode === 'spcoin_rread'
            ? spCoinReadMissingEntries
            : spCoinWriteMissingEntries;

    let method = '';
    let params: LabScriptParam[] = [];
    let name = '';

    switch (methodPanelMode) {
      case 'ecr20_read':
        method = selectedReadMethod;
        params = [
          activeReadLabels.requiresAddressA ? { key: activeReadLabels.addressALabel, value: String(readAddressA || '').trim() } : null,
          activeReadLabels.requiresAddressB ? { key: activeReadLabels.addressBLabel, value: String(readAddressB || '').trim() } : null,
        ].filter((value): value is LabScriptParam => value !== null && value.value.length > 0);
        name = activeReadLabels.title;
        break;
      case 'erc20_write':
        method = selectedWriteMethod;
        params = [
          { key: activeWriteLabels.addressALabel, value: String(writeAddressA || '').trim() },
          ...(activeWriteLabels.requiresAddressB ? [{ key: activeWriteLabels.addressBLabel, value: String(writeAddressB || '').trim() }] : []),
          { key: 'Amount', value: String(writeAmountRaw || '').trim() },
        ].filter((param) => param.value.length > 0);
        name = activeWriteLabels.title;
        break;
      case 'spcoin_rread':
        method = selectedSpCoinReadMethod;
        params = spReadParams
          .slice(0, activeSpCoinReadDef.params.length)
          .map((value, idx) => ({
            key: activeSpCoinReadDef.params[idx]?.label || `param${idx + 1}`,
            value: String(value || '').trim(),
          }))
          .filter((param) => param.value.length > 0);
        name = activeSpCoinReadDef.title;
        break;
      case 'spcoin_write':
        method = selectedSpCoinWriteMethod;
        params = spWriteParams
          .slice(0, activeSpCoinWriteDef.params.length)
          .map((value, idx) => ({
            key: activeSpCoinWriteDef.params[idx]?.label || `param${idx + 1}`,
            value: String(value || '').trim(),
          }))
          .filter((param) => param.value.length > 0);
        name = activeSpCoinWriteDef.title;
        break;
      default:
        break;
    }

    if (!method) return null;

    return {
      name,
      panel: methodPanelMode,
      method,
      hasMissingRequiredParams: activeMissingEntries.length > 0,
      'msg.sender':
        methodPanelMode === 'erc20_write' || methodPanelMode === 'spcoin_write'
          ? String(selectedWriteSenderAddress || '').trim() || undefined
          : undefined,
      params,
    };
  }, [
    activeReadLabels.addressALabel,
    activeReadLabels.addressBLabel,
    activeReadLabels.requiresAddressA,
    activeReadLabels.requiresAddressB,
    activeReadLabels.title,
    activeSpCoinReadDef.params,
    activeSpCoinReadDef.title,
    activeSpCoinWriteDef.params,
    activeSpCoinWriteDef.title,
    activeWriteLabels.addressALabel,
    activeWriteLabels.addressBLabel,
    activeWriteLabels.requiresAddressB,
    activeWriteLabels.title,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    methodPanelMode,
    readAddressA,
    readAddressB,
    selectedReadMethod,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedWriteMethod,
    selectedWriteSenderAddress,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    spReadParams,
    spWriteParams,
    writeAddressA,
    writeAddressB,
    writeAmountRaw,
  ]);
  const hasEditingScriptChanges = useMemo(() => {
    if (editingScriptStepNumber === null || !Array.isArray(selectedScript?.steps)) return true;
    const existingStep = selectedScript.steps.find((step) => step.step === editingScriptStepNumber);
    const currentDraft = buildCurrentScriptStepDraft();
    if (!existingStep || !currentDraft) return true;

    const comparableExistingStep = {
      name: existingStep.name,
      panel: existingStep.panel,
      method: existingStep.method,
      hasMissingRequiredParams: Boolean(existingStep.hasMissingRequiredParams),
      'msg.sender': String(existingStep['msg.sender'] || '').trim() || undefined,
      params: getStepParamEntries(existingStep),
    };

    return JSON.stringify(comparableExistingStep) !== JSON.stringify(currentDraft);
  }, [buildCurrentScriptStepDraft, editingScriptStepNumber, getStepParamEntries, selectedScript?.steps]);

  return {
    scripts,
    setScripts,
    selectedScriptId,
    setSelectedScriptId,
    selectedScript,
    scriptNameInput,
    setScriptNameInput,
    isScriptOptionsOpen,
    setIsScriptOptionsOpen,
    isNewScriptHovered,
    setIsNewScriptHovered,
    isDeleteScriptHovered,
    setIsDeleteScriptHovered,
    newScriptHoverTone,
    setNewScriptHoverTone,
    deleteScriptHoverTone,
    setDeleteScriptHoverTone,
    scriptNameValidation,
    deleteScriptValidation,
    selectedScriptStepNumber,
    setSelectedScriptStepNumber,
    expandedScriptStepIds,
    isDeleteStepPopupOpen,
    setIsDeleteStepPopupOpen,
    selectedScriptStep,
    getStepSender,
    getStepParamEntries,
    loadScriptStep,
    toggleScriptStepExpanded,
    goToAdjacentScriptStep,
    moveSelectedScriptStep,
    requestDeleteSelectedScriptStep,
    confirmDeleteSelectedScriptStep,
    toggleScriptStepBreakpoint,
    createNewScript,
    handleDeleteScriptClick,
    hasEditingScriptChanges,
    addCurrentMethodToScript,
  };
}
