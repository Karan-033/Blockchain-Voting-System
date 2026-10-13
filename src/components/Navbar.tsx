import React from 'react';
import { ShieldCheck, Vote, Award, Database, BarChart3, AlertCircle, Play, Pause, Lock } from 'lucide-react';
import { ElectionPhase } from '../types/voting';

interface NavbarProps {
  currentTab: 'ballot' | 'commissioner' | 'blockchain' | 'results';
  setCurrentTab: (tab: 'ballot' | 'commissioner' | 'blockchain' | 'results') => void;
  electionPhase: ElectionPhase;
  totalVotes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  electionPhase,
  totalVotes,
}) => {
  const getPhaseDisplay = () => {
    switch (electionPhase) {
      case 'ACTIVE':
        return {
          label: 'Voting Live & Open',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
          icon: Play,
        };
      case 'PAUSED':
        return {
          label: 'Voting Paused',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          dot: 'bg-amber-500',
          icon: Pause,
        };
      case 'CONCLUDED':
        return {
          label: 'Election Concluded & Sealed',
          color: 'text-slate-700 bg-slate-100 border-slate-300',
          dot: 'bg-slate-500',
          icon: Lock,
        };
      case 'SETUP':
      default:
        return {
          label: 'Nomination & Setup',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          dot: 'bg-blue-500',
          icon: AlertCircle,
        };
    }
  };

  const phaseInfo = getPhaseDisplay();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800">
              <Vote className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Bharat<span className="text-orange-600">Chain</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  EVM 3.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Decentralized Blockchain Voting System · Election Commission Architecture
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setCurrentTab('ballot')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'ballot'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote className="w-3.5 h-3.5 text-orange-600" />
              <span>Voter Ballot</span>
            </button>

            <button
              onClick={() => setCurrentTab('commissioner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'commissioner'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Election Commissioner</span>
            </button>

            <button
              onClick={() => setCurrentTab('blockchain')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'blockchain'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ledger Explorer</span>
            </button>

            <button
              onClick={() => setCurrentTab('results')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'results'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Results & Tally</span>
            </button>
          </nav>

          {/* Right Status Badge */}
          <div className="hidden md:flex items-center gap-3">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${phaseInfo.color}`}>
              <span className={`w-2 h-2 rounded-full ${phaseInfo.dot}`} />
              <span>{phaseInfo.label}</span>
            </div>

            <div className="text-right pl-2 border-l border-slate-200">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block leading-tight">
                Ledger Votes
              </span>
              <span className="text-xs font-bold font-mono text-slate-900">
                {totalVotes} Cast
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
