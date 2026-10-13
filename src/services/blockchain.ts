import { Block, VoteTransaction, AuditVerificationResult } from '../types/voting';
import { sha256, calculateMerkleRoot } from './crypto';

const STORAGE_KEY = 'bharatchain_ledger_blocks_v1';
const DIFFICULTY = 2; // Required leading zeroes for Proof of Work

export class Blockchain {
  private chain: Block[];

  constructor() {
    this.chain = this.loadFromStorage();
    if (this.chain.length === 0) {
      this.chain = [this.createGenesisBlock()];
      this.saveToStorage();
    }
  }

  private createGenesisBlock(): Block {
    const timestamp = 1714546800000; // ECI Genesis Timestamp
    const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const merkleRoot = sha256('ECI_BHARATCHAIN_GENESIS_ROOT');
    
    // Find nonce that satisfies difficulty
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(DIFFICULTY);
    
    while (true) {
      hash = this.calculateBlockHash(0, timestamp, [], previousHash, nonce, merkleRoot);
      if (hash.startsWith(target)) break;
      nonce++;
    }

    return {
      index: 0,
      timestamp,
      transactions: [],
      previousHash,
      hash,
      nonce,
      merkleRoot,
    };
  }

  public calculateBlockHash(
    index: number,
    timestamp: number,
    transactions: VoteTransaction[],
    previousHash: string,
    nonce: number,
    merkleRoot: string
  ): string {
    const rawData = `${index}${timestamp}${JSON.stringify(transactions)}${previousHash}${nonce}${merkleRoot}`;
    return sha256(rawData);
  }

  public getChain(): Block[] {
    return [...this.chain];
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Mine a new block containing the vote transaction
   */
  public mineVote(transaction: VoteTransaction): { block: Block; success: boolean } {
    const previousBlock = this.getLatestBlock();
    const index = previousBlock.index + 1;
    const timestamp = Date.now();
    const transactions = [transaction];
    const previousHash = previousBlock.hash;
    const merkleRoot = calculateMerkleRoot([transaction.txId]);

    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(DIFFICULTY);

    // Proof of Work mining loop
    while (true) {
      hash = this.calculateBlockHash(index, timestamp, transactions, previousHash, nonce, merkleRoot);
      if (hash.startsWith(target)) break;
      nonce++;
    }

    const newBlock: Block = {
      index,
      timestamp,
      transactions,
      previousHash,
      hash,
      nonce,
      merkleRoot,
    };

    this.chain.push(newBlock);
    this.saveToStorage();

    return { block: newBlock, success: true };
  }

  /**
   * Check if a specific voter hash has already been mined in any block
   */
  public hasVoterVoted(voterHash: string): boolean {
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.voterHash === voterHash) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get total vote count per candidate across the entire chain
   */
  public getCandidateTally(): Record<string, number> {
    const tally: Record<string, number> = {};
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        tally[tx.candidateId] = (tally[tx.candidateId] || 0) + 1;
      }
    }
    return tally;
  }

  /**
   * Full cryptographic validation of the ledger
   * Verifies each block hash, previousHash linkage, and PoW requirement.
   */
  public verifyLedger(): AuditVerificationResult {
    const target = '0'.repeat(DIFFICULTY);

    for (let i = 0; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];

      // 1. Genesis block check
      if (i === 0) {
        const recomputedHash = this.calculateBlockHash(
          currentBlock.index,
          currentBlock.timestamp,
          currentBlock.transactions,
          currentBlock.previousHash,
          currentBlock.nonce,
          currentBlock.merkleRoot
        );

        if (currentBlock.hash !== recomputedHash) {
          return {
            isValid: false,
            brokenBlockIndex: 0,
            details: `Genesis Block hash mismatch: stored "${currentBlock.hash}" vs computed "${recomputedHash}"`,
            timestamp: Date.now(),
            blocksChecked: 1,
          };
        }
        continue;
      }

      const previousBlock = this.chain[i - 1];

      // 2. Previous hash linkage check
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          isValid: false,
          brokenBlockIndex: i,
          details: `Broken Chain at Block #${currentBlock.index}: previousHash "${currentBlock.previousHash.substring(0, 12)}..." does not match Block #${previousBlock.index} hash "${previousBlock.hash.substring(0, 12)}..."`,
          timestamp: Date.now(),
          blocksChecked: i + 1,
        };
      }

      // 3. Recompute block hash
      const recomputedHash = this.calculateBlockHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.transactions,
        currentBlock.previousHash,
        currentBlock.nonce,
        currentBlock.merkleRoot
      );

      if (currentBlock.hash !== recomputedHash) {
        return {
          isValid: false,
          brokenBlockIndex: i,
          details: `Data Tampered in Block #${currentBlock.index}: stored hash "${currentBlock.hash.substring(0, 12)}..." does not match cryptographic hash "${recomputedHash.substring(0, 12)}..."`,
          timestamp: Date.now(),
          blocksChecked: i + 1,
        };
      }

      // 4. Proof of Work check
      if (!currentBlock.hash.startsWith(target)) {
        return {
          isValid: false,
          brokenBlockIndex: i,
          details: `Invalid Nonce/PoW at Block #${currentBlock.index}: Hash "${currentBlock.hash}" does not meet difficulty target "${target}"`,
          timestamp: Date.now(),
          blocksChecked: i + 1,
        };
      }
    }

    return {
      isValid: true,
      details: `Ledger 100% Cryptographically Valid. All ${this.chain.length} blocks checked with matching SHA-256 hashes and proof-of-work.`,
      timestamp: Date.now(),
      blocksChecked: this.chain.length,
    };
  }

  /**
   * Educational / Audit feature: Simulate tampering with a block to demonstrate detection
   */
  public simulateTamper(blockIndex: number, alteredCandidateName: string = 'Fraudulent Candidate'): boolean {
    if (blockIndex <= 0 || blockIndex >= this.chain.length) return false;
    const block = this.chain[blockIndex];
    if (block.transactions.length === 0) return false;

    // Mutate the transaction payload inside the block without recalculating the hash
    block.transactions[0].candidateName = alteredCandidateName;
    block.isTampered = true;
    this.saveToStorage();
    return true;
  }

  /**
   * Reset / repair the chain back to valid state
   */
  public resetLedger(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.chain = [this.createGenesisBlock()];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.chain));
    } catch (err) {
      console.error('Failed to save blockchain to localStorage', err);
    }
  }

  private loadFromStorage(): Block[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load blockchain from localStorage', err);
    }
    return [];
  }
}

// Global singleton instance for the session
export const blockchainInstance = new Blockchain();
