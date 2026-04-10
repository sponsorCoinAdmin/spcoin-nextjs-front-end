import { ConfirmModal } from '@/components/modals';

type Props = {
  isOpen: boolean;
  stepName: string;
  buttonStyle: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteStepPopup({
  isOpen,
  stepName,
  buttonStyle,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Delete Method"
      message={`Deleting method ${stepName}`}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelLabel="Cancel"
      confirmLabel="Delete"
      cancelButtonClassName={buttonStyle}
      confirmButtonClassName="rounded-lg border border-red-500 bg-red-950 px-3 py-[0.45rem] text-sm text-red-200 transition-colors hover:bg-red-600 hover:text-white"
    />
  );
}
