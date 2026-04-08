import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  getErc20ReadLabels,
  type Erc20ReadMethod,
} from '../jsonMethods/erc20/read';
import {
  getErc20WriteLabels,
  type Erc20WriteMethod,
} from '../jsonMethods/erc20/write';
import { normalizeSpCoinReadMethod, type SpCoinReadMethod } from '../jsonMethods/spCoin/read';
import { normalizeSpCoinWriteMethod, type SpCoinWriteMethod } from '../jsonMethods/spCoin/write';
import type { SerializationTestMethod } from '../jsonMethods/serializationTests';
import type { MethodDef } from '../jsonMethods/shared/types';
import type {
  ConnectionMode,
  LabJavaScriptScript,
  LabScript,
  LabScriptParam,
  LabScriptStep,
  MethodPanelMode,
  ScriptEditorKind,
} from '../scriptBuilder/types';
import {
  buildDefaultScriptName,
  formatScriptCreatedDate,
  inferScriptCreatedDate,
} from '../scriptBuilder/utils';
import { BUILTIN_SYSTEM_TEST_SCRIPTS } from '../scriptBuilder/systemTests';
import { BUILTIN_JAVASCRIPT_TEST_SCRIPTS } from '../scriptBuilder/javascriptTests';

type Tone = 'neutral' | 'invalid' | 'valid';

type Entry = { id: string; label: string };

