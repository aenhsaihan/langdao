# Technology Stack

## Architecture Overview

LangDAO uses a monorepo structure with separate frontend (Next.js), backend (Express), smart contracts (Hardhat), and WebRTC server.

## Frontend Stack

**Framework**: Next.js 15 (App Router) + React 19

**Web3 Libraries**:
- `wagmi` (2.16.4) - React hooks for Ethereum
- `viem` (2.34.0) - TypeScript Ethereum library
- `@rainbow-me/rainbowkit` (2.2.8) - Wallet connection UI
- `thirdweb` (5.109.0) - Additional Web3 utilities

**Real-time Communication**:
- `socket.io-client` (4.8.1) - WebSocket client for matching

**UI/Styling**:
- TailwindCSS (4.1.3) - Utility-first CSS
- DaisyUI (5.0.9) - Component library
- Framer Motion (11.11.17) - Animations
- `next-themes` (0.3.0) - Dark mode support

**State Management**:
- `zustand` (5.0.0) - Lightweight state management
- `@tanstack/react-query` (5.59.15) - Server state management

## Backend Stack

**Framework**: Express.js (4.18.2)

**Real-time**: Socket.io (4.7.4)

**Blockchain**: ethers.js (6.8.1)

**Database**: Redis (4.6.10) - In-memory state management

**Security**:
- `helmet` (7.1.0) - Security headers
- `cors` (2.8.5) - CORS configuration
- `express-rate-limit` (7.1.5) - Rate limiting

## Smart Contracts

**Framework**: Hardhat (2.22.10)

**Language**: Solidity (via OpenZeppelin 5.0.2)

**Testing**: Chai (4.5.0) + Hardhat Network

**Deployment**: hardhat-deploy (1.0.4)

**Payment Token**: PYUSD (PayPal USD) on Sepolia testnet
- Address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

## WebRTC Server

**Framework**: Custom Node.js implementation

**Location**: `backend/webRTC-implementation-LangDAO/`

**Purpose**: Peer-to-peer video/audio calls with disconnect detection

## Build System

**Package Manager**: Yarn 3.2.3 (workspaces)

**Node Version**: >= 20.18.3 (specified in `.nvmrc`)

**TypeScript**: 5.8.2

**Linting**: ESLint 9.23.0 + Prettier 3.5.3

## Common Commands

### Development Setup

```bash
# Install correct Node version
nvm use

# Install dependencies (from root)
cd webapp
yarn install
```

### Running Locally

```bash
# Terminal 1: Start local blockchain
cd webapp/packages/hardhat
yarn chain

# Terminal 2: Deploy contracts
cd webapp/packages/hardhat
yarn deploy

# Terminal 3: Start backend
cd backend
npm start  # or yarn dev

# Terminal 4: Start WebRTC server
cd backend/webRTC-implementation-LangDAO
npm start

# Terminal 5: Start frontend
cd webapp/packages/nextjs
yarn dev
```

### Smart Contract Commands

```bash
# From webapp/ root
yarn compile          # Compile contracts
yarn deploy           # Deploy to local network
yarn test             # Run contract tests
yarn hardhat:verify   # Verify on Etherscan
```

### Frontend Commands

```bash
# From webapp/ root
yarn start            # Start Next.js dev server
yarn build            # Build for production
yarn lint             # Run ESLint
yarn format           # Format with Prettier
yarn check-types      # TypeScript type checking
```

### Backend Commands

```bash
# From backend/
npm start             # Start Express server
npm run dev           # Start with nodemon (auto-reload)
npm test              # Run tests (if configured)
```

## Environment Variables

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_WEBRTC_URL=http://localhost:3000
```

### Backend (`.env`)
```bash
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RPC_URL=http://localhost:8545
BACKEND_PRIVATE_KEY=your_private_key_here
REDIS_URL=redis://localhost:6379
```

### Hardhat (`.env`)
```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key
```

## Key Dependencies to Know

- **Scaffold-ETH 2**: Base template for the dApp structure
- **PYUSD**: ERC-20 stablecoin used for payments (6 decimals)
- **Redis**: Required for backend matching state
- **Socket.io**: Powers real-time tutor/student matching

## Testing

### Smart Contracts
```bash
cd webapp/packages/hardhat
yarn test
```

### Frontend (manual testing)
- Use Hardhat local network
- Import test accounts into MetaMask
- Test full flow: register → match → session → payment

## Deployment

**Frontend**: Vercel (configured with `vercel` command)

**Backend**: Railway/Render (planned)

**Contracts**: Sepolia testnet (current), mainnet (future)

## Known Issues

- Language ID mapping inconsistency between frontend/backend/contract
- Socket binding race conditions in matching flow
- No automated E2E tests yet
- SSL certificate issues with Yarn (use npm as workaround)
