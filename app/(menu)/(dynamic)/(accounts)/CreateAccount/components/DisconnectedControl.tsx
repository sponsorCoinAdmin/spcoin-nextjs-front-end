'use client';

type Props = {
  message: string;
  className?: string;
};

export default function DisconnectedControl({ message, className = '' }: Props) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={`h-[42px] w-full rounded border border-white bg-[#1A1D2E] p-2 ${className}`.trim()}
    >
      <span className="block w-full text-center text-[120%] font-bold text-red-500">{message}</span>
    </button>
  );
}
