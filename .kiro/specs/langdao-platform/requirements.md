# Requirements Document

## Introduction

LangDAO is a decentralized Web3-enabled language tutoring platform that connects students with native-speaking tutors for live video sessions. The platform enables peer-to-peer language learning with cryptocurrency-based payments calculated per second of actual session time. Built on Ethereum Sepolia using PYUSD stablecoin, the system provides real-time matching, WebRTC video sessions, and smart contract-based payment settlement.

## Glossary

- **Student**: A user who wants to learn a language and pays for tutoring sessions
- **Tutor**: A user who teaches languages and earns cryptocurrency for their time
- **Session**: A live video call between a student and tutor for language learning
- **PYUSD**: PayPal USD stablecoin (ERC-20) used for payments on Sepolia testnet
- **LangDAO Contract**: The smart contract managing registrations, sessions, and payments
- **Backend Service**: Express.js server handling real-time matching via Socket.io
- **WebRTC Server**: Signaling server enabling peer-to-peer video connections
- **Redis**: In-memory data store for matching state and session tracking
- **Rate Per Second**: The amount of PYUSD a tutor charges per second of tutoring
- **Budget Per Second**: The maximum amount of PYUSD a student is willing to pay per second
- **Request ID**: Unique identifier for a student's tutor matching request
- **Session ID**: Unique identifier for a tutoring session
- **Language ID**: Numeric identifier (0-37) mapping to ISO 639-1 language codes
- **Available Tutor**: A tutor who is online and ready to accept student requests
- **Pending Request**: A student's request for a tutor that has not yet been matched
- **Active Session**: An ongoing tutoring session with video call in progress
- **Socket ID**: Unique identifier for a WebSocket connection

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to register as either a student or tutor with my wallet, so that I can participate in the platform.

#### Acceptance Criteria

1. WHEN a user connects their wallet THEN the System SHALL verify the wallet connection is valid
2. WHEN a student registers THEN the System SHALL record the student's target language and budget per second in the LangDAO Contract
3. WHEN a tutor registers THEN the System SHALL record the tutor's offered languages and rate per second in the LangDAO Contract
4. WHEN a user attempts to register with an already registered address THEN the System SHALL prevent duplicate registration
5. WHERE a tutor offers multiple languages THEN the System SHALL apply the same rate per second to all languages

### Requirement 2: Student Deposit and Balance Management

**User Story:** As a student, I want to deposit PYUSD funds into the contract, so that I can pay for tutoring sessions.

#### Acceptance Criteria

1. WHEN a student deposits PYUSD THEN the System SHALL transfer tokens from the student's wallet to the LangDAO Contract
2. WHEN a student deposits PYUSD THEN the System SHALL update the student's balance in the contract
3. WHEN a student attempts to withdraw funds WHILE the student has an active session THEN the System SHALL prevent the withdrawal
4. WHEN a student withdraws funds THEN the System SHALL transfer PYUSD from the contract to the student's wallet
5. WHEN a student withdraws funds THEN the System SHALL update the student's balance in the contract

### Requirement 3: Tutor Availability Management

**User Story:** As a tutor, I want to set myself as available or unavailable, so that students can find me when I'm ready to teach.

#### Acceptance Criteria

1. WHEN a tutor sets themselves available THEN the Backend Service SHALL store the tutor's availability in Redis with language and rate
2. WHEN a tutor sets themselves available THEN the Backend Service SHALL bind the tutor's socket ID to their wallet address
3. WHEN a tutor sets themselves available THEN the Backend Service SHALL check for pending student requests matching the tutor's language and rate
4. WHEN pending requests exist for a newly available tutor THEN the Backend Service SHALL notify the tutor of all matching requests
5. WHEN a tutor sets themselves unavailable THEN the Backend Service SHALL remove the tutor from the available tutors set in Redis
6. WHEN a tutor sets themselves unavailable THEN the Backend Service SHALL broadcast the unavailability to all connected clients

### Requirement 4: Student-Tutor Matching

**User Story:** As a student, I want to request a tutor for my target language, so that I can start a learning session.

#### Acceptance Criteria

1. WHEN a student requests a tutor THEN the Backend Service SHALL store the request in Redis with language and budget information
2. WHEN a student requests a tutor THEN the Backend Service SHALL find all available tutors matching the language whose rate is within budget
3. WHEN matching tutors are found THEN the Backend Service SHALL notify each matching tutor of the incoming request
4. WHEN no matching tutors are available THEN the Backend Service SHALL store the request for future tutor notifications
5. WHEN a tutor comes online WHILE student requests are pending THEN the Backend Service SHALL notify the tutor of matching pending requests

### Requirement 5: Tutor Request Acceptance

**User Story:** As a tutor, I want to accept or decline student requests, so that I can choose which students to teach.

#### Acceptance Criteria

