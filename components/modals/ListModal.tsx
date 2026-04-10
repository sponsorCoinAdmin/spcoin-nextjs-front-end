import type React from 'react';
import BaseModal from './BaseModal';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  items: string[];
  onClose: () => void;
  onConfirm?: () => void;
  closeLabel?: string;
  confirmLabel?: string;
  closeButtonClassName?: string;
  confirmButtonClassName?: string;
  maxWidthClassName?: string;
  titleClassName?: string;
  renderItem?: (item: string) => React.ReactNode;
};

export default function ListModal({
  isOpen,
  title,
  message,
  items,
  onClose,
  onConfirm,
  closeLabel = 'Close',
  confirmLabel = 'Continue',
  closeButtonClassName,
  confirmButtonClassName = 'rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-500',
  maxWidthClassName,
  titleClassName,
  renderItem,
}: Props) {
  return (
    <BaseModal
      isOpen={isOpen}
      title={title}
      maxWidthClassName={maxWidthClassName}
      titleClassName={titleClassName}
      footer={
        <>
          <button type="button" className={closeButtonClassName} onClick={onClose}>
            {closeLabel}
          </button>
          {onConfirm ? (
            <button type="button" className={confirmButtonClassName} onClick={onConfirm}>
              {confirmLabel}
            </button>
          ) : null}
        </>
      }
    >
      <p className="text-sm text-slate-200">{message}</p>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-100">
          {items.map((item) => (
            <li key={`list-modal-${item}`}>{renderItem ? renderItem(item) : item}</li>
          ))}
        </ul>
      ) : null}
    </BaseModal>
  );
}
