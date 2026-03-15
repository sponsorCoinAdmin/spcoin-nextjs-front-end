type Props = {
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DiscardChangesPopup({ isOpen, message, onCancel, onConfirm }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-lg font-semibold text-red-400">Discard Changes?</h3>
        <p className="mt-2 text-sm text-slate-200">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg bg-green-500 px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-400"
            onClick={onCancel}
          >
            Return
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-[#d7ae45]"
            onClick={onConfirm}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
