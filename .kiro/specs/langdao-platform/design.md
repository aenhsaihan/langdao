# Design Document

## Overview

LangDAO is a decentralized language tutoring platform built on Ethereum that connects students with native-speaking tutors through real-time matching and WebRTC video sessions. The system uses a three-tier architecture:

1. **Smart Contract Layer (Solidity)**: Manages user registration, session lifecycle, and per-second PYUSD payments
2. **Backend Service Layer (Node.js/Express)**: Handles real-time matching via Socket.io and Redis state management
3. **Frontend Layer (Next.js/React)**: Provides wallet-first UI with RainbowKit integration

The platform enables trustless, per-second payments using PYUSD stablecoin on Sepolia testnet, with WebRTC for peer-to-peer video communication.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Registration│  │   Matching   │  │  WebRTC UI   │      │
│  │  Components  │  │  Components  │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         │ wagmi/viem       │ Socket.io        │ WebRTC      │
│         ▼                  ▼                  ▼              │
└─────────────────────────────────────────────────────────────┘
         │                  │                  │
         │                  │                  │
┌────────▼──────────────────▼──────────────────▼──────────────┐
│              Backend Service (Express + Socket.io)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Matching    │  │   Session    │  │  Contract    │      │
│  │  Service     │  │   Service    │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│    ┌─────────┐        ┌─────────┐      ┌─────────┐         │
│    │  Redis  │        │  Redis  │      │ Ethers  │         │
│    └─────────┘        └─────────┘      └─────────┘         │
└──────────────────────────────────────────────┬──────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Smart Contract (Solidity on Sepolia)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Registration │  │   Sessions   │  │   Payments   │      │
│  │   Storage    │  │   Storage    │  │  (PYUSD)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              WebRTC Signaling Server (WebSocket)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Signaling  │  │  Heartbeat   │  │  Disconnect  │      │
│  │   Relay      │  │  Monitor     │  │  Detection   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 15 (App Router) + React 19
- wagmi 2.16.4 + viem 2.34.0 for Ethereum interactions
- RainbowKit 2.2.8 for wallet connection
- Socket.io-client 4.8.1 for real-time matching
- TailwindCSS + DaisyUI for styling

**Backend:**
- Express.js 4.18.2 with Socket.io 4.7.4
- Redis 4.6.10 for state management
- ethers.js 6.8.1 for contract interactions
- Helmet + CORS for security

**Smart Contracts:**
- Solidity (Hardhat 2.22.10)
- PYUSD ERC-20 token (6 decimals)
- OpenZeppelin 5.0.2 for standards

**WebRTC:**
- Custom Node.js WebSocket server
- Peer-to-peer video/audio connections


## Components and Interfaces

### Smart Contract (LangDAO.sol)

**Core Data Structures:**

```solidity
struct Student {
    uint8 targetLanguage;
    uint256 budgetPerSec;
    bool isRegistered;
}

struct Tutor {
    mapping(uint8 => bool) languages;
    mapping(uint8 => uint256) rateForLanguage;
    uint256 totalEarnings;
    uint256 sessionCount;
    bool isRegistered;
}

struct Session {
    address student;
    address tutor;
    address token;
    uint256 startTime;
    uint256 endTime;
    uint256 ratePerSecond;
    uint256 totalPaid;
    uint8 language;
    uint256 id;
    bool isActive;
}
```

**Key Functions:**

- `registerStudent(uint8 targetLanguage, uint256 budgetPerSec)`: Register as student
- `registerTutor(uint8[] languages, uint256 ratePerSecond)`: Register as tutor
- `depositFunds(uint256 amount)`: Deposit PYUSD into contract
- `withdrawFunds(uint256 amount)`: Withdraw PYUSD from contract
- `startSession(address tutorAddress, uint8 language)`: Start tutoring session
- `endSession(address tutorAddress)`: End session and process payment
- `isoToLanguage(string isoCode)`: Convert ISO code to language ID
- `languageToIso(uint8 language)`: Convert language ID to ISO code

