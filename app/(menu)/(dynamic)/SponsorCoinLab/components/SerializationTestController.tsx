import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import { getMethodOptionColor } from './methodOptionColors';
import type { MethodDef } from '../jsonMethods/shared/types';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  markEditorAsUserEdited: () => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedSerializationTestMethod: string;
  setSelectedSerializationTestMethod: (value: string) => void;
  serializationTestOptions: string[];
  serializationTestMethodDefs: Record<string, MethodDef>;
  activeSerializationTestDef: MethodDef;
  serializationTestParams: string[];
  setSerializationTestParams: React.Dispatch<React.SetStateAction<string[]>>;
  inputStyle: string;
  canRunSelectedSerializationTestMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSerializationTestMethod: () => void;
  addCurrentMethodToScript: () => void;
  hideMethodSelect?: boolean;
  hideActionButtons?: boolean;
  hideAddToScript?: boolean;
};

export default function SerializationTestController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    markEditorAsUserEdited,
    showOffChainMethods,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    serializationTestOptions,
    serializationTestMethodDefs,
    activeSerializationTestDef,
    serializationTestParams,
    setSerializationTestParams,
    inputStyle,
    canRunSelectedSerializationTestMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSerializationTestMethod,
    addCurrentMethodToScript,
    hideMethodSelect = false,
    hideActionButtons = false,
    hideAddToScript = false,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
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
  const visibleSerializationOptions = React.useMemo(
    () => (showOffChainMethods ? serializationTestOptions : []),
    [serializationTestOptions, showOffChainMethods],
  );
  React.useEffect(() => {
    if (visibleSerializationOptions.length === 0) return;
    if (visibleSerializationOptions.includes(selectedSerializationTestMethod)) return;
    setSelectedSerializationTestMethod(visibleSerializationOptions[0]);
  }, [selectedSerializationTestMethod, setSelectedSerializationTestMethod, visibleSerializationOptions]);
  const hasVisibleSerializationMethods = visibleSerializationOptions.length > 0;
  const displayedSerializationMethod =
    hasVisibleSerializationMethods && visibleSerializationOptions.includes(selectedSerializationTestMethod)
      ? selectedSerializationTestMethod
      : '__no_methods__';

  return (
    <div className="grid grid-cols-1 gap-3">
      {!hideMethodSelect ? <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <select
          className="w-full min-w-0 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={displayedSerializationMethod}
          onChange={(e) => setSelectedSerializationTestMethod(e.target.value)}
          disabled={!hasVisibleSerializationMethods}
        >
          {!hasVisibleSerializationMethods ? <option value="__no_methods__">No methods available</option> : null}
          {visibleSerializationOptions.map((name) => (
            <option
              key={`serialization-test-${name}`}
              value={name}
              style={{ color: getMethodOptionColor(name, serializationTestMethodDefs[name].executable) }}
            >
              {name}
            </option>
          ))}
        </select>
      </div> : null}
      <div id="JSON_METHOD" className="grid grid-cols-1 gap-3 rounded-lg bg-red-900/40 p-3">
        {!hasVisibleSerializationMethods ? <div className="text-sm text-slate-400">(no off-chain serialization methods match the current filter)</div> : null}
        {hasVisibleSerializationMethods ? activeSerializationTestDef.params.map((param, idx) => (
          <div key={`serialization-test-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <AccountSelection
              label={param.label}
              title={`Toggle ${param.label}`}
              isOpen={Boolean(openAddressFields[idx])}
              onToggle={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              control={
                <AccountDropdownInput
                  dataFieldId={`serialization-test-param-${idx}`}
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`serialization-test-param-${idx}`)}`}
                  value={serializationTestParams[idx] || ''}
                  onChange={(value) => {
                    markEditorAsUserEdited();
                    setSerializationTestParams((prev) => {
                      clearInvalidField(`serialization-test-param-${idx}`);
                      const next = [...prev];
                      next[idx] = normalizeAccountValue(value);
                      return next;
                    });
                  }}
                  placeholder="Select account"
                  options={accountOptions}
                />
              }
              metadata={getMetadataForAddress(serializationTestParams[idx] || '')}
            />
          ) : (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                data-field-id={`serialization-test-param-${idx}`}
                className={`${inputStyle}${invalidClass(`serialization-test-param-${idx}`)}`}
                value={serializationTestParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  setSerializationTestParams((prev) => {
                    clearInvalidField(`serialization-test-param-${idx}`);
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  });
                }}
                placeholder={param.placeholder}
              />
            </label>
          )}
          </div>
        )) : null}
      </div>
      {!hideActionButtons ? <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSerializationTestMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSerializationTestMethod()}
          disabled={!hasVisibleSerializationMethods}
          onMouseEnter={() => {
            if (!canRunSelectedSerializationTestMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSerializationTestMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSerializationTestDef.title}`}
        </button>
        {!hideAddToScript ? (
          <button
            type="button"
            className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
            onClick={() => {
              if (isAddToScriptBlockedByNoChanges) return;
              addCurrentMethodToScript();
            }}
            disabled={!hasVisibleSerializationMethods}
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
        ) : null}
      </div> : null}
    </div>
  );
}
