type Props = {
  fields: string[];
  buttonStyle: string;
  onClose: () => void;
};

export default function ValidationPopup({ fields, buttonStyle, onClose }: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-lg font-semibold text-red-400">Missing Required Fields</h3>
        <p className="mt-2 text-sm text-slate-200">Fill in the following fields before executing the method:</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-100">
          {fields.map((label) => (
            <li key={`missing-${label}`}>{label}</li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button type="button" className={buttonStyle} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