### Backend Services

**MatchingService (matchingService.js):**

```javascript
// Redis-based tutor/student matching
setTutorAvailable(address, language, ratePerSecond)
removeTutorAvailable(address)
findMatchingTutors({ language, budgetPerSecond, studentAddress })
storeStudentRequest(requestId, requestData)
getStudentRequest(requestId)
removeStudentRequest(requestId)
getPendingStudentRequests(language, tutorRatePerSecond)
getTutorByAddress(address)
```

**SessionService (sessionService.js):**

```javascript
// Session lifecycle management
storeSessionMapping(sessionId, studentAddress, tutorAddress, languageId)
getSessionMapping(sessionId)
removeSessionMapping(sessionId)
```

**ContractService (contractService.js):**

```javascript
// Smart contract interaction with caching
getTutorInfo(address)
getStudentInfo(address)
getActiveSession(tutorAddress)
endSession(tutorAddress)
// Includes Redis caching layer for registration data
```

### Socket.io Events

**Client → Server:**
- `user:connect`: Bind socket to wallet address
- `tutor:setAvailable`: Set tutor availability
- `tutor:set-unavailable`: Remove tutor availability
- `tutor:withdraw-acceptance`: Tutor cancels acceptance
- `student:request-tutor`: Student requests matching
- `student:cancel-request`: Cancel tutor request
- `student:accept-tutor`: Student confirms tutor
- `student:rejected-transaction`: Student rejects transaction
- `student:entered-room`: Student joined WebRTC room
- `tutor:accept-request`: Tutor accepts student
- `tutor:decline-request`: Tutor declines student

**Server → Client:**
- `tutor:incoming-request`: Notify tutor of student request
- `tutor:available-updated`: Broadcast availability changes
- `tutor:withdrew-acceptance`: Notify student of tutor withdrawal
- `student:tutor-accepted`: Notify student of tutor acceptance
- `student:accept-tutor`: Notify tutor of student confirmation
- `student:in-room`: Notify tutor student is ready
- `student:request-sent`: Confirm request was sent
- `student:no-tutors-available`: No matching tutors found
- `tutor:student-rejected-transaction`: Notify tutor of rejection

### WebRTC Server Events

**WebSocket Messages:**
- `heartbeat`: Session health monitoring
- `chat`: Text messages during session
- `user-status`: Audio/video mute status
- `call-ended`: Session termination
- WebRTC signaling (offer, answer, ICE candidates)

**Backend Notifications:**
- `user-connected`: User joined WebRTC room
- `user-disconnected`: User left WebRTC room
- `session-heartbeat`: Periodic health check
- `session-ended`: Session completed

## Data Models

### Redis Data Structures

**Tutor Availability:**
```
tutor:{address} → Hash {
    address: string
    language: string
    ratePerSecond: string
    isAvailable: "true" | "false"
    lastSeen: ISO timestamp
    socketId: string
    contractData: JSON string
}

available_tutors → Set of addresses
tutors:{language} → Set of addresses
```

**Student Requests:**
```
request:{requestId} → Hash {
    studentAddress: string
    studentSocketId: string
    language: string
    budgetPerSecond: string
    createdAt: ISO timestamp
    status: "pending"
}

pending_requests → Set of requestIds
```

**Session Mappings:**
```
session:{sessionId} → Hash {
    sessionId: string
    studentAddress: string
    tutorAddress: string
    languageId: string
    startTime: timestamp
}
```

**Socket Bindings:**
```
socket_to_address → Hash {
    socketId: address
}
```

**Rate Limiting:**
```
rate_limit:{socketId} → Counter with 60s TTL
```

### Language Mapping

38 supported languages with bidirectional conversion:
- Language ID (uint8): 0-37
- ISO 639-1 codes: "en", "es", "fr", etc.
- Frontend constants with flags and names