1. WHEN a tutor accepts a request THEN the Backend Service SHALL notify the student that the tutor has accepted
2. WHEN a tutor accepts a request THEN the Backend Service SHALL send the tutor's rate and language information to the student
3. WHEN a tutor accepts a request THEN the Backend Service SHALL remove the request from the pending requests set
4. WHEN a tutor declines a request THEN the Backend Service SHALL confirm the decline to the tutor
5. WHEN a tutor declines a request THEN the Backend Service SHALL keep the request available for other tutors

### Requirement 6: Session Initiation

**User Story:** As a student, I want to confirm a tutor and start a session, so that I can begin my language lesson.

#### Acceptance Criteria

1. WHEN a student accepts a tutor THEN the System SHALL verify the student can afford the tutor's rate
2. WHEN a student accepts a tutor THEN the System SHALL verify the student has sufficient PYUSD balance for at least 10 minutes
3. WHEN a student starts a session THEN the LangDAO Contract SHALL create a new session record with start time and rate
4. WHEN a student starts a session THEN the LangDAO Contract SHALL mark the student as studying
5. WHEN a student starts a session THEN the LangDAO Contract SHALL emit a SessionStarted event
6. WHEN a session starts THEN the Backend Service SHALL store the session mapping in Redis

### Requirement 7: WebRTC Video Session

**User Story:** As a student or tutor, I want to join a video call, so that I can communicate face-to-face during the lesson.

#### Acceptance Criteria

1. WHEN a student enters the WebRTC room THEN the Backend Service SHALL notify the tutor that the student is ready
2. WHEN a student enters the WebRTC room THEN the Backend Service SHALL provide the video call URL to both parties
3. WHEN both parties are in the room THEN the WebRTC Server SHALL establish a peer-to-peer connection
4. WHEN the WebRTC connection is established THEN the System SHALL enable audio and video streaming
5. WHEN either party disconnects THEN the WebRTC Server SHALL detect the disconnection and notify the Backend Service

### Requirement 8: Session Termination

**User Story:** As a student or tutor, I want to end the session, so that I can complete the lesson and process payment.

#### Acceptance Criteria

1. WHEN a student or tutor ends a session THEN the LangDAO Contract SHALL calculate the session duration in seconds
2. WHEN a session ends THEN the LangDAO Contract SHALL calculate total payment as duration multiplied by rate per second
3. WHEN the calculated payment exceeds student balance THEN the LangDAO Contract SHALL cap payment at available balance
4. WHEN a session ends THEN the LangDAO Contract SHALL transfer PYUSD from student balance to tutor wallet
5. WHEN a session ends THEN the LangDAO Contract SHALL update the tutor's total earnings and session count
6. WHEN a session ends THEN the LangDAO Contract SHALL mark the session as inactive and record the end time
7. WHEN a session ends THEN the LangDAO Contract SHALL emit a SessionEnded event
8. WHEN a session ends THEN the Backend Service SHALL remove the session mapping from Redis

### Requirement 9: Request Cancellation

**User Story:** As a student, I want to cancel my tutor request, so that I can stop searching if I change my mind.

#### Acceptance Criteria

1. WHEN a student cancels a request THEN the Backend Service SHALL remove the request from Redis
2. WHEN a student cancels a request THEN the Backend Service SHALL broadcast the cancellation to all tutors
3. WHEN a student cancels a request THEN the Backend Service SHALL confirm the cancellation to the student
4. WHEN a tutor receives a cancellation broadcast THEN the System SHALL remove the request from the tutor's UI
5. WHEN a request is cancelled THEN the System SHALL not allow tutors to accept the cancelled request

### Requirement 10: Transaction Rejection Handling

**User Story:** As a student, I want the system to handle my transaction rejection gracefully, so that tutors are notified when I decline to proceed.

#### Acceptance Criteria

1. WHEN a student rejects the transaction THEN the Backend Service SHALL notify the tutor of the rejection
2. WHEN a tutor receives rejection notification THEN the System SHALL return the tutor to waiting state
3. WHEN a student rejects the transaction THEN the Backend Service SHALL confirm the rejection to the student
4. WHEN a transaction is rejected THEN the System SHALL not create a session record
5. WHEN a transaction is rejected THEN the System SHALL allow the tutor to accept other requests

### Requirement 11: Tutor Withdrawal from Accepted Request

**User Story:** As a tutor, I want to withdraw my acceptance before the session starts, so that I can return to waiting for other students.

#### Acceptance Criteria

1. WHEN a tutor withdraws acceptance THEN the Backend Service SHALL notify the student of the withdrawal
2. WHEN a tutor withdraws acceptance THEN the Backend Service SHALL return the tutor to available state
3. WHEN a tutor withdraws acceptance THEN the System SHALL allow the tutor to accept new requests
4. WHEN a student receives withdrawal notification THEN the System SHALL return the student to searching state
5. WHEN a tutor withdraws acceptance THEN the System SHALL not create a session record

