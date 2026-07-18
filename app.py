from flask import Flask, jsonify, request, render_template
import time
from blockchain import Blockchain

app = Flask(__name__)

# Initialize blockchain
blockchain = Blockchain()

# Track election voting status ("PREPARATION", "LIVE", "ENDED")
PARTIES = []
election_state = "PREPARATION"

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/admin", methods=["GET"])
def admin():
    return render_template("admin.html")

@app.route("/status", methods=["GET"])
def get_status():
    return jsonify({
        "election_state": election_state,
        "voting_active": (election_state == "LIVE")
    })

@app.route("/start_voting", methods=["POST"])
def start_voting():
    global election_state
    if election_state != "PREPARATION":
        return jsonify({"message": f"Cannot start voting from state '{election_state}'"}), 400
    election_state = "LIVE"
    return jsonify({"message": "Voting has successfully started! Candidates are locked."}), 200

@app.route("/stop_voting", methods=["POST"])
def stop_voting():
    global election_state
    if election_state != "LIVE":
        return jsonify({"message": f"Cannot stop voting from state '{election_state}'"}), 400
    election_state = "ENDED"
    return jsonify({"message": "Voting has ended! Results are locked."}), 200

@app.route("/reset_election", methods=["POST"])
def reset_election():
    global election_state, PARTIES, blockchain
    election_state = "PREPARATION"
    PARTIES = []
    blockchain = Blockchain()
    return jsonify({"message": "Election reset to preparation phase! Roster and blockchain cleared."}), 200



@app.route("/parties", methods=["GET"])
def get_parties():
    return jsonify(PARTIES)

@app.route("/parties", methods=["POST"])
def add_party():
    if election_state != "PREPARATION":
        return jsonify({"message": "Cannot register new candidates unless in PREPARATION phase."}), 400
    data = request.get_json()
    if not data or "party" not in data:
        return jsonify({"message": "Party/Candidate name is required"}), 400
    party = str(data.get("party")).strip()
    if not party:
        return jsonify({"message": "Party/Candidate name cannot be empty"}), 400
    if party in PARTIES:
        return jsonify({"message": f"Party/Candidate '{party}' already exists!"}), 400
    PARTIES.append(party)
    return jsonify({"message": f"Party/Candidate '{party}' successfully added!", "parties": PARTIES}), 201

@app.route("/vote", methods=["POST"])
def cast_vote():
    if election_state != "LIVE":
        return jsonify({"message": f"Voting is not permitted in state '{election_state}'"}), 400
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid request data"}), 400
        
    name = data.get("name")
    age = data.get("age")
    aadhar = data.get("aadhar")
    party = data.get("party")
    
    if not name or age is None or not aadhar or not party:
        return jsonify({"message": "Name, Age, Aadhar, and Candidate Choice are required"}), 400
        
    # Trim inputs
    name = str(name).strip()
    aadhar = str(aadhar).strip()
    party = str(party).strip()
    
    try:
        age_int = int(age)
    except (ValueError, TypeError):
        return jsonify({"message": "Age must be an integer"}), 400
        
    if not name:
        return jsonify({"message": "Voter name cannot be empty"}), 400
    if age_int < 18:
        return jsonify({"message": "Voter must be at least 18 years old to cast a vote."}), 400
    if len(aadhar) != 12 or not aadhar.isdigit():
        return jsonify({"message": "Aadhar must be a 12-digit number"}), 400
    if party not in PARTIES:
        return jsonify({"message": f"Candidate selection '{party}' is invalid"}), 400
        
    # Check if voter already voted (Double-Voting Check by unique Aadhar number)
    if blockchain.is_voter_voted(aadhar):
        return jsonify({"message": f"Aadhar number '{aadhar}' has already cast a vote!"}), 400
        
    transaction = {
        "voter_id": aadhar,
        "voter_name": name,
        "party": party,
        "timestamp": time.time()
    }
    
    success = blockchain.add_new_transaction(transaction)
    if not success:
        return jsonify({"message": "Failed to record vote transaction"}), 400
        
    # Auto-mine block directly upon vote submission
    block = blockchain.mine()
    if not block:
        return jsonify({"message": "Vote registered but direct block mining failed"}), 500
        
    return jsonify({
        "message": f"Vote successfully cast and Block #{block.index} mined directly!", 
        "transaction": transaction,
        "mining_details": {
            "index": block.index,
            "nonce": block.nonce,
            "hash": block.hash
        }
    }), 201

@app.route("/mine", methods=["GET"])
def mine_block():
    block = blockchain.mine()
    if not block:
        return jsonify({"message": "No pending transactions to mine"}), 400
        
    return jsonify({
        "message": "Block successfully mined!",
        "index": block.index,
        "transactions": block.transactions,
        "timestamp": block.timestamp,
        "nonce": block.nonce,
        "previous_hash": block.previous_hash,
        "hash": block.hash
    }), 200

@app.route("/chain", methods=["GET"])
def get_chain():
    chain_data = []
    for block in blockchain.chain:
        chain_data.append({
            "index": block.index,
            "transactions": block.transactions,
            "timestamp": block.timestamp,
            "nonce": block.nonce,
            "previous_hash": block.previous_hash,
            "hash": block.hash
        })
    return jsonify({
        "length": len(chain_data),
        "chain": chain_data,
        "unconfirmed_count": len(blockchain.unconfirmed_transactions)
    }), 200

@app.route("/unconfirmed", methods=["GET"])
def get_unconfirmed():
    return jsonify(blockchain.unconfirmed_transactions), 200

@app.route("/results", methods=["GET"])
def get_results():
    # Tally votes from mined blocks
    votes_tally = {party: 0 for party in PARTIES}
    total_mined_votes = 0
    voted_ids = []
    
    for block in blockchain.chain:
        for tx in block.transactions:
            party = tx.get("party")
            voter_id = tx.get("voter_id")
            if party in votes_tally:
                votes_tally[party] += 1
                total_mined_votes += 1
                voted_ids.append(voter_id)

    # Count unconfirmed (pending) votes
    pending_votes_tally = {party: 0 for party in PARTIES}
    for tx in blockchain.unconfirmed_transactions:
        party = tx.get("party")
        if party in pending_votes_tally:
            pending_votes_tally[party] += 1
            
    return jsonify({
        "mined_results": votes_tally,
        "pending_results": pending_votes_tally,
        "total_mined_votes": total_mined_votes,
        "total_pending_votes": len(blockchain.unconfirmed_transactions),
        "all_voters": voted_ids
    }), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
