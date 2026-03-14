import React from 'react';
import Image from 'next/image';
import type { LabScript, LabScriptStep } from '../scriptBuilder/types';

type ValidationTone = 'neutral' | 'invalid' | 'valid';

type Props = {
  actionButtonStyle: string;
  hiddenScrollbarClass: string;
  scripts: LabScript[];
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
  handleDeleteScriptClick: () => void;
  runActiveMethod: () => Promise<void>;
  goToAdjacentScriptStep: (direction: -1 | 1) => void;
  moveSelectedScriptStep: (direction: -1 | 1) => void;
  requestDeleteSelectedScriptStep: () => void;
  renderScriptStepRow: (step: LabScriptStep) => React.ReactNode;
};

export default function ScriptBuilderCard({
  actionButtonStyle,
  hiddenScrollbarClass,
  scripts,
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
  handleDeleteScriptClick,
  runActiveMethod,
  goToAdjacentScriptStep,
  moveSelectedScriptStep,
  requestDeleteSelectedScriptStep,
  renderScriptStepRow,
}: Props) {
  const visibleScriptOptions = scripts;
  const selectedStepIndex = selectedScript?.steps.findIndex((step) => step.step === selectedScriptStepNumber) ?? -1;

  return (
    <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
      <h3 className="text-center text-lg font-semibold text-[#5981F3]">Script Builder/Debugger</h3>
      <div className="mt-4 grid grid-cols-[140px_minmax(0,1fr)_140px] items-center gap-3">
        <button
          type="button"
          className={`w-[140px] ${actionButtonStyle} ${
            (isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'valid'
              ? 'hover:bg-green-400'
              : (isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'invalid'
              ? 'hover:bg-red-600 hover:text-white'
              : ''
          }`}
          onClick={createNewScript}
          onMouseEnter={() => {
            setNewScriptHoverTone(scriptNameValidation.tone);
            setIsNewScriptHovered(true);
          }}
          onMouseLeave={() => setIsNewScriptHovered(false)}
          aria-disabled={scriptNameValidation.tone !== 'valid'}
          title={scriptNameValidation.message}
        >
          {(isNewScriptHovered ? newScriptHoverTone : scriptNameValidation.tone) === 'invalid' && isNewScriptHovered
            ? 'Name Exists'
            : 'New Script'}
        </button>
        <div className="relative min-w-0">
          <input
            className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={scriptNameInput}
            onFocus={() => setIsScriptOptionsOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setIsScriptOptionsOpen(false), 100);
            }}
            onChange={(e) => {
              const nextValue = e.target.value;
              setScriptNameInput(nextValue);
              const matchingScript = scripts.find((script) => script.name === nextValue);
              if (matchingScript && matchingScript.id !== selectedScriptId) {
                setSelectedScriptId(matchingScript.id);
              }
            }}
            aria-label="Script selector"
            title="Script selector"
            placeholder={scripts.length === 0 ? 'Script 1' : 'Select or name a script'}
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
      <div className="mt-4 flex h-56 flex-col rounded-lg border border-[#31416F] bg-[#0E111B] px-3 pb-3 pt-1.5 text-sm text-slate-200">
        <div className="flex items-center justify-end gap-[0.05rem]">
          <button
            type="button"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-green-400 transition-colors hover:bg-[#1E293B] hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-70"
            title="Run Script"
            onClick={() => void runActiveMethod()}
          >
            <Image
              src="/assets/miscellaneous/run.png"
              alt="Run Script"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(71%) sepia(39%) saturate(640%) hue-rotate(73deg) brightness(93%) contrast(90%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Run to Next Step"
            onClick={() => goToAdjacentScriptStep(1)}
            disabled={!selectedScript || (selectedStepIndex >= selectedScript.steps.length - 1 && selectedScript.steps.length > 0)}
          >
            <Image src="/assets/miscellaneous/next.png" alt="Run to Next Step" width={21} height={21} className="block h-[21px] w-[21px]" unoptimized />
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Move to Previous Step"
            onClick={() => goToAdjacentScriptStep(-1)}
            disabled={!selectedScript || selectedStepIndex <= 0}
          >
            <Image
              src="/assets/miscellaneous/back.png"
              alt="Move to Previous Step"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(76%) sepia(44%) saturate(633%) hue-rotate(357deg) brightness(95%) contrast(88%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-slate-200 transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-70"
            title="Run Remaining Scrept"
            disabled
          >
            <Image
              src="/assets/miscellaneous/continue.png"
              alt="Run Remaining Scrept"
              width={21}
              height={21}
              className="block h-[21px] w-[21px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(71%) sepia(39%) saturate(640%) hue-rotate(73deg) brightness(93%) contrast(90%)' }}
              unoptimized
            />
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Move Step Up"
            onClick={() => moveSelectedScriptStep(-1)}
            disabled={!selectedScript || selectedStepIndex <= 0}
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
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-white transition-colors hover:bg-[#1E293B] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            title="Move Step Down"
            onClick={() => moveSelectedScriptStep(1)}
            disabled={!selectedScript || (selectedStepIndex >= selectedScript.steps.length - 1 && selectedScript.steps.length > 0)}
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
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded p-0 text-red-400 transition-colors hover:bg-[#1E293B] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            title="Delete Step"
            onClick={requestDeleteSelectedScriptStep}
            disabled={selectedScriptStepNumber === null}
          >
            <span className="block text-[21px] leading-none">x</span>
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-auto pt-1 ${hiddenScrollbarClass}`}>
          {!selectedScript ? (
            <div className="text-slate-400">(no script selected)</div>
          ) : selectedScript.steps.length === 0 ? (
            <div className="text-slate-400">(script has no steps yet)</div>
          ) : (
            <div className="grid grid-cols-1 gap-1">{selectedScript.steps.map((step) => renderScriptStepRow(step))}</div>
          )}
        </div>
      </div>
    </section>
  );
}
