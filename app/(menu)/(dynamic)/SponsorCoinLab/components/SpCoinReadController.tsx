// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinReadController.tsx
import React from 'react';

type ParamDefLike = { label: string; placeholder: string };
type MethodDef = { title: string; params: ParamDefLike[]; executable?: boolean };

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  hideUnexecutables: boolean;
  setHideUnexecutables: (value: boolean) => void;
  selectedSpCoinReadMethod: string;
  setSelectedSpCoinReadMethod: (value: string) => void;
  spCoinReadOptions: string[];
  spCoinReadMethodDefs: Record<string, MethodDef>;
  activeSpCoinReadDef: MethodDef;
  spReadParams: string[];
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  inputStyle: string;
  buttonStyle: string;
  runSelectedSpCoinReadMethod: () => void;
};

export default function SpCoinReadController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    hideUnexecutables,
    setHideUnexecutables,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    spCoinReadOptions,
    spCoinReadMethodDefs,
    activeSpCoinReadDef,
    spReadParams,
    setSpReadParams,
    inputStyle,
    buttonStyle,
    runSelectedSpCoinReadMethod,
  } = props;
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) ? ' border-red-500 bg-red-950/40 focus:border-red-400' : '';

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#8FA8FF]">
        <input type="checkbox" checked={hideUnexecutables} onChange={(e) => setHideUnexecutables(e.target.checked)} />
        <span>Hide unexecutables</span>
      </label>
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">SpCoin Read Method</span>
        <select
          className="w-fit min-w-[18ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedSpCoinReadMethod}
          onChange={(e) => setSelectedSpCoinReadMethod(e.target.value)}
        >
          {spCoinReadOptions.map((name) => (
            <option
              key={`sp-read-${name}`}
              value={name}
              style={{ color: spCoinReadMethodDefs[name].executable === false ? '#ef4444' : undefined }}
            >
              {name}
            </option>
          ))}
        </select>
      </label>
      {activeSpCoinReadDef.params.map((param, idx) => (
        <label key={`sp-read-param-${param.label}-${idx}`} className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
          <input
            data-field-id={`spcoin-read-param-${idx}`}
            className={`${inputStyle}${invalidClass(`spcoin-read-param-${idx}`)}`}
            value={spReadParams[idx] || ''}
            onChange={(e) =>
              setSpReadParams((prev) => {
                clearInvalidField(`spcoin-read-param-${idx}`);
                const next = [...prev];
                next[idx] = e.target.value;
                return next;
              })
            }
            placeholder={param.placeholder}
          />
        </label>
      ))}
      <button type="button" className={buttonStyle} onClick={runSelectedSpCoinReadMethod}>
        Execute {activeSpCoinReadDef.title}
      </button>
    </div>
  );
}
