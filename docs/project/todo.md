# LangDAO - TODO List

**Last Updated:** November 10, 2025

This document tracks features and improvements that need to be implemented.

---

## 🔴 High Priority (Critical)

### 1. WebRTC Disconnect Detection & Auto-End Session

**⚠️ CRITICAL:** Without this, sessions continue billing even after users disconnect!

(See details below in Medium Priority section - moved up to High Priority)

### 2. End Session Button in WebRTC Interface

**Current State:**
- WebRTC interface has "End Call" button
- Clicking "End Call" only ends the WebRTC connection
- Blockchain session continues running (payment keeps accruing!)
- Users must manually go back to main app to end blockchain session
- No indication that blockchain session is still active

**Problem:**
This is a critical UX and payment issue:
- Users think they ended the session by clicking "End Call"
- Payment continues in the background
- Users get overcharged
- No way to end blockchain session from within video call

**Desired State:**
- "End Session" button in WebRTC interface
- Clicking button ends BOTH WebRTC and blockchain session
- Clear confirmation that session ended
- Show final cost/duration
- Redirect back to main app

**Changes Needed:**

#### WebRTC Client
- Add "End Session" button (or make existing "End Call" button do both)
- Call backend API endpoint to end blockchain session
- Show loading state while blockchain tx processes
- Show confirmation modal with session summary
- Redirect to main app after confirmation

#### Backend
- Add endpoint: `POST /api/sessions/:sessionId/end`
- Verify session exists and is active
- Call `endSession(tutorAddress)` on blockchain
- Wait for transaction confirmation
- Return session summary (duration, cost)
- Clean up Redis state

#### WebRTC Server
- Send session-ended event to backend when user clicks "End Session"
- Include session details for blockchain call

**User Flow:**
1. User clicks "End Session" in WebRTC interface
2. Modal: "Ending session... Please wait"
3. Backend calls `endSession()` on blockchain
4. Transaction confirms
5. Modal: "Session ended! Duration: 10 min, Cost: 60 PYUSD"
6. Redirect to dashboard

**Alternative Approach:**
Make the existing "End Call" button end both:
- User clicks "End Call"
- Confirmation: "This will end the call and the session. Continue?"
- If yes, end both WebRTC and blockchain
- Show summary and redirect

**Estimated Effort:** Small (1-2 days)

**Priority:** 🚨 CRITICAL - Users are being overcharged!

---

### 3. Frontend Cannot Monitor WebRTC Session Status

**Current State:**
- Frontend redirects users to external WebRTC URL (live link)
- WebRTC session runs on separate server/domain
- **Frontend has NO visibility** into WebRTC session state
- **Backend ALSO has NO visibility** (WebRTC server runs locally, not accessible)
- Neither frontend nor backend knows:
  - If user is still in the call
  - If call ended
  - If user disconnected
  - Session duration
  - Connection quality
- WebRTC server is isolated - can't communicate with backend or frontend

**Problem:**
This creates multiple critical issues:

**Frontend Issues:**
- Can't show "Session in Progress" status
- Can't warn user if they navigate away during active session
- Can't automatically end blockchain session when WebRTC ends
- Can't show real-time session duration/cost
- No way to detect if user closed WebRTC tab
- Dashboard shows stale session state

**Backend Issues:**
- Can't receive disconnect events from live WebRTC server (backend is local, not accessible from live server)
- Can't call `endSession()` when users disconnect
- Can't implement heartbeat monitoring
- Can't track active sessions
- Live WebRTC server can't notify local backend of session events
- Payment continues even after call ends

**Root Cause:**
Backend and frontend run locally (`localhost:4000` and `localhost:3000`) while WebRTC session runs on a live/deployed URL. Local backend/frontend cannot communicate with the live WebRTC server. There's no communication channel between the local development environment and the live WebRTC system.

**Desired State:**
- Frontend receives real-time updates from WebRTC session
- Shows live session status in dashboard
- Can detect when session ends
- Can automatically trigger blockchain session end
- Shows live duration and cost estimate

**Possible Solutions:**

#### Option 1: WebSocket Connection
- WebRTC server opens WebSocket connection to frontend
- Sends real-time status updates
- Frontend subscribes to session events
- **Challenge:** CORS, authentication, connection management

#### Option 2: Server-Sent Events (SSE)
- Frontend opens SSE connection to backend
- Backend relays WebRTC events to frontend
- Simpler than WebSocket
- **Challenge:** One-way communication only

