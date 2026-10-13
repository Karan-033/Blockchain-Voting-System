import React from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, ShieldCheck, Printer, X } from 'lucide-react';
import { Block, Candidate, VoteTransaction } from '../types/voting';

interface DigitalVvpatModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  transaction: VoteTransaction | null;
  block: Block | null;
  voterName: string;
  onViewInLedger: () => void;
}

export const DigitalVvpatModal: React.FC<DigitalVvpatModalProps> = ({
  isOpen,
  onClose,
  candidate,
  transaction,
  block,
  voterName,
  onViewInLedger,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !candidate || !transaction || !block) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(transaction.txId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(transaction.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Vote Mined Successfully</h3>
              <p className="text-xs text-slate-300">Digital VVPAT · Cryptographic Audit Trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Slip / VVPAT Display */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-xs font-mono text-xs">
            {/* Slip Header */}
            <div className="text-center pb-3 border-b border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ELECTION COMMISSION OF INDIA · BHARATCHAIN
              </div>
              <div className="text-[11px] text-slate-500">
                DIGITAL VVPAT ACKNOWLEDGEMENT SLIP
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Constituency: {transaction.constituency} · {new Date().toLocaleDateString('en-IN')} {formattedTime}
              </div>
            </div>

            {/* Candidate Box */}
            <div className="my-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Candidate Chosen (Serial #{candidate.serialNumber})
                </span>
                <span className="text-base font-bold text-slate-900 block font-sans">
                  {candidate.name}
                </span>
                <span className="text-xs text-slate-600 block font-sans mt-0.5">
                  {candidate.party}
                </span>
              </div>
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-xs">
                {candidate.symbol}
              </div>
            </div>

            {/* Cryptographic Ledger Details */}
            <div className="space-y-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Block Number:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Block #{block.index}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Block PoW Nonce:</span>
                <span className="font-semibold text-slate-700">{block.nonce}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-slate-400">Transaction Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-800 break-all text-right max-w-[200px]">
                    {transaction.txId.substring(0, 18)}...{transaction.txId.substring(transaction.txId.length - 8)}
                  </span>
                  <button
                    onClick={copyHash}
                    title="Copy full transaction hash"
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-slate-400">Anonymous Voter Hash:</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {transaction.voterHash.substring(0, 16)}...
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sealed on Immutable Ledger
                </span>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <div className="h-6 bg-slate-900 rounded-xs opacity-80 mx-auto max-w-[240px] flex items-center justify-center text-[9px] text-white tracking-widest">
                |||| || | |||| ||| || |||||| | |||
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                Ballot Privacy Protected under Section 128 of Representation of the People Act
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white flex items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewInLedger();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect on Ledger</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
