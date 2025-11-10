# LangDAO - Actual Architecture (As Implemented)

**Last Updated:** November 10, 2025

This document describes the **actual implemented architecture**, not the planned/documented one.

---

## High-Level Overview

LangDAO is a real-time language tutoring platform where students and tutors connect via Socket.io, conduct video sessions via WebRTC, and settle payments on-chain using a custom timestamp-based payment system.

```
┌─────────────┐
│   Student   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Socket.io  │   │   WebRTC    │
│   Backend   │   │   Server    │
│  (Express)  │   │  (Custom)   │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ▼                 │
┌─────────────┐          │
│    Redis    │          │
│   (State)   │          │
└─────────────┘          │
       │                 │
       ▼                 ▼
┌─────────────────────────┐
│   LangDAO Contract      │
│   (Timestamp-based      │
│    Payment System)      │
└─────────────────────────┘
```

---

## Core Components

### 1. Frontend (Next.js + Scaffold-ETH 2)

**Location:** `webapp/packages/nextjs/`

**Key Pages:**
- `/` - Landing page
- `/find-tutor` - Student flow (request tutor, accept offers, start session)
- `/tutor` - Tutor flow (set availability, accept requests, join sessions)
- `/dashboard` - User dashboard (session history, earnings)

**Tech Stack:**
- Next.js 14 (App Router)
- wagmi + viem (Web3 interactions)
- Socket.io-client (Real-time matching)
- Thirdweb (Wallet connection)
- TailwindCSS + Framer Motion (UI)

**Key Features:**
- Wallet connection (WalletConnect, MetaMask, etc.)
- Real-time tutor/student matching
- Session lifecycle management
- PYUSD token interactions

### 2. Backend (Express + Socket.io + Redis)

**Location:** `backend/src/`

**Purpose:** Real-time matching and session coordination

**Tech Stack:**
- Express.js (HTTP API)
- Socket.io (Real-time events)
- Redis (State management)
- ethers.js (Blockchain interactions)

**Key Responsibilities:**
- Match students with available tutors
- Manage pending requests and acceptances
- Track session state (waiting, active, ended)
- Call `endSession()` when WebRTC detects disconnect
- Rate limiting and security

**Socket Events:**
```javascript
// Tutor events
tutor:setAvailable        // Tutor goes online
tutor:set-unavailable     // Tutor goes offline
tutor:accept-request      // Tutor accepts student request
tutor:decline-request     // Tutor declines student request
tutor:withdraw-acceptance // Tutor cancels their acceptance

// Student events
student:request-tutor     // Student requests a tutor
student:cancel-request    // Student cancels their request
student:accept-tutor      // Student accepts a tutor offer
student:reject-tutor      // Student rejects a tutor offer
student:entered-room      // Student joined video call
student:rejected-transaction // Student rejected wallet tx

// Session events
session:started           // Blockchain tx confirmed
```

**Redis Data Structures:**
```
tutors:available          // Set of available tutor addresses
tutor:{address}           // Hash: {socketId, language, ratePerSecond}
student_request:{id}      // Hash: {studentAddress, language, budgetPerSecond}
session:{requestId}       // Hash: {studentAddress, tutorAddress, languageId}
socket_to_address         // Hash: socketId -> address mapping
rate_limit:{socketId}     // Rate limiting counter
```

### 3. Smart Contract (Solidity)

**Location:** `webapp/packages/hardhat/contracts/LangDAO.sol`

**Purpose:** Session management and payment processing

**Key Features:**

#### User Registration
```solidity
registerStudent(uint8 targetLanguage, uint256 budgetPerSec)
registerTutor(uint8[] languages, uint256 ratePerSecond)
```

#### Funds Management
```solidity
depositFunds(uint256 amount)        // Student deposits PYUSD
withdrawFunds(uint256 amount)       // Student withdraws PYUSD
```

#### Session Lifecycle
```solidity
startSession(address tutor, uint8 language) returns (uint256 sessionId)
endSession(address tutor)
```

#### Payment Calculation
```solidity
// In endSession():
uint256 duration = block.timestamp - session.startTime;
uint256 payment = duration * session.ratePerSecond;

// Cap at available balance to prevent revert
uint256 totalPayment = min(payment, studentBalance);

// Transfer PYUSD from contract to tutor
IERC20(PYUSD_TOKEN).transfer(tutor, totalPayment);
```

**Language System:**
- 38 supported languages (English=0, Spanish=1, French=2, etc.)
- Each tutor can teach multiple languages with different rates
- Language IDs are uint8 for gas efficiency

**Payment Token:**
- PYUSD (PayPal USD) on Sepolia testnet
- Address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

### 4. WebRTC Server (Custom Implementation)

**Location:** `backend/webRTC-implementation-LangDAO/`

**Purpose:** Video call infrastructure (custom WebRTC implementation)

**Key Features:**
- Peer-to-peer video/audio calls
- Session heartbeat monitoring
- Disconnect detection
- Sends events to main backend when:
  - User disconnects
  - Call ends
  - Heartbeat timeout (2 minutes)