#### Option 3: Polling
- Frontend polls backend for session status every 5-10 seconds
- Backend queries WebRTC server or Redis
- **Pros:** Simple, no persistent connections
- **Cons:** Not real-time, more server load

#### Option 4: Embed WebRTC in Frontend (Recommended)
- Instead of redirecting to external URL, embed WebRTC in iframe or component
- Frontend has full control over WebRTC session
- Can listen to all WebRTC events directly
- Can coordinate WebRTC and blockchain session lifecycle
- **Pros:** Best UX, full control, real-time updates
- **Cons:** More complex integration

**Changes Needed (Option 4 - Recommended):**

#### Frontend
- Create WebRTC component/page within Next.js app
- Integrate WebRTC client library directly
- Listen to WebRTC connection events
- Show session status in real-time
- Coordinate "End Call" with blockchain `endSession()`
- Keep user in app (no external redirect)

#### WebRTC Integration
- Use WebRTC library (simple-peer, PeerJS, or native WebRTC API)
- Connect to WebRTC signaling server
- Handle peer connection lifecycle
- Show video/audio streams in React components

#### Backend
- WebRTC signaling server (Socket.io for signaling)
- Coordinate peer connections
- Track active sessions
- Send session events to frontend
- **Deploy backend to production** so it can communicate with live WebRTC server
- Configure proper URLs (not localhost)
- Ensure backend is accessible from WebRTC server

**Benefits of Embedding:**
- ✅ Frontend knows session status in real-time
- ✅ Can end both WebRTC and blockchain together
- ✅ Better UX (no external redirect)
- ✅ Can show live duration/cost
- ✅ Can prevent navigation during active session
- ✅ Can auto-end blockchain when WebRTC ends

**Estimated Effort:** Large (4-5 days for full integration)

**Priority:** 🔴 HIGH - Required for proper session management

**Alternative Quick Fix:**
If embedding is too complex right now, implement Option 3 (polling):
- Frontend polls backend every 10 seconds
- Backend checks Redis for session status
- Shows basic status (active/ended)
- **Effort:** Small (1 day)
- **Note:** Still requires backend/frontend to be deployed and accessible!

**Deployment Requirement:**
Regardless of which option is chosen, the backend and frontend MUST be deployed to publicly accessible URLs (not localhost) so they can communicate with the live WebRTC server. Currently, backend/frontend run locally while WebRTC is live, preventing any communication.

---

### 4. Multi-Language Support for Students

**Current State:**
- Students can only select ONE target language when registering
- `Student` struct has single `uint8 targetLanguage` field
- Tutors already support multiple languages via mapping

**Desired State:**
- Students should be able to select multiple languages they want to learn
- Match with tutors who teach any of their target languages

**Changes Needed:**

#### Smart Contract (`LangDAO.sol`)
- Change `Student` struct:
  - Replace `uint8 targetLanguage` with `mapping(uint8 => bool) targetLanguages`
- Update `registerStudent()` function:
  - Accept `uint8[] memory _targetLanguages` instead of single language
  - Loop through array and set each language to true in mapping
- Update `getStudentInfo()` function:
  - Return array of languages or add new getter function
- Update `canAffordRate()` function:
  - Check if tutor teaches any of student's target languages
- Update `hasSufficientBalance()` function:
  - Similar language matching logic

#### Frontend
- Update student registration UI to allow multiple language selection
- Update student profile to show all target languages
- Update matching UI to show which language the match is for

#### Backend
- Update matching logic to find tutors who teach any of student's languages
- Update session creation to specify which language the session is for

**Estimated Effort:** Medium (2-3 days)

---

## 🟡 Medium Priority

### 5. Session History & Analytics

**Current State:**
- Sessions are stored on-chain but no UI to view them
- No analytics or statistics

**Desired State:**
- Students can see their past sessions
- Tutors can see their earnings history
- Dashboard with statistics

**Changes Needed:**
- Create session history page
- Add analytics dashboard
- Query blockchain for past sessions
- Display session details (date, duration, cost, language)

**Estimated Effort:** Medium (3-4 days)

---

### 3. WebRTC Disconnect Detection & Auto-End Session

**Current State:**
- WebRTC server sends some events but disconnect detection is incomplete
- Sessions do NOT auto-end when student or tutor drops from call
- No heartbeat monitoring implemented
- Manual "End Call" button works, but connection loss doesn't trigger `endSession()`

