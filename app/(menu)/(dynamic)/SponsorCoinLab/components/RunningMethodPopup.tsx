import React from 'react';
import BaseModal from '@/components/modals/BaseModal';

type Props = {
  isOpen: boolean;
  methodName: string;
  startedAt: number;
  isCancelling: boolean;
  onCancel: () => void;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function RunningMethodPopup({
  isOpen,
  methodName,
  startedAt,
  isCancelling,
  onCancel,
}: Props) {
  const [elapsedMs, setElapsedMs] = React.useState(() => Date.now() - startedAt);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    setElapsedMs(Date.now() - startedAt);
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [isOpen, startedAt]);

  return (
    <BaseModal
      isOpen={isOpen}
      title={isCancelling ? 'Cancelling Method' : 'Running Method'}
      maxWidthClassName="max-w-lg"
      panelClassName="rounded-2xl border border-[#31416F] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      titleClassName="text-lg font-semibold text-[#E5B94F]"
      footer={
        <button
          type="button"
          className={`rounded-lg px-3 py-[0.28rem] text-sm font-semibold transition-colors ${
            isCancelling
              ? 'cursor-not-allowed bg-slate-600 text-slate-200'
              : 'bg-red-600 text-white hover:bg-red-500'
          }`}
          onClick={onCancel}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      }
    >
      <div className="space-y-3 text-sm text-slate-200">
        <p>
          <span className="font-semibold text-white">Method:</span>{' '}
          <span className="break-all text-[#8FA8FF]">{methodName}</span>
        </p>
        <p>
          <span className="font-semibold text-white">Elapsed:</span> {formatElapsed(elapsedMs)}
        </p>
        <p className="text-slate-400">
          {isCancelling
            ? 'A cancellation request was sent. This popup will close when the method stops.'
            : 'This popup will close when the method completes.'}
        </p>
      </div>
    </BaseModal>
  );
}
