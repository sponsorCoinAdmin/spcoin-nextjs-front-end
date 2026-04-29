import type React from 'react';
import type { LabScriptParam, LabScriptStep } from '../scriptBuilder/types';

interface Props {
  step: LabScriptStep;
  isExpanded: boolean;
  isSelected: boolean;
  isEditingStep: boolean;
  hasExecutionError: boolean;
  getStepSender: (step: LabScriptStep) => string;
  getStepParamEntries: (step: LabScriptStep) => LabScriptParam[];
  selectScriptStep: (step: LabScriptStep) => void;
  editScriptStep: (step: LabScriptStep) => void;
  toggleScriptStepExpanded: (stepNumber: number) => void;
  toggleScriptStepBreakpoint: (stepNumber: number) => void;
}

export default function ScriptStepRow({
  step,
  isExpanded,
  isSelected,
  isEditingStep,
  hasExecutionError,
  getStepSender,
  getStepParamEntries,
  selectScriptStep,
  editScriptStep,
  toggleScriptStepExpanded,
  toggleScriptStepBreakpoint,
}: Props) {
  const sender = getStepSender(step);
  const params = getStepParamEntries(step);
  const hasExpandableContent = Boolean(sender) || params.length > 0;
  const methodClassName = hasExecutionError
    ? isSelected
      ? 'text-red-300 underline underline-offset-2'
      : 'text-red-400 underline underline-offset-2'
    : step.hasMissingRequiredParams
    ? isSelected
      ? 'text-red-400'
      : isEditingStep
      ? 'text-green-400 underline underline-offset-2'
      : 'text-[#E5B94F]'
    : isSelected
      ? 'text-green-400 underline underline-offset-2'
      : 'text-slate-200';
  const rowClassName = isSelected
    ? 'rounded-md bg-[#131A2A] ring-1 ring-[#5981F3]/50'
    : '';
  const handleStepKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectScriptStep(step);
    if (!hasExpandableContent) editScriptStep(step);
  };

  return (
    <div className={`m-0 flex flex-col p-0 font-mono leading-tight ${rowClassName}`}>
      <div className="grid w-full grid-cols-[calc(1.05em+3px)_minmax(0,1fr)] items-center gap-x-[2px] px-0 py-0 text-left text-sm">
        <button
          type="button"
          onClick={() => toggleScriptStepBreakpoint(step.step)}
          className={`col-start-1 ml-[3px] inline-flex h-[1em] w-[1.05em] shrink-0 items-center justify-center self-center border-0 bg-transparent p-0 leading-none ${
            step.breakpoint ? 'opacity-100' : 'opacity-0'
          }`}
          title={step.breakpoint ? `Remove breakpoint from ${step.method}` : `Add breakpoint to ${step.method}`}
        >
          <span className="block h-[0.62em] w-[0.62em] rounded-full bg-[#F87171]" />
        </button>
        <div className="col-start-2 inline-flex min-w-0 items-center">
          <span className={`mr-1 shrink-0 ${methodClassName}`}>{`${step.step}.`}</span>
          {hasExpandableContent ? (
            <button
              type="button"
              onClick={() => toggleScriptStepExpanded(step.step)}
              className={`shrink-0 ${isExpanded ? 'text-red-400' : 'text-green-400'}`}
              title={isExpanded ? `Collapse ${step.method}` : `Expand ${step.method}`}
            >
              {isExpanded ? '[-]' : '[+]'}
            </button>
          ) : null}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              selectScriptStep(step);
              if (!hasExpandableContent) editScriptStep(step);
            }}
            onDoubleClick={() => editScriptStep(step)}
            onKeyDown={handleStepKeyDown}
            className={`min-w-0 cursor-inherit select-none text-left ${methodClassName}`}
            title={`Select ${step.method}`}
          >
            {step.method}
          </div>
        </div>
      </div>
      {isExpanded && hasExpandableContent ? (
        <div className="mt-1 space-y-1 whitespace-nowrap pl-[28px] text-xs text-slate-200">
          {sender ? <div>{`msg.sender: ${sender};`}</div> : null}
          {params.length > 0
            ? params.map((param, idx) => (
                <div key={`step-${step.step}-param-${idx}`}>
                  {`${param.key}: ${param.value};`}
                </div>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
