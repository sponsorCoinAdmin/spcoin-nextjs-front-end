// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinReadController.tsx
import React from 'react';
import Image from 'next/image';
import AccountDropdownInput from './AccountDropdownInput';

type ParamDefLike = { label: string; placeholder: string; type?: string };
type MethodDef = { title: string; params: ParamDefLike[]; executable?: boolean };

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedSpCoinReadMethod: string;
  setSelectedSpCoinReadMethod: (value: string) => void;
  spCoinReadOptions: string[];
  spCoinReadMethodDefs: Record<string, MethodDef>;
  activeSpCoinReadDef: MethodDef;
  spReadParams: string[];
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  inputStyle: string;
  canRunSelectedSpCoinReadMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSpCoinReadMethod: () => void;
  addCurrentMethodToScript: () => void;
};

export default function SpCoinReadController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    writeTraceEnabled,
    toggleWriteTrace,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    spCoinReadOptions,
    spCoinReadMethodDefs,
    activeSpCoinReadDef,
    spReadParams,
    setSpReadParams,
    inputStyle,
    canRunSelectedSpCoinReadMethod,
    canAddCurrentMethodToScript,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSpCoinReadMethod,
    addCurrentMethodToScript,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const activeHoverInvalidFieldIds = hoveredBlockedAction ? missingFieldIds : [];
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) || activeHoverInvalidFieldIds.includes(fieldId)
      ? ' border-red-500 bg-red-950/40 focus:border-red-400'
      : '';
  const actionButtonClassName =
    'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
  const getActionButtonClassName = (isEnabled: boolean, buttonKind: 'execute' | 'add') =>
    isEnabled
      ? actionButtonClassName
      : `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'bg-red-600 text-white' : 'bg-[#E5B94F] text-black opacity-60'
        } cursor-not-allowed`;
  const normalizeAccountValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
  };
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
  const getMetadataForAddress = (address: string) =>
    hardhatAccountMetadata[String(address || '').trim().toLowerCase()];
  const formatAccountOptionLabel = (address: string, index: number) => {
    const metadata = getMetadataForAddress(address);
    const name = String(metadata?.name || '').trim() || 'Unnamed account';
    const symbol = String(metadata?.symbol || '').trim() || 'No symbol';
    return `Account ${index}, ${address}, ${name}(${symbol})`;
  };
  const accountOptions = React.useMemo(
    () =>
      hardhatAccounts.map((account, idx) => ({
        value: normalizeAccountValue(account.address),
        label: formatAccountOptionLabel(account.address, idx),
      })),
    [hardhatAccounts],
  );

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Method</span>
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
        <button type="button" className={`${actionButtonClassName} justify-self-end`} onClick={toggleWriteTrace}>
          {writeTraceEnabled ? 'Trace On' : 'Trace Off'}
        </button>
      </div>
      {activeSpCoinReadDef.params.map((param, idx) => (
        <div key={`sp-read-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <div className={`grid grid-cols-1 gap-3${openAddressFields[idx] ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                  title={`Toggle ${param.label}`}
                >
                  {param.label}
                </button>
                <AccountDropdownInput
                  dataFieldId={`spcoin-read-param-${idx}`}
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`spcoin-read-param-${idx}`)}`}
                  value={spReadParams[idx] || ''}
                  onChange={(value) =>
                    setSpReadParams((prev) => {
                      clearInvalidField(`spcoin-read-param-${idx}`);
                      const next = [...prev];
                      next[idx] = normalizeAccountValue(value);
                      return next;
                    })
                  }
                  placeholder="Select account"
                  options={accountOptions}
                />
              </label>
              {openAddressFields[idx] && (
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                  <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                      {getMetadataForAddress(spReadParams[idx] || '')?.logoURL ? (
                        <Image src={getMetadataForAddress(spReadParams[idx] || '')!.logoURL} alt={getMetadataForAddress(spReadParams[idx] || '')?.name || param.label} width={40} height={40} className="h-full w-full object-contain" unoptimized />
                      ) : (
                        <span className="text-[10px] text-slate-400">No logo</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">{getMetadataForAddress(spReadParams[idx] || '')?.name || 'Unnamed account'}</div>
                      <div className="truncate text-xs text-slate-400">{getMetadataForAddress(spReadParams[idx] || '')?.symbol || 'No symbol'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
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
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSpCoinReadMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => {
            if (!canRunSelectedSpCoinReadMethod) return;
            runSelectedSpCoinReadMethod();
          }}
          onMouseEnter={() => {
            if (!canRunSelectedSpCoinReadMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
          aria-disabled={!canRunSelectedSpCoinReadMethod}
        >
          {!canRunSelectedSpCoinReadMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Required Parameters'
            : `Execute ${activeSpCoinReadDef.title}`}
        </button>
        <button
          type="button"
          className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
          onClick={() => {
            if (!canAddCurrentMethodToScript) return;
            addCurrentMethodToScript();
          }}
          onMouseEnter={() => {
            if (!canAddCurrentMethodToScript) setHoveredBlockedAction('add');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
          aria-disabled={!canAddCurrentMethodToScript}
        >
          {!canAddCurrentMethodToScript && hoveredBlockedAction === 'add'
            ? 'Missing Required Parameters'
            : addToScriptButtonLabel}
        </button>
      </div>
    </div>
  );
}
