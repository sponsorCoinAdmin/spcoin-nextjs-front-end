// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20ReadController.tsx
import React from 'react';

type ActiveReadLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressA: boolean;
  requiresAddressB: boolean;
};

type Props = {
  selectedReadMethod: string;
  erc20ReadOptions: string[];
  setSelectedReadMethod: (value: string) => void;
  activeReadLabels: ActiveReadLabels;
  readAddressA: string;
  setReadAddressA: (value: string) => void;
  readAddressB: string;
  setReadAddressB: (value: string) => void;
  inputStyle: string;
  buttonStyle: string;
  runSelectedReadMethod: () => void;
};

export default function Erc20ReadController(props: Props) {
  const {
    selectedReadMethod,
    erc20ReadOptions,
    setSelectedReadMethod,
    activeReadLabels,
    readAddressA,
    setReadAddressA,
    readAddressB,
    setReadAddressB,
    inputStyle,
    buttonStyle,
    runSelectedReadMethod,
  } = props;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">ERC-20 Read Method</span>
        <select
          className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedReadMethod}
          onChange={(e) => setSelectedReadMethod(e.target.value)}
        >
          {erc20ReadOptions.map((name) => (
            <option key={`erc20-read-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {activeReadLabels.requiresAddressA && (
        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">{activeReadLabels.addressALabel}</span>
          <input
            className={inputStyle}
            value={readAddressA}
            onChange={(e) => setReadAddressA(e.target.value)}
            placeholder={activeReadLabels.addressAPlaceholder}
          />
        </label>
      )}
      {activeReadLabels.requiresAddressB && (
        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">{activeReadLabels.addressBLabel}</span>
          <input
            className={inputStyle}
            value={readAddressB}
            onChange={(e) => setReadAddressB(e.target.value)}
            placeholder={activeReadLabels.addressBPlaceholder}
          />
        </label>
      )}
      <button type="button" className={buttonStyle} onClick={runSelectedReadMethod}>
        Execute {activeReadLabels.title}
      </button>
    </div>
  );
}
