# LangDAO Project Audit - November 2025

## Executive Summary

This audit reviews the current state of the LangDAO project to identify what's been built, what's outdated, and what needs updating.

**Status:** MVP is partially implemented with core matching and session flow working. Documentation is outdated and doesn't reflect actual implementation.

---

## 🟢 What's Working (Implemented)

### Backend (Node.js + Socket.io + Redis)
- ✅ **Real-time matching system** - Students and tutors can find each other via Socket.io
- ✅ **Redis-based state management** - Session data, tutor availability, pending requests
- ✅ **Rate limiting** - Socket and HTTP endpoint protection
- ✅ **WebRTC integration** - Session end events from video calls trigger blockchain transactions
- ✅ **Session lifecycle** - Full flow from request → match → session start → session end

### Frontend (Next.js + Scaffold-ETH 2)
- ✅ **Wallet connection** - WalletConnect integration
- ✅ **Student flow** - `/find-tutor` page for requesting tutors
- ✅ **Tutor flow** - `/tutor` page for setting availability
- ✅ **Dashboard** - Basic user dashboard
- ✅ **Socket.io client** - Real-time communication with backend

### Smart Contracts (Hardhat)
- ✅ **LangDAO contract** - Session management, payments, language registration
- ✅ **Local blockchain** - Hardhat network for development
- ✅ **Deployment scripts** - Automated contract deployment

### Infrastructure
- ✅ **Redis** - Session state and caching
- ✅ **WebRTC server** - Separate video call server (in `backend/webRTC-implementation-LangDAO/`)
- ✅ **Documentation site** - MkDocs setup (though content is outdated)

---

## 🟡 What's Partially Implemented

### Payment System
- **Documented:** Superfluid/Sablier integration with per-second streaming
- **Reality:** Custom timestamp-based payment system in smart contract
  - Students deposit PYUSD into contract
  - `startSession()` records start timestamp
  - `endSession()` calculates duration and pays tutor based on `duration * ratePerSecond`
  - No external streaming protocol needed
- **Status:** ✅ Implemented and working (simpler than documented)

### Credentials (POAP/SBT)
- **Documented:** Automatic POAP minting after sessions
- **Reality:** Not found in codebase
- **Status:** Not implemented yet

### Language Matching
- **Issue:** Mismatch between frontend (lowercase codes like "spanish"), backend (string matching), and smart contract (numeric IDs like 1, 2, 3)
- **Workaround:** `LANGUAGE_MATCHING_FIX.md` documents current approach
- **Status:** Works but needs proper fix (see recommendations)

### Heartbeat Monitoring
- **Documented:** 5-second heartbeat pings to detect disconnects
- **Reality:** WebRTC server sends events, but heartbeat implementation unclear
- **Status:** Needs verification

---

## 🔴 What's Outdated or Missing

### Documentation Issues

#### 1. **Architecture Docs Don't Match Reality**
**File:** `docs/tech/architecture.md`

**Documented:**

- Complex flow with Matchmaker API, Heartbeat Service, Relayer Bot, Payment Controller
- Superfluid streaming with FlowOperator permissions
- DAO vetting for SBT credentials
- Booking system with calendar integration

**Reality:**

- Simple Socket.io matching (no separate Matchmaker API)
- No Relayer Bot (backend calls contracts directly)
- No booking system implemented
- No DAO vetting system
- No calendar integration

**Action Needed:** Rewrite architecture doc to reflect actual implementation

#### 2. **Empty Spec Files**
**Files:** `specs/prd.md`, `specs/metrics-kpi.smd`, `design/user-flows.md`

**Status:** All empty
**Action Needed:** Either populate or delete these files

#### 3. **MVP Scope is Vague**
**File:** `docs/product/scope-mvp.md`

**Issue:** Says "clickable + minimally on-chain" but doesn't specify what's actually built
**Action Needed:** Update with actual implemented features

#### 4. **Integration Docs Are Incomplete**
**File:** `docs/tech/integrations.md`

**Listed but not implemented:**
- Chainlink (not used)
- IPFS/Arweave (not used)
- POAP (not implemented)

**Action Needed:** Update to show only what's actually integrated

### Missing Documentation

1. **No API documentation** - Backend endpoints not documented
2. **No socket event reference** - List of all socket events and their payloads
3. **No deployment guide** - How to deploy to production
4. **No testing guide** - How to run tests (no tests exist)
5. **No troubleshooting guide** - Common issues and solutions

### Missing Features (Documented but Not Built)

1. **POAP/Credential Minting** - Documented extensively, not implemented
2. **Streaming Payments** - Unclear if Superfluid/Sablier is actually integrated
3. **Booking System** - Documented in architecture, not built
4. **DAO Vetting** - Documented, not built
5. **Rating System** - Documented, not built
6. **Multi-language Support** - Partially implemented (language IDs exist but matching is buggy)

---

## 📊 Current vs Documented Architecture

### What Was Documented (Complex)
```
Student → Matchmaker API → Heartbeat Service → Relayer Bot → Payment Controller → Superfluid
                ↓
            Huddle01 WebRTC
                ↓
         POAP/SBT Credentials
                ↓
         DAO Vetting System
```

### What Actually Exists (Simple)
```
Student → Socket.io Backend → Redis → Smart Contract → Payment
              ↓
          Custom WebRTC
              ↓
          Backend calls endSession()
```

