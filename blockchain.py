import json
import time
from hashlib import sha256

class Block:
    def __init__(self, index, transactions, timestamp, previous_hash, nonce=0):
        self.index = index
        self.transactions = transactions
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.nonce = nonce

    def compute_hash(self):
        """
        A function that returns the hash of the block contents.
        """
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return sha256(block_string.encode()).hexdigest()

class Blockchain:
    # Difficulty of Proof of Work algorithm
    difficulty = 2

    def __init__(self):
        self.unconfirmed_transactions = []
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        """
        A function to generate genesis block and appends it to
        the chain. The block has index 0, previous_hash as "0", and
        a valid hash.
        """
        genesis_block = Block(0, [], time.time(), "0")
        genesis_block.hash = self.proof_of_work(genesis_block)
        self.chain.append(genesis_block)

    @property
    def last_block(self):
        return self.chain[-1]

    def add_block(self, block, proof):
        """
        A function that adds the block to the chain after verification.
        Verification includes:
        - Checking if proof is valid (i.e. starts with difficulty number of zeros and matches the block hash).
        - Checking if previous_hash of the block matches the hash of the latest block on the chain.
        """
        previous_hash = self.last_block.hash

        if previous_hash != block.previous_hash:
            return False

        if not self.is_valid_proof(block, proof):
            return False

        block.hash = proof
        self.chain.append(block)
        return True

    def is_valid_proof(self, block, block_hash):
        """
        Check if block_hash is a valid hash of block and satisfies
        the difficulty criteria.
        """
        return (block_hash.startswith('0' * Blockchain.difficulty) and
                block_hash == block.compute_hash())

    def proof_of_work(self, block):
        """
        Function that tries different values of nonce to get a hash
        that satisfies our difficulty criteria.
        """
        block.nonce = 0
        computed_hash = block.compute_hash()
        while not computed_hash.startswith('0' * Blockchain.difficulty):
            block.nonce += 1
            computed_hash = block.compute_hash()
        return computed_hash

    def is_voter_voted(self, voter_id):
        """
        Check if the voter has already voted (in unconfirmed transactions or in the blockchain).
        """
        # Check unconfirmed transactions
        for tx in self.unconfirmed_transactions:
            if tx.get("voter_id") == voter_id:
                return True
        # Check mined blocks
        for block in self.chain:
            for tx in block.transactions:
                if tx.get("voter_id") == voter_id:
                    return True
        return False

    def add_new_transaction(self, transaction):
        voter_id = transaction.get("voter_id")
        if not voter_id:
            return False
            
        if self.is_voter_voted(voter_id):
            return False
            
        self.unconfirmed_transactions.append(transaction)
        return True

    def mine(self):
        """
        This interface serves as an easy way to mine the unconfirmed block.
        It packs the unconfirmed transactions, calculates Proof of Work, and
        adds the new block to the chain.
        """
        if not self.unconfirmed_transactions:
            return False

        last_block = self.last_block

        new_block = Block(
            index=last_block.index + 1,
            transactions=self.unconfirmed_transactions,
            timestamp=time.time(),
            previous_hash=last_block.hash
        )

        proof = self.proof_of_work(new_block)
        if self.add_block(new_block, proof):
            # Block successfully added, clear transactions
            self.unconfirmed_transactions = []
            return new_block
        return False

    def check_chain_validity(self):
        """
        Helper method to verify the entire blockchain integrity.
        """
        result = True
        previous_hash = "0"

        for block in self.chain:
            block_hash = block.hash
            # Temporarily remove hash field to recompute and verify
            delattr(block, "hash")

            if not self.is_valid_proof(block, block_hash) or previous_hash != block.previous_hash:
                result = False
                # Restore hash attribute on failure so object remains intact
                block.hash = block_hash
                break

            block.hash = block_hash
            previous_hash = block_hash

        return result
