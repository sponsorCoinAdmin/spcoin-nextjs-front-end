import type { LabScriptParam, LabScriptStep } from '../scriptBuilder/types';

type Props = {
  step: LabScriptStep;
  isExpanded: boolean;
  isSelected: boolean;
  getStepSender: (step: LabScriptStep) => string;
  getStepParamEntries: (step: LabScriptStep) => LabScriptParam[];
  loadScriptStep: (step: LabScriptStep) => void;
  toggleScriptStepExpanded: (stepNumber: number) => void;
  toggleScriptStepBreakpoint: (stepNumber: number) => void;
};

export default function ScriptStepRow({
  step,
  isExpanded,
  isSelected,
  getStepSender,
  getStepParamEntries,
  loadScriptStep,
  toggleScriptStepExpanded,
  toggleScriptStepBreakpoint,
}: Props) {
  const sender = getStepSender(step);
  const params = getStepParamEntries(step);

  return (
    <div className="m-0 flex flex-col p-0 font-mono leading-tight">
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
          <button
            type="button"
            onClick={() => toggleScriptStepExpanded(step.step)}
            className={`shrink-0 ${isExpanded ? 'text-green-400' : 'text-red-400'}`}
            title={isExpanded ? `Collapse ${step.method}` : `Expand ${step.method}`}
          >
            {isExpanded ? '[+]' : '[-]'}
          </button>
          <button
            type="button"
            onClick={() => loadScriptStep(step)}
            className={`min-w-0 text-left ${isSelected ? 'text-green-400 underline underline-offset-2' : 'text-slate-200'}`}
            title={`Load ${step.method}`}
          >
            {step.method}
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div className="mt-1 space-y-1 whitespace-nowrap pl-[28px] text-xs text-slate-200">
          {sender ? <div>{`msg.sender: ${sender};`}</div> : null}
          {params.length > 0 ? (
            params.map((param, idx) => (
              <div key={`step-${step.step}-param-${idx}`}>
                {`${param.key}: ${param.value};`}
              </div>
            ))
          ) : (
            <div>(no params)</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