**Examples:**
- 0 (ENGLISH) ↔ "en" ↔ 🇬🇧 English
- 1 (SPANISH) ↔ "es" ↔ 🇪🇸 Spanish
- 7 (CHINESE) ↔ "zh" ↔ 🇨🇳 Chinese


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Registration Properties

**Property 1: Wallet address validation**
*For any* wallet address input, the system should accept addresses matching the Ethereum format (0x followed by 40 hexadecimal characters) and reject all others.
**Validates: Requirements 1.1, 17.1**

**Property 2: Student registration persistence**
*For any* valid student registration with target language and budget, querying the contract after registration should return the same language and budget values.
**Validates: Requirements 1.2**

**Property 3: Tutor registration persistence**
*For any* valid tutor registration with languages and rate, querying the contract after registration should return the same languages and rate for each language.
**Validates: Requirements 1.3**

**Property 4: Registration idempotence**
*For any* registered user address, attempting to register again with the same address should be rejected by the contract.
**Validates: Requirements 1.4**

**Property 5: Multi-language rate consistency**
*For any* tutor registered with multiple languages, all languages should have the same rate per second.
**Validates: Requirements 1.5**

### Payment Properties

**Property 6: Deposit increases balance**
*For any* registered student and positive deposit amount, the student's contract balance after deposit should equal the previous balance plus the deposit amount.
**Validates: Requirements 2.1, 2.2**

**Property 7: Withdrawal decreases balance**
*For any* registered student without active session and valid withdrawal amount, the student's contract balance after withdrawal should equal the previous balance minus the withdrawal amount.
**Validates: Requirements 2.4, 2.5**

**Property 8: Session payment calculation**
*For any* completed session, the total payment should equal the session duration in seconds multiplied by the rate per second, capped at the student's available balance.
**Validates: Requirements 8.2, 8.3**

**Property 9: Payment transfer correctness**
*For any* ended session, the tutor's wallet balance should increase by the total payment amount, and the student's contract balance should decrease by the same amount.
**Validates: Requirements 8.4**

**Property 10: Earnings accumulation**
*For any* tutor completing multiple sessions, the tutor's total earnings should equal the sum of all session payments.
**Validates: Requirements 8.5**

### Matching Properties

**Property 11: Tutor availability storage**
*For any* tutor setting themselves available with language and rate, querying Redis should return a tutor record with the correct language, rate, and availability flag.
**Validates: Requirements 3.1**

**Property 12: Socket binding persistence**
*For any* tutor setting themselves available, the socket-to-address mapping in Redis should contain the tutor's address associated with their current socket ID.
**Validates: Requirements 3.2**

**Property 13: Pending request matching**
*For any* tutor becoming available, if pending student requests exist for the tutor's language where the student's budget is greater than or equal to the tutor's rate, those requests should be returned as matching.
**Validates: Requirements 3.3, 3.4**

**Property 14: Availability cleanup**
*For any* tutor setting themselves unavailable, querying Redis should show the tutor is not in the available tutors set.
**Validates: Requirements 3.5**

**Property 15: Request storage**
*For any* student requesting a tutor with language and budget, querying Redis should return a request record with the correct language, budget, and pending status.
**Validates: Requirements 4.1**

**Property 16: Affordable tutor filtering**
*For any* student request with budget B and language L, the matching tutors should only include tutors offering language L with rate R where R ≤ B.
**Validates: Requirements 4.2**

**Property 17: Request removal on acceptance**
*For any* tutor accepting a student request, querying Redis for that request ID should return not found or expired.
**Validates: Requirements 5.3**

**Property 18: Request persistence on decline**
*For any* tutor declining a student request, querying Redis should show the request still exists with pending status.
**Validates: Requirements 5.5**

**Property 19: Request removal on cancellation**
*For any* student cancelling their request, querying Redis should show the request no longer exists.
**Validates: Requirements 9.1**

**Property 20: Cancelled request rejection**
*For any* cancelled request, attempting to accept that request should fail or return an error.
**Validates: Requirements 9.5**

### Session Properties