---

## 🎯 Recommendations

### Immediate Actions (This Week)

1. ✅ **Update README.md** - DONE
     - Removed Superfluid references
     - Updated architecture section
     - Now reflects actual implementation

2. ✅ **Create Architecture Documentation** - DONE
     - Created `docs/architecture/overview.md` with complete details
     - Marked old `docs/tech/architecture.md` as outdated
     - Added warning banner with link to new doc

3. ✅ **Fix or Delete Empty Files** - DONE
     - Deleted all empty spec and design files
     - Cleaned up root-level test files
     - Kept empty directories for future use

4. ⏳ **Create Socket Event Reference**
     - Document all socket events with examples
     - Show request/response payloads
     - Add to `docs/tech/socket-events.md`

5. ⏳ **Document Language Matching Fix**
     - Move `LANGUAGE_MATCHING_FIX.md` into proper docs
     - Implement one of the recommended fixes
     - Update frontend/backend to use consistent language IDs

### Short-term (Next 2 Weeks)

1. **Verify Payment Implementation**
     - Check if Superfluid/Sablier is actually integrated
     - If not, document the actual payment mechanism
     - Update integration docs accordingly

2. **Add API Documentation**
     - Document all HTTP endpoints
     - Add request/response examples
     - Create `docs/tech/api-reference.md`

3. **Create Deployment Guide**
     - Document production deployment steps
     - Add environment variable reference
     - Create `docs/ops/deployment.md`

4. **Add Testing**
     - Write basic integration tests for socket events
     - Add contract tests
     - Document how to run tests

### Medium-term (Next Month)

1. **Implement or Remove POAP**
     - Either build the POAP minting feature
     - Or remove all references from docs

2. **Standardize Language System**
     - Implement Option 3 from `LANGUAGE_MATCHING_FIX.md`
     - Use language IDs everywhere (frontend, backend, contract)
     - Remove string-based matching

3. **Add Monitoring**
     - Add logging for all socket events
     - Track session metrics (duration, completion rate)
     - Add error tracking (Sentry?)

4. **Security Audit**
     - Review smart contract security
     - Check backend authentication
     - Verify rate limiting is sufficient

---

## 📁 File Cleanup Recommendations

### ~~Delete (Empty or Outdated)~~ ✅ COMPLETED
- ~~`specs/prd.md`~~ (deleted)
- ~~`specs/metrics-kpi.smd`~~ (deleted)
- ~~`design/user-flows.md`~~ (deleted)
- ~~`socket-test.html`~~ (deleted)
- ~~`test-socket.js`~~ (deleted)
- `design/wireframes/` (empty directory - kept for future)
- `specs/` (empty directory - kept for future)

### Move to Archive
- ~~`docs/adr/0001-huddle01.md`~~ - Updated with superseded status (Huddle01 didn't work, using custom WebRTC)
- `docs/product/testbed-latam.md` (if still relevant, keep; if not, archive)
- `docs/research/assumptions.md` (move to archive if outdated)

### Update (Outdated Content)
- `docs/tech/architecture.md` (major rewrite needed)
- `docs/tech/integrations.md` (remove unimplemented integrations)
- `docs/product/scope-mvp.md` (update with actual scope)
- `docs/product/roadmap.md` (update milestones)
- `README.md` (simplify, remove unimplemented features)

### Create (Missing Documentation)
- `docs/tech/socket-events.md` (socket event reference)
- `docs/tech/api-reference.md` (HTTP API docs)
- `docs/ops/deployment.md` (deployment guide)
- `docs/dev/testing.md` (testing guide)
- `docs/dev/troubleshooting.md` (common issues)

---

## 🔍 Questions to Answer

Before updating docs, clarify these implementation details:

1. ~~**Is Superfluid/Sablier actually integrated?**~~ ✅ **ANSWERED**
     - No external streaming protocol used
     - Custom timestamp-based payment in LangDAO.sol
     - Payment = `(endTime - startTime) * ratePerSecond`
     - Simpler and more reliable than Superfluid

2. **What's the actual session lifecycle?**
     - Student requests → Tutor accepts → ??? → Session starts → ??? → Session ends
     - Fill in the gaps with actual implementation

3. **How does WebRTC integration work?**
     - What events does the WebRTC server send?
     - How does backend know when to call `endSession()`?
     - Is heartbeat monitoring actually implemented?

4. **What's the language matching logic?**
     - Frontend sends what format?
     - Backend stores what format?
     - Contract expects what format?
     - How are they mapped?

5. **What's deployed vs local-only?**
     - Is there a production deployment?
     - What services are running where?
     - What's the deployment architecture?

---

## 📝 Next Steps

1. **Review this audit** - Confirm accuracy of findings
2. **Answer the questions** - Clarify implementation details
3. **Prioritize updates** - Decide what to fix first
4. **Create issues** - Track each documentation update
5. **Update incrementally** - Don't try to fix everything at once

---

## Summary

**Good news:** The core MVP is working - students can find tutors, sessions can start/end, payments happen.

**Bad news:** Documentation is significantly out of sync with reality. Many documented features don't exist, and actual implementation isn't documented.

**Priority:** Update docs to reflect reality before adding new features. This will prevent confusion and make onboarding new contributors easier.
