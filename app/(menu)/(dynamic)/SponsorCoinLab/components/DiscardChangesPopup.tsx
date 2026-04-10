import { ConfirmModal } from '@/components/modals';

type Props = {
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DiscardChangesPopup({ isOpen, message, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Discard Changes?"
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelLabel="Return"
      confirmLabel="Discard Changes"
      cancelButtonClassName="rounded-lg bg-green-500 px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-400"
      confirmButtonClassName="rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-[#d7ae45]"
    />
  );
}
