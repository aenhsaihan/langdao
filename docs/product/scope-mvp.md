# MVP Scope

## Goal

Deliver a working platform that proves the core loop:
**Student finds tutor → Match confirmed → Live session → Payment processed**.

## What's Implemented ✅

### Core Matching System
- **Real-time matching:** Students and tutors can search for each other via Socket.io
- **Roulette-style:** Whoever comes online first gets matched
- **Language selection:** Match based on language and rate preferences

### Session Management
- **Wallet authentication:** Connect wallet (MetaMask, WalletConnect, etc.)
- **User registration:** Register as student or tutor on-chain
- **Session lifecycle:** Start session → WebRTC call → End session → Payment

### Payment System
- **PYUSD payments:** Students deposit PYUSD, tutors receive PYUSD
- **Timestamp-based:** Payment = (endTime - startTime) × ratePerSecond
- **On-chain settlement:** All payments processed via smart contract

### Video Sessions
- **Custom WebRTC:** Peer-to-peer video/audio calls
- **Session monitoring:** Detect disconnects and end sessions
- **Auto-return:** Both parties return to search after session ends

## Descoped (Post-MVP)

- POAP/credential minting (moved to roadmap)
- Booking/scheduling system
- Full tokenomics and reputation system
- Multi-language orchestration
- DAO vetting for tutors
- Rating/review system

## Success Metrics

- ✅ Students can find and match with tutors
- ✅ Sessions start and payments are processed on-chain
- ✅ Video calls work peer-to-peer
- ✅ Tutors receive payment after sessions
- ✅ Both parties can return to search after session ends

## Technical Stack

- **Frontend:** Next.js + wagmi/viem + Socket.io-client
- **Backend:** Express + Socket.io + Redis
- **Video:** Custom WebRTC implementation
- **Blockchain:** Hardhat + Sepolia testnet
- **Payment Token:** PYUSD (PayPal USD)
