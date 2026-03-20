import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';

type ParamDefLike = { label: string; placeholder: string; type?: string };
type MethodDef = { title: string; params: ParamDefLike[]; executable?: boolean };

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
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
};

export default function SerializationTestController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
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

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Method</span>
        <select
          className="w-fit min-w-[28ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedSerializationTestMethod}
          onChange={(e) => setSelectedSerializationTestMethod(e.target.value)}
        >
          {serializationTestOptions.map((name) => (
            <option
              key={`serialization-test-${name}`}
              value={name}
              style={{ color: serializationTestMethodDefs[name].executable === false ? '#ef4444' : undefined }}
            >
              {name}
            </option>
          ))}
        </select>
      </div>
      {activeSerializationTestDef.params.map((param, idx) => (
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
                  onChange={(value) =>
                    setSerializationTestParams((prev) => {
                      clearInvalidField(`serialization-test-param-${idx}`);
                      const next = [...prev];
                      next[idx] = normalizeAccountValue(value);
                      return next;
                    })
                  }
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
                onChange={(e) =>
                  setSerializationTestParams((prev) => {
                    clearInvalidField(`serialization-test-param-${idx}`);
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
          className={`${getActionButtonClassName(canRunSelectedSerializationTestMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSerializationTestMethod()}
          onMouseEnter={() => {
            if (!canRunSelectedSerializationTestMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSerializationTestMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSerializationTestDef.title}`}
        </button>
        <button
          type="button"
          className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
          onClick={() => {
            if (isAddToScriptBlockedByNoChanges) return;
            addCurrentMethodToScript();
          }}
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
