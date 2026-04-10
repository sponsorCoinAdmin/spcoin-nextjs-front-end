import React from 'react';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';

type LabCardHeaderProps = {
  title: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  titleClassName?: string;
  leftSlot?: React.ReactNode;
  headerButtons?: React.ReactNode;
  secondaryRow?: React.ReactNode;
  secondaryRowClassName?: string;
};

export default function LabCardHeader({
  title,
  isExpanded,
  onToggleExpand,
  titleClassName = 'text-lg font-semibold text-[#5981F3]',
  leftSlot,
  headerButtons,
  secondaryRow,
  secondaryRowClassName = 'mt-3',
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
          <OpenCloseBtn
            onClick={onToggleExpand}
            isExpanded={isExpanded}
            className="relative -right-[9px] -top-[10px]"
          />
        </div>
      </div>
      {secondaryRow ? <div className={secondaryRowClassName}>{secondaryRow}</div> : null}
    </div>
  );
}
