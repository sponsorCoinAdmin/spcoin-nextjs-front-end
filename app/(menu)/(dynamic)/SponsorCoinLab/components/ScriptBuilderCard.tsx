import React from 'react';
import Image from 'next/image';
import type { LabScript, LabScriptStep } from '../scriptBuilder/types';
import { SelectChevron } from './SelectChevron';

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
  moveScriptStepToPosition: (sourceStepNumber: number, targetStepNumber: number, placement: 'before' | 'after') => void;
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
  moveScriptStepToPosition,
  requestDeleteSelectedScriptStep,
  renderScriptStepRow,
}: Props) {
  const scriptSelectorRef = React.useRef<HTMLDivElement | null>(null);
  const copyPopupRef = React.useRef<HTMLDivElement | null>(null);
  const visibleScriptOptions = visibleScripts;
  const activeSelectedScript = selectedScript;
  const selectedStepIndex = activeSelectedScript?.steps.findIndex((step) => step.step === selectedScriptStepNumber) ?? -1;
  const hasScriptSelection = Boolean(String(selectedScriptId || '').trim());
  const isScriptSelectorEmpty = String(scriptNameInput || '').trim() === '';
  const primaryHoverTone = isScriptSelectorEmpty ? 'invalid' : hasScriptSelection ? 'valid' : scriptNameValidation.tone;
  const primaryBaseTone = hasScriptSelection ? 'valid' : scriptNameValidation.tone;
  const [isCopyPopupOpen, setIsCopyPopupOpen] = React.useState(false);
  const [copyScriptNameInput, setCopyScriptNameInput] = React.useState('');
  const [isCopyScriptHovered, setIsCopyScriptHovered] = React.useState(false);
  const [draggedStepNumber, setDraggedStepNumber] = React.useState<number | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ stepNumber: number; placement: 'before' | 'after' } | null>(null);
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

  React.useEffect(() => {
    setDraggedStepNumber(null);
    setDropTarget(null);
  }, [selectedScript?.id]);

  const canDragSteps = Boolean(activeSelectedScript && !activeSelectedScript.isSystemScript && !isScriptDebugRunning);

  return (
    <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
      <h3 className="text-center text-lg font-semibold text-[#5981F3]">Script Builder/Debugger</h3>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[#8FA8FF]">
          <input
            type="checkbox"
            checked={showSystemTestsOnly}
            onChange={(e) => setShowSystemTestsOnly(e.target.checked)}
            className="h-4 w-4 rounded border border-[#334155] bg-[#0E111B] accent-[#5981F3]"
          />
          <span>System Tests</span>
        </label>
      </div>
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
                ? 'Script Empty'
                : hasScriptSelection
                ? 'Clear Script'
                : scriptNameValidation.message
            }
          >
            {isNewScriptHovered && isScriptSelectorEmpty
              ? 'Script Empty'
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
              <SelectChevron open={isScriptOptionsOpen} />
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
          {!activeSelectedScript ? (
            <div className="text-slate-400">(no script selected)</div>
          ) : activeSelectedScript.isLazy ? (
            <div className="text-slate-400">(loading script JSON...)</div>
          ) : activeSelectedScript.steps.length === 0 ? (
            <div className="text-slate-400">(script has no steps yet)</div>
          ) : (
            <div className="grid grid-cols-1 gap-0">
              {activeSelectedScript.steps.map((step) => {
                const isDropBefore = dropTarget?.stepNumber === step.step && dropTarget.placement === 'before';
                const isDropAfter = dropTarget?.stepNumber === step.step && dropTarget.placement === 'after';
                return (
                  <div
                    key={`step-drop-${step.step}`}
                    draggable={canDragSteps}
                    onDragStart={(event) => {
                      if (!canDragSteps) {
                        event.preventDefault();
                        return;
                      }
                      setDraggedStepNumber(step.step);
                      setDropTarget(null);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(step.step));
                    }}
                    onDragOver={(event) => {
                      if (!canDragSteps || draggedStepNumber === null || draggedStepNumber === step.step) return;
                      event.preventDefault();
                      const bounds = event.currentTarget.getBoundingClientRect();
                      const midpoint = bounds.top + bounds.height / 2;
                      const placement = event.clientY < midpoint ? 'before' : 'after';
                      setDropTarget((prev) =>
                        prev?.stepNumber === step.step && prev.placement === placement
                          ? prev
                          : { stepNumber: step.step, placement },
                      );
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setDropTarget((prev) => (prev?.stepNumber === step.step ? null : prev));
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (
                        !canDragSteps ||
                        draggedStepNumber === null ||
                        dropTarget === null ||
                        dropTarget.stepNumber !== step.step ||
                        draggedStepNumber === step.step
                      ) {
                        setDraggedStepNumber(null);
                        setDropTarget(null);
                        return;
                      }
                      moveScriptStepToPosition(draggedStepNumber, step.step, dropTarget.placement);
                      setDraggedStepNumber(null);
                      setDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedStepNumber(null);
                      setDropTarget(null);
                    }}
                    className={`rounded-md transition-opacity ${
                      draggedStepNumber === step.step ? 'cursor-grabbing opacity-70' : canDragSteps ? 'cursor-grab' : ''
                    }`}
                  >
                    <div className={`h-[2px] rounded-full transition-opacity ${isDropBefore ? 'mb-1 bg-[#8FA8FF] opacity-100' : 'mb-0 opacity-0'}`} />
                    {renderScriptStepRow(step)}
                    <div className={`h-[2px] rounded-full transition-opacity ${isDropAfter ? 'mt-1 bg-[#8FA8FF] opacity-100' : 'mt-0 opacity-0'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
