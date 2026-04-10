import BaseModal from './BaseModal';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
  maxWidthClassName?: string;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Continue',
  cancelButtonClassName = 'rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-[#d7ae45]',
  confirmButtonClassName = 'rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-500',
  maxWidthClassName,
}: Props) {
  return (
    <BaseModal
      isOpen={isOpen}
      title={title}
      maxWidthClassName={maxWidthClassName}
      footer={
        <>
          <button type="button" className={cancelButtonClassName} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmButtonClassName} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-200">{message}</p>
    </BaseModal>
  );
}
