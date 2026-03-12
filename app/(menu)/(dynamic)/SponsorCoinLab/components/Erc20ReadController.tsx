// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20ReadController.tsx
import React from 'react';
import Image from 'next/image';

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
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  mode: 'metamask' | 'hardhat';
  hardhatAccounts: Array<{ address: string; privateKey: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
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
    invalidFieldIds,
    clearInvalidField,
    writeTraceEnabled,
    toggleWriteTrace,
    mode,
    hardhatAccounts,
    hardhatAccountMetadata,
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
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) ? ' border-red-500 bg-red-950/40 focus:border-red-400' : '';
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<string, boolean>>({});
  const getMetadataForAddress = (address: string) =>
    hardhatAccountMetadata[String(address || '').trim().toLowerCase()];

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
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
        <button type="button" className={`${buttonStyle} justify-self-end`} onClick={toggleWriteTrace}>
          {writeTraceEnabled ? 'Trace On' : 'Trace Off'}
        </button>
      </div>
      {activeReadLabels.requiresAddressA && (
        <div className={`grid grid-cols-1 gap-3${mode === 'hardhat' && openAddressFields.addressA ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressA: !prev.addressA }))}
              className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
              title={`Toggle ${activeReadLabels.addressALabel}`}
            >
              {activeReadLabels.addressALabel}
            </button>
            {mode === 'hardhat' ? (
              <select
                data-field-id="erc20-read-address-a"
                className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-read-address-a')}`}
                value={readAddressA}
                onChange={(e) => {
                  clearInvalidField('erc20-read-address-a');
                  setReadAddressA(e.target.value);
                }}
              >
                <option value="">Select account</option>
                {hardhatAccounts.map((account, idx) => (
                  <option key={`erc20-read-address-a-${idx}-${account.address}`} value={account.address}>
                    {account.address}
                  </option>
                ))}
              </select>
            ) : (
              <input
                data-field-id="erc20-read-address-a"
                className={`${inputStyle}${invalidClass('erc20-read-address-a')}`}
                value={readAddressA}
                onChange={(e) => {
                  clearInvalidField('erc20-read-address-a');
                  setReadAddressA(e.target.value);
                }}
                placeholder={activeReadLabels.addressAPlaceholder}
              />
            )}
          </label>
          {mode === 'hardhat' && openAddressFields.addressA && (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {getMetadataForAddress(readAddressA || '')?.logoURL ? (
                    <Image src={getMetadataForAddress(readAddressA || '')!.logoURL} alt={getMetadataForAddress(readAddressA || '')?.name || activeReadLabels.addressALabel} width={40} height={40} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{getMetadataForAddress(readAddressA || '')?.name || 'Unnamed account'}</div>
                  <div className="truncate text-xs text-slate-400">{getMetadataForAddress(readAddressA || '')?.symbol || 'No symbol'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeReadLabels.requiresAddressB && (
        <div className={`grid grid-cols-1 gap-3${mode === 'hardhat' && openAddressFields.addressB ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressB: !prev.addressB }))}
              className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
              title={`Toggle ${activeReadLabels.addressBLabel}`}
            >
              {activeReadLabels.addressBLabel}
            </button>
            {mode === 'hardhat' ? (
              <select
                data-field-id="erc20-read-address-b"
                className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-read-address-b')}`}
                value={readAddressB}
                onChange={(e) => {
                  clearInvalidField('erc20-read-address-b');
                  setReadAddressB(e.target.value);
                }}
              >
                <option value="">Select account</option>
                {hardhatAccounts.map((account, idx) => (
                  <option key={`erc20-read-address-b-${idx}-${account.address}`} value={account.address}>
                    {account.address}
                  </option>
                ))}
              </select>
            ) : (
              <input
                data-field-id="erc20-read-address-b"
                className={`${inputStyle}${invalidClass('erc20-read-address-b')}`}
                value={readAddressB}
                onChange={(e) => {
                  clearInvalidField('erc20-read-address-b');
                  setReadAddressB(e.target.value);
                }}
                placeholder={activeReadLabels.addressBPlaceholder}
              />
            )}
          </label>
          {mode === 'hardhat' && openAddressFields.addressB && (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {getMetadataForAddress(readAddressB || '')?.logoURL ? (
                    <Image src={getMetadataForAddress(readAddressB || '')!.logoURL} alt={getMetadataForAddress(readAddressB || '')?.name || activeReadLabels.addressBLabel} width={40} height={40} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{getMetadataForAddress(readAddressB || '')?.name || 'Unnamed account'}</div>
                  <div className="truncate text-xs text-slate-400">{getMetadataForAddress(readAddressB || '')?.symbol || 'No symbol'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <button type="button" className={buttonStyle} onClick={runSelectedReadMethod}>
        Execute {activeReadLabels.title}
      </button>
    </div>
  );
}