**Property 21: Affordability validation**
*For any* student attempting to start a session with a tutor, the session should only be created if the student's budget per second is greater than or equal to the tutor's rate per second.
**Validates: Requirements 6.1**

**Property 22: Balance sufficiency validation**
*For any* student attempting to start a session, the session should only be created if the student's PYUSD balance is at least 10 minutes worth of the tutor's rate (600 * ratePerSecond).
**Validates: Requirements 6.2**

**Property 23: Session creation completeness**
*For any* successfully started session, querying the contract should return a session record with student address, tutor address, start time, rate per second, language, and isActive = true.
**Validates: Requirements 6.3**

**Property 24: Student studying flag**
*For any* student with an active session, querying the contract should show isStudying = true for that student.
**Validates: Requirements 6.4**

**Property 25: Session mapping storage**
*For any* started session, querying Redis should return a session mapping with the correct student address, tutor address, and language ID.
**Validates: Requirements 6.6**

**Property 26: Duration calculation accuracy**
*For any* ended session, the calculated duration should equal the end time minus the start time in seconds.
**Validates: Requirements 8.1**

**Property 27: Session state update**
*For any* ended session, querying the contract should show isActive = false and endTime should be set to a value greater than startTime.
**Validates: Requirements 8.6**

**Property 28: Session mapping cleanup**
*For any* ended session, querying Redis for the session mapping should return not found.
**Validates: Requirements 8.8**

### State Management Properties

**Property 29: Tutor state reset on rejection**
*For any* tutor whose student rejected the transaction, the tutor should be able to accept new requests immediately after.
**Validates: Requirements 10.2, 10.5**

**Property 30: No session on rejection**
*For any* rejected transaction, querying the contract should show no active session exists for that tutor.
**Validates: Requirements 10.4**

**Property 31: Tutor availability after withdrawal**
*For any* tutor withdrawing their acceptance, the tutor should appear in the available tutors set and be able to accept new requests.
**Validates: Requirements 11.2, 11.3**

**Property 32: Student state reset on withdrawal**
*For any* student whose tutor withdrew acceptance, the student should be able to request tutors again immediately.
**Validates: Requirements 11.4**

**Property 33: No session on withdrawal**
*For any* tutor withdrawing acceptance, querying the contract should show no active session exists for that tutor.
**Validates: Requirements 11.5**

### Language Conversion Properties

**Property 34: ISO to ID conversion**
*For any* supported ISO 639-1 language code, converting to language ID and back to ISO code should return the original code.
**Validates: Requirements 12.1, 12.2, 12.5**

**Property 35: Unsupported code handling**
*For any* string that is not a supported ISO 639-1 code, the contract should return UNSUPPORTED (255).
**Validates: Requirements 12.3**

**Property 36: Unsupported ID handling**
*For any* uint8 value greater than 37 (except 255), the contract should return "unsupported".
**Validates: Requirements 12.4**

### Rate Limiting Properties

**Property 37: Socket rate limit enforcement**
*For any* socket connection, emitting more than 10 events within a 60-second window should result in the 11th event being rejected.
**Validates: Requirements 14.1**

**Property 38: HTTP rate limit enforcement**
*For any* HTTP client, making more than 100 requests within a 60-second window should result in the 101st request returning a rate limit error.
**Validates: Requirements 14.2**

**Property 39: Rate limit window reset**
*For any* rate-limited client, waiting 60 seconds should allow new requests to proceed without rate limit errors.
**Validates: Requirements 14.4**

### History and Statistics Properties

**Property 40: Session history completeness**
*For any* user (student or tutor) who completed N sessions, querying their session history should return an array of N session IDs.
**Validates: Requirements 15.1**

**Property 41: Session detail completeness**
*For any* session ID, querying the session should return all fields: student, tutor, startTime, endTime, ratePerSecond, totalPaid, language, and isActive.
**Validates: Requirements 15.2**

