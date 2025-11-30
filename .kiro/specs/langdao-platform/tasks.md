# Implementation Plan

- [x] 1. Smart Contract Development
- [x] 1.1 Implement LangDAO.sol core contract
  - Created contract with user registration, session management, and payment processing
  - Implemented 38 language support with ISO 639-1 mapping
  - Added PYUSD token integration for payments
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 1.2 Implement student registration functionality
  - Created registerStudent function with target language and budget parameters
  - Added validation for unsupported languages and duplicate registrations
  - Implemented StudentRegistered event emission
  - _Requirements: 1.2, 1.4_

- [x] 1.3 Implement tutor registration functionality
  - Created registerTutor function supporting multiple languages
  - Implemented rate per second storage for each language
  - Added TutorRegistered event emission
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 1.4 Implement PYUSD deposit and withdrawal
  - Created depositFunds function with ERC-20 token transfer
  - Implemented withdrawFunds with active session check
  - Added balance tracking in studentBalances mapping
  - Implemented FundsDeposited and FundsWithdrawn events
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.5 Implement session lifecycle management
  - Created startSession function with affordability and balance checks
  - Implemented endSession with duration calculation and payment processing
  - Added session state management (activeSessions, sessionHistory)
  - Implemented SessionStarted and SessionEnded events
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 1.6 Implement language conversion utilities
  - Created isoToLanguage function for ISO 639-1 to uint8 conversion
  - Implemented languageToIso function for uint8 to ISO 639-1 conversion
  - Added support for all 38 languages
  - Implemented UNSUPPORTED handling for invalid inputs
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 1.7 Implement helper view functions
  - Created canAffordRate function for affordability checks
  - Implemented hasSufficientBalance for 10-minute buffer validation
  - Added getUserSessions, getSession, getCurrentSessionCost
  - Implemented getTutorInfo, getStudentInfo, getStudentPYUSDBalance
  - _Requirements: 6.1, 6.2, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 2. Backend Service Development
- [x] 2.1 Set up Express server with Socket.io
  - Created Express app with HTTP server
  - Configured Socket.io with CORS settings
  - Implemented security middleware (Helmet, CORS, rate limiting)
  - Added health check endpoint
  - _Requirements: 13.1, 14.2, 17.3, 17.4_

- [x] 2.2 Implement Redis connection and configuration
  - Set up Redis client with connection handling
  - Configured TTL values for availability (5 min) and requests (1 min)
  - Implemented error handling and reconnection logic
  - _Requirements: 3.1, 4.1, 16.1, 16.2_

- [x] 2.3 Implement MatchingService
  - Created setTutorAvailable function with Redis storage
  - Implemented removeTutorAvailable for cleanup
  - Created findMatchingTutors with language and budget filtering
  - Implemented storeStudentRequest and getStudentRequest
  - Added getPendingStudentRequests for deferred matching
  - Created getTutorByAddress for tutor lookup
  - _Requirements: 3.1, 3.2, 3.5, 4.1, 4.2, 4.4, 4.5, 5.2, 5.3, 5.5_

- [x] 2.4 Implement SessionService
  - Created storeSessionMapping for session tracking
  - Implemented getSessionMapping for session lookup
  - Added removeSessionMapping for cleanup
  - _Requirements: 6.6, 8.8_

- [x] 2.5 Implement ContractService with caching
  - Created contract initialization with ethers.js
  - Implemented getTutorInfo and getStudentInfo with Redis caching
  - Added getActiveSession and endSession functions
  - Implemented fallback mode for blockchain unavailability
  - Added cache invalidation logic
  - _Requirements: 1.2, 1.3, 8.6, 16.1, 16.2, 16.5_

- [x] 2.6 Implement Socket.io event handlers
  - Created user:connect handler for socket binding
  - Implemented tutor:setAvailable with pending request checking
  - Added tutor:set-unavailable with cleanup
  - Created student:request-tutor with matching logic
  - Implemented tutor:accept-request and tutor:decline-request
  - Added student:accept-tutor and student:cancel-request
  - Implemented student:entered-room for WebRTC coordination
  - Added tutor:withdraw-acceptance and student:rejected-transaction
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.6, 7.1, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 11.1, 11.2_

- [x] 2.7 Implement rate limiting
  - Created checkSocketRateLimit function with Redis counters
  - Implemented HTTP rate limiting middleware (100 req/min)
  - Added socket rate limiting (10 events/min)
  - Configured TTL-based counter reset
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 3. WebRTC Server Development
- [x] 3.1 Set up WebSocket signaling server
  - Created WebSocket server with room management
  - Implemented signaling message relay
  - Added user role tracking (student/tutor)
  - _Requirements: 7.3, 7.4_

- [x] 3.2 Implement heartbeat monitoring
  - Created heartbeat message handling
  - Implemented backend notification for heartbeats
  - Added session health tracking
  - _Requirements: 7.5_

- [x] 3.3 Implement disconnect detection
  - Created connection close handler
  - Implemented backend notification on disconnect
  - Added room cleanup when all users leave
  - _Requirements: 7.5, 13.5_

- [x] 3.4 Implement session end coordination
  - Created call-ended message handling
  - Implemented backend notification with session details
  - Added message forwarding to other room participants
  - _Requirements: 8.7, 8.8_

- [x] 3.5 Implement chat and status updates
  - Created chat message relay
  - Implemented user-status updates (mute/video)
  - Added message broadcasting within rooms
  - _Requirements: 7.1, 7.2_

