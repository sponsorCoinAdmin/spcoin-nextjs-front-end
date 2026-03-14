import React from 'react';
import LabCardHeader from './LabCardHeader';

type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
type FormattedPanelView = 'script' | 'output';

type Props = {
  className: string;
  style?: React.CSSProperties;
  isExpanded: boolean;
  onToggleExpand: () => void;
  controls: {
    outputPanelMode: OutputPanelMode;
    setOutputPanelMode: (value: OutputPanelMode) => void;
    buttonStyle: string;
    copyTextToClipboard: (label: string, value: string) => Promise<void>;
    setLogs: (value: string[]) => void;
    setTreeOutputDisplay: (value: string) => void;
    setFormattedOutputDisplay: (value: string) => void;
    formattedPanelView: FormattedPanelView;
    setFormattedPanelView: (value: FormattedPanelView) => void;
  };
  content: {
    logs: string[];
    treeOutputDisplay: string;
    status: string;
    formattedOutputDisplay: string;
    scriptDisplay: string;
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
    runTreeDump: () => Promise<void>;
  };
};

export default function OutputResultsCard({
  className,
  style,
  isExpanded,
  onToggleExpand,
  controls,
  content,
  treeActions,
}: Props) {
  return (
    <article className={className} style={style}>
      <LabCardHeader
        title="Test Output Results"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        secondaryRow={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              {[
                ['execution', 'Execution'],
                ['formatted', 'Formatted'],
                ['tree', 'Tree'],
                ['raw_status', 'Raw Status'],
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
            <div className="flex flex-wrap justify-start gap-3 sm:justify-end">
              <button
                type="button"
                className={controls.buttonStyle}
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
                Copy to Clipboard
              </button>
              <button
                type="button"
                className={controls.buttonStyle}
                onClick={() => {
                  if (controls.outputPanelMode === 'execution') {
                    controls.setLogs([]);
                    return;
                  }
                  if (controls.outputPanelMode === 'tree') {
                    controls.setTreeOutputDisplay('(no tree yet)');
                    return;
                  }
                  if (controls.outputPanelMode === 'formatted') {
                    if (controls.formattedPanelView === 'script') return;
                    controls.setFormattedOutputDisplay('(no output yet)');
                  }
                }}
              >
                {controls.outputPanelMode === 'execution'
                  ? 'Clear Log'
                  : controls.outputPanelMode === 'formatted'
                    ? controls.formattedPanelView === 'script'
                      ? 'Copy Only'
                      : 'Clear'
                    : controls.outputPanelMode === 'tree'
                    ? 'Clear'
                    : 'Copy Only'}
              </button>
            </div>
          </div>
        }
      />
      <div className="mt-4 min-h-0 flex flex-1 flex-col overflow-hidden">
        {controls.outputPanelMode === 'tree' ? (
          <>
            <p className="text-sm text-slate-200">
              Read methods are no-fee calls. Tree dump uses the first account from `getAccountList`.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runHeaderRead()}>
                Run Header Read
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runAccountListRead()}>
                Run Account List Read
              </button>
              <button type="button" className={controls.buttonStyle} onClick={() => void treeActions.runTreeDump()}>
                Dump First Account Tree
              </button>
            </div>
          </>
        ) : null}
        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-[#334155] bg-[#0B1220]">
          {controls.outputPanelMode === 'formatted' ? (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-3 rounded-md bg-[#0B1220]/90 px-2 py-1 text-xs text-slate-200">
              {([
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
              ))}
            </div>
          ) : null}
          <pre
            className={`h-full min-h-0 overflow-auto p-3 text-xs text-slate-200 ${controls.outputPanelMode === 'formatted' ? 'pr-36' : ''} ${content.hiddenScrollbarClass}`}
          >
            {controls.outputPanelMode === 'formatted' &&
            controls.formattedPanelView === 'script' &&
            content.highlightedFormattedOutputLines
              ? content.highlightedFormattedOutputLines.map(({ line, active }, idx) => (
                  <span key={`formatted-line-${idx}`} className={active ? 'text-green-400' : undefined}>
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
                    : controls.formattedPanelView === 'script'
                      ? content.scriptDisplay
                      : content.formattedOutputDisplay}
          </pre>
        </div>
      </div>
    </article>
  );
}