**Property 42: Tutor statistics accuracy**
*For any* tutor, the total earnings should equal the sum of totalPaid from all their sessions, and session count should equal the number of sessions.
**Validates: Requirements 15.3**

**Property 43: Active session cost calculation**
*For any* active session, the current cost should equal (current time - start time) * rate per second.
**Validates: Requirements 15.5**

### Multi-Language Properties

**Property 44: Language matching exclusivity**
*For any* student request with target language L, the matching tutors should only include tutors who have registered language L in their offered languages.
**Validates: Requirements 18.4**

**Property 45: Language ID consistency**
*For any* language, the language ID used in the frontend should map to the same ISO code in the backend and the same uint8 value in the contract.
**Validates: Requirements 18.5**

### Input Validation Properties

**Property 46: Field sanitization**
*For any* user input containing special characters or potential injection attacks, the system should sanitize the input before processing.
**Validates: Requirements 17.2**

**Property 47: Authorization verification**
*For any* sensitive operation (ending session, withdrawing funds), the system should verify the caller is authorized (student, tutor, or owner).
**Validates: Requirements 17.5**

### WebRTC Properties

**Property 48: Disconnect detection**
*For any* WebRTC connection that closes, the WebRTC server should detect the disconnection and notify the backend service within 30 seconds.
**Validates: Requirements 7.5**

**Property 49: Reconnection support**
*For any* user whose socket disconnects and reconnects with the same wallet address, the system should restore the socket-to-address binding.
**Validates: Requirements 13.5**


## Error Handling

### Smart Contract Error Handling

**Registration Errors:**
- Duplicate registration attempts → Revert with "Student/Tutor already registered"
- Unsupported language → Revert with "Unsupported language"
- Invalid parameters → Revert with descriptive message

**Session Errors:**
- Insufficient balance → Revert with "Student does not have sufficient PYUSD balance"
- Cannot afford rate → Revert with "Student cannot afford tutor's rate"
- Active session exists → Revert with "There should be no ongoing session for this tutor"
- Unauthorized caller → Revert with "Caller is not the student, tutor nor owner"
- Session not active → Revert with "Session not active"

**Payment Errors:**
- Withdrawal during session → Revert with "Student is studying"
- Insufficient balance → Revert with "Insufficient balance"
- Zero amount → Revert with "Amount must be greater than 0"

### Backend Error Handling

**Redis Errors:**
- Connection failure → Log error, continue with degraded functionality
- Operation failure → Log error, return appropriate error response
- Data not found → Return success: false with descriptive message

**Contract Errors:**
- RPC connection failure → Use fallback mode with Redis-only state
- Contract call failure → Return mock data if ALLOW_CONTRACT_FALLBACK=true
- Transaction failure → Return error to client with transaction details

**Socket.io Errors:**
- Rate limit exceeded → Emit error event to client
- Invalid data → Emit error event with validation message
- Missing required fields → Emit error event with field names
- Request not found → Emit error event with "Request not found or expired"

**WebRTC Errors:**
- Connection failure → Notify backend, trigger session end prompt
- Heartbeat timeout → Notify backend, trigger disconnect detection
- Signaling failure → Log error, allow retry

### Error Recovery Strategies

**Blockchain Unavailability:**
1. Detect RPC connection failure
2. Switch to Redis-only mode for matching
3. Return mock data for registration queries
4. Log all operations for later reconciliation
5. Resume normal operations when blockchain recovers

**Redis Unavailability:**
1. Log connection errors
2. Continue with in-memory state (degraded)
3. Disable matching functionality
4. Return errors for state-dependent operations
5. Attempt reconnection every 30 seconds

**Socket Disconnection:**
1. Detect disconnection event
2. Clean up socket-to-address mapping
3. Remove from available tutors if applicable
4. Allow reconnection with same address
5. Restore state on reconnection

**WebRTC Disconnection:**
1. Detect via heartbeat timeout or close event
2. Notify backend service
3. Trigger session end prompt for other party
4. Allow 30-second grace period for reconnection
5. End session if not reconnected

