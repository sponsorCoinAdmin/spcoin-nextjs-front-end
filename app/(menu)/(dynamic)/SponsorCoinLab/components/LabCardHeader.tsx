import React from 'react';

type LabCardHeaderProps = {
  title: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  titleClassName?: string;
  leftSlot?: React.ReactNode;
  headerButtons?: React.ReactNode;
  secondaryRow?: React.ReactNode;
};

export default function LabCardHeader({
  title,
  isExpanded,
  onToggleExpand,
  titleClassName = 'text-lg font-semibold text-[#5981F3]',
  leftSlot,
  headerButtons,
  secondaryRow,
}: LabCardHeaderProps) {
  return (
    <div
      onDoubleClick={onToggleExpand}
      title={isExpanded ? 'Double-click to return to shared view' : 'Double-click to expand'}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
        <div className="flex min-h-10 items-center">{leftSlot}</div>
        <div className="min-w-0 justify-self-center text-center">
          <div className={`${titleClassName} text-center`}>{title}</div>
        </div>
        <div
          className="flex shrink-0 items-center justify-self-end gap-2"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {headerButtons}
          <button
            type="button"
            onClick={onToggleExpand}
            className="relative -right-[9px] -top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
            title={isExpanded ? 'Return to shared view' : 'Expand this card'}
            aria-label={isExpanded ? 'Return to shared view' : 'Expand this card'}
          >
            {isExpanded ? 'x' : '+'}
          </button>
        </div>
      </div>
      {secondaryRow ? <div className="mt-3">{secondaryRow}</div> : null}
    </div>
  );
}
