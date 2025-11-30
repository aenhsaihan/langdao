# Product Overview

## What is LangDAO?

LangDAO is a decentralized Web3 language tutoring platform that connects students with native-speaking tutors for live video sessions. Users earn cryptocurrency for teaching languages and pay per second of actual session time.

## Core Value Proposition

- **For Tutors**: Monetize language skills by teaching and earning PYUSD cryptocurrency
- **For Students**: Learn languages through live 1-on-1 video sessions with native speakers
- **For Web3**: Bridge language barriers to enable global Web3 adoption

## Key Features

- **Real-time Matching**: Socket.io-based instant tutor-student pairing
- **Live Video Sessions**: Custom WebRTC implementation for peer-to-peer video calls
- **Per-Second Payments**: Timestamp-based payment system using PYUSD stablecoin
- **Wallet-First**: Connect with MetaMask, WalletConnect, or other Web3 wallets
- **Multi-Language**: Support for 38 languages with ISO 639-1 mapping

## Current Status

**MVP Implemented** (Hackathon Phase):
- User registration (student/tutor)
- Real-time matching system
- WebRTC video sessions
- Smart contract payment processing
- Session history and earnings tracking

**First Testbed**: Latin America (Spanish language focus)

## User Flows

### Student Journey
1. Connect wallet → Register → Deposit PYUSD
2. Request tutor for target language
3. Accept tutor offer → Start session (blockchain tx)
4. Join video call → Learn language
5. End session → Payment auto-processed

### Tutor Journey
1. Connect wallet → Register with languages and rate
2. Set availability → Receive student requests
3. Accept request → Wait for student confirmation
4. Join video call → Teach language
5. End session → Receive PYUSD payment

## Payment Model

- **Currency**: PYUSD (PayPal USD stablecoin) on Sepolia testnet
- **Pricing**: Per-second rates set by tutors (e.g., 0.1 PYUSD/second)
- **Settlement**: Calculated at session end based on timestamps
- **Formula**: `payment = (endTime - startTime) * ratePerSecond`

## Future Roadmap

- **M2**: Mentor-validated tokenomics + LatAm pilot program
- **M3**: Multi-language expansion + contributor reputation system
- **Long-term**: POAP/credentials, DAO governance, mobile app, group sessions
