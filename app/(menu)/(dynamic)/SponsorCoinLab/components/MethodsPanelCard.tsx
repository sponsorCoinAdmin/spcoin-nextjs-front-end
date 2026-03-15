import React, { type ComponentProps, type MutableRefObject } from 'react';
import type { MethodPanelMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';
import ScriptBuilderCard from './ScriptBuilderCard';
import Erc20ReadController from './Erc20ReadController';
import Erc20WriteController from './Erc20WriteController';
import SpCoinReadController from './SpCoinReadController';
import SpCoinWriteController from './SpCoinWriteController';

type Props = {
  articleClassName: string;
  methodsCardRef: MutableRefObject<HTMLElement | null>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  methodPanelTitle: string;
  methodPanelMode: MethodPanelMode;
  setMethodPanelMode: (value: MethodPanelMode) => void;
  scriptBuilderProps: ComponentProps<typeof ScriptBuilderCard>;
  erc20ReadProps: ComponentProps<typeof Erc20ReadController>;
  erc20WriteProps: ComponentProps<typeof Erc20WriteController>;
  spCoinReadProps: ComponentProps<typeof SpCoinReadController>;
  spCoinWriteProps: ComponentProps<typeof SpCoinWriteController>;
};

export default function MethodsPanelCard({
  articleClassName,
  methodsCardRef,
  isExpanded,
  onToggleExpand,
  methodPanelTitle,
  methodPanelMode,
  setMethodPanelMode,
  scriptBuilderProps,
  erc20ReadProps,
  erc20WriteProps,
  spCoinReadProps,
  spCoinWriteProps,
}: Props) {
  const methodPanelGroupName = React.useId();
  return (
    <article ref={methodsCardRef} className={articleClassName}>
      <LabCardHeader title="Script Test Editor" isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      <div className="mt-4 grid grid-cols-1 gap-4">
        <ScriptBuilderCard {...scriptBuilderProps} />

        <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
          <h3 className="text-center text-lg font-semibold text-[#5981F3]">{methodPanelTitle}</h3>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-200">
              {[
                ['ecr20_read', 'ECR20 Read'],
                ['erc20_write', 'ERC20 Write'],
                ['spcoin_rread', 'Spcoin Read'],
                ['spcoin_write', 'SpCoin Write'],
              ].map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    name={methodPanelGroupName}
                    value={value}
                    checked={methodPanelMode === value}
                    onMouseDown={(e) => {
                      if (methodPanelMode === value) e.preventDefault();
                    }}
                    onChange={(e) => {
                      if (methodPanelMode === value) return;
                      setMethodPanelMode(e.target.value as MethodPanelMode);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {methodPanelMode === 'ecr20_read' ? <Erc20ReadController {...erc20ReadProps} /> : null}
          {methodPanelMode === 'erc20_write' ? <Erc20WriteController {...erc20WriteProps} /> : null}
          {methodPanelMode === 'spcoin_rread' ? <SpCoinReadController {...spCoinReadProps} /> : null}
          {methodPanelMode === 'spcoin_write' ? <SpCoinWriteController {...spCoinWriteProps} /> : null}
        </section>
      </div>
    </article>
  );
}
