from blockchain import Blockchain, Block
import time

def test_blockchain():
    print("Initializing Blockchain...")
    blockchain = Blockchain()
    
    # Check genesis block
    print(f"Genesis Block Hash: {blockchain.chain[0].hash}")
    assert len(blockchain.chain) == 1, "Should only have genesis block"
    assert blockchain.chain[0].previous_hash == "0", "Genesis previous hash must be '0'"
    
    # 1. Add normal transactions (votes)
    print("\nAdding valid transactions...")
    tx1 = {"voter_id": "VOID001", "party": "Democratic Party", "timestamp": time.time()}
    tx2 = {"voter_id": "VOID002", "party": "Republican Party", "timestamp": time.time()}
    
    assert blockchain.add_new_transaction(tx1) is True, "Should succeed adding tx1"
    assert blockchain.add_new_transaction(tx2) is True, "Should succeed adding tx2"
    assert len(blockchain.unconfirmed_transactions) == 2, "Unconfirmed tx count should be 2"
    
    # 2. Check double voting under unconfirmed
    print("Testing double voting prevention (in unconfirmed pool)...")
    tx1_dup = {"voter_id": "VOID001", "party": "Independent", "timestamp": time.time()}
    assert blockchain.add_new_transaction(tx1_dup) is False, "Should block duplicate voter in unconfirmed pool"
    
    # 3. Mine first block
    print("\nMining block 1...")
    block1 = blockchain.mine()
    assert block1 is not False, "Mining should succeed"
    assert len(blockchain.chain) == 2, "Chain length should be 2"
    assert len(blockchain.unconfirmed_transactions) == 0, "Unconfirmed transactions should be cleared"
    print(f"Mined Block 1 Hash: {block1.hash} (nonce: {block1.nonce})")
    assert block1.hash.startswith("00"), "Hash should satisfy difficulty requirement (2 zeros)"
    
    # 4. Check double voting after transaction is mined
    print("Testing double voting prevention (against already mined blocks)...")
    tx1_mined_dup = {"voter_id": "VOID001", "party": "Democratic Party", "timestamp": time.time()}
    assert blockchain.add_new_transaction(tx1_mined_dup) is False, "Should block duplicate voter already in chain"
    
    # 5. Check chain validity
    print("Verifying overall chain integrity...")
    assert blockchain.check_chain_validity() is True, "Chain must be valid"
    
    # 6. Tamper check
    print("Simulating block tampering...")
    # Tamper with block 1 info
    blockchain.chain[1].transactions[0]["party"] = "Green Party"
    # Check chain integrity
    assert blockchain.check_chain_validity() is False, "Chain verification must fail after tampering"
    print("Tamper verification succeeded (detected invalid chain)")
    
    print("\n--- ALL BLOCKCHAIN CORE TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    test_blockchain()
