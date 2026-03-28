import React from 'react';
import Image from 'next/image';
import type { LabJavaScriptScript, LabScript, LabScriptStep, ScriptEditorKind } from '../scriptBuilder/types';

type ValidationTone = 'neutral' | 'invalid' | 'valid';

function normalizeScriptName(value: string) {
  return String(value || '').trim().toLowerCase();
}

type Props = {
  actionButtonStyle: string;
  hiddenScrollbarClass: string;
  scripts: LabScript[];
  visibleScripts: LabScript[];
  showSystemTestsOnly: boolean;
  setShowSystemTestsOnly: React.Dispatch<React.SetStateAction<boolean>>;
  scriptEditorKind: ScriptEditorKind;
  setScriptEditorKind: React.Dispatch<React.SetStateAction<ScriptEditorKind>>;
  showJavaScriptUtilScriptsOnly: boolean;
  setShowJavaScriptUtilScriptsOnly: React.Dispatch<React.SetStateAction<boolean>>;
  availableJavaScriptScripts: LabJavaScriptScript[];
  visibleJavaScriptScripts: LabJavaScriptScript[];
  selectedJavaScriptScriptId: string;
  setSelectedJavaScriptScriptId: (value: string) => void;
  javaScriptScriptNameInput: string;
  setJavaScriptScriptNameInput: (value: string) => void;
  isJavaScriptScriptOptionsOpen: boolean;
  setIsJavaScriptScriptOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  javaScriptScriptNameValidation: { tone: ValidationTone; message: string };
  javaScriptDeleteScriptValidation: { tone: 'invalid' | 'valid'; message: string };
  createNewJavaScriptScript: () => void;
  clearSelectedJavaScriptScript: () => void;
  handleDeleteJavaScriptScriptClick: () => void;
  selectedScript: LabScript | null;
  selectedScriptStepNumber: number | null;
  scriptNameInput: string;
  setScriptNameInput: (value: string) => void;
  selectedScriptId: string;
  setSelectedScriptId: (value: string) => void;
  isScriptOptionsOpen: boolean;
  setIsScriptOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNewScriptHovered: boolean;
  setIsNewScriptHovered: React.Dispatch<React.SetStateAction<boolean>>;
  isDeleteScriptHovered: boolean;
  setIsDeleteScriptHovered: React.Dispatch<React.SetStateAction<boolean>>;
  newScriptHoverTone: ValidationTone;
  setNewScriptHoverTone: React.Dispatch<React.SetStateAction<ValidationTone>>;
  deleteScriptHoverTone: 'invalid' | 'valid';
  setDeleteScriptHoverTone: React.Dispatch<React.SetStateAction<'invalid' | 'valid'>>;
  scriptNameValidation: { tone: ValidationTone; message: string };
  deleteScriptValidation: { tone: 'invalid' | 'valid'; message: string };
  createNewScript: () => void;
  duplicateSelectedScript: (name: string) => boolean;
  clearSelectedScript: () => void;
  handleDeleteScriptClick: () => void;
  restartScriptAtStart: () => Promise<void>;
  runSelectedScriptStep: () => Promise<void>;
  runRemainingScriptSteps: () => Promise<void>;
  isScriptDebugRunning: boolean;
  moveSelectedScriptStep: (direction: -1 | 1) => void;
  requestDeleteSelectedScriptStep: () => void;
  renderScriptStepRow: (step: LabScriptStep) => React.ReactNode;
};