**Desired State:**
- Detect when either party disconnects from WebRTC session
- Automatically call `endSession()` on blockchain
- Heartbeat every 30 seconds to detect stale connections
- Grace period (30-60 seconds) for reconnection before ending
- Handle all disconnect scenarios:
  - Browser closed
  - Network loss
  - Tab closed
  - Computer sleep/crash

**Changes Needed:**

#### WebRTC Client
- Implement heartbeat ping every 30 seconds
- Send heartbeat to WebRTC server
- Detect connection state changes (`disconnected`, `failed`, `closed`)
- Send disconnect event to WebRTC server

#### WebRTC Server
- Track last heartbeat timestamp for each user
- Monitor for missing heartbeats (>2 minutes = stale)
- Detect WebRTC peer disconnection events
- Send disconnect notification to backend immediately
- Implement grace period before notifying backend

#### Backend
- Receive disconnect events from WebRTC server
- Wait for grace period (30-60 seconds) for reconnection
- If no reconnection, call `endSession(tutorAddress)` on blockchain
- Handle both student and tutor disconnects
- Clean up session state in Redis

**Edge Cases to Handle:**
- Both parties disconnect simultaneously
- Reconnection within grace period
- Multiple disconnect events for same session
- Session already ended manually

**Related Critical Issue:**
Currently, there's NO way to end the blockchain session from within the WebRTC interface. If a user clicks "End Call" in the WebRTC UI:
- ✅ WebRTC session ends
- ❌ Blockchain session continues (payment keeps running!)

This means users MUST go back to the main app and manually end the session, which is terrible UX and can lead to overcharging.

**Solution Needed:**
- Add "End Session" button in WebRTC interface
- Button calls backend API to trigger `endSession()` on blockchain
- OR: WebRTC "End Call" automatically triggers blockchain session end
- Show confirmation that blockchain session ended
- Redirect users back to main app after session ends

**Estimated Effort:** Medium (2-3 days)

**Priority:** 🚨 CRITICAL - Users are being overcharged!

---

### 6. Standardize Language Codes Across Web2 and Web3

**Current State:**
- **Frontend (Web2):** Uses lowercase string codes (`"spanish"`, `"french"`)
- **Backend (Web2):** Uses string matching for languages
- **Smart Contract (Web3):** Uses numeric IDs (`1` = Spanish, `2` = French, etc.)
- **Socket Events:** Mix of strings and IDs
- **Mismatch causes bugs** and requires constant mapping

**Problem:**
- Inconsistent language representation across the stack
- Frontend sends `"spanish"` → Backend matches by string → Must map to ID `1` for contract
- Error-prone conversions at every layer
- Hard to maintain (3 different systems)
- Bugs when mapping fails

**Desired State:**
- **Single source of truth:** Use numeric language IDs everywhere
- Frontend, backend, and contract all use the same IDs
- No string-based matching
- Direct pass-through from frontend to contract

**Language ID Standard (from Smart Contract):**
```
0  = English (en)
1  = Spanish (es)
2  = French (fr)
3  = German (de)
4  = Italian (it)
5  = Portuguese (pt)
... (38 languages total)
```

**Changes Needed:**

#### Frontend
- Update `LANGUAGES` constant to use IDs as primary key
- Store language ID in state (not string code)
- Send language ID in all API calls and socket events
- Display language name in UI but use ID internally
- Update registration forms to use IDs
- Update matching UI to use IDs

#### Backend
- Update matching logic to use language IDs (not strings)
- Update Redis storage to use IDs
- Update socket event handlers to expect IDs
- Remove all string-based language matching
- Update session storage to use IDs

#### Socket Events
- Change all language fields from strings to numbers
- `tutor:setAvailable` → `languageId: 1` (not `language: "spanish"`)
- `student:request-tutor` → `languageId: 1`
- Update socket events documentation

#### Smart Contract
- No changes needed (already uses IDs)
- This is the source of truth

**Migration Strategy:**
1. Add language ID alongside existing string fields (backward compatible)
2. Update frontend to send both (transition period)
3. Update backend to accept both but prefer IDs
4. Remove string-based logic once all clients updated
5. Update documentation

**Benefits:**
- ✅ No more string/ID mapping bugs
- ✅ Consistent across entire stack
- ✅ Easier to maintain
- ✅ Better performance (numeric comparison vs string)
- ✅ Type-safe (TypeScript can enforce number type)

**Estimated Effort:** Small-Medium (2-3 days)

**Priority:** 🟡 Medium (fixes bugs, improves maintainability)

