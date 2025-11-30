# Project Structure

## Repository Organization

```
langdao-ethonline2025/
├── .kiro/                          # Kiro AI assistant configuration
│   ├── hooks/                      # Agent hooks for automation
│   ├── settings/                   # MCP and other settings
│   └── specs/                      # Feature specifications
│       └── langdao-platform/       # Main platform spec
│           ├── requirements.md     # Acceptance criteria
│           ├── design.md          # Architecture & properties
│           └── tasks.md           # Implementation tasks
├── backend/                        # Express + Socket.io backend
│   ├── src/
│   │   ├── server.js              # Main server entry point
│   │   ├── routes/                # HTTP routes
│   │   └── services/              # Business logic
│   │       ├── contractService.js # Smart contract interactions
│   │       ├── matchingService.js # Tutor-student matching
│   │       ├── sessionService.js  # Session lifecycle
│   │       └── sessionTerminationService.js
│   ├── webRTC-implementation-LangDAO/  # Custom WebRTC server
│   │   ├── server.js              # WebRTC signaling server
│   │   ├── public/                # WebRTC client UI
│   │   └── docs/                  # Integration guides
│   ├── .env                       # Backend environment variables
│   └── package.json
├── webapp/                         # Scaffold-ETH 2 monorepo
│   ├── packages/
│   │   ├── hardhat/               # Smart contracts
│   │   │   ├── contracts/         # Solidity contracts
│   │   │   │   └── LangDAO.sol   # Main platform contract
│   │   │   ├── deploy/            # Deployment scripts
│   │   │   ├── test/              # Contract tests
│   │   │   └── hardhat.config.ts
│   │   └── nextjs/                # Next.js frontend
│   │       ├── app/               # Next.js App Router pages
│   │       │   ├── page.tsx       # Landing page
│   │       │   ├── debug/         # Contract debugging UI
│   │       │   └── blockexplorer/ # Block explorer
│   │       ├── components/        # React components
│   │       │   ├── deposit/       # PYUSD deposit flow
│   │       │   ├── onboarding/    # Registration components
│   │       │   ├── student/       # Student-specific UI
│   │       │   ├── tutor/         # Tutor-specific UI
│   │       │   ├── session/       # Session management
│   │       │   ├── dashboard/     # User dashboards
│   │       │   ├── webrtc/        # WebRTC integration
│   │       │   ├── Header.tsx     # Navigation header
│   │       │   └── Footer.tsx     # Page footer
│   │       ├── contracts/         # Contract ABIs & addresses
│   │       │   └── deployedContracts.ts
│   │       ├── hooks/             # Custom React hooks
│   │       │   └── useWebRTCSession.ts
│   │       ├── utils/             # Utility functions
│   │       │   └── scaffold-eth/  # Scaffold-ETH utilities
│   │       ├── styles/            # Global styles
│   │       │   └── globals.css
│   │       ├── .env.local         # Frontend environment variables
│   │       └── package.json
│   ├── .yarn/                     # Yarn 3 cache & plugins
│   └── package.json               # Workspace root
├── docs/                          # Project documentation
│   ├── architecture/              # Architecture docs
│   │   └── overview.md           # Actual implementation overview
│   ├── guides/                    # How-to guides
│   ├── product/                   # Product documentation
│   ├── tech/                      # Technical documentation
│   ├── bug-reports/               # Bug tracking
│   └── index.md                   # Documentation index
├── ops/                           # Operations & deployment
│   ├── deployment-notes.md
│   └── env.example
├── .nvmrc                         # Node version specification
├── README.md                      # Main project README
└── package.json                   # Root package.json
```

## Key Directories Explained

### `/backend`
Express.js server handling real-time matching and session coordination.

**Important Files**:
- `src/server.js` - Main entry point, Socket.io setup
- `src/services/matchingService.js` - Redis-based tutor/student matching
- `src/services/contractService.js` - Smart contract interaction layer
- `src/services/sessionService.js` - Session state management

### `/backend/webRTC-implementation-LangDAO`
Standalone WebRTC signaling server for video calls.

**Important Files**:
- `server.js` - WebSocket server for WebRTC signaling
- `public/index.html` - WebRTC client interface
- `docs/BACKEND_INTEGRATION_GUIDE.md` - Integration documentation

### `/webapp/packages/hardhat`
Smart contract development environment.

**Important Files**:
- `contracts/LangDAO.sol` - Main platform contract
- `deploy/` - Hardhat deployment scripts
- `test/` - Contract unit tests
- `hardhat.config.ts` - Hardhat configuration

### `/webapp/packages/nextjs`
Next.js frontend application.