## Testing Strategy

### Unit Testing

**Smart Contract Tests (Hardhat + Chai):**
- Registration functions with valid/invalid inputs
- Deposit and withdrawal with various amounts
- Session start with affordability checks
- Session end with payment calculations
- Language conversion functions
- Authorization checks

**Backend Service Tests (Jest/Mocha):**
- MatchingService functions with Redis mocking
- SessionService CRUD operations
- ContractService with ethers.js mocking
- Socket.io event handlers
- Rate limiting logic
- Error handling paths

**Frontend Component Tests (React Testing Library):**
- Registration form validation
- Wallet connection flows
- Matching UI state transitions
- WebRTC component lifecycle
- Error message display

### Property-Based Testing

**Testing Framework:** fast-check (JavaScript/TypeScript)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure adequate coverage of the input space.

**Test Tagging:** Each property-based test must include a comment explicitly referencing the correctness property from this design document using the format: `// Feature: langdao-platform, Property N: [property text]`

**Key Properties to Test:**

1. **Registration Properties (1-5):**
   - Generate random wallet addresses (valid/invalid formats)
   - Generate random language IDs and rates
   - Test registration persistence and idempotence

2. **Payment Properties (6-10):**
   - Generate random deposit/withdrawal amounts
   - Generate random session durations and rates
   - Test balance updates and payment calculations

3. **Matching Properties (11-20):**
   - Generate random tutor/student combinations
   - Generate random budgets and rates
   - Test matching algorithm correctness

4. **Session Properties (21-28):**
   - Generate random session parameters
   - Test session lifecycle state transitions
   - Test duration and payment calculations

5. **Language Properties (34-36, 44-45):**
   - Test all 38 supported languages
   - Test round-trip conversion
   - Test unsupported language handling

6. **Rate Limiting Properties (37-39):**
   - Generate rapid request sequences
   - Test rate limit enforcement and reset

### Integration Testing

**End-to-End Flows:**
1. Student registration → Deposit → Request tutor → Accept tutor → Start session → End session
2. Tutor registration → Set available → Receive request → Accept request → Join session → End session
3. Multiple concurrent matching requests
4. Session cancellation at various stages
5. WebRTC connection and disconnection scenarios

**Test Environment:**
- Local Hardhat network for smart contracts
- Local Redis instance for state management
- Mock WebRTC signaling for video tests
- Test wallets with PYUSD tokens

### Manual Testing Checklist

- [ ] Wallet connection with MetaMask/WalletConnect
- [ ] Student registration with all 38 languages
- [ ] Tutor registration with multiple languages
- [ ] PYUSD deposit and approval flow
- [ ] Real-time matching with multiple tutors
- [ ] WebRTC video/audio quality
- [ ] Session payment calculation accuracy
- [ ] Disconnect and reconnection handling
- [ ] Rate limiting behavior
- [ ] Error message clarity

## Security Considerations

### Smart Contract Security

**Access Control:**
- Only registered students can deposit/withdraw
- Only registered students can start sessions
- Only session participants or owner can end sessions
- Owner-only functions for emergency operations

**Reentrancy Protection:**
- Use checks-effects-interactions pattern
- Update state before external calls
- PYUSD transfers occur after state updates

**Integer Overflow:**
- Solidity 0.8+ has built-in overflow protection
- All arithmetic operations are safe by default

**Payment Safety:**
- Cap payment at student's available balance
- Prevent withdrawal during active session
- Validate affordability before session start

### Backend Security

**Rate Limiting:**
- Socket.io: 10 events per minute per socket
- HTTP: 100 requests per minute per IP
- Redis-based counter with TTL

**Input Validation:**
- Wallet address format validation
- Language ID range validation (0-37)
- Positive number validation for amounts
- Request ID format validation

**CORS Configuration:**
- Whitelist specific origins
- Credentials allowed for authenticated requests
- Preflight request handling

**Security Headers (Helmet):**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### Frontend Security