**Reference:** See `docs/guides/language-matching-fix.md` for detailed analysis

---

## 🟢 Low Priority

### 7. POAP/Credential Minting

**Current State:**
- Not implemented

**Desired State:**
- Mint POAP or credential NFT after session completion
- Display in user profile

**Changes Needed:**
- Integrate POAP API or create custom NFT
- Add minting logic after session ends
- Display credentials in dashboard

**Estimated Effort:** Medium (3-4 days)

---

### 8. Rating System

**Current State:**
- Not implemented

**Desired State:**
- Students can rate tutors after sessions
- Tutors can rate students
- Ratings displayed on profiles

**Changes Needed:**
- Add rating storage (on-chain or IPFS)
- Create rating UI
- Display ratings on profiles
- Use ratings in matching algorithm

**Estimated Effort:** Medium (3-4 days)

---

### 9. Booking/Scheduling System

**Current State:**
- Only roulette-style matching (first come, first served)

**Desired State:**
- Students can book tutors for specific times
- Calendar integration
- Reminders

**Changes Needed:**
- Add booking logic to backend
- Create calendar UI
- Add notification system
- Store scheduled sessions

**Estimated Effort:** Large (5-7 days)

---

### 10. User Profiles

**Current State:**
- Minimal profile (just wallet address)

**Desired State:**
- Rich profiles with bio, languages, experience
- Profile pictures
- Session history
- Ratings and reviews

**Changes Needed:**
- Add profile storage (IPFS or database)
- Create profile UI
- Add profile editing

**Estimated Effort:** Medium (3-4 days)

---

## 🔧 Technical Improvements

### 11. Add Automated Tests

**Current State:**
- No automated tests

**Desired State:**
- Smart contract tests (Hardhat)
- Backend integration tests (Jest)
- Frontend E2E tests (Playwright)

**Changes Needed:**
- Write contract tests for all functions
- Write backend tests for socket events
- Write E2E tests for user flows

**Estimated Effort:** Large (5-7 days)

---

### 12. Improve Error Handling

**Current State:**
- Basic error handling
- Not all edge cases covered

**Desired State:**
- Comprehensive error handling
- User-friendly error messages
- Proper error logging

**Changes Needed:**
- Add try-catch blocks
- Improve error messages
- Add error logging service

**Estimated Effort:** Medium (2-3 days)

---

### 13. Add Deployment Guide

**Current State:**
- No production deployment documentation

**Desired State:**
- Complete deployment guide
- CI/CD pipeline
- Environment setup

**Changes Needed:**
- Document deployment steps
- Create deployment scripts
- Set up CI/CD (GitHub Actions)

**Estimated Effort:** Small (1-2 days)

---

## 📊 Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 **CRITICAL** | **Disconnect Detection** | **Medium** | **CRITICAL** |
| 🔴 **CRITICAL** | **End Session in WebRTC** | **Small** | **CRITICAL** |
| 🔴 High | **Frontend Monitor WebRTC** | **Large** | **High** |
| 🔴 High | Multi-Language Support | Medium | High |
| 🟡 Medium | Session History | Medium | Medium |
| 🟡 Medium | Language Matching Fix | Small | Medium |
| 🟢 Low | POAP Minting | Medium | Low |
| 🟢 Low | Rating System | Medium | Medium |
| 🟢 Low | Booking System | Large | High |
| 🟢 Low | User Profiles | Medium | Medium |
| 🔧 Tech | Automated Tests | Large | High |
| 🔧 Tech | Error Handling | Medium | Medium |
| 🔧 Tech | Deployment Guide | Small | Low |

---

## Next Steps

### Immediate (Critical Payment Issues)
1. **🚨 URGENT:** End Session Button in WebRTC (users being overcharged!)
2. **🚨 URGENT:** WebRTC Disconnect Detection (prevents payment issues!)

### Short-term (This Week)
3. **Quick Fix:** Frontend polling for session status (1 day)
4. Multi-Language Support for Students
5. Language Matching Fix

### Medium-term (Next 2 Weeks)
6. **Proper Fix:** Embed WebRTC in Frontend (4-5 days)
7. Session History & Analytics

### Long-term (This Month)
8. POAP Minting + Rating System
9. Booking/Scheduling System

---

## Notes

- Focus on high-impact, low-effort items first
- Get multi-language support working before adding more features
- Automated tests should be added incrementally as features are built
- User feedback will help prioritize low-priority items

---

**Questions or suggestions?** Add them to this document or create GitHub issues.
