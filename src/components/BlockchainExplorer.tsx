import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Hash, 
  Clock, 
  Key, 
  Link2, 
  RotateCcw,
  RefreshCw,
  FileCheck2,
  Lock
} from 'lucide-react';
import { Block, AuditVerificationResult } from '../types/voting';
import { blockchainInstance } from '../services/blockchain';

interface BlockchainExplorerProps {
  blocks: Block[];
  onRefresh: () => void;
}

export const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({
  blocks,
  onRefresh,
}) => {
  const [auditResult, setAuditResult] = useState<AuditVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);

  // Run real-time cryptographic audit
  const handleVerifyLedger = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = blockchainInstance.verifyLedger();
      setAuditResult(result);
      setIsVerifying(false);
    }, 400);
  };

  // Simulate malicious edit to demonstrate tamper detection
  const handleSimulateTamper = (blockIndex: number) => {
    blockchainInstance.simulateTamper(blockIndex, 'FRAUDULENT_VOTE_ALTERED');
    setTamperedIndex(blockIndex);
    onRefresh();
    // Run audit immediately to show the error
    const result = blockchainInstance.verifyLedger();
    setAuditResult(result);
  };

  // Reset/repair ledger
  const handleResetLedger = () => {
    blockchainInstance.resetLedger();
    setAuditResult(null);
    setTamperedIndex(null);
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <Database className="w-4 h-4" />
            <span>Decentralized Proof of Work Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Blockchain Ledger & Cryptographic Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Every cast vote is packaged into an immutable block with a SHA-256 cryptographic hash, linked to the previous block, and mined with Proof of Work.
          </p>
        </div>

        {/* Audit Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs disabled:opacity-60"
          >
            {isVerifying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Verify Ledger Integrity</span>
          </button>

          <button
            onClick={handleResetLedger}
            title="Reset ledger to genesis block"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Chain</span>
          </button>
        </div>
      </div>

      {/* Audit Banner */}
      {auditResult && (
        <div
          className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            auditResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {auditResult.isValid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {auditResult.isValid
                  ? 'Cryptographic Verification Passed · Ledger 100% Authentic'
                  : 'Ledger Tamper Detected · Cryptographic Anomaly Flagged!'}
              </h3>
              <p className="text-xs leading-relaxed text-slate-700">
                {auditResult.details}
              </p>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Checked: {auditResult.blocksChecked} blocks · Verified at {new Date(auditResult.timestamp).toLocaleTimeString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chain Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">Total Blocks</span>
          <span className="text-xl font-bold font-mono text-slate-900">{blocks.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">Consensus Algorithm</span>
          <span className="text-xl font-bold font-mono text-slate-900">PoW (Difficulty 2)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">Mined Transactions</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {blocks.reduce((acc, b) => acc + b.transactions.length, 0)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-semibold text-slate-400 block">Hash Function</span>
          <span className="text-xl font-bold font-mono text-slate-900">SHA-256 256-bit</span>
        </div>
      </div>

      {/* Visual Blocks Pipeline */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Chained Blocks (Genesis &rarr; Current Head)
        </h2>

        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isGenesis = block.index === 0;
            const hasTamper = block.isTampered;

            return (
              <div
                key={block.index}
                className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-xs relative ${
                  hasTamper
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-200'
                    : isGenesis
                    ? 'border-slate-300 bg-slate-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        isGenesis
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isGenesis ? 'Block #0 (Genesis)' : `Block #${block.index}`}
                    </span>

                    <span className="text-xs text-slate-500 font-mono">
                      Nonce: <strong>{block.nonce}</strong>
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(block.timestamp).toLocaleTimeString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {block.transactions.length} Vote Transaction{block.transactions.length === 1 ? '' : 's'}
                    </span>

                    {/* Educational Tamper Button */}
                    {!isGenesis && block.transactions.length > 0 && !hasTamper && (
                      <button
                        onClick={() => handleSimulateTamper(block.index)}
                        title="Simulate malicious modification to demonstrate cryptographic chain breaking"
                        className="px-2.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                      >
                        Simulate Tamper
                      </button>
                    )}

                    {hasTamper && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">
                        TAMPERED DATA
                      </span>
                    )}
                  </div>
                </div>

                {/* Block Hash Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      Current Block Hash (SHA-256)
                    </span>
                    <span className="text-slate-900 font-bold break-all">
                      <span className="text-emerald-600 font-extrabold">{block.hash.substring(0, 2)}</span>
                      {block.hash.substring(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      Previous Block Hash
                    </span>
                    <span className="text-slate-600 break-all">
                      {block.previousHash}
                    </span>
                  </div>
                </div>

                {/* Transactions in Block */}
                {block.transactions.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                      Included Transactions:
                    </span>
                    {block.transactions.map((tx) => (
                      <div
                        key={tx.txId}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              Vote Cast For: {tx.candidateName}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">{tx.party}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Anonymous Voter Token: {tx.voterHash.substring(0, 20)}...
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px] text-slate-400">
                          <div>TxID: {tx.txId.substring(0, 14)}...</div>
                          <div className="text-emerald-700">{tx.digitalSignature.substring(0, 16)}...</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 italic">
                    Genesis Block · Initialized with ECI Root Merkle Hash
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
