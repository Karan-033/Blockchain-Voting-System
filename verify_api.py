import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
        json_data = json.dumps(data).encode("utf-8")
        req.data = json_data
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            return status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"message": body}

def run_e2e_api_tests():
    print("Starting E2E API Verification Tests...")
    
    # 0. Register candidates dynamically
    print("\nRegistering candidates dynamically...")
    status, res = make_request(f"{BASE_URL}/parties", method="POST", data={"party": "Democratic Party"})
    assert status == 201, f"Failed to register Democratic Party: {res}"
    status, res = make_request(f"{BASE_URL}/parties", method="POST", data={"party": "Republican Party"})
    assert status == 201, f"Failed to register Republican Party: {res}"

    # Test voting restriction block before starting election
    print("\nTesting vote rejection before polls open...")
    payload = {"name": "Amit Sharma", "age": 32, "aadhar": "123456789012", "party": "Democratic Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 400, "Should reject vote because polls are closed"
    print("Correctly rejected vote before polls open. Error Message:", res["message"])

    # Start voting
    print("\nActivating polls...")
    status, res = make_request(f"{BASE_URL}/start_voting", method="POST")
    assert status == 200, f"Failed to start voting: {res}"
    print("Poll status activated:", res["message"])

    # Test candidate registration restriction after starting voting
    print("\nTesting candidate registration block after starting voting...")
    status, res = make_request(f"{BASE_URL}/parties", method="POST", data={"party": "Late Candidate"})
    assert status == 400, "Should reject late candidate registration"
    print("Correctly blocked late candidate registration. Error Message:", res["message"])

    # 1. Fetch parties List
    print("\nFetching parties list...")
    status, parties = make_request(f"{BASE_URL}/parties")
    assert status == 200, "Failed to fetch parties"
    print("Candidates found:", parties)
    assert "Democratic Party" in parties and "Republican Party" in parties, "Required candidates not found"

    # Refresh endpoint checks (should start with genesis block and 0 votes)
    status, results = make_request(f"{BASE_URL}/results")
    assert status == 200
    assert results["total_mined_votes"] == 0, "Initial mined votes should be 0"

    # Test underage voter registration check directly on casting
    print("Testing underage voter rejection directly on casting...")
    underage_voter = {"name": "Young Voter", "age": 17, "aadhar": "111122223333", "party": "Democratic Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=underage_voter)
    assert status == 400
    print("Correctly blocked underage voter. Response:", res["message"])

    # Test invalid aadhar format registration check directly on casting
    print("Testing invalid aadhar voter rejection directly on casting...")
    bad_aadhar_voter = {"name": "Bad Aadhar", "age": 20, "aadhar": "12345", "party": "Democratic Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=bad_aadhar_voter)
    assert status == 400
    print("Correctly blocked invalid aadhar. Response:", res["message"])

    # 2. Vote for Amit Sharma -> Democratic Party
    print("\nCasting vote for Amit Sharma -> Democratic Party...")
    payload = {"name": "Amit Sharma", "age": 32, "aadhar": "123456789012", "party": "Democratic Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 201, f"Failed: {res}"
    print("Response:", res)

    # 3. Test double-voting check
    print("\nTesting double-voting checker for Amit Sharma -> Republican Party...")
    payload = {"name": "Amit Sharma", "age": 32, "aadhar": "123456789012", "party": "Republican Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 400, "Double-vote should have been rejected!"
    print("Correctly blocked double vote. Response error-msg:", res["message"])

    # 4. Cast voter Priya Patel -> Republican Party
    print("\nCasting vote for Priya Patel -> Republican Party...")
    payload = {"name": "Priya Patel", "age": 28, "aadhar": "987654321098", "party": "Republican Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 201, f"Failed: {res}"
    print("Response:", res)

    # Check pending pool status (should be 0 since it is auto-mined)
    status, results = make_request(f"{BASE_URL}/results")
    assert status == 200
    assert results["total_pending_votes"] == 0, "Pending votes should be 0 because of auto-mining"
    assert results["total_mined_votes"] == 2, "Mined votes should be 2"
    print("\nPending votes tally matches: 0 pending, 2 mined.")

    # 5. Check manual mine reject
    print("\nVerifying that manual mining returns 400 when pool is empty...")
    status, mine_data = make_request(f"{BASE_URL}/mine")
    assert status == 400
    print("Correctly rejected manual mine. Message:", mine_data["message"])
    
    # 6. Verify Blockchain ledger updates (Genesis + Block 1 + Block 2)
    print("\nFetching full blockchain details...")
    status, chain_data = make_request(f"{BASE_URL}/chain")
    assert status == 200
    print(f"New chain length: {chain_data['length']}")
    assert chain_data["length"] == 3, "Chain must consist of 3 blocks (Genesis + Block 1 + Block 2)"
    
    # 7. Check finalized standings
    print("\nFetching finalized election standings...")
    status, results = make_request(f"{BASE_URL}/results")
    assert status == 200
    print("Final Standings (Mined):", results["mined_results"])
    assert results["mined_results"]["Democratic Party"] == 1, "Democratic Party must have 1 vote"
    assert results["mined_results"]["Republican Party"] == 1, "Republican Party must have 1 vote"
    assert results["total_mined_votes"] == 2, "Total mined votes must be 2"
    assert results["total_pending_votes"] == 0, "Pending votes should be cleared"

    # 8. Test double voting after mining
    print("\nTesting double-voting checker for Amit Sharma against finalized blocks...")
    payload = {"name": "Amit Sharma", "age": 32, "aadhar": "123456789012", "party": "Independent Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 400, "Double-vote should have been rejected (post-mining)!"
    print("Correctly blocked double vote post-mining details:", res["message"])

    # 9. Stop the election
    print("\nStopping election...")
    status, res = make_request(f"{BASE_URL}/stop_voting", method="POST")
    assert status == 200, f"Failed to stop election: {res}"
    print("Election successfully stopped:", res["message"])

    # Verify state is ENDED
    status, res = make_request(f"{BASE_URL}/status")
    assert status == 200
    assert res["election_state"] == "ENDED"
    print("Election state successfully transitioned to ENDED.")

    # Test voting blocks in ended state
    print("\nTesting vote rejection in ENDED state...")
    payload = {"name": "Priya Patel", "age": 28, "aadhar": "987654321098", "party": "Democratic Party"}
    status, res = make_request(f"{BASE_URL}/vote", method="POST", data=payload)
    assert status == 400
    print("Correctly blocked vote in ENDED state:", res["message"])

    # Test candidate registration block in ended state
    print("\nTesting registration rejection in ENDED state...")
    status, res = make_request(f"{BASE_URL}/parties", method="POST", data={"party": "Late Candidate 2"})
    assert status == 400
    print("Correctly blocked registration in ENDED state:", res["message"])

    # 10. Test resetting the election
    print("\nResetting election...")
    status, res = make_request(f"{BASE_URL}/reset_election", method="POST")
    assert status == 200, f"Failed to reset election: {res}"
    print("Election successfully reset:", res["message"])

    # Verify state is back to PREPARATION and list is empty
    status, res = make_request(f"{BASE_URL}/status")
    assert status == 200
    assert res["election_state"] == "PREPARATION"
    
    status, parties = make_request(f"{BASE_URL}/parties")
    assert status == 200
    assert len(parties) == 0, "Roster should be empty after reset"
    print("Verification completed: state is back to PREPARATION and roster is clean!")

    print("\n--- ALL E2E API VERIFICATION TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    time.sleep(1)
    run_e2e_api_tests()