export default function ScriptBuilderCard({
  actionButtonStyle,
  hiddenScrollbarClass,
  scripts,
  visibleScripts,
  showSystemTestsOnly,
  setShowSystemTestsOnly,
  scriptEditorKind,
  setScriptEditorKind,
  showJavaScriptUtilScriptsOnly,
  setShowJavaScriptUtilScriptsOnly,
  availableJavaScriptScripts,
  visibleJavaScriptScripts,
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
  selectedScriptStepNumber,
  scriptNameInput,
  setScriptNameInput,
  selectedScriptId,
  setSelectedScriptId,
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
  createNewScript,
  duplicateSelectedScript,
  clearSelectedScript,
  handleDeleteScriptClick,
  restartScriptAtStart,
  runSelectedScriptStep,
  runRemainingScriptSteps,
  isScriptDebugRunning,
  moveSelectedScriptStep,
  requestDeleteSelectedScriptStep,
  renderScriptStepRow,
}: Props) {
  const isJsonScriptMode = scriptEditorKind === 'json';
  const scriptSelectorRef = React.useRef<HTMLDivElement | null>(null);
  const copyPopupRef = React.useRef<HTMLDivElement | null>(null);
  const visibleScriptOptions = isJsonScriptMode ? visibleScripts : [];
  const activeSelectedScript = isJsonScriptMode ? selectedScript : null;
  const selectedStepIndex = activeSelectedScript?.steps.findIndex((step) => step.step === selectedScriptStepNumber) ?? -1;
  const hasScriptSelection = isJsonScriptMode && Boolean(String(selectedScriptId || '').trim());
  const isScriptSelectorEmpty = isJsonScriptMode ? String(scriptNameInput || '').trim() === '' : false;
  const primaryHoverTone = isScriptSelectorEmpty ? 'invalid' : hasScriptSelection ? 'valid' : newScriptHoverTone;
  const primaryBaseTone = hasScriptSelection ? 'valid' : scriptNameValidation.tone;
  const [isCopyPopupOpen, setIsCopyPopupOpen] = React.useState(false);
  const [copyScriptNameInput, setCopyScriptNameInput] = React.useState('');
  const [isCopyScriptHovered, setIsCopyScriptHovered] = React.useState(false);
  const hasJavaScriptSelection = !isJsonScriptMode && Boolean(String(selectedJavaScriptScriptId || '').trim());
  const isJavaScriptSelectorEmpty = !isJsonScriptMode ? String(javaScriptScriptNameInput || '').trim() === '' : false;
  const javaScriptPrimaryHoverTone = isJavaScriptSelectorEmpty ? 'invalid' : hasJavaScriptSelection ? 'valid' : newScriptHoverTone;
  const javaScriptPrimaryBaseTone = hasJavaScriptSelection ? 'valid' : javaScriptScriptNameValidation.tone;
  const normalizedCopyScriptName = normalizeScriptName(copyScriptNameInput);
  const copyScriptNameMatch = React.useMemo(() => {
    if (!normalizedCopyScriptName) return null;
    return scripts.find((script) => normalizeScriptName(script.name) === normalizedCopyScriptName) || null;
  }, [normalizedCopyScriptName, scripts]);
  const copyScriptValidation = React.useMemo(() => {
    const nextName = String(copyScriptNameInput || '').trim();
    if (!nextName) return { tone: 'invalid' as const, message: 'No Script Name' };
    if (copyScriptNameMatch) return { tone: 'invalid' as const, message: 'Duplicate' };
    return { tone: 'valid' as const, message: 'Copy Script' };
  }, [copyScriptNameInput, copyScriptNameMatch]);
  React.useEffect(() => {
    if (!isScriptOptionsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && scriptSelectorRef.current?.contains(target)) return;
      setIsScriptOptionsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isScriptOptionsOpen, setIsScriptOptionsOpen]);

  React.useEffect(() => {
    if (!isJavaScriptScriptOptionsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && scriptSelectorRef.current?.contains(target)) return;
      setIsJavaScriptScriptOptionsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isJavaScriptScriptOptionsOpen, setIsJavaScriptScriptOptionsOpen]);

  React.useEffect(() => {
    if (!isCopyPopupOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && copyPopupRef.current?.contains(target)) return;
      setIsCopyPopupOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isCopyPopupOpen]);

  React.useEffect(() => {
    if (!isCopyPopupOpen) return;
    setCopyScriptNameInput(selectedScript ? `${selectedScript.name} Copy` : '');
    setIsCopyScriptHovered(false);
  }, [isCopyPopupOpen, selectedScript]);

  return (
    <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
      <h3 className="text-center text-lg font-semibold text-[#5981F3]">
        {isJsonScriptMode ? 'JSON Script Builder/Debugger' : 'JavaScript Builder/Debugger'}
      </h3>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8FA8FF]">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={scriptEditorKind === 'json'}
              onChange={() => setScriptEditorKind('json')}
              className="h-4 w-4 accent-[#5981F3]"
            />
            <span>JSON Scripts</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={scriptEditorKind === 'javascript'}
              onChange={() => setScriptEditorKind('javascript')}
              className="h-4 w-4 accent-[#5981F3]"
            />
            <span>JavaScript Scripts</span>
          </label>
        </div>
        {isJsonScriptMode ? (
          <label className="inline-flex items-center gap-2 text-sm text-[#8FA8FF]">
            <input
              type="checkbox"
              checked={showSystemTestsOnly}
              onChange={(e) => setShowSystemTestsOnly(e.target.checked)}
              className="h-4 w-4 rounded border border-[#334155] bg-[#0E111B] accent-[#5981F3]"
            />
            <span>System Tests</span>
          </label>
        ) : (
          <label className="inline-flex items-center gap-2 text-sm text-[#8FA8FF]">
            <input
              type="checkbox"
              checked={showJavaScriptUtilScriptsOnly}
              onChange={(e) => setShowJavaScriptUtilScriptsOnly(e.target.checked)}
              className="h-4 w-4 rounded border border-[#334155] bg-[#0E111B] accent-[#5981F3]"
            />
            <span>Util Scripts</span>
          </label>
        )}
      </div>
      {isJsonScriptMode ? (
        <div className="grid grid-cols-[140px_minmax(0,1fr)_140px] items-center gap-3">
          <button
            type="button"
            className={`w-[140px] ${actionButtonStyle} ${
              (isNewScriptHovered ? primaryHoverTone : primaryBaseTone) === 'valid'
                ? 'hover:bg-green-400'
                : (isNewScriptHovered ? primaryHoverTone : primaryBaseTone) === 'invalid'
                ? 'hover:bg-red-600 hover:text-white'
                : ''
            }`}
            onClick={hasScriptSelection ? clearSelectedScript : createNewScript}
            onMouseEnter={() => {
              setNewScriptHoverTone(primaryHoverTone);
              setIsNewScriptHovered(true);
            }}
            onMouseLeave={() => setIsNewScriptHovered(false)}
            aria-disabled={!hasScriptSelection && scriptNameValidation.tone !== 'valid'}
            title={
              isScriptSelectorEmpty
                ? 'Srript Empty'
                : hasScriptSelection
                ? 'Clear Script'
                : scriptNameValidation.message
            }
          >
            {isNewScriptHovered && isScriptSelectorEmpty
              ? 'Srript Empty'
              : hasScriptSelection
              ? 'Clear Script'
              : (isNewScriptHovered ? primaryHoverTone : primaryBaseTone) === 'invalid' && isNewScriptHovered
              ? 'Name Exists'
              : 'New Script'}
          </button>
          <div ref={scriptSelectorRef} className="relative min-w-0">
            <input
              className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={scriptNameInput}
              onFocus={() => setIsScriptOptionsOpen(true)}
              onChange={(e) => {
                const nextValue = e.target.value;
                setScriptNameInput(nextValue);
                const normalizedNextValue = normalizeScriptName(nextValue);
                const matchingScript = normalizedNextValue
                  ? visibleScripts.find((script) => normalizeScriptName(script.name) === normalizedNextValue)
                  : null;
                if (matchingScript && matchingScript.id !== selectedScriptId) {
                  setSelectedScriptId(matchingScript.id);
                  return;
                }
                if (!matchingScript && selectedScriptId) {
                  setSelectedScriptId('');
                }
              }}
              aria-label="Script selector"
              title="Script selector"
              placeholder={visibleScripts.length === 0 ? (showSystemTestsOnly ? 'No System Tests' : 'Script 1') : 'Select or name a script'}
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsScriptOptionsOpen((prev) => !prev);
              }}
              className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-lg text-[#8FA8FF] transition-colors hover:text-white"
              title="Show scripts"
              aria-label="Show scripts"
            >
              v
            </button>
            {isScriptOptionsOpen && visibleScriptOptions.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#334155] bg-[#0E111B] shadow-lg">
                {visibleScriptOptions.map((script) => (
                  <button
                    key={script.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedScriptId(script.id);
                      setScriptNameInput(script.name);
                      setIsScriptOptionsOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#1E293B]"
                    title={script.name}
                  >
                    {script.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`w-[140px] ${actionButtonStyle} ${
              (isDeleteScriptHovered ? deleteScriptHoverTone : deleteScriptValidation.tone) === 'invalid'
                ? 'hover:bg-red-600 hover:text-white'
                : ''
            }`}
            onClick={handleDeleteScriptClick}
            onMouseEnter={() => {
              setDeleteScriptHoverTone(deleteScriptValidation.tone);
              setIsDeleteScriptHovered(true);
            }}
            onMouseLeave={() => setIsDeleteScriptHovered(false)}
            aria-disabled={deleteScriptValidation.tone !== 'valid'}
            title={deleteScriptValidation.message}
          >
            {(isDeleteScriptHovered ? deleteScriptHoverTone : deleteScriptValidation.tone) === 'invalid' &&
            isDeleteScriptHovered
              ? 'Not Found'
              : 'Delete Script'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[140px_minmax(0,1fr)_140px] items-center gap-3">
          <button
            type="button"
            className={`w-[140px] ${actionButtonStyle} ${
              (isNewScriptHovered ? javaScriptPrimaryHoverTone : javaScriptPrimaryBaseTone) === 'valid'
                ? 'hover:bg-green-400'
                : (isNewScriptHovered ? javaScriptPrimaryHoverTone : javaScriptPrimaryBaseTone) === 'invalid'
                ? 'hover:bg-red-600 hover:text-white'
                : ''
            }`}
            onClick={hasJavaScriptSelection ? clearSelectedJavaScriptScript : createNewJavaScriptScript}
            onMouseEnter={() => {
              setNewScriptHoverTone(javaScriptPrimaryHoverTone);
              setIsNewScriptHovered(true);
            }}
            onMouseLeave={() => setIsNewScriptHovered(false)}
            title={
              isJavaScriptSelectorEmpty
                ? 'Script Empty'
                : hasJavaScriptSelection
                ? 'Clear Script'
                : javaScriptScriptNameValidation.message
            }
          >
            {isNewScriptHovered && isJavaScriptSelectorEmpty
              ? 'Script Empty'
              : hasJavaScriptSelection
              ? 'Clear Script'
              : (isNewScriptHovered ? javaScriptPrimaryHoverTone : javaScriptPrimaryBaseTone) === 'invalid' &&
                isNewScriptHovered
              ? 'Name Exists'
              : 'New Script'}
          </button>
          <div ref={scriptSelectorRef} className="relative min-w-0">
            <input
              className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
              value={javaScriptScriptNameInput}
              onFocus={() => setIsJavaScriptScriptOptionsOpen(true)}
              onChange={(e) => {
                const nextValue = e.target.value;
                setJavaScriptScriptNameInput(nextValue);
                const normalizedNextValue = normalizeScriptName(nextValue);
                const matchingScript = normalizedNextValue
                  ? visibleJavaScriptScripts.find((script) => normalizeScriptName(script.name) === normalizedNextValue)
                  : null;
                if (matchingScript && matchingScript.id !== selectedJavaScriptScriptId) {
                  setSelectedJavaScriptScriptId(matchingScript.id);
                  return;
                }
                if (!matchingScript && selectedJavaScriptScriptId) {
                  setSelectedJavaScriptScriptId('');
                }
              }}
              aria-label="JavaScript script selector"
              title="JavaScript script selector"
              placeholder={
                visibleJavaScriptScripts.length === 0
                  ? showJavaScriptUtilScriptsOnly
                    ? 'Utility Script 1'
                    : 'JavaScript Script 1'
                  : 'Select or name a script'
              }
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsJavaScriptScriptOptionsOpen((prev) => !prev);
              }}
              className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-lg text-[#8FA8FF] transition-colors hover:text-white"
              title="Show JavaScript scripts"
              aria-label="Show JavaScript scripts"
            >
              v
            </button>
            {isJavaScriptScriptOptionsOpen && visibleJavaScriptScripts.length > 0 ? (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#334155] bg-[#0E111B] shadow-lg">
                {visibleJavaScriptScripts.map((script) => (
                  <button
                    key={script.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedJavaScriptScriptId(script.id);
                      setJavaScriptScriptNameInput(script.name);
                      setIsJavaScriptScriptOptionsOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#1E293B]"
                    title={script.name}
                  >
                    {script.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`w-[140px] ${actionButtonStyle} ${
              javaScriptDeleteScriptValidation.tone === 'invalid' ? 'hover:bg-red-600 hover:text-white' : ''
            }`}
            onClick={handleDeleteJavaScriptScriptClick}
            onMouseEnter={() => {
              setDeleteScriptHoverTone(javaScriptDeleteScriptValidation.tone);
              setIsDeleteScriptHovered(true);
            }}
            onMouseLeave={() => setIsDeleteScriptHovered(false)}
            title={javaScriptDeleteScriptValidation.message}
          >
            {(isDeleteScriptHovered ? deleteScriptHoverTone : javaScriptDeleteScriptValidation.tone) === 'invalid' &&
            isDeleteScriptHovered
              ? 'Not Found'
              : 'Delete Script'}
          </button>
        </div>
      )}
      <div className="relative mt-4 flex h-56 flex-col rounded-lg border border-[#31416F] bg-[#0E111B] px-3 pb-3 pt-3 text-sm text-slate-200">
        <div className="absolute right-3 top-2 flex items-center justify-end gap-[0.05rem]">
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 text-green-400 transition-colors hover:bg-[#1E293B] hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-70"
            title="Run Script From Start"
            onClick={() => void restartScriptAtStart()}
            disabled={!activeSelectedScript || activeSelectedScript.steps.length === 0 || isScriptDebugRunning}
          >
            <Image
              src="/assets/miscellaneous/run.png"
              alt="Run Script From Start"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(71%) sepia(39%) saturate(640%) hue-rotate(73deg) brightness(93%) contrast(90%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 text-[#E5B94F] transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70"
            title="Run Selected Step"
            onClick={() => void runSelectedScriptStep()}
            disabled={
              !activeSelectedScript || activeSelectedScript.steps.length === 0 || selectedScriptStepNumber === null || isScriptDebugRunning
            }
          >
            <Image
              src="/assets/miscellaneous/next.png"
              alt="Run Selected Step"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(42%) saturate(979%) hue-rotate(343deg) brightness(94%) contrast(89%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 text-[#E5B94F] transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70"
            title="Run Remaining Script"
            onClick={() => void runRemainingScriptSteps()}
            disabled={!activeSelectedScript || activeSelectedScript.steps.length === 0 || isScriptDebugRunning}
          >
            <Image
              src="/assets/miscellaneous/continue.png"
              alt="Run Remaining Script"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(42%) saturate(979%) hue-rotate(343deg) brightness(94%) contrast(89%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Move Step Up"
            onClick={() => moveSelectedScriptStep(-1)}
            disabled={!activeSelectedScript || selectedScriptStepNumber === null || selectedStepIndex <= 0 || isScriptDebugRunning}
          >
            <Image
              src="/assets/miscellaneous/up.png"
              alt="Move Step Up"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(57%) sepia(58%) saturate(2412%) hue-rotate(200deg) brightness(98%) contrast(96%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Move Step Down"
            onClick={() => moveSelectedScriptStep(1)}
            disabled={
              !activeSelectedScript ||
              selectedScriptStepNumber === null ||
              (selectedStepIndex >= activeSelectedScript.steps.length - 1 && activeSelectedScript.steps.length > 0) ||
              isScriptDebugRunning
            }
          >
            <Image
              src="/assets/miscellaneous/down.png"
              alt="Move Step Down"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(57%) sepia(58%) saturate(2412%) hue-rotate(200deg) brightness(98%) contrast(96%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
            title="Copy Script"
            onClick={() => {
              if (!hasScriptSelection) return;
              setIsCopyPopupOpen(true);
            }}
            disabled={!hasScriptSelection}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="block h-[21px] w-[21px] opacity-100"
              fill="none"
            >
              <rect x="8" y="5" width="10" height="12" rx="1.5" stroke="#8FA8FF" strokeWidth="2" />
              <path d="M6 9H5a1 1 0 0 0-1 1v9h10a1 1 0 0 0 1-1v-1" stroke="#8FA8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded p-0 transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed"
            title="Delete Step"
            onClick={requestDeleteSelectedScriptStep}
            disabled={selectedScriptStepNumber === null || isScriptDebugRunning}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="block h-[21px] w-[21px] opacity-100"
              fill="none"
            >
              <path d="M6 6L18 18" stroke="#FF0000" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M18 6L6 18" stroke="#FF0000" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {isCopyPopupOpen ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1220]/80">
            <div
              ref={copyPopupRef}
              className="w-full max-w-md rounded-xl border border-[#31416F] bg-[#0B1220] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="text-center text-lg font-semibold text-[#5981F3]">Copy Script</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <input
                  className="w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400"
                  value={copyScriptNameInput}
                  onChange={(e) => setCopyScriptNameInput(e.target.value)}
                  placeholder="Copy script name"
                  title="Copy Script Name"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className={`w-[140px] ${actionButtonStyle}`}
                    title="Return"
                    onClick={() => setIsCopyPopupOpen(false)}
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    className={`w-[140px] ${actionButtonStyle} ${
                      copyScriptValidation.tone === 'invalid' ? 'hover:bg-red-600 hover:text-white' : ''
                    }`}
                    title="Copy Script"
                    onMouseEnter={() => setIsCopyScriptHovered(true)}
                    onMouseLeave={() => setIsCopyScriptHovered(false)}
                    onClick={() => {
                      if (duplicateSelectedScript(copyScriptNameInput)) {
                        setIsCopyPopupOpen(false);
                      }
                    }}
                  >
                    {copyScriptValidation.tone === 'invalid' && isCopyScriptHovered
                      ? copyScriptValidation.message
                      : 'Copy Script'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className={`min-h-0 flex-1 overflow-auto pr-24 ${hiddenScrollbarClass}`}>
          {!isJsonScriptMode ? (
            <div className="text-slate-400">
              {availableJavaScriptScripts.length === 0
                ? '(no JavaScript scripts registered yet)'
                : selectedJavaScriptScriptId
                ? '(JavaScript script selected)'
                : '(select a JavaScript script)'}
            </div>
          ) : !activeSelectedScript ? (
            <div className="text-slate-400">(no script selected)</div>
          ) : activeSelectedScript.steps.length === 0 ? (
            <div className="text-slate-400">(script has no steps yet)</div>
          ) : (
            <div className="grid grid-cols-1 gap-1">{activeSelectedScript.steps.map((step) => renderScriptStepRow(step))}</div>
          )}
        </div>
      </div>
    </section>
  );
}