**Integration:**
```javascript
// WebRTC server sends HTTP POST to backend
POST /api/webrtc-events
{
  "type": "session-ended",
  "sessionId": "req_abc123",
  "endedBy": "student",
  "timestamp": 1234567890
}

// Backend calls smart contract
await langDAOContract.endSession(tutorAddress);
```

---

## Complete User Flow

### Student Journey

1. **Connect Wallet**
   - Student connects wallet (MetaMask, WalletConnect, etc.)
   - Frontend checks if registered on-chain

2. **Register (if needed)**
   - Call `registerStudent(targetLanguage, budgetPerSec)`
   - Deposit PYUSD via `depositFunds(amount)`

3. **Request Tutor**
   - Select language and budget
   - Emit `student:request-tutor` socket event
   - Backend stores request in Redis
   - Backend notifies all matching tutors

4. **Wait for Offers**
   - Tutors who accept emit `tutor:accept-request`
   - Student receives `student:tutor-accepted` events
   - UI shows list of tutors who accepted

5. **Select Tutor**
   - Student clicks "Accept" on a tutor
   - Emit `student:accept-tutor` socket event
   - Backend notifies rejected tutors
   - Backend notifies selected tutor

6. **Start Session (Blockchain)**
   - Student approves PYUSD spending (if needed)
   - Call `startSession(tutorAddress, languageId)`
   - Transaction mined → session starts on-chain
   - Emit `session:started` socket event

7. **Enter Video Call**
   - Student redirected to WebRTC room
   - Emit `student:entered-room` socket event
   - Backend notifies tutor to join

8. **Video Session**
   - Both parties in WebRTC call
   - WebRTC server monitors connection
   - Payment accrues per second on-chain

9. **End Session**
   - Either party clicks "End Call"
   - WebRTC server → Backend → `endSession(tutorAddress)`
   - Payment calculated: `duration * ratePerSecond`
   - PYUSD transferred to tutor
   - Both parties redirected to dashboard

### Tutor Journey

1. **Connect Wallet**
   - Tutor connects wallet

2. **Register (if needed)**
   - Call `registerTutor(languages[], ratePerSecond)`
   - Set languages and rates

3. **Set Available**
   - Select language to teach
   - Set rate per second
   - Emit `tutor:setAvailable` socket event
   - Backend stores in Redis

4. **Receive Requests**
   - Backend sends `tutor:incoming-request` for matching students
   - UI shows pending student requests

5. **Accept Request**
   - Tutor clicks "Accept"
   - Emit `tutor:accept-request` socket event
   - Backend notifies student

6. **Wait for Student Selection**
   - Student may accept or reject
   - If accepted: receive `tutor:student-selected`
   - If rejected: receive `tutor:student-rejected`

7. **Wait for Blockchain Confirmation**
   - Student calls `startSession()` on-chain
   - Tutor receives `session:started` socket event

8. **Wait for Student to Enter Room**
   - Student enters WebRTC room first
   - Tutor receives `student:in-room` socket event
   - Tutor can now join

9. **Join Video Call**
   - Tutor joins WebRTC room
   - Session is live

10. **End Session**
    - Either party ends call
    - Backend calls `endSession()`
    - Tutor receives PYUSD payment
    - Redirect to dashboard

---

## Payment System Details

### How It Works

**No streaming protocol needed** - payments are calculated at session end based on timestamps.

#### 1. Student Deposits Funds
```solidity
// Student deposits PYUSD into contract
depositFunds(1000 * 10**6); // 1000 PYUSD (6 decimals)

// Contract stores balance
studentBalances[student][PYUSD_TOKEN] = 1000 * 10**6;
```

#### 2. Session Starts
```solidity
// Student calls startSession()
startSession(tutorAddress, SPANISH);

// Contract records start time
session.startTime = block.timestamp; // e.g., 1699999000
session.ratePerSecond = 100000; // 0.1 PYUSD per second
```

#### 3. Session Ends
```solidity
// Backend or user calls endSession()
endSession(tutorAddress);

// Contract calculates payment
uint256 duration = block.timestamp - session.startTime; // e.g., 600 seconds (10 min)
uint256 payment = duration * session.ratePerSecond; // 600 * 100000 = 60,000,000 (60 PYUSD)

// Cap at available balance
uint256 totalPayment = min(payment, studentBalance); // 60 PYUSD

// Transfer to tutor
IERC20(PYUSD_TOKEN).transfer(tutor, totalPayment);

// Update balances
studentBalances[student][PYUSD_TOKEN] -= totalPayment;
tutors[tutor].totalEarnings += totalPayment;
```

### Why This Approach?

**Advantages over Superfluid/Sablier:**
- ✅ Simpler implementation (no external dependencies)
- ✅ No liquidation risk
- ✅ No buffer requirements
- ✅ Easier to understand and audit
- ✅ Lower gas costs
- ✅ More predictable behavior

**Trade-offs:**
- ⚠️ Payment happens at end (not streaming in real-time)
- ⚠️ Requires trust that `endSession()` will be called
- ⚠️ Backend must be reliable to call `endSession()` on disconnect

