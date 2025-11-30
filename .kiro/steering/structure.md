# Project Structure

## Repository Layout

```
langdao-ethonline2025/
├── .kiro/                    # Kiro AI assistant configuration
├── backend/                  # Express + Socket.io backend
├── docs/                     # MkDocs documentation
├── ops/                      # Deployment and operations
└── webapp/                   # Scaffold-ETH 2 monorepo
```

## Backend Structure

```
backend/
├── src/
│   ├── server.js                    # Main Express + Socket.io server
│   ├── routes/                      # HTTP API routes
│   │   └── webrtc.js               # WebRTC event endpoints
│   ├── services/                    # Business logic
│   │   ├── contractService.js      # Smart contract interactions
│   │   ├── matchingService.js      # Student/tutor matching
│   │   ├── sessionService.js       # Session lifecycle
│   │   └── sessionTerminationService.js
│   └── config/                      # Configuration files
├── webRTC-implementation-LangDAO/   # Custom WebRTC server
│   ├── server.js                    # WebRTC signaling server
│   ├── public/
│   │   ├── index.html              # WebRTC client UI
│   │   └── langdao-integration.js  # Integration code
│   └── docs/                        # WebRTC documentation
├── .env                             # Backend environment variables
├── env.example                      # Environment template
└── package.json
```

### Backend Key Files

- **`src/server.js`**: Main entry point, Socket.io event handlers, Redis connection
- **`src/services/contractService.js`**: Ethers.js contract interactions
- **`src/services/matchingService.js`**: Tutor/student pairing logic
- **`webRTC-implementation-LangDAO/server.js`**: Separate WebRTC signaling server

## Webapp Structure (Scaffold-ETH 2)

```
webapp/
├── packages/
│   ├── hardhat/                     # Smart contracts
│   │   ├── contracts/
│   │   │   └── LangDAO.sol         # Main contract
│   │   ├── deploy/                  # Deployment scripts
│   │   ├── scripts/                 # Utility scripts
│   │   └── test/                    # Contract tests
│   │
│   └── nextjs/                      # Next.js frontend
│       ├── app/                     # Next.js App Router
│       │   ├── page.tsx            # Landing page
│       │   ├── find-tutor/         # Student flow
│       │   ├── tutor/              # Tutor flow
│       │   ├── dashboard/          # User dashboard
│       │   └── debug/              # Contract debugging
│       │
│       ├── components/              # React components
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── ScaffoldEthAppWithProviders.tsx
│       │   ├── onboarding/         # Registration flows
│       │   │   ├── StudentRegistration.tsx
│       │   │   └── TutorRegistration.tsx
│       │   ├── dashboard/          # Dashboard components
│       │   │   ├── StudentDashboard.tsx
│       │   │   └── TutorDashboard.tsx
│       │   ├── student/            # Student-specific
│       │   │   └── StudentTutorFinder.tsx
│       │   ├── tutor/              # Tutor-specific
│       │   │   └── TutorAvailabilityFlow.tsx
│       │   ├── session/            # Session management
│       │   │   └── ActiveSessionPrompt.tsx
│       │   ├── deposit/            # Payment flows
│       │   │   └── DepositFlow.tsx
│       │   └── webrtc/             # WebRTC integration
│       │       ├── WebRTCSessionProvider.tsx
│       │       ├── WebRTCSessionStatus.tsx
│       │       ├── WebRTCSessionEndPrompt.tsx
│       │       └── WebRTCSessionTest.tsx
│       │
│       ├── hooks/                   # Custom React hooks
│       │   ├── scaffold-eth/       # Scaffold-ETH hooks
│       │   └── useWebRTCSession.ts # WebRTC session hook
│       │
│       ├── contracts/               # Contract ABIs & addresses
│       │   └── deployedContracts.ts
│       │
│       ├── utils/                   # Utility functions
│       │   └── scaffold-eth/
│       │       └── contract.ts     # Contract helpers
│       │
│       ├── styles/
│       │   └── globals.css         # Global styles
│       │
│       ├── .env.local              # Frontend environment
│       └── package.json
│
├── .nvmrc                           # Node version
├── package.json                     # Root package.json
└── yarn.lock
```

### Frontend Key Files

**Pages (App Router)**:
- `app/page.tsx` - Landing page with hero section
- `app/find-tutor/page.tsx` - Student matching flow
- `app/tutor/page.tsx` - Tutor availability and matching
- `app/dashboard/page.tsx` - User dashboard (sessions, earnings)
- `app/debug/page.tsx` - Contract debugging interface

