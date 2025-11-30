# Technology Stack

## Build System

- **Package Manager**: Yarn 3.2.3 (workspaces enabled)
- **Node Version**: >= 20.18.3 (specified in `.nvmrc`)
- **Monorepo Structure**: Yarn workspaces with `packages/hardhat` and `packages/nextjs`

## Frontend Stack

**Framework**: Next.js 15.2.5 (App Router)
- React 19.0.0
- TypeScript 5.8.2
- TailwindCSS 4.1.3 + DaisyUI 5.0.9
- Framer Motion 11.18.2 for animations

**Web3 Libraries**:
- wagmi 2.16.4 + viem 2.34.0 (Ethereum interactions)
- RainbowKit 2.2.8 (wallet connection)
- Thirdweb 5.109.0 (additional Web3 utilities)
- ethers.js 6.13.7 (contract interactions)

**Real-time Communication**:
- Socket.io-client 4.8.1 (matching system)
- Custom WebRTC implementation (video calls)

**State Management**:
- Zustand 5.0.0 (global state)
- @tanstack/react-query 5.59.15 (async state)
- usehooks-ts 3.1.0 (React hooks)

## Backend Stack

**Server**: Express.js 4.18.2
- Socket.io 4.7.4 (real-time events)
- CORS 2.8.5
- Helmet 7.1.0 (security headers)
- Morgan 1.10.0 (logging)
- express-rate-limit 7.1.5

**Database**: Redis 4.6.10 (in-memory state management)

**Blockchain**: ethers.js 6.8.1

**Environment**: Node.js 20.18.3+

## Smart Contract Stack

**Framework**: Hardhat 2.22.19
- Solidity (latest stable)
- OpenZeppelin Contracts 5.0.2
- Hardhat plugins: ethers, verify, deploy

**Testing**: Mocha + Chai

**Network**: Ethereum Sepolia testnet (current), local Hardhat network (dev)

## WebRTC Server

**Custom Implementation**: Node.js WebSocket server
- Location: `backend/webRTC-implementation-LangDAO/`
- Peer-to-peer video/audio connections
- Heartbeat monitoring and disconnect detection

## Key Libraries & Frameworks

**Scaffold-ETH 2**: Base framework providing:
- Hot contract reloading
- Custom React hooks for Web3
- Burner wallet for testing
- Debug contracts UI

**Payment Token**: PYUSD (PayPal USD) ERC-20 on Sepolia
- Address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- 6 decimal places

## Common Commands

### Development Setup

```bash
# Use correct Node version
nvm use

# Install dependencies (use npm, not yarn for initial setup due to SSL issues)
cd webapp
npm install --legacy-peer-deps
```

### Local Development

```bash
# Terminal 1: Start local blockchain
cd webapp/packages/hardhat
yarn chain

# Terminal 2: Deploy contracts
cd webapp/packages/hardhat
yarn deploy

# Terminal 3: Start Redis
redis-server

# Terminal 4: Start backend
cd backend
yarn dev

# Terminal 5: Start WebRTC server
cd backend/webRTC-implementation-LangDAO
npm start

# Terminal 6: Start frontend
cd webapp/packages/nextjs
yarn dev
# or from root: yarn start
```

### Smart Contract Commands

```bash
# Compile contracts
yarn hardhat:compile

# Run tests
yarn hardhat:test

# Deploy to network
yarn hardhat:deploy

# Verify on Etherscan
yarn hardhat:verify

# Clean artifacts
yarn hardhat:clean
```

### Frontend Commands

```bash
# Development server (port 3002)
yarn next:dev

# Production build
yarn next:build

# Type checking
yarn next:check-types

# Linting
yarn next:lint

# Format code
yarn next:format
```

### Backend Commands

```bash
# Development with nodemon
npm run dev

# Production
npm start

# Run tests
npm test
```

### Workspace Commands (from root)

```bash
# Run all linters
yarn lint

# Format all code
yarn format

# Run all tests
yarn test

# Generate new account
yarn generate
```

## Environment Variables

### Backend (`.env`)
```bash
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RPC_URL=http://localhost:8545
BACKEND_PRIVATE_KEY=your_private_key
REDIS_URL=redis://localhost:6379
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_WEBRTC_URL=http://localhost:3000
```

### WebRTC Server (`.env`)
```bash
PORT=3000
BACKEND_URL=http://localhost:4000/api/webrtc-events
```

## Code Style & Conventions

**Formatting**: Prettier 3.5.3
- Import sorting via @trivago/prettier-plugin-sort-imports
- Consistent across frontend and backend

**Linting**: ESLint 9.23.0
- Next.js config
- Prettier integration
- TypeScript rules

**TypeScript**: Strict mode enabled
- Type safety enforced
- No implicit any
- Incremental compilation

## Testing Strategy

**Smart Contracts**: Hardhat + Chai (unit tests)

**Backend**: Jest 29.7.0 (planned, not fully implemented)

**Frontend**: React Testing Library (planned)

**E2E**: Manual testing currently, Playwright planned

## Deployment

**Frontend**: Vercel (configured with custom build env)

**Backend**: Railway/Render (Docker-ready)

**Smart Contracts**: Sepolia testnet (current), Ethereum mainnet (future)

**Redis**: Managed Redis instance (production)

## Known Technical Debt

- Language ID mapping inconsistency (frontend uses strings, contract uses uint8)
- Socket authentication not implemented (anyone can emit events)
- No reentrancy guard on smart contract
- Limited automated test coverage
- Backend private key in .env (should use secrets manager)