**Mitigation:**
- WebRTC server monitors connection and calls `endSession()` on disconnect
- Heartbeat timeout (2 min) triggers auto-end
- Owner can emergency end sessions
- Student/tutor can both call `endSession()`

---

## Security Considerations

### Smart Contract
- ✅ Payment capped at student balance (no revert risk)
- ✅ Only student, tutor, or owner can end session
- ✅ Session must be active to end
- ✅ Student can't withdraw while in session
- ⚠️ No reentrancy guard (consider adding)
- ⚠️ No emergency pause mechanism

### Backend
- ✅ Rate limiting on socket events (10 req/min)
- ✅ Rate limiting on HTTP endpoints (100 req/min)
- ✅ CORS configured
- ✅ Helmet security headers
- ⚠️ Backend private key stored in .env (use secrets manager in prod)
- ⚠️ No authentication on socket events (anyone can emit)

### Frontend
- ✅ Wallet signature verification
- ✅ Transaction confirmation before session start
- ⚠️ No session timeout on frontend
- ⚠️ No balance check before long sessions

---

## Known Issues & Workarounds

### 1. Language Matching Mismatch

**Issue:** Frontend uses lowercase codes ("spanish"), backend uses strings, contract uses IDs (1).

**Current Workaround:** Frontend maps language codes to IDs before calling contract.

**Proper Fix:** Use language IDs everywhere (see `LANGUAGE_MATCHING_FIX.md`).

### 2. Socket Binding Race Condition

**Issue:** Tutor socket may not be bound when student starts session.

**Current Workaround:** Backend logs socket binding and checks before emitting.

**Proper Fix:** Add retry logic or confirmation handshake.

### 3. WebRTC Disconnect Detection

**Issue:** If WebRTC server is down, sessions won't auto-end.

**Current Workaround:** Student/tutor can manually call `endSession()`.

**Proper Fix:** Add redundant monitoring (frontend heartbeat, backend polling).

---

## Environment Variables

### Backend (.env)
```bash
# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Blockchain
RPC_URL=http://localhost:8545
BACKEND_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_WEBRTC_URL=http://localhost:3000
```

### WebRTC Server (.env)
```bash
PORT=3000
BACKEND_URL=http://localhost:4000/api/webrtc-events
```

---

## Deployment Architecture

### Development (Current)
```
localhost:3000  - Next.js frontend
localhost:4000  - Backend API + Socket.io
localhost:3000  - WebRTC server (different port)
localhost:6379  - Redis
localhost:8545  - Hardhat local blockchain
```

### Production (Planned)
```
Vercel          - Next.js frontend
Railway/Render  - Backend API + Socket.io
Railway/Render  - WebRTC server
Redis Cloud     - Redis
Sepolia         - Ethereum testnet
```

---

## Testing

### Manual Testing Flow

1. **Start all services:**
```bash
# Terminal 1: Blockchain
cd webapp/packages/hardhat && yarn chain

# Terminal 2: Redis
redis-server

# Terminal 3: Backend
cd backend && yarn dev

# Terminal 4: WebRTC
cd backend/webRTC-implementation-LangDAO && npm start

# Terminal 5: Frontend
cd webapp && yarn start
```

2. **Test student flow:**
   - Open http://localhost:3000
   - Connect wallet
   - Register as student
   - Deposit PYUSD
   - Request tutor

3. **Test tutor flow:**
   - Open http://localhost:3000 in incognito
   - Connect different wallet
   - Register as tutor
   - Set available
   - Accept student request

4. **Test session:**
   - Student accepts tutor
   - Student starts session (blockchain tx)
   - Both enter video call
   - End call
   - Verify payment on dashboard

### Automated Tests
⚠️ **Not implemented yet** - need to add:
- Smart contract tests (Hardhat)
- Backend integration tests (Jest + Supertest)
- Socket event tests (Socket.io-client)
- Frontend E2E tests (Playwright)

---

## Future Improvements

### Short-term
1. Add proper language ID mapping throughout stack
2. Add socket authentication (signed messages)
3. Add session timeout handling
4. Add balance warnings before long sessions
5. Add reentrancy guard to contract

### Medium-term
1. Implement POAP/credential minting
2. Add rating system
3. Add session history UI
4. Add tutor profiles
5. Add booking system

### Long-term
1. Multi-chain support
2. DAO governance for tutor vetting
3. Reputation system
4. Mobile app
5. Group sessions

---

## Summary

**What works:**
- Real-time matching via Socket.io
- Video calls via custom WebRTC implementation
- Timestamp-based payments via custom smart contract
- Full session lifecycle from request to payment

**What's different from docs:**
- No Superfluid/Sablier (custom payment system instead)
- No separate Matchmaker API (Socket.io backend handles it)
- No Relayer Bot (backend calls contract directly)
- No booking system (roulette matching only)
- No POAP/credentials (not implemented yet)

**Key insight:** The actual implementation is **simpler and more pragmatic** than the documented architecture. This is good - it's easier to understand, maintain, and debug.