- [x] 4. Frontend Development
- [x] 4.1 Set up Next.js project with Scaffold-ETH 2
  - Configured Next.js 15 with App Router
  - Set up wagmi, viem, and RainbowKit for Web3
  - Configured TailwindCSS and DaisyUI
  - Implemented ScaffoldEthAppWithProviders wrapper
  - _Requirements: 1.1, 17.3_

- [x] 4.2 Implement wallet connection
  - Integrated RainbowKit for wallet connection UI
  - Configured supported wallets (MetaMask, WalletConnect, etc.)
  - Added wallet connection state management
  - Implemented Header component with wallet button
  - _Requirements: 1.1_

- [x] 4.3 Implement student registration UI
  - Created StudentRegistration component
  - Implemented language selection grid (38 languages)
  - Added budget per hour input with PYUSD conversion
  - Integrated with LangDAO contract registerStudent function
  - Added transaction confirmation and error handling
  - _Requirements: 1.2, 18.2, 18.3_

- [x] 4.4 Implement tutor registration UI
  - Created TutorRegistration component
  - Implemented multi-language selection
  - Added rate per hour input with per-second conversion
  - Integrated with LangDAO contract registerTutor function
  - Added transaction confirmation and error handling
  - _Requirements: 1.3, 1.5, 18.2, 18.3_

- [x] 4.5 Implement deposit flow UI
  - Created DepositFlow component
  - Implemented PYUSD approval flow
  - Added deposit amount input and validation
  - Integrated with LangDAO contract depositFunds function
  - Added balance display and transaction tracking
  - _Requirements: 2.1, 2.2_

- [x] 4.6 Implement Socket.io integration
  - Created socket context provider
  - Implemented socket connection with wallet address binding
  - Added event listeners for matching events
  - Implemented reconnection handling
  - _Requirements: 13.1, 13.2, 13.5_

- [x] 4.7 Implement tutor availability flow
  - Created TutorAvailabilityFlow component
  - Implemented set available/unavailable functionality
  - Added incoming request display
  - Implemented accept/decline request actions
  - Added withdrawal of acceptance functionality
  - _Requirements: 3.1, 3.5, 5.1, 5.4, 11.1_

- [x] 4.8 Implement student tutor finder
  - Created StudentTutorFinder component
  - Implemented request tutor functionality
  - Added tutor acceptance display
  - Implemented tutor confirmation flow
  - Added request cancellation
  - Added transaction rejection handling
  - _Requirements: 4.1, 4.3, 5.1, 9.1, 10.1_

- [x] 4.9 Implement WebRTC session components
  - Created WebRTCSessionProvider for global session state
  - Implemented WebRTCSessionStatus for active session display
  - Added WebRTCSessionEndPrompt for disconnect handling
  - Created WebRTCSessionTest for testing
  - Implemented useWebRTCSession hook for session management
  - _Requirements: 7.1, 7.2, 7.5, 8.7_

- [x] 4.10 Implement dashboard components
  - Created StudentDashboard with session history
  - Implemented TutorDashboard with earnings display
  - Added active session display
  - Implemented balance and statistics display
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 4.11 Implement session management UI
  - Created ActiveSessionPrompt component
  - Implemented session start transaction flow
  - Added video call URL generation and display
  - Implemented session end functionality
  - Added duration tracking and cost calculation
  - _Requirements: 6.3, 6.5, 7.1, 7.2, 8.1, 8.7, 15.5_

- [x] 5. Integration and Configuration
- [x] 5.1 Configure environment variables
  - Set up backend .env with RPC_URL, CONTRACT_ADDRESS, REDIS_URL
  - Configured frontend .env.local with NEXT_PUBLIC_SOCKET_URL
  - Added WebRTC server BACKEND_URL configuration
  - Created env.example templates
  - _Requirements: 16.1, 16.2_

- [x] 5.2 Implement language constants
  - Created LANGUAGES constant with 38 languages
  - Added language IDs, names, flags, and ISO codes
  - Ensured consistency across frontend, backend, and contract
  - _Requirements: 12.1, 12.2, 12.5, 18.1, 18.5_

- [x] 5.3 Configure PYUSD token integration
  - Set PYUSD token address (Sepolia testnet)
  - Configured 6 decimal places for PYUSD
  - Implemented approval and transfer flows
  - Added balance checking utilities
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 5.4 Implement error handling across stack
  - Added contract revert messages
  - Implemented backend error responses
  - Created frontend error toast notifications
  - Added fallback mode for blockchain unavailability
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.2_

- [x] 5.5 Configure security measures
  - Implemented Helmet security headers
  - Configured CORS policies
  - Added rate limiting (HTTP and Socket.io)
  - Implemented input validation and sanitization
  - _Requirements: 14.1, 14.2, 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 6. Documentation
- [x] 6.1 Create README files
  - Created main project README
  - Added backend README with setup instructions
  - Created WebRTC integration documentation
  - Added component-level README files
  - _Requirements: All_

- [x] 6.2 Document API and events
  - Documented Socket.io events
  - Created WebRTC integration guide
  - Added backend integration documentation
  - Documented smart contract functions
  - _Requirements: All_

- [x] 6.3 Create deployment guides
  - Documented local development setup
  - Added deployment notes for backend
  - Created environment variable documentation
  - _Requirements: All_