**Important Directories**:
- `app/` - Next.js pages (App Router)
- `components/` - React components organized by feature
- `hooks/` - Custom React hooks
- `contracts/` - Contract ABIs and deployed addresses
- `utils/` - Helper functions and utilities

**Component Organization**:
- `components/deposit/` - PYUSD deposit and balance management
- `components/onboarding/` - Student/tutor registration flows
- `components/student/` - Student-specific features (tutor finder)
- `components/tutor/` - Tutor-specific features (availability)
- `components/session/` - Active session UI
- `components/dashboard/` - User dashboards
- `components/webrtc/` - WebRTC integration components

### `/docs`
MkDocs-based documentation site.

**Structure**:
- `architecture/` - System architecture documentation
- `guides/` - Step-by-step guides
- `product/` - Product specs and roadmap
- `tech/` - Technical reference
- `bug-reports/` - Bug tracking and templates

### `/.kiro`
Kiro AI assistant configuration and specifications.

**Structure**:
- `specs/langdao-platform/` - Main feature specification
  - `requirements.md` - User stories and acceptance criteria
  - `design.md` - Architecture and correctness properties
  - `tasks.md` - Implementation task breakdown
- `hooks/` - Automated agent hooks
- `settings/` - MCP and other configurations

## File Naming Conventions

**React Components**: PascalCase
- `StudentDashboard.tsx`
- `TutorRegistration.tsx`
- `WebRTCSessionProvider.tsx`

**Utilities & Services**: camelCase
- `contractService.js`
- `matchingService.js`
- `useWebRTCSession.ts`

**Configuration Files**: kebab-case or standard names
- `hardhat.config.ts`
- `next.config.js`
- `.env.local`

**Documentation**: kebab-case with .md extension
- `deployment-notes.md`
- `language-matching-fix.md`

## Import Conventions

**Frontend Imports** (organized by @trivago/prettier-plugin-sort-imports):
1. React and Next.js imports
2. Third-party libraries
3. Scaffold-ETH components and hooks
4. Local components
5. Types and utilities
6. Styles

Example:
```typescript
import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { StudentDashboard } from "~~/components/dashboard/StudentDashboard";
import type { Session } from "~~/types/session";
```

**Backend Imports**:
```javascript
// Node built-ins first
const path = require('path');

// Third-party packages
const express = require('express');
const { Server } = require('socket.io');

// Local modules
const matchingService = require('./services/matchingService');
```

## Configuration Files

**Root Level**:
- `.nvmrc` - Node version (20.18.3)
- `package.json` - Workspace configuration
- `.gitignore` - Git ignore rules

**Frontend**:
- `webapp/packages/nextjs/.env.local` - Frontend environment variables
- `webapp/packages/nextjs/next.config.js` - Next.js configuration
- `webapp/packages/nextjs/tailwind.config.ts` - TailwindCSS configuration

**Backend**:
- `backend/.env` - Backend environment variables
- `backend/package.json` - Backend dependencies

**Smart Contracts**:
- `webapp/packages/hardhat/hardhat.config.ts` - Hardhat configuration
- `webapp/packages/hardhat/.env` - Contract deployment keys

## State Management Patterns

**Frontend State**:
- **Global State**: Zustand stores in `webapp/packages/nextjs/store/`
- **Server State**: React Query for contract reads
- **Local State**: React useState/useReducer

**Backend State**:
- **Persistent**: Redis (tutor availability, pending requests, sessions)
- **Transient**: In-memory (socket connections, rate limiting)

**Smart Contract State**:
- **On-chain**: User registrations, sessions, balances
- **Events**: SessionStarted, SessionEnded for indexing

## Testing Organization

**Smart Contracts**: `webapp/packages/hardhat/test/`
- Unit tests for each contract function
- Integration tests for full flows

**Backend**: `backend/test/` (planned)
- Service unit tests
- Socket.io integration tests
- Redis mocking

**Frontend**: `webapp/packages/nextjs/__tests__/` (planned)
- Component tests
- Hook tests
- E2E tests

## Environment-Specific Files

**Development**:
- Local Hardhat blockchain
- Local Redis instance
- `.env.local` with localhost URLs

**Production**:
- Sepolia testnet
- Managed Redis (Redis Cloud)
- `.env.production` with production URLs

## Documentation Standards

**Code Comments**:
- JSDoc for functions and components
- Inline comments for complex logic
- TODO/FIXME tags for technical debt

**README Files**:
- Each major directory should have a README.md
- Include setup instructions and examples

**Specification Files**:
- Requirements use "WHEN/THEN/SHALL" format
- Design includes correctness properties
- Tasks reference requirements and properties
