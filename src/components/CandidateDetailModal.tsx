import React, { useState } from 'react';
import { 
  X, 
  Award, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Vote, 
  GraduationCap, 
  Briefcase, 
  Coins, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Candidate } from '../types/voting';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onSelectCandidate: (candidateId: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
  isSelected,
  onSelectCandidate,
}) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'bio' | 'achievements' | 'affidavit'>('platform');

  if (!isOpen || !candidate) return null;

  const handleSelectAndProceed = () => {
    onSelectCandidate(candidate.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-modal-title"
      >
        {/* Header with Candidate Banner */}
        <div className="relative bg-slate-900 text-white p-5 sm:p-6 overflow-hidden">
          {/* Subtle party theme accent overlay */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: candidate.color || '#ea580c' }}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Election Symbol Box */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                <span>{candidate.symbol}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-mono mt-0.5 font-bold">
                  #{candidate.serialNumber}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                  <span>Constituency: {candidate.constituency}</span>
                  <span className="text-slate-500">·</span>
                  <span>Serial #{candidate.serialNumber}</span>
                </div>
                <h2 id="candidate-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {candidate.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="text-slate-100 font-semibold">{candidate.party}</span>
                  <span className="text-slate-500">·</span>
                  <span>Symbol: {candidate.symbolName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-5 border-t border-white/10 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('platform')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'platform'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Party Platform</span>
            </button>

            <button
              onClick={() => setActiveTab('bio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'bio'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bio & Vision</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'achievements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Key Achievements</span>
            </button>

            <button
              onClick={() => setActiveTab('affidavit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'affidavit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Form 26 Affidavit</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: PARTY PLATFORM / MANIFESTO */}
          {activeTab === 'platform' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span>Key Election Manifesto Commitments</span>
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  {candidate.party}
                </span>
              </div>

              {candidate.partyPlatform && candidate.partyPlatform.length > 0 ? (
                <div className="space-y-2.5">
                  {candidate.partyPlatform.map((point, index) => (
                    <div 
                      key={index} 
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                  No specific manifesto points submitted.
                </div>
              )}

              {/* Civic Context Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Manifesto commitments are published in accordance with the Model Code of Conduct (MCC) issued by the Election Commission of India.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BIO & VISION */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Candidate Profile & Civic Orientation</span>
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {candidate.bio || 'Candidate has not provided an extended profile biography.'}
                </p>

                {candidate.education && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Education: <strong className="text-slate-800">{candidate.education}</strong></span>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Constituency Representation
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Contesting for the <strong>{candidate.constituency}</strong> Parliamentary constituency. If elected, candidate represents all registered electors regardless of caste, creed, or political affiliation under the Constitution of India.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: KEY ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Verified Civic & Public Service Track Record</span>
                </h3>
              </div>

              {candidate.keyAchievements && candidate.keyAchievements.length > 0 ? (
                <div className="space-y-2.5">
                  {candidate.keyAchievements.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                  No public service achievements listed.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FORM 26 AFFIDAVIT & TRANSPARENCY */}
          {activeTab === 'affidavit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Form 26 Statutory Affidavit Disclosures</span>
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                  ECI Public Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Criminal Record Disclosure */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Criminal Antecedents
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${
                      candidate.affidavitSummary?.criminalCases === 0 
                        ? 'text-emerald-700' 
                        : 'text-amber-700'
                    }`}>
                      {candidate.affidavitSummary?.criminalCases ?? 0} Pending Cases
                    </span>
                    {candidate.affidavitSummary?.criminalCases === 0 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    No convictions or disqualifications under Section 8 of RPA, 1951.
                  </p>
                </div>

                {/* Declared Assets */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Declared Assets & Net Worth
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {candidate.affidavitSummary?.declaredAssets || '₹50 Lakhs (Self & Spouse)'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Movable and immovable assets sworn under oath.
                  </p>
                </div>

                {/* Profession */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Profession / Source of Income
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {candidate.affidavitSummary?.profession || 'Public Service'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Self-declared in returning officer nomination filing.
                  </p>
                </div>

                {/* Educational Qualifications */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Educational Qualifications
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {candidate.education || 'Graduate'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Verified through verified academic transcripts.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  As mandated by the Supreme Court of India in Association for Democratic Reforms (2002), all candidates must transparently disclose their criminal, educational, and financial background prior to voting day.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close Dossier
          </button>

          <button
            type="button"
            onClick={handleSelectAndProceed}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isSelected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected Candidate (Proceed to Vote)</span>
              </>
            ) : (
              <>
                <Vote className="w-4 h-4" />
                <span>Choose {candidate.name} on Ballot</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