**Wallet Security:**
- Never request private keys
- Use wagmi/viem for secure signing
- Display transaction details before signing
- Verify contract addresses

**XSS Prevention:**
- React's built-in escaping
- Sanitize user-generated content
- Content Security Policy headers

**Data Validation:**
- Validate all form inputs
- Check wallet connection before operations
- Verify transaction success before UI updates

## Performance Considerations

### Smart Contract Optimization

**Gas Optimization:**
- Use uint8 for language IDs (vs uint256)
- Pack struct fields efficiently
- Use mappings instead of arrays where possible
- Minimize storage writes

**Expected Gas Costs:**
- Student registration: ~100,000 gas
- Tutor registration: ~150,000 gas (varies with language count)
- Deposit: ~50,000 gas
- Start session: ~200,000 gas
- End session: ~150,000 gas

### Backend Performance

**Redis Optimization:**
- Use pipelining for multiple operations
- Set appropriate TTLs (5 min for availability, 1 min for requests)
- Use sets for O(1) membership checks
- Cache contract data with 5-minute TTL

**Socket.io Scaling:**
- Use Redis adapter for multi-server deployment
- Implement connection pooling
- Limit broadcast frequency
- Use rooms for targeted messaging

**Expected Throughput:**
- 1000+ concurrent socket connections
- 100+ matches per second
- Sub-100ms matching latency

### Frontend Performance

**Code Splitting:**
- Lazy load WebRTC components
- Separate registration flows
- Dynamic imports for heavy libraries

**State Management:**
- Minimize re-renders with React.memo
- Use zustand for global state
- Cache contract reads with react-query

**WebRTC Optimization:**
- Use STUN/TURN servers for NAT traversal
- Adaptive bitrate for varying network conditions
- Fallback to lower quality on poor connections

## Deployment Strategy

### Smart Contract Deployment

**Networks:**
- Development: Hardhat local network
- Testnet: Sepolia (current)
- Mainnet: Ethereum mainnet (future)

**Deployment Steps:**
1. Compile contracts with Hardhat
2. Run test suite
3. Deploy to target network
4. Verify on Etherscan
5. Update frontend with new addresses

### Backend Deployment

**Infrastructure:**
- Platform: Railway/Render/AWS
- Redis: Managed Redis instance
- Environment: Node.js 20+

**Deployment Steps:**
1. Build Docker image
2. Push to container registry
3. Deploy to hosting platform
4. Configure environment variables
5. Verify health endpoint

### Frontend Deployment

**Platform:** Vercel

**Deployment Steps:**
1. Build Next.js application
2. Deploy to Vercel
3. Configure environment variables
4. Set up custom domain
5. Enable analytics

### WebRTC Server Deployment

**Infrastructure:** Separate Node.js server

**Deployment Steps:**
1. Deploy WebSocket server
2. Configure CORS for frontend origin
3. Set up SSL/TLS certificates
4. Configure backend notification URL
5. Monitor connection health

## Monitoring and Observability

### Metrics to Track

**Smart Contract:**
- Total registrations (students/tutors)
- Active sessions count
- Total PYUSD volume
- Average session duration
- Gas costs per operation

**Backend:**
- Socket connections count
- Matching success rate
- Redis operation latency
- Contract call success rate
- Error rates by type

**Frontend:**
- Wallet connection success rate
- Transaction success rate
- Page load times
- WebRTC connection success rate
- User session duration

### Logging Strategy

**Backend Logging:**
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request IDs for tracing
- Log all state transitions
- Log all contract interactions

**Frontend Logging:**
- Console errors in development
- Sentry for production errors
- User action tracking
- Transaction hash logging

### Alerting

**Critical Alerts:**
- Redis connection failure
- RPC connection failure
- High error rate (>5%)
- Rate limit threshold exceeded
- WebRTC server down

**Warning Alerts:**
- Slow contract responses (>5s)
- High Redis latency (>100ms)
- Low tutor availability
- Session end failures
