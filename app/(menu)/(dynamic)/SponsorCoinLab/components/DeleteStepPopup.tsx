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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-lg font-semibold text-red-400">Delete Method</h3>
        <p className="mt-2 text-sm text-slate-200">
          Deleting method <span className="font-semibold text-slate-100">{stepName}</span>
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" className={buttonStyle} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-500 bg-red-950 px-3 py-[0.45rem] text-sm text-red-200 transition-colors hover:bg-red-600 hover:text-white"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
