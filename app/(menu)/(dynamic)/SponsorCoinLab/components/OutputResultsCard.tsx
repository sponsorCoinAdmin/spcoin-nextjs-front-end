import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';
import LabCardHeader from './LabCardHeader';
import JsonInspector from '@/components/shared/JsonInspector';
import {
  defaultMissingImage,
  getAccountLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';
import { useJsonInspector } from '@/lib/hooks/useJsonInspector';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type FormattedPanelView = 'script' | 'output';

type Props = {
  className: string;
  style?: React.CSSProperties;
  isExpanded: boolean;
  onToggleExpand: () => void;
  inputStyle: string;
  controls: {
    outputPanelMode: OutputPanelMode;
    setOutputPanelMode: (value: OutputPanelMode) => void;
    refreshActiveOutput: () => void;
    buttonStyle: string;
    copyTextToClipboard: (label: string, value: string) => Promise<void>;
    setLogs: (value: string[]) => void;
    setStatus: (value: string) => void;
    setTreeOutputDisplay: (value: string) => void;
    setFormattedOutputDisplay: (value: string) => void;
    formattedPanelView: FormattedPanelView;
    setFormattedPanelView: (value: FormattedPanelView) => void;
    formattedJsonViewEnabled: boolean;
    setFormattedJsonViewEnabled: (value: boolean) => void;
    showTreeAccountDetails: boolean;
    setShowTreeAccountDetails: (value: boolean) => void;
    showAllTreeRecords: boolean;
    setShowAllTreeRecords: (value: boolean) => void;
  };
  content: {
    logs: string[];
    treeOutputDisplay: string;
    status: string;
    formattedOutputDisplay: string;
    scriptDisplay: string;
    selectedScriptStepNumber: number | null;
    selectedScriptStepHasMissingRequiredParams: boolean;
    selectedScriptStepHasExecutionError: boolean;
    highlightedFormattedOutputLines:
      | Array<{
          line: string;
          active: boolean;
        }>
      | null;
    hiddenScrollbarClass: string;
  };
  treeActions: {
    runHeaderRead: () => Promise<void>;
    runAccountListRead: () => Promise<void>;
    runTreeAccountsRead: () => Promise<void>;
    runTreeDump: (accountOverride?: string) => Promise<void>;
    treeAccountOptions: string[];
    selectedTreeAccount: string;
    setSelectedTreeAccount: (value: string) => void;
    treeAccountRefreshToken: number;
    requestRefreshSelectedTreeAccount: () => void;
    openAccountFromAddress: (account: string, pathHint?: string) => Promise<void>;
  };
};

export default function OutputResultsCard({
  className,
  style,
  isExpanded,
  onToggleExpand,
  inputStyle,
  controls,
  content,
  treeActions,
}: Props) {
  const hiddenRuleOptions = [
    ['zeroValues', '0 values'],
    ['emptyValues', 'empty / null'],
    ['falseValues', 'false values'],
    ['todoValues', 'todo markers'],
    ['emptyCollections', 'empty arrays / objects'],
    ['creationDates', 'creationTime / creationDate'],
  ] as const;
  const [hiddenInspectorRules, setHiddenInspectorRules] = useState({
    zeroValues: true,
    emptyValues: true,
    falseValues: true,
    todoValues: true,
    emptyCollections: true,
    creationDates: true,
  });
  const [isShowAllMenuOpen, setIsShowAllMenuOpen] = useState(false);
  const showAllMenuRef = useRef<HTMLDivElement | null>(null);
  const actionButtonClassName =
    'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
  const refreshIconButtonClassName =
    'inline-flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border-0 bg-[#243056] text-[#5981F3] outline-none ring-0 transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0';
  const [selectedTreeAccountMetadata, setSelectedTreeAccountMetadata] = useState<{
    name?: string;
    symbol?: string;
    logoURL: string;
  }>({
    logoURL: defaultMissingImage,
  });
  const treeAccountMetadataCacheRef = useRef<
    Map<
      string,
      {
        name?: string;
        symbol?: string;
        logoURL: string;
      }
    >
  >(new Map());
  const lastMetadataRefreshTokenRef = useRef(treeActions.treeAccountRefreshToken);
  const currentFormattedDisplay =
    controls.formattedPanelView === 'script' ? content.scriptDisplay : content.formattedOutputDisplay;
  const inspectorNamespace =
    controls.outputPanelMode === 'tree'
      ? 'sponsorCoinLab.tree'
      : `sponsorCoinLab.formatted.${controls.formattedPanelView}`;
  const { collapsedKeys, updateCollapsedKeys } = useJsonInspector(inspectorNamespace);
  const parseCollapsibleBlocks = useMemo(
    () => (rawValue: string) => {
      const trimmed = String(rawValue || '').trim();
      if (
        !trimmed ||
        trimmed === '(no output yet)' ||
        trimmed === '(no script yet)' ||
        trimmed === '(no tree yet)'
      ) {
        return null;
      }
      try {
        return [JSON.parse(trimmed) as unknown];
      } catch {
        const blocks = trimmed
          .split(/\n\s*\n/)
          .map((block) => block.trim())
          .filter(Boolean);
        if (blocks.length <= 1) return null;
        try {
          return blocks.map((block) => JSON.parse(block) as unknown);
        } catch {
          return null;
        }
      }
    },
    [],
  );
  const collapsibleFormattedBlocks = useMemo(() => {
    if (controls.formattedJsonViewEnabled) return null;
    return parseCollapsibleBlocks(currentFormattedDisplay);
  }, [controls.formattedJsonViewEnabled, currentFormattedDisplay, parseCollapsibleBlocks]);
  const collapsibleTreeBlocks = useMemo(() => {
    if (controls.formattedJsonViewEnabled || controls.outputPanelMode !== 'tree') return null;
    return parseCollapsibleBlocks(content.treeOutputDisplay);
  }, [content.treeOutputDisplay, controls.formattedJsonViewEnabled, controls.outputPanelMode, parseCollapsibleBlocks]);
  const activeInspectorRootLabel = controls.outputPanelMode === 'tree' ? 'Tree' : controls.formattedPanelView === 'script' ? 'Script' : 'Step';
  const highlightedInspectorPathPrefixes = useMemo(() => {
    if (controls.outputPanelMode !== 'formatted' || controls.formattedPanelView !== 'script') return [];
    if (content.selectedScriptStepNumber === null || content.selectedScriptStepNumber <= 0) return [];
    return [`script-0.steps.${content.selectedScriptStepNumber - 1}`];
  }, [content.selectedScriptStepNumber, controls.formattedPanelView, controls.outputPanelMode]);
  const inspectorHighlightColorClass =
    content.selectedScriptStepHasMissingRequiredParams || content.selectedScriptStepHasExecutionError
      ? 'text-red-400'
      : 'text-green-400';

  useEffect(() => {
    const account = String(treeActions.selectedTreeAccount || '').trim();
    const folder = normalizeAddressForAssets(account);
    if (!folder) {
      setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
      return;
    }

    let cancelled = false;
    const logoURL = getAccountLogoURL(account);
    const shouldBypassCache = lastMetadataRefreshTokenRef.current !== treeActions.treeAccountRefreshToken;
    lastMetadataRefreshTokenRef.current = treeActions.treeAccountRefreshToken;
    if (!shouldBypassCache) {
      const cached = treeAccountMetadataCacheRef.current.get(folder);
      if (cached) {
        setSelectedTreeAccountMetadata(cached);
        return;
      }
    }

    const loadAccountMetadata = async () => {
      try {
        const response = await fetch(`/assets/accounts/${folder}/account.json`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (!cancelled) setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
          return;
        }
        const payload = (await response.json()) as {
          name?: string;
          symbol?: string;
          logoURL?: string;
        };
        if (cancelled) return;
        const nextMetadata = {
          name: String(payload?.name || '').trim() || undefined,
          symbol: String(payload?.symbol || '').trim() || undefined,
          logoURL,
        };
        treeAccountMetadataCacheRef.current.set(folder, nextMetadata);
        setSelectedTreeAccountMetadata(nextMetadata);
      } catch {
        if (!cancelled) setSelectedTreeAccountMetadata({ logoURL: defaultMissingImage });
      }
    };

    void loadAccountMetadata();
    return () => {
      cancelled = true;
    };
  }, [treeActions.selectedTreeAccount, treeActions.treeAccountRefreshToken]);

  useEffect(() => {
    if (!isShowAllMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (showAllMenuRef.current?.contains(event.target as Node)) return;
      setIsShowAllMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isShowAllMenuOpen]);

  const allShownRulesSelected = hiddenRuleOptions.every(
    ([key]) => !hiddenInspectorRules[key],
  );

  return (
    <article className={className} style={style}>
      <LabCardHeader
        title="Console Displey"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        secondaryRow={
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              {[
                ['execution', 'Execution'],
                ['formatted', 'Formatted'],
                ['raw_status', 'Raw Status'],
                ['tree', 'Tree'],
              ].map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name="output-panel-mode"
                    value={value}
                    checked={controls.outputPanelMode === value}
                    onChange={(e) => controls.setOutputPanelMode(e.target.value as OutputPanelMode)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="ml-auto flex items-center justify-end gap-3">
              <button
                type="button"
                className={refreshIconButtonClassName}
                onClick={() => controls.refreshActiveOutput()}
                title="Refresh active command"
                aria-label="Refresh active command"
              >
                <RotateCcw className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className={actionButtonClassName}
                title="Copy To Clipboard"
                onClick={() =>
                  void controls.copyTextToClipboard(
                    controls.outputPanelMode === 'execution'
                      ? 'Execution Log'
                      : controls.outputPanelMode === 'tree'
                        ? 'Tree'
                        : controls.outputPanelMode === 'raw_status'
                          ? 'Raw Status'
                          : controls.formattedPanelView === 'script'
                            ? 'Current Script'
                            : 'Formatted Output Display',
                    controls.outputPanelMode === 'execution'
                      ? content.logs.join('\n')
                      : controls.outputPanelMode === 'tree'
                        ? content.treeOutputDisplay
                        : controls.outputPanelMode === 'raw_status'
                          ? content.status
                          : controls.formattedPanelView === 'script'
                            ? content.scriptDisplay
                            : content.formattedOutputDisplay,
                  )
                }
              >
                Copy
              </button>
              <button
                type="button"
                className={actionButtonClassName}
                onClick={() => {
                  if (controls.outputPanelMode === 'execution') {
                    controls.setLogs([]);
                    return;
                  }
                  if (controls.outputPanelMode === 'tree') {
                    controls.setTreeOutputDisplay('(no tree yet)');
                    return;
                  }
                  if (controls.outputPanelMode === 'raw_status') {
                    controls.setStatus('(no status yet)');
                    return;
                  }
                  if (controls.outputPanelMode === 'formatted') {
                    if (controls.formattedPanelView === 'script') {
                      controls.setFormattedOutputDisplay('(no script yet)');
                      return;
                    }
                    controls.setFormattedOutputDisplay('(no output yet)');
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>
        }
      />
      <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
        {controls.outputPanelMode === 'tree' ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runHeaderRead()}>
                spCoin Meta Data
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runAccountListRead()}>
                spCoin Account List
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runTreeAccountsRead()}>
                Show Tree Accounts
              </button>
            </div>
            <div
              className={`mt-4 grid grid-cols-1 gap-3${
                controls.showTreeAccountDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
              }`}
            >
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => controls.setShowTreeAccountDetails(!controls.showTreeAccountDetails)}
                  className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                  title="Toggle active account details"
                >
                  Active Account
                </button>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <select
                    className={inputStyle}
                    value={treeActions.selectedTreeAccount}
                    onChange={(e) => {
                      const nextAccount = e.target.value;
                      treeActions.setSelectedTreeAccount(nextAccount);
                      void treeActions.runTreeDump(nextAccount);
                    }}
                  >
                    {treeActions.treeAccountOptions.length === 0 ? (
                      <option value="">No accounts available</option>
                    ) : null}
                    {treeActions.treeAccountOptions.map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#334155] bg-[#1E2340] text-[#8FA8FF] transition-colors hover:bg-[#2B335A] hover:text-white"
                    onClick={() => treeActions.requestRefreshSelectedTreeAccount()}
                    title="Refresh active account data"
                    aria-label="Refresh active account data"
                  >
                    <RotateCcw className="h-5 w-5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
              {controls.showTreeAccountDetails ? (
                <>
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                    <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                        {selectedTreeAccountMetadata.logoURL ? (
                          <Image
                            src={selectedTreeAccountMetadata.logoURL}
                            alt={selectedTreeAccountMetadata.name || 'Selected account'}
                            width={40}
                            height={40}
                            className="h-full w-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">No logo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {selectedTreeAccountMetadata.name || 'Unnamed account'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {selectedTreeAccountMetadata.symbol || 'No symbol'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-[#334155] bg-[#0B1220]">
          {controls.outputPanelMode === 'formatted' || controls.outputPanelMode === 'tree' ? (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-3 rounded-md bg-[#0B1220]/90 px-2 py-1 text-xs text-slate-200">
              {!controls.formattedJsonViewEnabled ? (
                <div ref={showAllMenuRef} className="relative flex items-center gap-1">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors ${
                      controls.showAllTreeRecords ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                    onClick={() => controls.setShowAllTreeRecords(!controls.showAllTreeRecords)}
                    aria-pressed={controls.showAllTreeRecords}
                  >
                    <span>Show</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] text-slate-400 transition-colors hover:text-white"
                    onClick={() => setIsShowAllMenuOpen((prev) => !prev)}
                    aria-label="Toggle Show All filters"
                    aria-expanded={isShowAllMenuOpen}
                  >
                    v
                  </button>
                  {isShowAllMenuOpen ? (
                    <div className="absolute left-0 top-6 z-20 w-56 rounded-md border border-[#334155] bg-[#0B1220] p-2 text-[10px] leading-4 text-slate-300 shadow-lg">
                      <div className="mb-1 font-semibold text-[#8FA8FF]">Show Field</div>
                      <label className="flex items-center gap-2 py-0.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                          checked={allShownRulesSelected}
                          onChange={(event) =>
                            setHiddenInspectorRules({
                              zeroValues: !event.target.checked,
                              emptyValues: !event.target.checked,
                              falseValues: !event.target.checked,
                              todoValues: !event.target.checked,
                              emptyCollections: !event.target.checked,
                              creationDates: !event.target.checked,
                            })
                          }
                        />
                        <span>{allShownRulesSelected ? 'None' : 'All'}</span>
                      </label>
                      {hiddenRuleOptions.map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 py-0.5">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                            checked={!hiddenInspectorRules[key as keyof typeof hiddenInspectorRules]}
                            onChange={(event) =>
                              setHiddenInspectorRules((prev) => ({
                                ...prev,
                                [key]: !event.target.checked,
                              }))
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border border-[#334155] bg-[#0E111B] accent-green-500"
                  checked={controls.formattedJsonViewEnabled}
                  onChange={(e) => controls.setFormattedJsonViewEnabled(e.target.checked)}
                />
                <span>Json</span>
              </label>
              {controls.outputPanelMode === 'formatted'
                ? ([
                    ['script', 'Script'],
                    ['output', 'Output'],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name="formatted-panel-view"
                        value={value}
                        checked={controls.formattedPanelView === value}
                        onChange={(e) => controls.setFormattedPanelView(e.target.value as FormattedPanelView)}
                      />
                      <span>{label}</span>
                    </label>
                  ))
                : null}
            </div>
          ) : null}
          {controls.outputPanelMode === 'formatted' &&
          !controls.formattedJsonViewEnabled &&
          collapsibleFormattedBlocks ? (
            <div className={`h-full min-h-0 overflow-auto p-3 pr-36 text-xs text-slate-200 ${content.hiddenScrollbarClass}`}>
              <div className="space-y-3">
                {collapsibleFormattedBlocks.map((block, index) => (
                  <JsonInspector
                    key={`${activeInspectorRootLabel}-${index}`}
                    data={
                      block && typeof block === 'object'
                        ? block
                        : {
                            value: block,
                          }
                    }
                    collapsedKeys={collapsedKeys}
                    updateCollapsedKeys={updateCollapsedKeys}
                    path={`${activeInspectorRootLabel.toLowerCase()}-${index}`}
                    highlightPathPrefixes={highlightedInspectorPathPrefixes}
                    highlightColorClass={inspectorHighlightColorClass}
                    showAll={controls.showAllTreeRecords}
                    hiddenRules={hiddenInspectorRules}
                    label={
                      collapsibleFormattedBlocks.length === 1
                        ? activeInspectorRootLabel
                        : `${activeInspectorRootLabel} ${index + 1}`
                    }
                    rootLabel={
                      collapsibleFormattedBlocks.length === 1
                        ? activeInspectorRootLabel
                        : `${activeInspectorRootLabel} ${index + 1}`
                    }
                    onLeafValueClick={(value, path) => void treeActions.openAccountFromAddress(value, path)}
                  />
                ))}
              </div>
            </div>
          ) : controls.outputPanelMode === 'tree' &&
            !controls.formattedJsonViewEnabled &&
            collapsibleTreeBlocks ? (
            <div className={`h-full min-h-0 overflow-auto p-3 pr-36 text-xs text-slate-200 ${content.hiddenScrollbarClass}`}>
              <div className="space-y-3">
                {collapsibleTreeBlocks.map((block, index) => (
                  <JsonInspector
                    key={`tree-${index}`}
                    data={
                      block && typeof block === 'object'
                        ? block
                        : {
                            value: block,
                          }
                    }
                    collapsedKeys={collapsedKeys}
                    updateCollapsedKeys={updateCollapsedKeys}
                    path={`tree-${index}`}
                    highlightPathPrefixes={[]}
                    label={collapsibleTreeBlocks.length === 1 ? 'Tree' : `Tree ${index + 1}`}
                    rootLabel={collapsibleTreeBlocks.length === 1 ? 'Tree' : `Tree ${index + 1}`}
                    showAll={controls.showAllTreeRecords}
                    hiddenRules={hiddenInspectorRules}
                    onLeafValueClick={(value, path) => void treeActions.openAccountFromAddress(value, path)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <pre
              className={`h-full min-h-0 overflow-auto p-3 text-xs text-slate-200 ${controls.outputPanelMode === 'formatted' || controls.outputPanelMode === 'tree' ? 'pr-36' : ''} ${content.hiddenScrollbarClass}`}
            >
              {controls.outputPanelMode === 'formatted' &&
              content.highlightedFormattedOutputLines
                ? content.highlightedFormattedOutputLines.map(({ line, active }, idx) => (
                    <span
                      key={`formatted-line-${idx}`}
                      className={
                        active
                          ? content.selectedScriptStepHasMissingRequiredParams || content.selectedScriptStepHasExecutionError
                            ? 'text-red-400'
                            : 'text-green-400'
                          : undefined
                      }
                    >
                      {line}
                      {'\n'}
                    </span>
                  ))
                : controls.outputPanelMode === 'execution'
                  ? content.logs.join('\n')
                  : controls.outputPanelMode === 'tree'
                    ? content.treeOutputDisplay
                    : controls.outputPanelMode === 'raw_status'
                      ? content.status
                      : currentFormattedDisplay}
            </pre>
          )}
        </div>
      </div>
    </article>
  );
}
