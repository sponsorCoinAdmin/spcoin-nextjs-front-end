type Props = {
  fields: string[];
  message: string;
  buttonStyle: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  title?: string;
  cancelLabel?: string;
};

export default function ValidationPopup({
  fields,
  message,
  buttonStyle,
  onClose,
  onConfirm,
  confirmLabel,
  title,
  cancelLabel,
}: Props) {
  if (
    fields.length === 0 &&
    !onConfirm &&
    (!message.trim() || message === 'Fill in the following fields before executing the method:')
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-lg font-semibold text-red-400">{title || 'Missing Required Fields'}</h3>
        <p className="mt-2 text-sm text-slate-200">{message}</p>
        {fields.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-100">
            {fields.map((label) => (
              <li key={`missing-${label}`}>{label}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonStyle} onClick={onClose}>
            {cancelLabel || 'Close'}
          </button>
          {onConfirm ? (
            <button
              type="button"
              className="rounded-lg bg-[#E5B94F] px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-500"
              onClick={onConfirm}
            >
              {confirmLabel || 'Continue'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
