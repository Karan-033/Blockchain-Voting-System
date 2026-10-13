import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VoterBallotView } from './components/VoterBallotView';
import { CommissionerPanel } from './components/CommissionerPanel';
import { BlockchainExplorer } from './components/BlockchainExplorer';
import { ResultsAnalytics } from './components/ResultsAnalytics';
import { DigitalVvpatModal } from './components/DigitalVvpatModal';
import { voterRegistryInstance } from './services/voterRegistry';
import { blockchainInstance } from './services/blockchain';
import { Candidate, VoteTransaction, Block, ElectionPhase, Voter } from './types/voting';
import { ShieldCheck, Vote } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'ballot' | 'commissioner' | 'blockchain' | 'results'>('ballot');
  
  // Core Application Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [electionPhase, setElectionPhase] = useState<ElectionPhase>('ACTIVE');
  const [blocks, setBlocks] = useState<Block[]>([]);

  // VVPAT Receipt Modal State
  const [vvpatOpen, setVvpatOpen] = useState(false);
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const [minedTx, setMinedTx] = useState<VoteTransaction | null>(null);
  const [minedBlock, setMinedBlock] = useState<Block | null>(null);
  const [voterName, setVoterName] = useState('');

  // Load and refresh state from services
  const refreshAllData = () => {
    setCandidates(voterRegistryInstance.getCandidates());
    setVoters(voterRegistryInstance.getVoters());
    setElectionPhase(voterRegistryInstance.getElectionPhase());
    setBlocks(blockchainInstance.getChain());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const totalVotes = blocks.reduce((acc, b) => acc + b.transactions.length, 0);

  const handleVoteCastSuccess = (
    candidate: Candidate,
    transaction: VoteTransaction,
    block: Block,
    name: string
  ) => {
    refreshAllData();
    setVotedCandidate(candidate);
    setMinedTx(transaction);
    setMinedBlock(block);
    setVoterName(name);
    setVvpatOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-950">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        electionPhase={electionPhase}
        totalVotes={totalVotes}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {currentTab === 'ballot' && (
          <VoterBallotView
            candidates={candidates}
            electionPhase={electionPhase}
            onVoteCastSuccess={handleVoteCastSuccess}
            onSwitchToCommissioner={() => setCurrentTab('commissioner')}
          />
        )}

        {currentTab === 'commissioner' && (
          <CommissionerPanel
            candidates={candidates}
            electionPhase={electionPhase}
            voters={voters}
            onRefreshData={refreshAllData}
            onSwitchToBallot={() => setCurrentTab('ballot')}
          />
        )}

        {currentTab === 'blockchain' && (
          <BlockchainExplorer
            blocks={blocks}
            onRefresh={refreshAllData}
          />
        )}

        {currentTab === 'results' && (
          <ResultsAnalytics
            candidates={candidates}
            voters={voters}
            electionPhase={electionPhase}
            onSwitchToBallot={() => setCurrentTab('ballot')}
          />
        )}
      </main>

      {/* Digital VVPAT Modal */}
      <DigitalVvpatModal
        isOpen={vvpatOpen}
        onClose={() => setVvpatOpen(false)}
        candidate={votedCandidate}
        transaction={minedTx}
        block={minedBlock}
        voterName={voterName}
        onViewInLedger={() => {
          setVvpatOpen(false);
          setCurrentTab('blockchain');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              BharatChain E-Voting System · Sovereign Decentralized Protocol
            </span>
          </div>
          <div className="text-center sm:text-right">
            <span>
              Representation of the People Act · Tamper-Evident SHA-256 Ledger
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
