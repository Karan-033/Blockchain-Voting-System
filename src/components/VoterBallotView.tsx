import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  CheckCircle, 
  AlertOctagon, 
  Vote, 
  Lock, 
  IdCard, 
  User, 
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  BookOpen,
  Award,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  Sparkle,
  QrCode,
  Scan,
  KeyRound,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Candidate, ElectionPhase, VerificationResult, VoteTransaction, Block, Voter, ECIBoothQRData } from '../types/voting';
import { voterRegistryInstance } from '../services/voterRegistry';
import { blockchainInstance } from '../services/blockchain';
import { hashVoterEpic, generateDigitalSignature, sha256 } from '../services/crypto';
import { CandidateDetailModal } from './CandidateDetailModal';
import { UPIStylePinModal } from './UPIStylePinModal';
import { ECIBoothQRModal } from './ECIBoothQRModal';

interface VoterBallotViewProps {
  candidates: Candidate[];
  electionPhase: ElectionPhase;
  onVoteCastSuccess: (candidate: Candidate, transaction: VoteTransaction, block: Block, voterName: string) => void;
  onSwitchToCommissioner: () => void;
}

export const VoterBallotView: React.FC<VoterBallotViewProps> = ({
  candidates,
  electionPhase,
  onVoteCastSuccess,
  onSwitchToCommissioner,
}) => {
  // Linear Voter's POV Step State (1: Scan QR, 2: Identify Voter, 3: Candidate Ballot, 4: Done)
  const [voterStep, setVoterStep] = useState<1 | 2 | 3 | 4>(1);

  // Booth QR State for Step 1
  const [boothData, setBoothData] = useState<ECIBoothQRData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isConnectingBooth, setIsConnectingBooth] = useState(false);
  const [boothQRModalOpen, setBoothQRModalOpen] = useState(false);

  // Voter Identification State for Step 2
  const [epicNumber, setEpicNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [autoFetchedVoter, setAutoFetchedVoter] = useState<Voter | null>(null);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [autoFetchNotice, setAutoFetchNotice] = useState<string | null>(null);

  // Candidate Selection State for Step 3
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [detailModalCandidate, setDetailModalCandidate] = useState<Candidate | null>(null);

  // UPI PIN Modal & Blockchain Mining State for Step 4
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [miningStatusText, setMiningStatusText] = useState('');
  const [completedTx, setCompletedTx] = useState<{
    txId: string;
    candidate: Candidate;
    voterName: string;
    timestamp: number;
    blockIndex: number;
  } | null>(null);

  // Generate Booth QR Code for Step 1
  useEffect(() => {
    const data = voterRegistryInstance.getBoothQRData();
    setBoothData(data);
    QRCode.toDataURL(data.qrPayloadUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate booth QR:', err));
  }, [electionPhase]);

  // Demo Voter Presets for Quick Evaluation
  const demoVoters = [
    { label: 'Eligible Elector (Age 28)', name: 'Arjun Mehra', epic: 'DEL8849201', dob: '1996-03-14', pin: '482910', badge: 'Eligible' },
    { label: 'Eligible Elector (Age 24)', name: 'Ananya Sharma', epic: 'DEL9921045', dob: '2001-11-20', pin: '739102', badge: 'Eligible' },
    { label: 'Senior Elector (Age 47)', name: 'Devendra Kumar', epic: 'DEL3310928', dob: '1978-07-04', pin: '210584', badge: 'Eligible' },
    { label: 'Minor / Underage (Age 16)', name: 'Rohan Verma', epic: 'DEL4059182', dob: '2010-08-15', pin: '556677', badge: 'Minor' },
    { label: 'Unregistered Citizen', name: 'Unknown Citizen', epic: 'FAKE9998881', dob: '1990-01-01', pin: '000000', badge: 'Unregistered' },
  ];

  // Lookup Voter Details by Voter ID (EPIC)
  const performFetchDetails = (epicToLookup: string) => {
    const clean = epicToLookup.trim().toUpperCase();
    if (!clean) return;

    setIsAutoFetching(true);
    setTimeout(() => {
      const match = voterRegistryInstance.findVoterByEpic(clean);
      if (match) {
        setFullName(match.fullName);
        setDob(match.dob);
        setAutoFetchedVoter(match);
        setAutoFetchNotice(`Electoral Roll matched: ${match.fullName}`);
        const result = voterRegistryInstance.verifyVoterEligibility(clean, match.dob);
        setVerificationResult(result);
      } else {
        setAutoFetchedVoter(null);
        setVerificationResult({
          eligible: false,
          code: 'NOT_FOUND_IN_ROLL',
          reason: `Voter ID "${clean}" not found in current Electoral Roll.`,
        });
        setAutoFetchNotice(`Voter ID "${clean}" not found in current Electoral Roll.`);
      }
      setIsAutoFetching(false);
    }, 250);
  };

  const handleEpicChange = (val: string) => {
    const upper = val.toUpperCase();
    setEpicNumber(upper);
    setVerificationResult(null);
    setAutoFetchNotice(null);

    const clean = upper.trim();
    if (clean.length >= 6) {
      const match = voterRegistryInstance.findVoterByEpic(clean);
      if (match) {
        setFullName(match.fullName);
        setDob(match.dob);
        setAutoFetchedVoter(match);
        setAutoFetchNotice(`Electoral Roll matched: ${match.fullName}`);
        const result = voterRegistryInstance.verifyVoterEligibility(clean, match.dob);
        setVerificationResult(result);
      } else {
        setAutoFetchedVoter(null);
      }
    } else {
      setAutoFetchedVoter(null);
    }
  };

  const handleSelectPreset = (preset: typeof demoVoters[0]) => {
    setEpicNumber(preset.epic);
    performFetchDetails(preset.epic);
  };

  // Step 1: Scan / Connect to Booth
  const handleConnectBooth = (prefilledEpic?: string) => {
    setIsConnectingBooth(true);
    setTimeout(() => {
      setIsConnectingBooth(false);
      setVoterStep(2);
      if (prefilledEpic) {
        setEpicNumber(prefilledEpic);
        performFetchDetails(prefilledEpic);
      } else if (!epicNumber) {
        // default to first eligible demo for ultra-smooth testing
        handleSelectPreset(demoVoters[0]);
      }
    }, 450);
  };

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  // Step 3 -> 4: Press Cast Vote Button -> Opens UPI PIN modal
  const handlePressCastVote = () => {
    if (!selectedCandidate || !verificationResult?.eligible) return;
    setPinModalOpen(true);
  };

  // Step 4: PIN Verified -> Mine Vote to Blockchain
  const handleCastVote = async () => {
    if (!verificationResult || !verificationResult.eligible || !selectedCandidate) return;

    setIsMining(true);
    setMiningStatusText('Cryptographically hashing voter ID (anonymized SHA-256)...');

    setTimeout(() => {
      setMiningStatusText('Signing digital ballot with Returning Officer key...');

      setTimeout(() => {
        setMiningStatusText('Mining vote transaction into Proof-of-Work blockchain block...');

        setTimeout(() => {
          try {
            const voterHash = hashVoterEpic(epicNumber);
            const timestamp = Date.now();
            const txId = sha256(`${voterHash}:${selectedCandidate.id}:${timestamp}`);
            const digitalSignature = generateDigitalSignature(txId);

            const transaction: VoteTransaction = {
              txId,
              voterHash,
              candidateId: selectedCandidate.id,
              candidateName: selectedCandidate.name,
              party: selectedCandidate.party,
              constituency: selectedCandidate.constituency,
              timestamp,
              digitalSignature,
            };

            // Mine block onto ledger
            const { block } = blockchainInstance.mineVote(transaction);

            // Mark voter as having voted
            voterRegistryInstance.markVoterCast(epicNumber, txId);

            // Trigger confetti
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch (err) {
              // ignore
            }

            setIsMining(false);
            setMiningStatusText('');

            setCompletedTx({
              txId,
              candidate: selectedCandidate,
              voterName: fullName || 'Citizen Elector',
              timestamp,
              blockIndex: block.index,
            });

            // Move to final completed view
            setVoterStep(4);

            // Notify app to show VVPAT modal
            onVoteCastSuccess(selectedCandidate, transaction, block, fullName || 'Citizen Elector');
          } catch (err) {
            console.error('Mining failed:', err);
            setIsMining(false);
          }
        }, 600);
      }, 500);
    }, 400);
  };

  // Reset to start new voter journey
  const handleStartNewVote = () => {
    setSelectedCandidateId(null);
    setVerificationResult(null);
    setFullName('');
    setEpicNumber('');
    setDob('');
    setAutoFetchedVoter(null);
    setAutoFetchNotice(null);
    setCompletedTx(null);
    setVoterStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Banner if Election is Not Active */}
      {electionPhase !== 'ACTIVE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                {electionPhase === 'SETUP' && 'Official Polling Has Not Started Yet'}
                {electionPhase === 'PAUSED' && 'Polling is Temporarily Paused by ECI'}
                {electionPhase === 'CONCLUDED' && 'Election Has Concluded & Sealed'}
              </h4>
              <p className="text-xs text-amber-700">
                The Election Commission of India (ECI) must start the election before electors can scan the booth QR and cast ballots.
              </p>
            </div>
          </div>
          <button
            onClick={onSwitchToCommissioner}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors whitespace-nowrap shadow-xs"
          >
            Open ECI Authority Panel
          </button>
        </div>
      )}

      {/* Voter POV Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Voter Journey (Voter's POV)</span>
          <span className="font-mono text-[11px] text-slate-400">Step {voterStep} of 4</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setVoterStep(1)}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              voterStep === 1
                ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200'
                : voterStep > 1
                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              {voterStep > 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</span>
              )}
              <span className={voterStep === 1 ? 'text-orange-950' : ''}>Scan QR</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5 hidden sm:block">
              Booth Terminal
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => setVoterStep(2)}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              voterStep === 2
                ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200'
                : voterStep > 2
                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              {voterStep > 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
              )}
              <span className={voterStep === 2 ? 'text-orange-950' : ''}>Identify Voter</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5 hidden sm:block">
              Voter ID & Details
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => {
              if (verificationResult?.eligible) setVoterStep(3);
            }}
            disabled={!verificationResult?.eligible && voterStep < 3}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              voterStep === 3
                ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-200'
                : voterStep > 3
                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              {voterStep > 3 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span>
              )}
              <span className={voterStep === 3 ? 'text-orange-950' : ''}>Candidate Ballot</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5 hidden sm:block">
              Select Candidate
            </div>
          </button>

          {/* Step 4 Tab */}
          <button
            type="button"
            disabled={voterStep !== 4}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              voterStep === 4
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Cast with PIN</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5 hidden sm:block">
              Confirmed on Chain
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SCAN POLLING BOOTH QR (VOTER ARRIVES AT THE BOOTH) */}
      {/* ========================================================================= */}
      {voterStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-3">
              <span>🇮🇳 Election Commission of India</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Scan Official Polling Station QR Code
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-1">
              As a voter, scan the official QR generated by the ECI at this booth to connect to your secure digital voting session.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Live QR Display Box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center max-w-sm mx-auto shadow-inner text-center">
              <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Official ECI Booth QR"
                    className="w-56 h-56 rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                {/* Ashoka Chakra Center Emblem */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-orange-500 shadow-md flex items-center justify-center text-sm">
                    🇮🇳
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1 w-full pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-900">
                  {boothData?.boothName || 'Polling Station #42, Constitution Club of India'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Station ID: {boothData?.boothId || 'BOOTH-42'} · Constituency: {boothData?.constituency || 'New Delhi Central'}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                  ECI Digital Seal: {boothData?.signature || '0xECI_VERIFIED'}
                </div>
              </div>
            </div>

            {/* Voter Action Buttons */}
            <div className="max-w-md mx-auto space-y-3">
              <button
                type="button"
                onClick={() => handleConnectBooth()}
                disabled={isConnectingBooth}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isConnectingBooth ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to Secure Booth Session...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Scan Booth QR & Connect to Elector Portal &rarr;</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setBoothQRModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Open Interactive Camera Scanner Simulator / Voter Slips</span>
              </button>
            </div>

            {/* Quick 1-Click Voter Profiles to Test Flow */}
            <div className="border-t border-slate-200 pt-5">
              <span className="text-xs font-bold text-slate-700 block mb-2 text-center">
                Or Tap a Registered Voter to Simulate Instant QR Entry:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {demoVoters.slice(0, 3).map((v) => (
                  <button
                    key={v.epic}
                    type="button"
                    onClick={() => handleConnectBooth(v.epic)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all shadow-2xs group"
                  >
                    <div className="text-xs font-bold text-slate-900 group-hover:text-orange-950">
                      {v.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {v.epic}
                    </div>
                    <div className="text-[10px] text-amber-900 font-medium mt-1">
                      Assigned PIN: <strong className="font-mono">{v.pin}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: IDENTIFY YOURSELF BY VOTER ID (EPIC) & VERIFY DETAILS */}
      {/* ========================================================================= */}
      {voterStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200 space-y-6 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                <IdCard className="w-4 h-4" />
                <span>Step 2: Elector Identification</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Identify Yourself with your ECI Voter ID
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your Electoral Photo Identity Card (EPIC) number to fetch your official details from the Electoral Roll.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setVoterStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to QR Scan</span>
            </button>
          </div>

          {/* Voter ID Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Voter ID Number (EPIC) Provided by ECI
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={epicNumber}
                    onChange={(e) => handleEpicChange(e.target.value)}
                    placeholder="e.g. DEL8849201"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-bold uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => performFetchDetails(epicNumber)}
                  disabled={!epicNumber.trim() || isAutoFetching}
                  className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
                >
                  {isAutoFetching ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Fetch Details</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                <span>Format: 3 letters + 7 numbers (e.g. DEL8849201)</span>
                <button
                  type="button"
                  onClick={() => setBoothQRModalOpen(true)}
                  className="text-orange-600 hover:underline flex items-center gap-1"
                >
                  <Scan className="w-3 h-3" />
                  <span>Scan e-EPIC QR Slip</span>
                </button>
              </div>
            </div>

            {/* Quick Presets for Instant One-Click Testing */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">
                Quick-Select Registered Voter Record:
              </span>
              <div className="flex flex-wrap gap-2">
                {demoVoters.map((demo) => (
                  <button
                    key={demo.epic}
                    type="button"
                    onClick={() => handleSelectPreset(demo)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all border ${
                      epicNumber === demo.epic
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{demo.name}</span>
                    <span className="font-mono text-[10px] opacity-75 ml-1">({demo.epic})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FETCHED VOTER DETAILS CARD */}
          {verificationResult && (
            <div className={`p-5 rounded-2xl border transition-all ${
              verificationResult.eligible
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-red-50/70 border-red-300 text-red-950'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                    verificationResult.eligible
                      ? 'bg-white border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-white border-red-300 text-red-700 shadow-xs'
                  }`}>
                    {verificationResult.eligible ? '🇮🇳' : '⚠️'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Official ECI Electoral Record
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        verificationResult.eligible
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {verificationResult.eligible ? 'VERIFIED ELIGIBLE' : 'NOT ELIGIBLE'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {fullName || autoFetchedVoter?.fullName || 'Elector Record Found'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 pt-1">
                      <div>
                        Voter ID (EPIC): <strong className="font-mono text-slate-900">{epicNumber}</strong>
                      </div>
                      <div>
                        Date of Birth: <strong className="text-slate-900">{dob || autoFetchedVoter?.dob || 'Verified'}</strong>
                        {verificationResult.calculatedAge && (
                          <span> ({verificationResult.calculatedAge} Years Old)</span>
                        )}
                      </div>
                      <div>
                        Constituency: <strong className="text-slate-900">{autoFetchedVoter?.constituency || 'New Delhi Central'}</strong>
                      </div>
                      <div>
                        Polling Station: <strong className="text-slate-900">Booth #42 - Constitution Club</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Reason */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="text-slate-600">
                  {verificationResult.reason}
                </div>

                {autoFetchedVoter?.voterPin && (
                  <div className="font-medium text-amber-900 text-right">
                    Assigned ECI Secret PIN: <strong className="font-mono text-slate-900 font-bold">{autoFetchedVoter.voterPin}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setVoterStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setVoterStep(3)}
              disabled={!verificationResult?.eligible}
              className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
                verificationResult?.eligible
                  ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <span>Verify Myself & Proceed to Candidate Ballot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CANDIDATE BALLOT (SELECT YOUR CANDIDATE & PRESS CAST VOTE) */}
      {/* ========================================================================= */}
      {voterStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200 space-y-6 p-6 sm:p-8">
          {/* Header & Verified Elector Chip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                <Vote className="w-4 h-4" />
                <span>Step 3: Official Candidate Ballot</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Select Your Representative Candidate
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                New Delhi Central Parliamentary Constituency (PC-04) · Single Choice Secret Ballot
              </p>
            </div>

            {/* Elector Identity Badge */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Verified Elector
              </span>
              <span className="text-xs font-bold text-slate-900 block">
                {fullName || autoFetchedVoter?.fullName || 'Arjun Mehra'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">
                {epicNumber}
              </span>
            </div>
          </div>

          {/* EVM-Style Candidate Ballot Rows */}
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const isSelected = selectedCandidateId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Serial Number */}
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {candidate.serialNumber}
                    </div>

                    {/* Candidate Symbol */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-2xl shrink-0">
                      {candidate.symbol}
                    </div>

                    {/* Candidate Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {candidate.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {candidate.party} · Symbol: <span className="font-semibold text-slate-800">{candidate.symbolName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: EVM Blue Lamp & Selection Radio */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalCandidate(candidate);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors hidden sm:flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Platform</span>
                    </button>

                    {/* EVM Blue Vote Lamp */}
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-600 shadow-[0_0_10px_#2563eb] ring-4 ring-blue-100' 
                          : 'bg-slate-200'
                      }`} />

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-orange-600 bg-orange-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Action Bar: PRESS CAST VOTE BUTTON */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-500 block">Selected Choice:</span>
              <span className="font-bold text-sm text-slate-900">
                {selectedCandidate ? (
                  `${selectedCandidate.name} (${selectedCandidate.symbol} ${selectedCandidate.party})`
                ) : (
                  <span className="text-slate-400 italic">Select one candidate from the ballot above</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVoterStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Back to Identity
              </button>

              <button
                type="button"
                onClick={handlePressCastVote}
                disabled={!selectedCandidate || electionPhase !== 'ACTIVE'}
                className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedCandidate && electionPhase === 'ACTIVE'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Press Cast Vote Button &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: VOTE COMPLETE & DIGITAL CONFIRMATION */}
      {/* ========================================================================= */}
      {voterStep === 4 && completedTx && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
          {/* Official Inked Finger Badge */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-300 mx-auto flex items-center justify-center text-4xl shadow-md">
            🇮🇳
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
              Election Commission of India · Voted
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Your Vote Has Been Recorded!
            </h2>
            <p className="text-xs text-slate-600">
              Your vote has been cryptographically signed with your ECI PIN and permanently sealed onto the BharatChain blockchain ledger.
            </p>
          </div>

          {/* Sealed Transaction Receipt Box */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Candidate Voted:</span>
              <span className="font-bold text-slate-900">
                {completedTx.candidate.name} ({completedTx.candidate.symbol})
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Political Party:</span>
              <span className="font-semibold text-slate-800">
                {completedTx.candidate.party}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Sealed in Block:</span>
              <span className="font-mono font-bold text-indigo-700">
                Block #{completedTx.blockIndex}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Transaction ID (Hash)
              </span>
              <span className="font-mono text-[11px] text-slate-700 break-all">
                {completedTx.txId}
              </span>
            </div>
          </div>

          {/* Action to Next Voter or Explorer */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartNewVote}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Voter in Queue / Cast Another Vote</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* UPI-Style Secret PIN Authentication Modal */}
      <UPIStylePinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        candidate={selectedCandidate}
        voter={
          autoFetchedVoter ||
          verificationResult?.voter || {
            fullName: fullName || 'Arjun Mehra',
            epicNumber: epicNumber || 'DEL8849201',
            dob: dob || '1996-03-14',
            constituency: selectedCandidate?.constituency || 'New Delhi Central',
            state: 'Delhi',
            voterPin: '482910',
            hasVoted: false,
          }
        }
        onPinVerified={() => {
          setPinModalOpen(false);
          handleCastVote();
        }}
      />

      {/* Interactive Camera / Simulator Booth QR Scanner Modal */}
      <ECIBoothQRModal
        isOpen={boothQRModalOpen}
        onClose={() => setBoothQRModalOpen(false)}
        onVoterScanned={(scannedEpic) => {
          setEpicNumber(scannedEpic);
          performFetchDetails(scannedEpic);
          setVoterStep(2);
        }}
        initialMode="booth"
      />

      {/* Detailed Candidate Dossier Modal */}
      <CandidateDetailModal
        candidate={detailModalCandidate}
        isOpen={!!detailModalCandidate}
        onClose={() => setDetailModalCandidate(null)}
        isSelected={selectedCandidateId === detailModalCandidate?.id}
        onSelectCandidate={(candidateId) => {
          setSelectedCandidateId(candidateId);
          setDetailModalCandidate(null);
        }}
      />
    </div>
  );
};
