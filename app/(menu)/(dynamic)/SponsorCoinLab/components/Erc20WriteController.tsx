// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20WriteController.tsx
import React from 'react';

type ActiveWriteLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressB: boolean;
};

type Props = {
  selectedWriteMethod: string;
  erc20WriteOptions: string[];
  setSelectedWriteMethod: (value: string) => void;
  activeWriteLabels: ActiveWriteLabels;
  writeAddressA: string;
  setWriteAddressA: (value: string) => void;
  writeAddressB: string;
  setWriteAddressB: (value: string) => void;
  writeAmountRaw: string;
  setWriteAmountRaw: (value: string) => void;
  inputStyle: string;
  buttonStyle: string;
  runSelectedWriteMethod: () => void;
};

export default function Erc20WriteController(props: Props) {
  const {
    selectedWriteMethod,
    erc20WriteOptions,
    setSelectedWriteMethod,
    activeWriteLabels,
    writeAddressA,
    setWriteAddressA,
    writeAddressB,
    setWriteAddressB,
    writeAmountRaw,
    setWriteAmountRaw,
    inputStyle,
    buttonStyle,
    runSelectedWriteMethod,
  } = props;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">ERC-20 Write Method</span>
        <select
          className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedWriteMethod}
          onChange={(e) => setSelectedWriteMethod(e.target.value)}
        >
          {erc20WriteOptions.map((name) => (
            <option key={`erc20-write-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">{activeWriteLabels.addressALabel}</span>
        <input
          className={inputStyle}
          value={writeAddressA}
          onChange={(e) => setWriteAddressA(e.target.value)}
          placeholder={activeWriteLabels.addressAPlaceholder}
        />
      </label>
      {activeWriteLabels.requiresAddressB && (
        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">{activeWriteLabels.addressBLabel}</span>
          <input
            className={inputStyle}
            value={writeAddressB}
            onChange={(e) => setWriteAddressB(e.target.value)}
            placeholder={activeWriteLabels.addressBPlaceholder}
          />
        </label>
      )}
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Amount (raw uint256)</span>
        <input
          className={inputStyle}
          value={writeAmountRaw}
          onChange={(e) => setWriteAmountRaw(e.target.value)}
          placeholder={`${activeWriteLabels.title}(amount raw uint256)`}
        />
      </label>
      <button type="button" className={buttonStyle} onClick={runSelectedWriteMethod}>
        Execute {activeWriteLabels.title}
      </button>
    </div>
  );
}
