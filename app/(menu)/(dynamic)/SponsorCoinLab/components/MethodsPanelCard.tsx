import React, { type ComponentProps, type MutableRefObject } from 'react';
import type { MethodPanelMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';
import ScriptBuilderCard from './ScriptBuilderCard';
import Erc20ReadController from './Erc20ReadController';
import Erc20WriteController from './Erc20WriteController';
import SpCoinReadController from './SpCoinReadController';
import SpCoinWriteController from './SpCoinWriteController';
import SerializationTestController from './SerializationTestController';

type MethodPanelTab = MethodPanelMode | 'todos';

type Props = {
  articleClassName: string;
  methodsCardRef: MutableRefObject<HTMLElement | null>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  methodPanelTitle: string;
  methodPanelMode: MethodPanelMode;
  activeMethodPanelTab: MethodPanelTab;
  selectMethodPanelTab: (value: MethodPanelTab) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  showOnChainMethods: boolean;
  setShowOnChainMethods: (value: boolean) => void;
  showOffChainMethods: boolean;
  setShowOffChainMethods: (value: boolean) => void;
  javaScriptEditorProps: {
    hiddenScrollbarClass: string;
    selectedScriptName: string;
    selectedFilePath: string;
    javaScriptFileContent: string;
    isJavaScriptFileLoading: boolean;
    canRunSelectedJavaScriptScript: boolean;
    runSelectedJavaScriptScript: () => void;
    canAddSelectedJavaScriptScriptToScript: boolean;
    addSelectedJavaScriptScriptToScript: () => void;
  };
  scriptBuilderProps: ComponentProps<typeof ScriptBuilderCard>;
  erc20ReadProps: ComponentProps<typeof Erc20ReadController>;
  erc20WriteProps: ComponentProps<typeof Erc20WriteController>;
  spCoinReadProps: ComponentProps<typeof SpCoinReadController>;
  spCoinWriteProps: ComponentProps<typeof SpCoinWriteController>;
  serializationTestProps: ComponentProps<typeof SerializationTestController>;
};

export default function MethodsPanelCard({
  articleClassName,
  methodsCardRef,
  isExpanded,
  onToggleExpand,
  methodPanelTitle,
  methodPanelMode,
  activeMethodPanelTab,
  selectMethodPanelTab,
  writeTraceEnabled,
  toggleWriteTrace,
  showOnChainMethods,
  setShowOnChainMethods,
  showOffChainMethods,
  setShowOffChainMethods,
  javaScriptEditorProps,
  scriptBuilderProps,
  erc20ReadProps,
  erc20WriteProps,
  spCoinReadProps,
  spCoinWriteProps,
  serializationTestProps,
}: Props) {
  const methodPanelGroupName = React.useId();
  const isJavaScriptScriptMode = scriptBuilderProps.scriptEditorKind === 'javascript';

  return (
    <article ref={methodsCardRef} className={articleClassName}>
      <LabCardHeader title="Script Editor" isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      <div className="grid grid-cols-1 gap-4">
        <ScriptBuilderCard {...scriptBuilderProps} />

        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <h3 className="text-center text-lg font-semibold text-[#5981F3]">{methodPanelTitle}</h3>
          {isJavaScriptScriptMode ? (
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">JavaScript</span>
                <select
                  className="w-fit min-w-[28ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                  value={scriptBuilderProps.selectedJavaScriptScriptId}
                  onChange={(event) => scriptBuilderProps.setSelectedJavaScriptScriptId(event.target.value)}
                >
                  {scriptBuilderProps.visibleJavaScriptScripts.length === 0 ? (
                    <option value="">No JavaScript Scripts</option>
                  ) : null}
                  {scriptBuilderProps.visibleJavaScriptScripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className={`min-h-[20rem] w-full overflow-auto rounded-lg border border-[#31416F] bg-[#0E111B] px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-[#5981F3] ${javaScriptEditorProps.hiddenScrollbarClass}`}
                value={javaScriptEditorProps.javaScriptFileContent}
                readOnly
                placeholder={
                  javaScriptEditorProps.selectedFilePath
                    ? javaScriptEditorProps.isJavaScriptFileLoading
                      ? 'Loading JavaScript file...'
                      : 'No file contents loaded.'
                    : 'Select a JavaScript script to view it here.'
                }
                spellCheck={false}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`h-[36px] min-w-[50%] shrink-0 rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors ${
                    javaScriptEditorProps.canRunSelectedJavaScriptScript
                      ? 'bg-[#E5B94F] hover:bg-green-500'
                      : 'bg-[#E5B94F] hover:bg-[#d7ae45]'
                  }`}
                  onClick={javaScriptEditorProps.runSelectedJavaScriptScript}
                >
                  {`Run ${javaScriptEditorProps.selectedScriptName || 'JavaScript'}`}
                </button>
                <button
                  type="button"
                  className={`h-[36px] min-w-0 flex-1 rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors ${
                    javaScriptEditorProps.canAddSelectedJavaScriptScriptToScript
                      ? 'bg-[#E5B94F] hover:bg-green-500'
                      : 'bg-[#E5B94F] hover:bg-[#d7ae45]'
                  }`}
                  onClick={javaScriptEditorProps.addSelectedJavaScriptScriptToScript}
                >
                  Add To Script
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-200">
                  {[
                    ['ecr20_read', 'ECR20 Read'],
                    ['erc20_write', 'ERC20 Write'],
                    ['spcoin_rread', 'SpCoin Read'],
                    ['spcoin_write', 'SpCoin Write'],
                    ['todos', 'ToDos'],
                  ].map(([value, label]) => (
                    <label key={value} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        name={methodPanelGroupName}
                        value={value}
                        checked={activeMethodPanelTab === value}
                        onMouseDown={(e) => {
                          if (activeMethodPanelTab === value) e.preventDefault();
                        }}
                        onChange={(e) => {
                          if (activeMethodPanelTab === value) return;
                          selectMethodPanelTab(e.target.value as MethodPanelTab);
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-3 text-xs text-slate-200">
                  <label className="inline-flex items-center justify-end gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#E5B94F]"
                      checked={writeTraceEnabled}
                      onChange={toggleWriteTrace}
                    />
                    <span>Trace</span>
                  </label>
                  <label className="inline-flex items-center justify-end gap-2 text-right">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-green-500"
                      checked={showOnChainMethods}
                      onChange={(event) => setShowOnChainMethods(event.target.checked)}
                    />
                    <span className="text-green-400">On-Chain</span>
                  </label>
                  <label className="inline-flex items-center justify-end gap-2 text-right">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#5981F3]"
                      checked={showOffChainMethods}
                      onChange={(event) => setShowOffChainMethods(event.target.checked)}
                    />
                    <span className="text-[#8FA8FF]">Off-Chain</span>
                  </label>
                </div>
              </div>

              {methodPanelMode === 'ecr20_read' ? <Erc20ReadController {...erc20ReadProps} /> : null}
              {methodPanelMode === 'erc20_write' ? <Erc20WriteController {...erc20WriteProps} /> : null}
              {methodPanelMode === 'spcoin_rread' ? <SpCoinReadController {...spCoinReadProps} /> : null}
              {methodPanelMode === 'spcoin_write' ? <SpCoinWriteController {...spCoinWriteProps} /> : null}
              {methodPanelMode === 'serialization_tests' ? <SerializationTestController {...serializationTestProps} /> : null}
            </>
          )}
        </section>
      </div>
    </article>
  );
}
