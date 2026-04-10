import type React from 'react';

type Props = {
  isOpen: boolean;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  titleClassName?: string;
};

export default function BaseModal({
  isOpen,
  title,
  children,
  footer,
  maxWidthClassName = 'max-w-md',
  panelClassName = 'rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
  titleClassName = 'text-lg font-semibold text-red-400',
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`w-full ${maxWidthClassName} ${panelClassName}`}>
        <h3 className={titleClassName}>{title}</h3>
        <div className="mt-2">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
