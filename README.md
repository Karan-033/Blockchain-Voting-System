# Premium Blockchain-Powered Voting System

A decentralized, tamper-proof, and real-time voting ledger built using Python, Flask, and Vanilla CSS/JavaScript. The application operates a light in-memory Proof-of-Work blockchain consensus, preventing double-voting and ensuring the immutability of cast ballots.

---

## 🌟 Overview & Key Features

- **Direct Voter Self-Authentication**: Voters submit their credentials (`Name`, `Age`, `Aadhar`) directly when casting their ballots. Eligibility (Age $\ge$ 18) and formatting are verified in real-time.
- **Dynamic Candidate Setup**: Register parties dynamically during the Preparation phase before opening the polls.
- **Immutable Blockchain Ledger**: Every cast ballot is encapsulated inside a blocks transaction pool and automatically mined.
- **Real-Time Data Dashboard**: Poll results, total vote counts, and the blockchain ledger update dynamically on the public interface.
- **Proof-of-Work Consensus**: Implements cryptographic mining to secure voter consensus without relying on centralized databases.

---

## 👶 Beginner's Guide: How It Works

### What is Blockchain?
Think of a blockchain as a digital diary that is shared. Each page in this diary represents a **Block**. In our system:
1. When you cast a ballot, we write your vote details onto a new page.
2. To lock the page, the system solves a hard mathematical puzzle. This process is called **Mining**.
3. Once the page is locked, it is linked cryptographically to the previous page. If anyone attempts to change an old page, the chain break becomes visible to everyone. This is called **Immutability**.

### Step-by-Step Installation

1. **Verify Python Configuration**:
   Make sure you have Python 3.10+ installed on your computer. You can verify it by opening your terminal (PowerShell, Command Prompt, or terminal emulator) and running:
   ```cmd
   python --version
   ```

2. **Clone the Repository**:
   Download this project directory to your local environment.

3. **Install Dependencies**:
   Our system uses standard library components. You only need to install `Flask` (to host the local web server):
   ```cmd
   pip install flask
   ```

4. **Start the Web Server**:
   Launch the system by running:
   ```cmd
   python app.py
   ```
   The terminal will output:
   `* Serving Flask app 'app.py' (lazy loading)`
   `* Running on http://127.0.0.1:5000`

5. **Open in Browser**:
   - Access the **Public Voting Portal**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
   - Access the **Admin Control Panel**: [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin)

---

## 🚀 Advanced Developer's Deep Dive

### System & Directory Architecture

```text
├── app.py                  # API endpoints, route controls, and state management
├── blockchain.py           # Core blockchain structure (Block, POW, validator)
├── templates/
│   ├── index.html          # Public voting portal (cast ballots, view live standings)
│   └── admin.html          # Admin dashboard (start/stop polls, register candidates)
├── verify_api.py           # Automated E2E REST API assertions script
└── verify_blockchain.py    # Unit tests for the cryptographic ledger module
```

### Technical Stack & Configurations
- **Web Layer**: Flask (running on port `5000`), serving HTML/CSS/JS.
- **Ledger Layer**: Custom Python implementation of SHA-256 cryptographic hashing.
- **Difficulty target**: In-memory Proof-of-Work difficulty target is set to `2` leading zeroes (e.g., `00...`).
- **State Controller**:
  - `PREPARATION`: Candidate registration is active. Voting is disabled.
  - `LIVE`: Voting is active. Candidate registration is locked.
  - `ENDED`: Polls are closed. Ledger is final. No changes allowed.

### Core REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/status` | Returns the current phase (`PREPARATION`, `LIVE`, `ENDED`) and active status. |
| `POST` | `/parties` | Registers a new candidate (only active in `PREPARATION` phase). |
| `GET` | `/parties` | Fetches the set of registered candidates. |
| `POST` | `/vote` | Accepts JSON `{"name": "...", "age": 21, "aadhar": "...", "party": "..."}`. Auto-mines the vote block. |
| `GET` | `/chain` | Returns the full list of blocks on the ledger. |
| `GET` | `/results` | Returns live standings from mined blocks. |

### Running the Test Suite
We provide two separate automated verification test scripts.

To test the cryptographic blockchain module (immutability, double-voting prevention):
```cmd
python verify_blockchain.py
```

To run complete E2E client-server integration tests (lifecycle, validation failures, invalid inputs):
```cmd
python verify_api.py
```