### Requirement 12: Language Code Conversion

**User Story:** As a system component, I want to convert between language IDs and ISO codes, so that different parts of the system can communicate consistently.

#### Acceptance Criteria

1. WHEN the System converts an ISO 639-1 code to language ID THEN the LangDAO Contract SHALL return the corresponding numeric ID (0-37)
2. WHEN the System converts a language ID to ISO 639-1 code THEN the LangDAO Contract SHALL return the corresponding two-letter code
3. WHEN the System receives an unsupported language code THEN the LangDAO Contract SHALL return UNSUPPORTED (255)
4. WHEN the System receives an unsupported language ID THEN the LangDAO Contract SHALL return "unsupported"
5. WHERE the System supports 38 languages THEN the LangDAO Contract SHALL provide bidirectional conversion for all supported languages

### Requirement 13: Real-time Communication

**User Story:** As a user, I want real-time updates about matching and session status, so that I know what's happening without refreshing.

#### Acceptance Criteria

1. WHEN a user connects to the platform THEN the Backend Service SHALL establish a WebSocket connection via Socket.io
2. WHEN a user's state changes THEN the Backend Service SHALL emit the appropriate event to the user's socket
3. WHEN a tutor becomes available THEN the Backend Service SHALL broadcast the availability update to all connected clients
4. WHEN a tutor becomes unavailable THEN the Backend Service SHALL broadcast the unavailability update to all connected clients
5. WHEN a socket connection is lost THEN the System SHALL allow reconnection with the same wallet address

### Requirement 14: Rate Limiting

**User Story:** As a system administrator, I want to rate limit requests, so that the system is protected from abuse.

#### Acceptance Criteria

1. WHEN a socket emits more than 10 events per minute THEN the Backend Service SHALL reject additional events
2. WHEN an HTTP client makes more than 100 requests per minute THEN the Backend Service SHALL return a rate limit error
3. WHEN rate limiting is triggered THEN the System SHALL return an appropriate error message
4. WHEN the rate limit window expires THEN the System SHALL reset the counter for that client
5. WHEN rate limiting fails THEN the System SHALL allow the request to proceed

### Requirement 15: Session History and Statistics

**User Story:** As a user, I want to view my session history and statistics, so that I can track my learning or earnings.

#### Acceptance Criteria

1. WHEN a user queries their sessions THEN the LangDAO Contract SHALL return an array of session IDs
2. WHEN a session ID is queried THEN the LangDAO Contract SHALL return complete session details including duration and payment
3. WHEN a tutor's info is queried THEN the LangDAO Contract SHALL return total earnings and session count
4. WHEN a student's info is queried THEN the LangDAO Contract SHALL return target language and budget
5. WHEN a session is active THEN the LangDAO Contract SHALL calculate the current cost based on elapsed time

### Requirement 16: Error Handling and Fallback

**User Story:** As a system, I want to handle blockchain unavailability gracefully, so that the platform remains partially functional during outages.

#### Acceptance Criteria

1. WHEN the blockchain is unavailable THEN the Backend Service SHALL use Redis for state management
2. WHEN contract calls fail THEN the Backend Service SHALL return mock data if fallback is enabled
3. WHEN Redis is unavailable THEN the System SHALL log errors and continue with degraded functionality
4. WHEN a critical error occurs THEN the System SHALL return appropriate error messages to users
5. WHEN the blockchain becomes available again THEN the System SHALL resume normal contract operations

### Requirement 17: Security and Validation

**User Story:** As a system, I want to validate all inputs and secure communications, so that users are protected from attacks.

#### Acceptance Criteria

1. WHEN a wallet address is received THEN the System SHALL validate it matches the Ethereum address format
2. WHEN user input is received THEN the System SHALL sanitize and validate all fields
3. WHEN HTTP requests are received THEN the Backend Service SHALL apply security headers via Helmet
4. WHEN cross-origin requests are made THEN the Backend Service SHALL enforce CORS policies
5. WHEN sensitive operations are performed THEN the System SHALL verify the caller's authorization

### Requirement 18: Multi-Language Support

**User Story:** As a global platform, I want to support 38 languages, so that users worldwide can teach and learn diverse languages.

#### Acceptance Criteria

1. WHEN the System initializes THEN the LangDAO Contract SHALL support 38 predefined languages
2. WHEN a user selects a language THEN the System SHALL display the language name and flag emoji
3. WHEN a tutor registers THEN the System SHALL allow selection of multiple languages
4. WHEN matching occurs THEN the System SHALL only match tutors who offer the student's target language
5. WHERE language IDs are used THEN the System SHALL maintain consistent mapping across frontend, backend, and contract
