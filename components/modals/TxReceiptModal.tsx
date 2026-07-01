'use client';

import type React from 'react';
import { useCallback } from 'react';
import BaseModal from './BaseModal';

export type TxReceipt = {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  tokenSymbol: string;
};

type Props = {
  isOpen: boolean;
  receipt: TxReceipt | null;
  onClose: () => void;
};

function truncateAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 shrink-0 text-sm">{label}:</span>
      <div className="flex items-center text-sm text-right">{children}</div>
    </div>
  );
}

export default function TxReceiptModal({ isOpen, receipt, onClose }: Props) {
  const copyHash = useCallback(() => {
    if (receipt?.txHash) void navigator.clipboard.writeText(receipt.txHash);
  }, [receipt?.txHash]);

  return (
    <BaseModal
      isOpen={isOpen}
      title="✓ Transaction Complete"
      titleClassName="text-lg font-semibold text-green-400"
      panelClassName="rounded-2xl border border-green-700 bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#1f3e1d] px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          Close
        </button>
      }
    >
      {receipt && (
        <div className="mt-2 flex flex-col">
          <Row label="Tx Hash">
            <span className="font-mono text-[#94a3b8] break-all">{receipt.txHash}</span>
            <button
              type="button"
              title="Copy transaction hash"
              onClick={copyHash}
              className="ml-2 shrink-0 text-slate-400 hover:text-white transition-colors"
            >
              ⎘
            </button>
          </Row>
          <Row label="From">
            <span className="font-mono text-[#94a3b8]" title={receipt.from}>{truncateAddr(receipt.from)}</span>
          </Row>
          <Row label="To">
            <span className="font-mono text-[#94a3b8]" title={receipt.to}>{truncateAddr(receipt.to)}</span>
          </Row>
          <Row label="Amount">
            <span className="font-semibold text-white">{receipt.amount} {receipt.tokenSymbol}</span>
          </Row>
        </div>
      )}
    </BaseModal>
  );
}
