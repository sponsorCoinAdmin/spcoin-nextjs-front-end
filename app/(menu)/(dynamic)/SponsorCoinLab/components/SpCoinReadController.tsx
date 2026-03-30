// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinReadController.tsx
import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import { getMethodOptionColor } from './methodOptionColors';
import type { MethodDef } from '../jsonMethods/shared/types';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedSpCoinReadMethod: string;
  setSelectedSpCoinReadMethod: (value: string) => void;
  spCoinWorldReadOptions: string[];
  spCoinSenderReadOptions: string[];
  spCoinAdminReadOptions: string[];
  spCoinCompoundReadOptions: string[];
  spCoinReadMethodDefs: Record<string, MethodDef>;
  activeSpCoinReadDef: MethodDef;
  spReadParams: string[];
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  inputStyle: string;
  canRunSelectedSpCoinReadMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSpCoinReadMethod: () => void;
  addCurrentMethodToScript: () => void;
};

export default function SpCoinReadController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    showOnChainMethods,
    showOffChainMethods,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    spCoinWorldReadOptions,
    spCoinSenderReadOptions,
    spCoinAdminReadOptions,
    spCoinCompoundReadOptions,
    spCoinReadMethodDefs,
    activeSpCoinReadDef,
    spReadParams,
    setSpReadParams,
    inputStyle,
    canRunSelectedSpCoinReadMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
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
    buttonKind === 'add' && isAddToScriptBlockedByNoChanges
      ? `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'cursor-not-allowed bg-red-600 text-white' : 'bg-[#E5B94F] text-black'
        }`
      : isEnabled
      ? actionButtonClassName
      : `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'bg-red-600 text-white' : 'bg-[#E5B94F] text-black hover:bg-[#d7ae45]'
        }`;
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
  const visibleWorldReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinWorldReadOptions : []),
    [showOnChainMethods, spCoinWorldReadOptions],
  );
  const visibleSenderReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinSenderReadOptions : []),
    [showOnChainMethods, spCoinSenderReadOptions],
  );
  const visibleAdminReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinAdminReadOptions : []),
    [showOnChainMethods, spCoinAdminReadOptions],
  );
  const visibleCompoundReadOptions = React.useMemo(
    () => (showOffChainMethods ? spCoinCompoundReadOptions : []),
    [showOffChainMethods, spCoinCompoundReadOptions],
  );
  const visibleReadMethods = React.useMemo(
    () => [
      ...visibleWorldReadOptions,
      ...visibleSenderReadOptions,
      ...visibleAdminReadOptions,
      ...visibleCompoundReadOptions,
    ],
    [visibleAdminReadOptions, visibleCompoundReadOptions, visibleSenderReadOptions, visibleWorldReadOptions],
  );
  React.useEffect(() => {
    if (visibleReadMethods.length === 0) return;
    if (visibleReadMethods.includes(selectedSpCoinReadMethod)) return;
    setSelectedSpCoinReadMethod(visibleReadMethods[0]);
  }, [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod, visibleReadMethods]);
  const hasVisibleReadMethods = visibleReadMethods.length > 0;
  const displayedReadMethod =
    hasVisibleReadMethods && visibleReadMethods.includes(selectedSpCoinReadMethod)
      ? selectedSpCoinReadMethod
      : '__no_methods__';

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <select
          className="w-fit min-w-[18ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={displayedReadMethod}
          onChange={(e) => setSelectedSpCoinReadMethod(e.target.value)}
          disabled={!hasVisibleReadMethods}
        >
          {!hasVisibleReadMethods ? <option value="__no_methods__">No methods available</option> : null}
          <option
            key="sp-read-world-divider"
            value="__world-divider__"
            disabled
            style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
          >
            ---- World Access ----
          </option>
          {visibleWorldReadOptions.map((name) => (
            <option
              key={`sp-read-${name}`}
              value={name}
              style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
            >
              {spCoinReadMethodDefs[name]?.title || name}
            </option>
          ))}
          {visibleSenderReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-sender-divider"
                value="__sender-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Sender Access ----
              </option>
              {visibleSenderReadOptions.map((name) => (
                <option
                  key={`sp-read-sender-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleAdminReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-admin-divider"
                value="__admin-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Admin Access ----
              </option>
              {visibleAdminReadOptions.map((name) => (
                <option
                  key={`sp-read-admin-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleCompoundReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-compound-divider"
                value="__compound-divider__"
                disabled
                style={{
                  backgroundColor: '#E5B94F',
                  color: '#111827',
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                ---- Structured Compound Reads ----
              </option>,
              {visibleCompoundReadOptions.map((name) => (
                <option
                  key={`sp-read-compound-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
        </select>
      </div>
      {!hasVisibleReadMethods ? <div className="text-sm text-slate-400">(no SpCoin read methods match the current filter)</div> : null}
      {hasVisibleReadMethods ? activeSpCoinReadDef.params.map((param, idx) => (
        <div key={`sp-read-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <AccountSelection
              label={param.label}
              title={`Toggle ${param.label}`}
              isOpen={Boolean(openAddressFields[idx])}
              onToggle={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              control={
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
              }
              metadata={getMetadataForAddress(spReadParams[idx] || '')}
            />
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
      )) : null}
      <div className="flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSpCoinReadMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSpCoinReadMethod()}
          disabled={!hasVisibleReadMethods}
          onMouseEnter={() => {
            if (!canRunSelectedSpCoinReadMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSpCoinReadMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSpCoinReadDef.title}`}
        </button>
        <button
          type="button"
          className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
          onClick={() => {
            if (isAddToScriptBlockedByNoChanges) return;
            addCurrentMethodToScript();
          }}
          disabled={!hasVisibleReadMethods}
          onMouseEnter={() => {
            if (!canAddCurrentMethodToScript || isAddToScriptBlockedByNoChanges) setHoveredBlockedAction('add');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
          title={!hasEditorScriptSelected ? 'Create a Script in the Editor Editor' : undefined}
        >
          {isAddToScriptBlockedByNoChanges
            ? hoveredBlockedAction === 'add'
              ? 'No Update Changes'
              : addToScriptButtonLabel
            : !hasEditorScriptSelected && hoveredBlockedAction === 'add'
            ? 'No Editor Script'
            : !canAddCurrentMethodToScript && hoveredBlockedAction === 'add'
            ? 'Missing Parameters'
            : addToScriptButtonLabel}
        </button>
      </div>
    </div>
  );
}