**Core Components**:
- `components/ScaffoldEthAppWithProviders.tsx` - Root provider wrapper (wagmi, RainbowKit, etc.)
- `components/Header.tsx` - Navigation with wallet connection
- `components/onboarding/` - Registration flows for students and tutors
- `components/webrtc/` - WebRTC session management components

**Hooks**:
- `hooks/scaffold-eth/` - Scaffold-ETH provided hooks (useScaffoldContract, etc.)
- `hooks/useWebRTCSession.ts` - Custom hook for WebRTC session state

**Smart Contracts**:
- `packages/hardhat/contracts/LangDAO.sol` - Main contract with registration, sessions, payments
- `packages/hardhat/deploy/` - Hardhat deploy scripts
- `packages/nextjs/contracts/deployedContracts.ts` - Auto-generated contract addresses and ABIs

## Documentation Structure

```
docs/
├── adr/                             # Architecture Decision Records
│   └── 0001-huddle01.md
├── architecture/
│   └── overview.md                  # Actual implemented architecture
├── bug-reports/                     # Bug tracking
│   ├── README.md
│   └── bug-report-*.md
├── guides/                          # How-to guides
│   ├── language-matching-fix.md
│   ├── student-tutor-pairing-flow.md
│   └── webrtc-integration.md
├── ops/                             # Operations
│   └── environment-variables.md
├── product/                         # Product documentation
│   ├── overview.md
│   ├── roadmap.md
│   ├── scope-mvp.md
│   └── testbed-latam.md
├── project/                         # Project management
│   ├── audit.md
│   ├── cleanup-summary.md
│   └── todo.md
├── research/
│   └── assumptions.md
├── tech/                            # Technical documentation
│   ├── api-reference.md
│   ├── architecture.md             # Original planned architecture
│   ├── dao-vetting.md
│   ├── integrations.md
│   └── socket-events.md
└── index.md                         # Documentation home
```

## Configuration Files

**Root Level**:
- `.nvmrc` - Node version specification (20.18.3)
- `package.json` - Workspace configuration
- `mkdocs.yml` - Documentation site configuration

**Frontend**:
- `webapp/packages/nextjs/.env.local` - Frontend environment variables
- `webapp/packages/nextjs/next.config.js` - Next.js configuration
- `webapp/packages/nextjs/tailwind.config.ts` - TailwindCSS configuration
- `webapp/packages/nextjs/scaffold.config.ts` - Scaffold-ETH configuration

**Backend**:
- `backend/.env` - Backend environment variables
- `backend/env.example` - Environment template

**Smart Contracts**:
- `webapp/packages/hardhat/hardhat.config.ts` - Hardhat configuration
- `webapp/packages/hardhat/.env` - Contract deployment keys

## Important Conventions

### File Naming
- React components: PascalCase (e.g., `StudentDashboard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useWebRTCSession.ts`)
- Utilities: camelCase (e.g., `contractService.js`)
- Smart contracts: PascalCase (e.g., `LangDAO.sol`)

### Component Organization
- Group by feature/domain (e.g., `components/student/`, `components/tutor/`)
- Shared components at root level (e.g., `components/Header.tsx`)
- WebRTC components isolated in `components/webrtc/`

### Smart Contract Organization
- One main contract: `LangDAO.sol`
- Deployment scripts in `deploy/` directory
- Tests in `test/` directory

### Documentation Organization
- Product docs in `docs/product/`
- Technical docs in `docs/tech/`
- Architecture decisions in `docs/adr/`
- Bug reports in `docs/bug-reports/`
- How-to guides in `docs/guides/`

## Key Directories to Know

**When working on frontend features**: `webapp/packages/nextjs/components/` and `webapp/packages/nextjs/app/`

**When working on smart contracts**: `webapp/packages/hardhat/contracts/` and `webapp/packages/hardhat/deploy/`

**When working on backend logic**: `backend/src/services/` and `backend/src/routes/`

**When working on WebRTC**: `backend/webRTC-implementation-LangDAO/` and `webapp/packages/nextjs/components/webrtc/`

**When updating documentation**: `docs/` (MkDocs format)

## Monorepo Workspaces

The project uses Yarn workspaces:
- `@se-2/hardhat` - Smart contracts package
- `@se-2/nextjs` - Frontend package

Commands run from root (`webapp/`) are proxied to the appropriate workspace (e.g., `yarn start` runs `@se-2/nextjs dev`).
