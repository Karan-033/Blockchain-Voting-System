import React from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, Award, ShieldCheck, Vote } from 'lucide-react';
import { Candidate, ElectionPhase, Voter } from '../types/voting';
import { blockchainInstance } from '../services/blockchain';

interface ResultsAnalyticsProps {
  candidates: Candidate[];
  voters: Voter[];
  electionPhase: ElectionPhase;
  onSwitchToBallot: () => void;
}

export const ResultsAnalytics: React.FC<ResultsAnalyticsProps> = ({
  candidates,
  voters,
  electionPhase,
  onSwitchToBallot,
}) => {
  const tally = blockchainInstance.getCandidateTally();
  const totalVotesCast = Object.values(tally).reduce((a, b) => a + b, 0);
  const totalEnrolled = voters.length;
  const turnoutPercent = totalEnrolled > 0 ? ((totalVotesCast / totalEnrolled) * 100).toFixed(1) : '0.0';

  // Sort candidates by vote count descending
  const sortedCandidates = [...candidates].sort((a, b) => {
    const votesA = tally[a.id] || 0;
    const votesB = tally[b.id] || 0;
    return votesB - votesA;
  });

  const leadingCandidate = sortedCandidates[0];
  const leadingVotes = leadingCandidate ? tally[leadingCandidate.id] || 0 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600">
            <BarChart3 className="w-4 h-4" />
            <span>Decentralized Real-Time Tabulation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Election Results & Public Audit Tally
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tallies are computed live by parsing every mined block on the cryptographic blockchain ledger.
          </p>
        </div>

        <button
          onClick={onSwitchToBallot}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-xs"
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Cast Your Vote</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Ballots Cast</span>
            <Vote className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {totalVotesCast}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Cryptographically sealed into blocks
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Voter Turnout Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {turnoutPercent}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalVotesCast} of {totalEnrolled} enrolled voters participated
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Leader</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {leadingVotes > 0 && leadingCandidate ? (
              <span className="flex items-center gap-1.5">
                <span>{leadingCandidate.symbol}</span>
                <span>{leadingCandidate.name}</span>
              </span>
            ) : (
              <span className="text-slate-400 font-normal">Awaiting first vote</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {leadingVotes > 0 ? `${leadingVotes} votes (${((leadingVotes / (totalVotesCast || 1)) * 100).toFixed(1)}%)` : 'No votes recorded'}
          </span>
        </div>
      </div>

      {/* Main Candidate Tally Board */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Candidate Standings · New Delhi Central Constituency
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Status: {electionPhase === 'ACTIVE' ? 'Live Counting' : electionPhase}
          </span>
        </div>

        {totalVotesCast === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Votes Cast Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Head to the Voter Ballot tab to cast the first cryptographically verified vote for this constituency.
            </p>
            <button
              onClick={onSwitchToBallot}
              className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Open Voter Ballot
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCandidates.map((cand, idx) => {
              const count = tally[cand.id] || 0;
              const percentage = totalVotesCast > 0 ? ((count / totalVotesCast) * 100).toFixed(1) : '0';
              const isLeading = idx === 0 && count > 0;

              return (
                <div
                  key={cand.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isLeading
                      ? 'border-purple-300 bg-purple-50/30 shadow-xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                        #{cand.serialNumber}
                      </span>
                      <div className="text-2xl">{cand.symbol}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{cand.name}</span>
                          {isLeading && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              Leading
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {cand.party} · {cand.symbolName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold font-mono text-slate-900 block leading-tight">
                        {count} <span className="text-xs font-normal text-slate-500">votes</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cand.color || '#ea580c',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audit Statement */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-slate-900 mb-0.5">Cryptographic Guarantees</h4>
            <p>
              Unlike traditional black-box EVM tallies, every vote counted above is an immutable transaction inside an audited blockchain block. Any modification to a past vote breaks the SHA-256 hash chain and is immediately caught.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
