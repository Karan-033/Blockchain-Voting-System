export type ElectionPhase = 'SETUP' | 'ACTIVE' | 'PAUSED' | 'CONCLUDED';

export interface Candidate {
  id: string;
  serialNumber: number;
  name: string;
  party: string;
  symbol: string; // Emoji or SVG representation
  symbolName: string;
  constituency: string;
  color: string;
  bio?: string;
  partyPlatform?: string[]; // Key manifesto points
  keyAchievements?: string[]; // Civic & public service track record
  education?: string;
  affidavitSummary?: {
    criminalCases: number;
    declaredAssets: string;
    profession: string;
  };
  registeredAt: number;
}

export interface Voter {
  epicNumber: string; // Electoral Photo Identity Card (e.g. DEL8849201)
  fullName: string;
  fatherName?: string; // Father's / Guardian's Full Name
  dob: string; // YYYY-MM-DD
  aadhaarNumber?: string; // 12-digit UIDAI Aadhaar Number
  state: string;
  constituency: string; // Registered Parliamentary Constituency
  gender?: 'Male' | 'Female' | 'Other';
  voterPin: string; // Secret 6-digit Voter Security PIN issued by ECI during registration (like UPI PIN)
  hasVoted: boolean;
  votedAt?: number;
  txHash?: string;
  registeredAt?: number;
}

export interface ECIAuthSession {
  isAuthenticated: boolean;
  officerId: string;
  officerName: string;
  designation: string;
  constituency: string; // Authenticated Parliamentary Constituency Jurisdiction
  authenticatedAt?: number;
  token?: string;
}

export interface VotersAuditReport {
  totalVoters: number;
  votedCount: number;
  pendingCount: number;
  turnoutPercentage: number;
  eligibleCount: number;
  underageCount: number;
  constituencyBreakdown: Record<string, { total: number; voted: number; pending: number }>;
  aadhaarUniqueCompliant: boolean;
  crossConstituencyViolations: number;
  blockchainIntegrityMatch: boolean;
}

export interface ECIBoothQRData {
  electionId: string;
  constituency: string;
  boothId: string;
  boothName: string;
  officerId: string;
  phase: ElectionPhase;
  generatedAt: number;
  qrPayloadUrl: string;
  signature: string;
}

export interface VoteTransaction {
  txId: string;
  voterHash: string; // Anonymized SHA-256 hash of EPIC to maintain ballot secrecy
  candidateId: string;
  candidateName: string;
  party: string;
  constituency: string;
  timestamp: number;
  digitalSignature: string;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: VoteTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  isTampered?: boolean;
}

export interface VerificationResult {
  eligible: boolean;
  reason: string;
  code: 'ELIGIBLE' | 'UNDERAGE' | 'NOT_FOUND_IN_ROLL' | 'ALREADY_VOTED' | 'VOTING_NOT_ACTIVE' | 'INVALID_EPIC_FORMAT';
  calculatedAge?: number;
  voter?: Voter;
}

export interface AuditVerificationResult {
  isValid: boolean;
  brokenBlockIndex?: number;
  details: string;
  timestamp: number;
  blocksChecked: number;
}
