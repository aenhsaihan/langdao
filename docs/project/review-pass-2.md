# Documentation Review - Pass 2

**Date:** November 10, 2025

## Overview

Second pass review to identify what needs to be updated, clarified, or created based on the actual implementation.

---

## 🔴 High Priority - Needs Immediate Update

### 1. `docs/product/scope-mvp.md` - Inaccurate Scope

**Current Issues:**

- Says "mint credential → get paid" but POAP minting is NOT implemented
- Mentions "POAP mints" in success signals but this doesn't exist
- Too vague about what's actually built

**What Actually Works:**

- ✅ Wallet connection
- ✅ Real-time tutor/student matching via Socket.io
- ✅ WebRTC video sessions
- ✅ Timestamp-based payments (PYUSD on Sepolia)
- ✅ Session lifecycle management
- ❌ NO POAP/credential minting

**Action Needed:**

- Rewrite to reflect actual MVP features
- Remove POAP references or mark as "planned"
- Add actual success metrics (sessions completed, payments processed)

---

### 2. `docs/product/roadmap.md` - Outdated Milestones

**Current Issues:**

- M1 says "Hackathon" but we're past that
- Vague about what's done vs what's planned
- No dates or current status

**Action Needed:**

- Update M1 to show what was actually completed
- Add current status (e.g., "M1 - COMPLETED")
- Add realistic timeline for M2 and M3
- Clarify what's in progress vs planned

---

### 3. Missing: Socket Events Reference

**Why Critical:**
The backend has 15+ socket events that are core to the matching system, but they're not documented anywhere except in code.

**Events to Document:**
```
Tutor Events:
- tutor:setAvailable
- tutor:set-unavailable
- tutor:accept-request
- tutor:decline-request
- tutor:withdraw-acceptance

Student Events:
- student:request-tutor
- student:cancel-request
- student:accept-tutor
- student:reject-tutor
- student:entered-room
- student:rejected-transaction

Session Events:
- session:started
- user:connect
```

**Action Needed:**
- Create `docs/tech/socket-events.md`
- Document each event with:
  - Purpose
  - Request payload
  - Response/emitted events
  - Example usage
  - Error cases

---

## 🟡 Medium Priority - Should Update Soon

### 4. `docs/product/overview.md` - Too Generic

**Current Issues:**

- Mentions "POAP or lightweight credential NFTs" (not implemented)
- Says "teaching, moderating, translating, or guiding" but only teaching is implemented
- No mention of actual tech stack

**Action Needed:**

- Focus on what's actually built (1-on-1 language tutoring)
- Remove or mark as "future" features not yet implemented
- Add brief tech stack mention

---

### 5. Missing: Environment Variables Reference

**Why Important:**
Multiple `.env` files across backend, frontend, WebRTC server with no central documentation.

**Action Needed:**

- Create `docs/ops/environment-variables.md`
- Document all env vars for:
    - Backend
    - Frontend
    - WebRTC server
    - Smart contracts
- Include examples and required vs optional

---

### 6. Missing: API Reference

**Why Important:**
Backend has HTTP endpoints that aren't documented.

**Known Endpoints:**
```
GET  /health
POST /api/webrtc-events
GET  /api/tutors/*
GET  /api/students/*
GET  /api/matching/*
```

**Action Needed:**

- Create `docs/tech/api-reference.md`
- Document each endpoint with:
  - Method and path
  - Request body/params
  - Response format
  - Authentication (if any)
  - Example curl commands

---

## 🟢 Low Priority - Nice to Have

### 7. Missing: Deployment Guide

**Action Needed:**

- Create `docs/ops/deployment.md`
- Document how to deploy:
  - Frontend (Vercel?)
  - Backend (Railway/Render?)
  - WebRTC server
  - Smart contracts (testnet/mainnet)
- Include environment setup
- Add troubleshooting section

---

### 8. Missing: Testing Guide

**Action Needed:**

- Create `docs/dev/testing.md`
- Document manual testing flow
- Add instructions for automated tests (when they exist)
- Include test scenarios and expected results

---

### 9. Missing: Troubleshooting Guide

**Action Needed:**

- Create `docs/dev/troubleshooting.md`
- Document common issues:
    - Socket connection failures
    - WebRTC connection issues
    - Transaction failures
    - Language matching bugs
- Add solutions and debug tips

---

### 10. Missing: Contributing Guide

**Action Needed:**

- Create `docs/dev/contributing.md` or update root `CONTRIBUTING.md`
- Document:
    - How to set up dev environment
    - Code style guidelines
    - PR process
    - How to run tests
    - Where to ask questions

---

## 📊 Documentation Accuracy Check

### Files That Need Fact-Checking

1. **`docs/architecture/overview.md`**
     - ✅ Mostly accurate
     - ⚠️ Need to verify: Is heartbeat monitoring actually implemented?
     - ⚠️ Need to verify: WebRTC disconnect detection details

2. **`docs/guides/language-matching-fix.md`**
     - ✅ Accurate description of the problem
     - ⏳ Need to implement one of the proposed solutions

3. **`docs/guides/webrtc-integration.md`**
     - ✅ Accurate
     - ⚠️ Need to verify: Is heartbeat timeout actually 2 minutes?
     - ⚠️ Need to verify: Is grace period actually 30 seconds?

---

## 🔍 Questions to Answer

Before updating docs, we need to clarify:

### Backend Implementation

1. **Is heartbeat monitoring actually implemented?**
     - Check `backend/src/server.js` for heartbeat logic
     - Check WebRTC server for heartbeat sending

2. **What are the actual HTTP endpoints?**
     - List all routes in `backend/src/routes/`
     - Document their purpose and usage

3. **How does session state management work?**
     - What's stored in Redis?
     - What's the lifecycle of a session?
     - When does data get cleaned up?

### Frontend Implementation
1. **What pages actually exist?**
     - `/` - Landing page
     - `/find-tutor` - Student flow
     - `/tutor` - Tutor flow
     - `/dashboard` - User dashboard
     - What else?

2. **What's the actual user flow?**
     - Step-by-step for student
     - Step-by-step for tutor
     - Where do they get stuck?

### Smart Contract
1. **What's the actual payment flow?**

     - How does student deposit funds?
     - How does payment get calculated?
     - How does tutor receive payment?
     - What happens if student runs out of funds mid-session?

2. **What are the gas costs?**
     - registerStudent
     - registerTutor
     - depositFunds
     - startSession
     - endSession

---

## 📝 Action Plan

### Immediate (Today/Tomorrow)
1. ✅ Update `docs/product/scope-mvp.md` with actual features
2. ✅ Update `docs/product/roadmap.md` with current status
3. ✅ Create `docs/tech/socket-events.md`

### This Week
1. Create `docs/ops/environment-variables.md`
2. Create `docs/tech/api-reference.md`
3. Verify and update architecture details (heartbeat, disconnect detection)

### Next Week
1. Create `docs/ops/deployment.md`
2. Create `docs/dev/testing.md`
3. Create `docs/dev/troubleshooting.md`
4. Update or create `docs/dev/contributing.md`

---

## 🎯 Success Criteria

Documentation is complete when:

- ✅ All implemented features are accurately documented
- ✅ All unimplemented features are clearly marked as "planned"
- ✅ New contributors can set up dev environment from docs alone
- ✅ All socket events are documented with examples
- ✅ All API endpoints are documented
- ✅ Common issues have documented solutions
- ✅ Deployment process is documented

---

## 📌 Notes

- Keep docs in sync with code as features are added
- Mark outdated sections clearly
- Link related documentation
- Use examples and code snippets
- Keep it concise and actionable