const ACCESS_MODULES_TYPESCRIPT_ROOT = 'spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src';
const OFFCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/offChain/`;
const ONCHAIN_TYPESCRIPT_ROOT = `${ACCESS_MODULES_TYPESCRIPT_ROOT}/onChain/`;

function getJavaScriptScriptCategoryPath(script: LabJavaScriptScript) {
  return String(script.executionFilePath || script.filePath || script.displayFilePath || '').trim();
}

function normalizeScriptName(value: string) {
  return String(value || '').trim().toLowerCase();
}

function mergeScripts(userScripts: LabScript[], systemScripts: LabScript[]) {
  const mergedById = new Map<string, LabScript>();
  userScripts.forEach((script) => {
    mergedById.set(script.id, script);
  });
  systemScripts.forEach((script) => {
    mergedById.set(script.id, script);
  });
  return Array.from(mergedById.values());
}

function mergeJavaScriptScripts(userScripts: LabJavaScriptScript[], systemScripts: LabJavaScriptScript[]) {
  const mergedById = new Map<string, LabJavaScriptScript>();
  userScripts.forEach((script) => {
    mergedById.set(script.id, script);
  });
  systemScripts.forEach((script) => {
    mergedById.set(script.id, script);
  });
  return Array.from(mergedById.values());
}

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
  selectedSerializationTestMethod: SerializationTestMethod;
  serializationTestParams: string[];
  activeSerializationTestDef: MethodDef;
  serializationTestMethodDefs: Record<string, MethodDef>;
  editingScriptStepNumber: number | null;
  erc20ReadMissingEntries: Entry[];
  erc20WriteMissingEntries: Entry[];
  spCoinReadMissingEntries: Entry[];
  spCoinWriteMissingEntries: Entry[];
  serializationTestMissingEntries: Entry[];
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
  setSelectedSerializationTestMethod: (value: SerializationTestMethod) => void;
  setSerializationTestParams: (value: string[]) => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
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
  selectedSerializationTestMethod,
  serializationTestParams,
  activeSerializationTestDef,
  serializationTestMethodDefs,
  editingScriptStepNumber,
  erc20ReadMissingEntries,
  erc20WriteMissingEntries,
  spCoinReadMissingEntries,
  spCoinWriteMissingEntries,
  serializationTestMissingEntries,
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
  setSelectedSerializationTestMethod,
  setSerializationTestParams,
  showOnChainMethods,
  showOffChainMethods,
}: Params) {
  const effectiveScriptPanelMode: MethodPanelMode = methodPanelMode;
  const [scripts, setScriptsState] = useState<LabScript[]>([]);
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
  const [showSystemTestsOnly, setShowSystemTestsOnly] = useState(false);
  const [scriptEditorKind, setScriptEditorKind] = useState<ScriptEditorKind>('json');
  const [showJavaScriptUtilScriptsOnly, setShowJavaScriptUtilScriptsOnly] = useState(false);
  const [javaScriptScripts, setJavaScriptScripts] = useState<LabJavaScriptScript[]>([]);
  const [selectedJavaScriptScriptId, setSelectedJavaScriptScriptId] = useState('');
  const [javaScriptScriptNameInput, setJavaScriptScriptNameInput] = useState('');
  const [isJavaScriptScriptOptionsOpen, setIsJavaScriptScriptOptionsOpen] = useState(false);
  const availableJavaScriptScripts = useMemo(
    () => mergeJavaScriptScripts(javaScriptScripts, BUILTIN_JAVASCRIPT_TEST_SCRIPTS),
    [javaScriptScripts],
  );
  const visibleJavaScriptScripts = useMemo(
    () =>
      availableJavaScriptScripts.filter(
        (script) =>
          (script.scriptType === 'util') === showJavaScriptUtilScriptsOnly &&
          (
            showJavaScriptUtilScriptsOnly ||
            !script.isSystemScript ||
            ((showOnChainMethods && getJavaScriptScriptCategoryPath(script).includes(ONCHAIN_TYPESCRIPT_ROOT)) ||
              (showOffChainMethods && getJavaScriptScriptCategoryPath(script).includes(OFFCHAIN_TYPESCRIPT_ROOT)))
          ),
      ),
    [availableJavaScriptScripts, showJavaScriptUtilScriptsOnly, showOffChainMethods, showOnChainMethods],
  );
  const selectedJavaScriptScript = useMemo(
    () => availableJavaScriptScripts.find((script) => script.id === selectedJavaScriptScriptId) || null,
    [availableJavaScriptScripts, selectedJavaScriptScriptId],
  );
  const javaScriptScriptNameMatch = useMemo(() => {
    const name = normalizeScriptName(javaScriptScriptNameInput);
    if (!name) return null;
    return visibleJavaScriptScripts.find((script) => normalizeScriptName(script.name) === name) || null;
  }, [javaScriptScriptNameInput, visibleJavaScriptScripts]);
  const javaScriptScriptNameValidation = useMemo(() => {
    const name = String(javaScriptScriptNameInput || '').trim();
    if (!name) return { tone: 'neutral' as const, message: 'Enter a script name.' };
    if (javaScriptScriptNameMatch) return { tone: 'invalid' as const, message: 'Script Name Exists' };
    return { tone: 'valid' as const, message: 'Valid script name' };
  }, [javaScriptScriptNameInput, javaScriptScriptNameMatch]);
  const javaScriptDeleteScriptValidation = useMemo(() => {
    if (!javaScriptScriptNameMatch) return { tone: 'invalid' as const, message: 'Script Not Found' };
    if (javaScriptScriptNameMatch.isSystemScript) return { tone: 'invalid' as const, message: 'System Test Script' };
    return { tone: 'valid' as const, message: `Delete ${javaScriptScriptNameMatch.name}` };
  }, [javaScriptScriptNameMatch]);

  const allScripts = useMemo(() => mergeScripts(scripts, BUILTIN_SYSTEM_TEST_SCRIPTS), [scripts]);
  const selectedScript = useMemo(
    () => allScripts.find((script) => script.id === selectedScriptId) || null,
    [allScripts, selectedScriptId],
  );
  const visibleScripts = useMemo(
    () => allScripts.filter((script) => Boolean(script.isSystemScript) === showSystemTestsOnly),
    [allScripts, showSystemTestsOnly],
  );
  const scriptNameMatch = useMemo(() => {
    const name = normalizeScriptName(scriptNameInput);
    if (!name) return null;
    return visibleScripts.find((script) => normalizeScriptName(script.name) === name) || null;
  }, [scriptNameInput, visibleScripts]);
  const scriptNameValidation = useMemo(() => {
    const name = String(scriptNameInput || '').trim();
    if (!name) return { tone: 'neutral' as const, message: 'Enter a script name.' };
    if (scriptNameMatch) return { tone: 'invalid' as const, message: 'Script Name Exists' };
    return { tone: 'valid' as const, message: 'Valid script name' };
  }, [scriptNameInput, scriptNameMatch]);
  const deleteScriptValidation = useMemo(() => {
    if (!scriptNameMatch) return { tone: 'invalid' as const, message: 'Script Not Found' };
    if (scriptNameMatch.isSystemScript) return { tone: 'invalid' as const, message: 'System Test Script' };
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
    setScriptNameInput('');
  }, [selectedScript]);

  useEffect(() => {
    if (!selectedScript) return;
    if (Boolean(selectedScript.isSystemScript) === showSystemTestsOnly) return;
    setSelectedScriptId('');
    setScriptNameInput('');
    setSelectedScriptStepNumber(null);
    setExpandedScriptStepIds({});
  }, [selectedScript, showSystemTestsOnly]);

  useEffect(() => {
    if (!showSystemTestsOnly) return;
    if (selectedScript && selectedScript.isSystemScript) return;
    const firstSystemScript = visibleScripts[0];
    if (!firstSystemScript) return;
    setSelectedScriptId(firstSystemScript.id);
    setScriptNameInput(firstSystemScript.name);
    setSelectedScriptStepNumber(null);
    setExpandedScriptStepIds({});
  }, [selectedScript, setSelectedScriptId, showSystemTestsOnly, visibleScripts]);

  useEffect(() => {
    if (scriptEditorKind !== 'javascript') return;
    if (!selectedJavaScriptScriptId) return;
    if (visibleJavaScriptScripts.some((script) => script.id === selectedJavaScriptScriptId)) return;
    setSelectedJavaScriptScriptId('');
  }, [scriptEditorKind, selectedJavaScriptScriptId, visibleJavaScriptScripts]);

  useEffect(() => {
    if (scriptEditorKind !== 'javascript') return;
    if (selectedJavaScriptScript) {
      setJavaScriptScriptNameInput(selectedJavaScriptScript.name);
      return;
    }
    setJavaScriptScriptNameInput('');
  }, [scriptEditorKind, selectedJavaScriptScript]);

  const clearSelectedJavaScriptScript = useCallback(() => {
    setSelectedJavaScriptScriptId('');
    setJavaScriptScriptNameInput('');
  }, []);

  const createNewJavaScriptScript = useCallback(() => {
    const existingNames = new Set(availableJavaScriptScripts.map((script) => normalizeScriptName(script.name)));
    const requestedName = String(javaScriptScriptNameInput || '').trim();
    let nextName = requestedName;

    if (!nextName) {
      let counter = availableJavaScriptScripts.length + 1;
      nextName = `${showJavaScriptUtilScriptsOnly ? 'TypeScript Util File' : 'Offchain TypeScript File'} ${counter}`;
      while (existingNames.has(normalizeScriptName(nextName))) {
        counter += 1;
        nextName = `${showJavaScriptUtilScriptsOnly ? 'TypeScript Util File' : 'Offchain TypeScript File'} ${counter}`;
      }
    } else if (existingNames.has(normalizeScriptName(nextName))) {
      setStatus('Script Name Exists');
      setOutputPanelMode('raw_status');
      return;
    }

    void (async () => {
      try {
        const response = await fetch('/api/spCoin/javascript-scripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nextName,
            scriptType: showJavaScriptUtilScriptsOnly ? 'util' : 'test',
          }),
        });
        const payload = (await response.json()) as { ok?: boolean; message?: string; script?: LabJavaScriptScript };
        if (!response.ok || !payload?.script) {
          throw new Error(payload?.message || `Unable to create TypeScript file (${response.status})`);
        }
        setJavaScriptScripts((prev) => [...prev, payload.script as LabJavaScriptScript]);
        setSelectedJavaScriptScriptId(payload.script.id);
        setJavaScriptScriptNameInput(payload.script.name);
        setStatus(`Created ${payload.script.name}.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to create TypeScript file.');
      } finally {
        setOutputPanelMode('raw_status');
      }
    })();
  }, [availableJavaScriptScripts, javaScriptScriptNameInput, setOutputPanelMode, setStatus, showJavaScriptUtilScriptsOnly]);

  const handleDeleteJavaScriptScriptClick = useCallback(() => {
    const targetScript = selectedJavaScriptScript ?? javaScriptScriptNameMatch;
    if (!targetScript) {
      setStatus('Select a TypeScript file first.');
      setOutputPanelMode('raw_status');
      return;
    }
    if (targetScript.isSystemScript) {
      setStatus('System Test Script');
      setOutputPanelMode('raw_status');
      return;
    }

    void (async () => {
      try {
        if (targetScript.filePath) {
          const response = await fetch('/api/spCoin/javascript-scripts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: targetScript.filePath }),
          });
          if (!response.ok) {
            const payload = (await response.json()) as { message?: string };
            throw new Error(payload?.message || `Unable to delete TypeScript file (${response.status})`);
          }
        }
        setJavaScriptScripts((prev) => prev.filter((script) => script.id !== targetScript.id));
        setSelectedJavaScriptScriptId('');
        setJavaScriptScriptNameInput('');
        setIsJavaScriptScriptOptionsOpen(false);
        setStatus(`Deleted ${targetScript.name}.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to delete TypeScript file.');
      } finally {
        setOutputPanelMode('raw_status');
      }
    })();
  }, [javaScriptScriptNameMatch, selectedJavaScriptScript, setOutputPanelMode, setStatus]);

  const HARDHAT_NETWORK_LABEL = 'Hardhat EC2';
  const LEGACY_HARDHAT_NETWORK_LABEL = 'Hardhat Ec2-BASE';

  const getStepNetwork = useCallback(
    (step: LabScriptStep): string =>
      String(step.network || '').trim() ||
      ((step.mode || '') === 'hardhat' ? HARDHAT_NETWORK_LABEL : activeNetworkName || 'MetaMask'),
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
      String(scriptNetwork || '').trim() === HARDHAT_NETWORK_LABEL ||
      String(scriptNetwork || '').trim() === LEGACY_HARDHAT_NETWORK_LABEL ||
      getStepNetwork(step) === HARDHAT_NETWORK_LABEL ||
      getStepNetwork(step) === LEGACY_HARDHAT_NETWORK_LABEL ||
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
        const def = spCoinReadMethodDefs[normalizeSpCoinReadMethod(step.method)];
        return legacyValues
          .map((value, idx) => ({ key: def?.params[idx]?.label || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      if (step.panel === 'serialization_tests') {
        const def = serializationTestMethodDefs[step.method as SerializationTestMethod];
        return legacyValues
          .map((value, idx) => ({ key: def?.params[idx]?.label || `param${idx + 1}`, value }))
          .filter((param) => param.value.trim().length > 0);
      }

      const writeDef = spCoinWriteMethodDefs[normalizeSpCoinWriteMethod(step.method)];
      return legacyValues
        .map((value, idx) => ({ key: writeDef?.params[idx]?.label || `param${idx + 1}`, value }))
        .filter((param) => param.value.trim().length > 0);
    },
    [serializationTestMethodDefs, spCoinReadMethodDefs, spCoinWriteMethodDefs],
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
        const def = spCoinReadMethodDefs[normalizeSpCoinReadMethod(step.method)];
        return (def?.params || []).some((param) => !findParamValue(param.label));
      }

      if (step.panel === 'serialization_tests') {
        const def = serializationTestMethodDefs[step.method as SerializationTestMethod];
        return (def?.params || []).some((param) => !findParamValue(param.label));
      }

      const def = spCoinWriteMethodDefs[normalizeSpCoinWriteMethod(step.method)];
      if (stepMode === 'hardhat' && !sender) return true;
      return (def?.params || []).some((param) => param.type !== 'date' && !findParamValue(param.label));
    },
    [
      getStepMode,
      getStepParamEntries,
      getStepSender,
      selectedScript?.network,
      serializationTestMethodDefs,
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
    ],
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
  const setScripts = useCallback<Dispatch<SetStateAction<LabScript[]>>>(
    (value) => {
      setScriptsState((prev) => {
        const next = typeof value === 'function' ? (value as (prevState: LabScript[]) => LabScript[])(prev) : value;
        return next.map((script) => normalizeScript(script));
      });
    },
    [normalizeScript],
  );

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
      const fillParamList = (defs: Array<{ label: string }>) =>
        Array.from({ length: 7 }, (_, idx) => findParamValue([defs[idx]?.label || `param${idx + 1}`]));

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
        const normalizedMethod = normalizeSpCoinReadMethod(step.method);
        setSelectedSpCoinReadMethod(normalizedMethod);
        const def = spCoinReadMethodDefs[normalizedMethod];
        setSpReadParams(fillParamList(def?.params || []));
        return;
      }

      if (step.panel === 'spcoin_write') {
        const normalizedMethod = normalizeSpCoinWriteMethod(step.method);
        setSelectedSpCoinWriteMethod(normalizedMethod);
        setSelectedWriteSenderAddress(stepSender);
        const def = spCoinWriteMethodDefs[normalizedMethod];
        setSpWriteParams(fillParamList(def?.params || []));
        return;
      }

      setSelectedSerializationTestMethod(step.method as SerializationTestMethod);
      const def = serializationTestMethodDefs[step.method as SerializationTestMethod];
      setSerializationTestParams(fillParamList(def?.params || []));
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
      setSelectedSerializationTestMethod,
      setSelectedWriteMethod,
      setSelectedWriteSenderAddress,
      setSpReadParams,
      setSpWriteParams,
      setSerializationTestParams,
      setWriteAddressA,
      setWriteAddressB,
      setWriteAmountRaw,
      spCoinReadMethodDefs,
      spCoinWriteMethodDefs,
      serializationTestMethodDefs,
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
      if (selectedScript.isSystemScript) {
        setStatus('System Tests are read-only. Copy the script to edit it.');
        return;
      }
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
    if (selectedScript?.isSystemScript) {
      setStatus('System Tests are read-only. Copy the script to edit it.');
      return;
    }
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
    setSelectedScriptStepNumber(null);
  }, [selectedScript?.isSystemScript, selectedScript?.steps, selectedScriptId, selectedScriptStepNumber, setStatus]);

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
      if (selectedScript?.isSystemScript) {
        setStatus('System Tests are read-only. Copy the script to edit it.');
        return;
      }
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
    [selectedScript?.isSystemScript, selectedScriptId, setStatus],
  );

  const createNewScript = useCallback(() => {
    if (scriptNameValidation.tone !== 'valid') {
      setStatus(scriptNameValidation.message);
      return;
    }
    const nextIndex = allScripts.filter((script) => !script.isSystemScript).length + 1;
    const nextId = `script-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextName = String(scriptNameInput || '').trim() || buildDefaultScriptName(nextIndex);
    const nextScript: LabScript = {
      id: nextId,
      name: nextName,
      'Date Created': formatScriptCreatedDate(new Date()),
      network: mode === 'hardhat' ? HARDHAT_NETWORK_LABEL : activeNetworkName || 'MetaMask',
      steps: [],
    };
    setScripts((prev) => [...prev, nextScript]);
    setSelectedScriptId(nextId);
    setFormattedOutputDisplay(JSON.stringify(nextScript, null, 2));
    setOutputPanelMode('formatted');
    setStatus(`Created ${nextScript.name}.`);
  }, [activeNetworkName, allScripts, mode, scriptNameInput, scriptNameValidation.message, scriptNameValidation.tone, setFormattedOutputDisplay, setOutputPanelMode, setStatus]);

  const duplicateSelectedScript = useCallback(
    (nextNameRaw: string) => {
      if (!selectedScript) {
        setStatus('Select a script to copy.');
        return false;
      }

      const nextName = String(nextNameRaw || '').trim();
      if (!nextName) {
        setStatus('No Script Name');
        return false;
      }

      const normalizedNextName = normalizeScriptName(nextName);
      const duplicateExists = allScripts.some((script) => normalizeScriptName(script.name) === normalizedNextName);
      if (duplicateExists) {
        setStatus('Duplicate');
        return false;
      }

      const nextId = `script-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextScript: LabScript = {
        ...selectedScript,
        id: nextId,
        name: nextName,
        'Date Created': formatScriptCreatedDate(new Date()),
        isSystemScript: undefined,
        steps: Array.isArray(selectedScript.steps)
          ? selectedScript.steps.map((step, idx) => normalizeScriptStep({ ...step }, idx))
          : [],
      };

      setScripts((prev) => [...prev, nextScript]);
      setSelectedScriptId(nextId);
      setScriptNameInput(nextName);
      setSelectedScriptStepNumber(null);
      setExpandedScriptStepIds({});
      setFormattedOutputDisplay(JSON.stringify(nextScript, null, 2));
      setOutputPanelMode('formatted');
      setStatus(`Copied ${selectedScript.name} to ${nextScript.name}.`);
      return true;
    },
    [
      normalizeScriptStep,
      allScripts,
      selectedScript,
      setFormattedOutputDisplay,
      setOutputPanelMode,
      setStatus,
    ],
  );

  const clearSelectedScript = useCallback(() => {
    setSelectedScriptId('');
    setScriptNameInput('');
    setSelectedScriptStepNumber(null);
    setExpandedScriptStepIds({});
    setFormattedOutputDisplay('(no output yet)');
    setOutputPanelMode('formatted');
    setStatus('Cleared selected script.');
  }, [setFormattedOutputDisplay, setOutputPanelMode, setStatus]);

  const deleteSelectedScript = useCallback(
    (targetScriptId: string) => {
      if (!targetScriptId) return;
      if (selectedScript?.isSystemScript || scriptNameMatch?.isSystemScript) {
        setStatus('System Tests cannot be deleted.');
        return;
      }
      setScripts((prev) => {
        const remaining = prev.filter((script) => script.id !== targetScriptId);
        setSelectedScriptId('');
        setScriptNameInput('');
        setSelectedScriptStepNumber(null);
        setExpandedScriptStepIds({});
        setFormattedOutputDisplay(
          JSON.stringify({ scripts: [] }, null, 2),
        );
        return remaining;
      });
      setOutputPanelMode('formatted');
      setStatus('Deleted selected script.');
    },
    [scriptNameMatch?.isSystemScript, selectedScript?.isSystemScript, setFormattedOutputDisplay, setOutputPanelMode, setStatus],
  );

  const handleDeleteScriptClick = useCallback(() => {
    if (deleteScriptValidation.tone !== 'valid') {
      setStatus(deleteScriptValidation.message);
      return;
    }
    deleteSelectedScript(scriptNameMatch?.id || '');
  }, [deleteScriptValidation.message, deleteScriptValidation.tone, deleteSelectedScript, scriptNameMatch?.id, setStatus]);
  const buildEditorStepDraft = useCallback(
    (hasMissingRequiredParams: boolean): Omit<LabScriptStep, 'step'> | null => {
      const sender =
        effectiveScriptPanelMode === 'erc20_write' || effectiveScriptPanelMode === 'spcoin_write'
          ? String(selectedWriteSenderAddress || '').trim() || undefined
          : undefined;

      if (effectiveScriptPanelMode === 'ecr20_read') {
        return {
          name: activeReadLabels.title,
          panel: effectiveScriptPanelMode,
          method: selectedReadMethod,
          hasMissingRequiredParams,
          'msg.sender': sender,
          params: [
            activeReadLabels.requiresAddressA ? { key: activeReadLabels.addressALabel, value: String(readAddressA || '').trim() } : null,
            activeReadLabels.requiresAddressB ? { key: activeReadLabels.addressBLabel, value: String(readAddressB || '').trim() } : null,
          ].filter((value): value is LabScriptParam => value !== null && value.value.length > 0),
        };
      }

      if (effectiveScriptPanelMode === 'erc20_write') {
        return {
          name: activeWriteLabels.title,
          panel: effectiveScriptPanelMode,
          method: selectedWriteMethod,
          hasMissingRequiredParams,
          'msg.sender': sender,
          params: [
            { key: activeWriteLabels.addressALabel, value: String(writeAddressA || '').trim() },
            ...(activeWriteLabels.requiresAddressB ? [{ key: activeWriteLabels.addressBLabel, value: String(writeAddressB || '').trim() }] : []),
            { key: 'Amount', value: String(writeAmountRaw || '').trim() },
          ].filter((param) => param.value.length > 0),
        };
      }

      if (effectiveScriptPanelMode === 'spcoin_rread') {
        return {
          name: activeSpCoinReadDef.title,
          panel: effectiveScriptPanelMode,
          method: selectedSpCoinReadMethod,
          hasMissingRequiredParams,
          'msg.sender': sender,
          params: spReadParams
            .slice(0, activeSpCoinReadDef.params.length)
            .map((value, idx) => ({
              key: activeSpCoinReadDef.params[idx]?.label || `param${idx + 1}`,
              value: String(value || '').trim(),
            }))
            .filter((param) => param.value.length > 0),
        };
      }

      if (effectiveScriptPanelMode === 'spcoin_write') {
        return {
          name: activeSpCoinWriteDef.title,
          panel: effectiveScriptPanelMode,
          method: selectedSpCoinWriteMethod,
          hasMissingRequiredParams,
          'msg.sender': sender,
          params: spWriteParams
            .slice(0, activeSpCoinWriteDef.params.length)
            .map((value, idx) => ({
              key: activeSpCoinWriteDef.params[idx]?.label || `param${idx + 1}`,
              value: String(value || '').trim(),
            }))
            .filter((param) => param.value.length > 0),
        };
      }

      if (effectiveScriptPanelMode === 'serialization_tests') {
        return {
          name: activeSerializationTestDef.title,
          panel: effectiveScriptPanelMode,
          method: selectedSerializationTestMethod,
          hasMissingRequiredParams,
          'msg.sender': sender,
          params: serializationTestParams
            .slice(0, activeSerializationTestDef.params.length)
            .map((value, idx) => ({
              key: activeSerializationTestDef.params[idx]?.label || `param${idx + 1}`,
              value: String(value || '').trim(),
            }))
            .filter((param) => param.value.length > 0),
        };
      }

      return null;
    },
    [
      activeReadLabels.addressALabel,
      activeReadLabels.addressBLabel,
      activeReadLabels.requiresAddressA,
      activeReadLabels.requiresAddressB,
      activeReadLabels.title,
      activeSpCoinReadDef.params,
      activeSpCoinReadDef.title,
      activeSpCoinWriteDef.params,
      activeSpCoinWriteDef.title,
      activeSerializationTestDef.params,
      activeSerializationTestDef.title,
      activeWriteLabels.addressALabel,
      activeWriteLabels.addressBLabel,
      activeWriteLabels.requiresAddressB,
      activeWriteLabels.title,
      effectiveScriptPanelMode,
      readAddressA,
      readAddressB,
      selectedReadMethod,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      selectedSerializationTestMethod,
      selectedWriteMethod,
      selectedWriteSenderAddress,
      serializationTestParams,
      spReadParams,
      spWriteParams,
      writeAddressA,
      writeAddressB,
      writeAmountRaw,
    ],
  );

  const addCurrentMethodToScript = useCallback((options?: { skipValidation?: boolean }) => {
    if (!selectedScriptId) {
      setStatus('Select or create a script first.');
      setOutputPanelMode('raw_status');
      return false;
    }
    if (selectedScript?.isSystemScript) {
      setStatus('System Tests are read-only. Copy the script to edit it.');
      setOutputPanelMode('raw_status');
      return false;
    }

    const activeMissingEntries =
      effectiveScriptPanelMode === 'ecr20_read'
        ? erc20ReadMissingEntries
        : effectiveScriptPanelMode === 'erc20_write'
          ? erc20WriteMissingEntries
          : effectiveScriptPanelMode === 'spcoin_rread'
            ? spCoinReadMissingEntries
            : effectiveScriptPanelMode === 'spcoin_write'
              ? spCoinWriteMissingEntries
              : serializationTestMissingEntries;
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
          confirmLabel: isUpdatingExistingStep ? 'Update Anyway' : 'Add to Script Anyway',
          onConfirm: () => {
            addCurrentMethodToScript({ skipValidation: true });
          },
        },
      );
      return false;
    }

    const nextDraft = buildEditorStepDraft(activeMissingEntries.length > 0);
    if (!nextDraft) {
      setStatus('No active method is available to add.');
      setOutputPanelMode('raw_status');
      return false;
    }

    const nextStep: LabScriptStep = {
      step: 0,
      ...nextDraft,
      breakpoint: activeMissingEntries.length > 0 ? true : undefined,
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
                    ? HARDHAT_NETWORK_LABEL
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
          ? `Added ${nextDraft.name} with missing required parameters.`
          : `Added ${nextDraft.name} to the selected script.`,
    );
    return savedStepNumber;
  }, [
    activeNetworkName,
    buildEditorStepDraft,
    editingScriptStepNumber,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    effectiveScriptPanelMode,
    mode,
    selectedScript?.steps,
    selectedScriptId,
    selectedScriptStepNumber,
    setOutputPanelMode,
    setStatus,
    showValidationPopup,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
    selectedScript?.isSystemScript,
  ]);

  const buildCurrentScriptStepDraft = useCallback((): Omit<LabScriptStep, 'step'> | null => {
    const activeMissingEntries =
      effectiveScriptPanelMode === 'ecr20_read'
        ? erc20ReadMissingEntries
        : effectiveScriptPanelMode === 'erc20_write'
          ? erc20WriteMissingEntries
          : effectiveScriptPanelMode === 'spcoin_rread'
            ? spCoinReadMissingEntries
            : effectiveScriptPanelMode === 'spcoin_write'
              ? spCoinWriteMissingEntries
              : serializationTestMissingEntries;

    return buildEditorStepDraft(activeMissingEntries.length > 0);
  }, [
    buildEditorStepDraft,
    erc20ReadMissingEntries,
    erc20WriteMissingEntries,
    effectiveScriptPanelMode,
    spCoinReadMissingEntries,
    spCoinWriteMissingEntries,
    serializationTestMissingEntries,
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
    visibleScripts,
    setScripts,
    javaScriptScripts,
    setJavaScriptScripts,
    selectedScriptId,
    setSelectedScriptId,
    showSystemTestsOnly,
    setShowSystemTestsOnly,
    scriptEditorKind,
    setScriptEditorKind,
    showJavaScriptUtilScriptsOnly,
    setShowJavaScriptUtilScriptsOnly,
    availableJavaScriptScripts,
    visibleJavaScriptScripts,
    selectedJavaScriptScript,
    selectedJavaScriptScriptId,
    setSelectedJavaScriptScriptId,
    javaScriptScriptNameInput,
    setJavaScriptScriptNameInput,
    isJavaScriptScriptOptionsOpen,
    setIsJavaScriptScriptOptionsOpen,
    javaScriptScriptNameValidation,
    javaScriptDeleteScriptValidation,
    createNewJavaScriptScript,
    clearSelectedJavaScriptScript,
    handleDeleteJavaScriptScriptClick,
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
    duplicateSelectedScript,
    clearSelectedScript,
    handleDeleteScriptClick,
    hasEditingScriptChanges,
    addCurrentMethodToScript,
  };
}
