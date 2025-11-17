# langdao-ethonline2025

🌎 Empowering people worldwide to use their language skills to learn, teach, and earn in Web3

[![Docs](https://img.shields.io/badge/docs-website-blue)](https://aenhsaihan.github.io/langdao-ethonline2025)

# LangDAO

> Helping people worldwide use their **language skills** to **teach and earn crypto** in Web3.

## TL;DR (60 seconds)

- **What:** A community platform where Spanish (and any language) speakers teach/guide learners and **earn crypto**.
- **Why now:** Web3 adoption needs human onboarding; language is the missing bridge.
- **First testbed:** **Latin America**, scalable globally.
- **Status:** MVP implemented with WebRTC video calls, real-time matching, and on-chain payments.

## Problem

Millions have skills but no clear path to earn in Web3. Learning is scattered, incentives are weak, and language access is uneven.

## Solution

- **Live sessions (WebRTC)** + **wallet-connected rooms**.
- **Proof of participation/skill** via **POAP/credentials**.
- **Micro-bounties** for teaching, vetting, or guiding onboarding.

## MVP Scope (Hackathon)

- Join with wallet → book/join a session → complete language session → **get paid**.
- Start with **Spanish**; design to be language-agnostic.

## Architecture (high-level)

- Frontend: Next.js + wagmi/viem, WalletConnect.
- Video: **Custom WebRTC implementation** for peer-to-peer sessions.
- Payments: Custom timestamp-based system (PYUSD on Sepolia)
- Backend: Express + Socket.io + Redis for real-time matching
- Smart Contract: Session management and payment processing

## Roadmap (milestones)

- **M1 (Hackathon):** clickable prototype + live session flow + POAP mint.
- **M2 (Post-hack):** mentor-validated tokenomics + pilot program in LatAm.
- **M3:** multi-language expansion, contributor reputation.

## Ask (Mentors & Collaborators)

- **Validation:** problem/solution fit, incentives.
- **Biz viability:** revenue & sustainability.
- **Launch strategy:** partnerships, community seeding (LatAm).

## Development Setup

### Prerequisites

- Node.js (use version specified in `.nvmrc`)
- nvm (Node Version Manager)

### Getting Started

1. Clone the repository
2. Install the correct Node.js version:
   ```bash
   nvm use
   ```
3. Install dependencies:
   ```bash
   cd webapp
   npm install --legacy-peer-deps
   ```
4. Start the development environment:

   ```bash
   # Terminal 1: Start local blockchain
   cd webapp/packages/hardhat
   npm run chain

   # Terminal 2: Deploy to local blockchain
   cd webapp/packages/hardhat
   npm run deploy

   # Terminal 3: Start frontend
   cd webapp/packages/nextjs
   npm run dev
   ```

   **Note**: If you encounter SSL certificate issues with Yarn, the project is configured to work with npm instead.

### Project Structure

- `webapp/` - Scaffold-ETH 2 dApp (Next.js + Hardhat)
- `docs/` - Project documentation (MkDocs)
- `contracts/` - (Available for additional contracts if needed)

## Links

- Onboarding video notes: `docs/product/overview.md`
- Tech integrations: `docs/tech/integrations.md`
- Testbed rationale: `docs/product/testbed-latam.md`

License: MIT
