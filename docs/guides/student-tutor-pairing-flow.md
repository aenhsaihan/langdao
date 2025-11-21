# Student-Tutor Pairing Flow Documentation

## Overview

This document explains the complete flow of pairing students with tutors, including all UI states, transitions, socket events, and when each screen appears. This flow is critical to understand for debugging and feature development.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Student  │ ◄─────► │   Backend    │ ◄─────► │    Tutor    │
│  Frontend  │ Socket  │   Server     │ Socket  │  Frontend   │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │     Redis    │
                        │  (Matching)  │
                        └──────────────┘
```

## Student Flow

### Component: `StudentTutorFinder.tsx`

The student flow has **5 main states**:

1. **`setup`** - Initial configuration screen
2. **`searching`** - Actively searching for tutors
3. **`tutor-found`** - A tutor has accepted the request
4. **`session-starting`** - Transaction submitted, waiting for blockchain
5. **`no-tutors`** - No tutors available (currently merged into `searching`)

### State 1: Setup (`finderState === "setup"`)

**When shown:**

- Initial state when component mounts
- After cancelling a search
- After returning from a session

**What the student sees:**

- Language selection (pre-filled from registration, read-only)
- Budget input (pre-filled from registration, editable)
- Connection status indicator
- "Find Tutors Now" button

**User actions:**

- Can adjust budget (must be sufficient for at least 10 minutes)
- Can click "Find Tutors Now" to start search
- Can click "Back" (if `onBack` prop provided)

**What happens when "Find Tutors Now" is clicked:**

```javascript
1. Validates connection and inputs
2. Converts hourly budget to per-second PYUSD units
3. Generates unique requestId
4. Emits: student:request-tutor {
     requestId,
     studentAddress,
     language,
     budgetPerSecond
   }
5. Waits for: student:request-sent event
6. Transitions to: "searching" state
```

### State 2: Searching (`finderState === "searching"`)

**When shown:**

- After student clicks "Find Tutors Now"
- After tutor withdraws acceptance
- After skipping a tutor
- After tutor becomes unavailable

**What the student sees:**

- Animated search indicator with language flag
- Elapsed search time counter
- Status messages that change based on elapsed time:
  - < 10 seconds: "Searching available tutors..."
  - < 30 seconds: "Notifying tutors who come online..."
  - > = 30 seconds: "Broadcasting to new tutors..."
- "Cancel Search" button

**Socket events listened for:**

- `student:request-sent` - Confirms request was received
- `student:no-tutors-available` - No tutors online initially
- `student:tutor-accepted` - A tutor accepted the request
- `tutor:available-updated` - Tutor availability changed
- `tutor:withdrew-acceptance` - Tutor withdrew their acceptance

**What happens when tutor accepts:**

```javascript
1. Receives: student:tutor-accepted event
2. Stores tutor data in currentTutor state
3. Transitions to: "tutor-found" state
4. Shows success toast notification
```

**What happens when tutor withdraws:**

```javascript
1. Receives: tutor:withdrew-acceptance event
2. Checks if it's the current tutor
3. Clears currentTutor state
4. Stays in: "searching" state
5. Shows toast: "Tutor withdrew acceptance, continuing search..."
```

### State 3: Tutor Found (`finderState === "tutor-found"`)

**When shown:**

- After receiving `student:tutor-accepted` event
- After transaction rejection (if user wants to retry)

**What the student sees:**

- Success animation (🎉)
- Tutor information:
  - Tutor address (truncated)
  - Language being taught
  - Rate per hour (from blockchain)
- Balance warnings (if applicable):
  - Insufficient balance warning (if `hasSufficientBalance === false`)
  - Budget too low warning (if `canAfford === false`)
- Two action buttons:
  - "Skip & Find Another" - Rejects this tutor, continues searching
  - "Start Session Now" - Accepts tutor and starts session

**Blockchain checks performed:**

- `canAffordRate()` - Can student afford this tutor's rate?
- `hasSufficientBalance()` - Does student have 10 minutes worth of balance?
- `getTutorInfo()` - Get tutor's on-chain information
- `tutorRates()` - Get tutor's actual rate from blockchain

**User actions:**

1. **Skip Tutor:**

   ```javascript
   - Emits: student:reject-tutor {
       requestId,
       tutorAddress,
       studentAddress
     }
   - Clears currentTutor
   - Returns to: "searching" state
   ```

2. **Accept Tutor (Start Session):**
   ```javascript
   - Prepares transaction: simulateContract(startSession)
   - Shows MetaMask popup: writeContract()
   - Gets transaction hash immediately after MetaMask confirmation
   - Sets state to: "session-starting" IMMEDIATELY (student sees rotating camera screen)
   - Emits: student:accept-tutor {
       requestId,
       tutorAddress,
       studentAddress,
       language
     }
   - Stores session info in sessionStorage
   - Starts blockchain polling (every 1 second) for active session
   - On blockchain confirmation (active session detected):
     * Redirects to video call URL (window.location.href)
   - On transaction rejection:
     * Emits: student:rejected-transaction
     * Returns to: "tutor-found" state (user can try again)
   - On other errors:
     * Returns to: "tutor-found" state (user can try again)
   ```

### State 4: Session Starting (`finderState === "session-starting"`)

**When shown:**

- Immediately after student clicks "Start Session Now" on the "tutor-found" screen
- While waiting for MetaMask transaction confirmation
- While waiting for blockchain transaction to confirm

**What the student sees:**

- Rotating video camera icon (📹)
- "Starting Your Session! 🎓" message
- "Preparing video call..." status
- This screen is shown while the transaction is being processed

**What happens:**

```javascript
1. Student clicks "Start Session Now"
2. MetaMask popup appears for transaction confirmation
3. After student confirms in MetaMask, transaction hash is received
4. setFinderState("session-starting") is called IMMEDIATELY
5. Student sees "session-starting" screen (rotating camera)
6. Emits student:accept-tutor event (notifies tutor)
7. Stores session info in sessionStorage
8. Starts blockchain polling every 1 second for active session
9. Polls activeSessions(tutorAddress) until session becomes active
10. Once blockchain confirms session (isActive && startTime > 0):
    * Redirects to video call URL
    * Student enters WebRTC room simultaneously with tutor
```

**Blockchain Polling:**

- Polls `activeSessions(tutorAddress)` every 1 second
- Checks if `isActive === true` and `startTime > 0`
- When active, redirects to video call URL
- This ensures both student and tutor enter at the same time

**Note:** The student will see this screen from MetaMask confirmation until blockchain confirms the session (typically a few seconds). Both student and tutor use blockchain polling to enter simultaneously.

## Tutor Flow

### Component: `TutorAvailabilityFlow.tsx`

The tutor flow has **5 main states**:

1. **`setup`** - Initial configuration screen
2. **`waiting`** - Available and waiting for student requests
3. **`waiting-for-student`** - Accepted a request, waiting for student to confirm
4. **`session-starting`** - Student confirmed transaction, waiting for blockchain
5. **`in-session`** - Currently in an active session (rarely used, mostly handled by video call)

### State 1: Setup (`availabilityState === "setup"`)

**When shown:**

- Initial state when component mounts
- After stopping tutoring
- After session ends

**What the tutor sees:**

- Registration check (if not registered, shows warning)
- Language selection grid (only registered languages)
- Rate display for selected language (from blockchain)
- Connection status indicator
- "Go Live & Start Earning" button

**User actions:**

- Select a language from registered languages
- Click "Go Live & Start Earning" to become available
- Click "Back" (if `onBack` prop provided)

**What happens when "Go Live" is clicked:**

```javascript
1. Validates: registered, language selected, rate exists
2. Gets rate from blockchain for selected language
3. Emits: tutor:set-available {
     address,
     language, // language code
     ratePerSecond
   }
4. Waits for: tutor:availability-set event
5. Transitions to: "waiting" state
```

### State 2: Waiting (`availabilityState === "waiting"`)

**When shown:**

- After tutor goes live
- After student rejects tutor
- After student rejects transaction
- After tutor withdraws acceptance

**What the tutor sees:**

- Animated waiting indicator with language flag
- Connection status debug info
- Earnings preview (per minute, hour, day)
- Sound wave animation
- "Waiting for students..." status
- Incoming requests list (if any)
- "Stop Tutoring" button

**Socket events listened for:**

- `tutor:incoming-request` - New student request received
- `tutor:request-accepted` - Confirmation after accepting request
- `tutor:student-rejected` - Student rejected this tutor
- `tutor:availability-removed` - Availability removed (from stop button)

**What happens when student request arrives:**

```javascript
1. Receives: tutor:incoming-request event
2. Adds request to incomingRequests array
3. Shows toast notification with Accept/Decline buttons
4. Request appears in "Incoming Requests" section
```

**User actions:**

1. **Accept Request:**

   ```javascript
   - Emits: tutor:accept-request {
       requestId,
       tutorAddress
     }
   - Removes request from incomingRequests
   - Waits for: tutor:request-accepted event
   - Transitions to: "waiting-for-student" state
   ```

2. **Decline Request:**

   ```javascript
   - Emits: tutor:decline-request { requestId }
   - Removes request from incomingRequests
   - Stays in: "waiting" state
   ```

3. **Stop Tutoring:**
   ```javascript
   - Emits: tutor:set-unavailable { address }
   - Waits for: tutor:availability-removed event
   - Transitions to: "setup" state
   ```

### State 3: Waiting for Student (`availabilityState === "waiting-for-student"`)

**When shown:**

- After tutor accepts a student request
- Waiting for student to confirm transaction

**What the tutor sees:**

- Animated waiting indicator (⏳)
- "Waiting for Student to Start 🎓" message
- Request details:
  - Student address (truncated)
  - Language
  - Student's budget
- "Back to Waiting" button (withdraws acceptance)

**Socket events listened for:**

- `student:accept-tutor` - Student confirmed transaction
- `tutor:student-rejected` - Student rejected or selected another tutor
- `tutor:student-rejected-transaction` - Student rejected MetaMask transaction

**What happens when student accepts:**

```javascript
1. Receives: student:accept-tutor event
2. Stores session data in currentSession
3. Transitions to: "session-starting" state
4. Shows rotating camera screen (same as student sees)
```

**What happens when student rejects:**

```javascript
1. Receives: tutor:student-rejected event
2. Clears currentSession
3. Transitions to: "waiting" state
4. Shows toast: "Student rejected you or selected another tutor"
```

**User actions:**

- **Withdraw Acceptance:**
  ```javascript
  - Emits: tutor:withdraw-acceptance {
      requestId,
      tutorAddress,
      studentAddress
    }
  - Transitions to: "waiting" state
  ```

### State 4: Session Starting (`availabilityState === "session-starting"`)

**When shown:**

- After student confirms transaction (`student:accept-tutor` event)
- Waiting for blockchain confirmation and student to enter video room

**What the tutor sees:**

- Rotating video camera icon
- "Starting Your Session! 🎓" message
- "Preparing video call..." status

**What happens:**

```javascript
1. Receives student:accept-tutor event (student confirmed MetaMask transaction)
2. Transitions to "session-starting" state
3. Shows rotating camera screen (same as student sees)
4. Starts blockchain polling every 1 second for active session
5. Polls activeSessions(tutorAddress) until session becomes active
6. Once blockchain confirms session (isActive && startTime > 0):
   * Redirects to video call URL immediately
   * Tutor enters WebRTC room simultaneously with student
```

**Socket events listened for:**

- `student:accept-tutor` - Student confirmed MetaMask transaction
- `session:started` - Transaction confirmed on blockchain (informational only)
- `student:in-room` - Student entered video call room (informational only, not used for redirect)

**Blockchain polling:**

- Polls `activeSessions(tutorAddress)` every 1 second
- Checks if `isActive === true` and `startTime > 0`
- When active, redirects to video call immediately (no delay)
- This is the primary and only method for entering the WebRTC room
- Ensures both student and tutor enter simultaneously

## Backend Matching Logic

### Matching Service (`matchingService.js`)

**Key Functions:**

1. **`setTutorAvailable(address, language, ratePerSecond)`**

   - Stores tutor in Redis with TTL (5 minutes default)
   - Adds to `available_tutors` set
   - Adds to `tutors:{language}` set
   - Checks for pending student requests matching this tutor

2. **`findMatchingTutors({language, budgetPerSecond, studentAddress})`**

   - Gets all tutors for the language from Redis
   - Filters by: `tutorRate <= studentBudget`
   - Sorts by rate (lowest first)
   - Returns matching tutors

3. **`storeStudentRequest(requestId, requestData)`**

   - Stores request in Redis with TTL (1 minute default)
   - Adds to `pending_requests` set
   - Request includes: studentAddress, language, budgetPerSecond, socketId

4. **`getPendingStudentRequests(language, tutorRatePerSecond)`**
   - Gets all pending requests
   - Filters by matching language and budget
   - Returns sorted by creation time (oldest first)

### Socket Event Flow

#### Student Requests Tutor

```
Student                    Backend                    Tutor
  │                          │                          │
  │──student:request-tutor─►│                          │
  │                          │──store in Redis─────────┤
  │                          │──findMatchingTutors()───┤
  │                          │──tutor:incoming-request►│
  │◄─student:request-sent────│                          │
  │                          │                          │
```

#### Tutor Accepts Request

```
Student                    Backend                    Tutor
  │                          │                          │
  │                          │◄──tutor:accept-request───│
  │                          │──getStudentRequest()────┤
  │                          │──getTutorByAddress()────┤
  │◄──student:tutor-accepted─│──student:tutor-accepted►│
  │                          │──removeStudentRequest()─┤
  │                          │──tutor:request-accepted►│
  │                          │                          │
```

#### Student Accepts Tutor (Starts Session)

```
Student                    Backend                    Tutor
  │                          │                          │
  │──startSession() tx───────┤                          │
  │   (MetaMask confirm)     │                          │
  │──setState("session-      │                          │
  │   starting")              │                          │
  │──student:accept-tutor────►│                          │
  │                          │──removeStudentRequest()─┤
  │                          │──student:accept-tutor───►│
  │                          │                          │
  │──poll blockchain─────────┤                          │──poll blockchain
  │   (every 1s)             │                          │   (every 1s)
  │                          │                          │
  │──detect active session───┤                          │──detect active session
  │──redirect to video───────┤                          │──redirect to video
  │   (simultaneously)        │                          │   (simultaneously)
```

#### Student Enters Video Room

```
Student                    Backend                    Tutor
  │                          │                          │
  │──redirect to WebRTC──────┤                          │──redirect to WebRTC
  │   (after blockchain      │                          │   (after blockchain
  │    confirms)              │                          │    confirms)
  │                          │                          │
  │──student:entered-room───►│                          │
  │   (from WebRTC page)     │                          │
  │                          │──storeSessionMapping()──┤
  │                          │──student:in-room────────►│
  │                          │   (broadcast to all)     │
  │◄──student:room-entry─────│                          │
  │   -confirmed             │                          │
  │                          │                          │
```

**Note:** Both student and tutor redirect to WebRTC simultaneously via blockchain polling. The `student:entered-room` event is emitted after both have already entered the room, and is used for session tracking, not for triggering redirects.

## Active Session Prompt

### Component: `ActiveSessionPrompt.tsx`

**Purpose:** Warns users if they have an active session when navigating away from session pages.

**When shown:**

- User has an active session on blockchain (`activeSessions(address)` returns active session)
- User is NOT on `/tutor` or `/find-tutor` pages (or paths starting with these)
- Session has started (`startTime > 0`)
- Session is NOT very new (more than 60 seconds old) - grace period for session-starting flow

**What user sees:**

- Orange/red banner at top of page
- Session duration (live counter)
- "End Session Now" button
- "Dismiss" button

**What happens:**

- Polls blockchain every 5 seconds for active session
- Updates duration counter every second
- "End Session Now" calls `endSession(tutorAddress)` on blockchain

## State Transition Diagrams

### Student State Machine

```
┌──────┐
│setup │
└──┬───┘
   │ "Find Tutors Now"
   ▼
┌──────────┐
│searching │◄──────────┐
└──┬───────┘           │
   │ tutor accepted    │ skip/reject
   ▼                   │
┌─────────────┐        │
│tutor-found  │────────┘
└──┬──────────┘
   │ "Start Session"
   ▼
┌─────────────────┐
│session-starting │
│ (polling        │
│  blockchain)    │
└──┬──────────────┘
   │ active session
   │ detected
   ▼
[Redirect to Video Call]
```

### Tutor State Machine

```
┌──────┐
│setup │
└──┬───┘
   │ "Go Live"
   ▼
┌──────────┐
│ waiting  │◄──────────────────┐
└──┬───────┘                   │
   │ accept request             │ student rejects
   ▼                            │ or withdraw
┌──────────────────┐            │
│waiting-for-student│───────────┘
└──┬───────────────┘
   │ student accepts
   ▼
┌─────────────────┐
│session-starting │
└─────────────────┘
   │
   ▼
[Redirect to Video Call]
```

## Common Issues & Debugging

### Student sees "Searching" but no tutors appear

**Check:**

1. Are tutors actually available? Check Redis: `SMEMBERS available_tutors`
2. Do tutors match language? Check: `SMEMBERS tutors:{language}`
3. Do tutors match budget? Check tutor rates vs student budget
4. Are socket connections working? Check backend logs for `tutor:incoming-request` emissions

### Tutor doesn't receive student requests

**Check:**

1. Is tutor's socket ID stored in Redis? `HGET tutor:{address} socketId`
2. Is tutor in the correct language set? `SMEMBERS tutors:{language}`
3. Is student's request stored? `HGETALL request:{requestId}`
4. Check backend logs for request processing

### Student accepts tutor but nothing happens

**Check:**

1. Did transaction succeed? Check MetaMask
2. Did `student:accept-tutor` event reach backend? Check backend logs
3. Did tutor receive `student:accept-tutor`? Check tutor frontend console
4. Is session stored in Redis? Check `sessionService.storeSessionMapping()`
5. Is blockchain polling working? Check console for "Student polling blockchain" logs
6. Is active session detected? Check if `activeSessions(tutorAddress)` returns active session
7. **Important:** Student queries `activeSessions(tutorAddress)`, not `activeSessions(studentAddress)` - the mapping is keyed by tutor address

### Tutor stuck in "waiting-for-student"

**Check:**

1. Did student actually accept? Check student's transaction history
2. Did `student:accept-tutor` event fire? Check backend logs
3. Is tutor listening for the event? Check tutor frontend console
4. Try withdrawing acceptance and going back to waiting

## Key Files

- **Student Component:** `webapp/packages/nextjs/components/student/StudentTutorFinder.tsx`
- **Tutor Component:** `webapp/packages/nextjs/components/tutor/TutorAvailabilityFlow.tsx`
- **Active Session Prompt:** `webapp/packages/nextjs/components/session/ActiveSessionPrompt.tsx`
- **Backend Server:** `backend/src/server.js`
- **Matching Service:** `backend/src/services/matchingService.js`
- **Socket Events Docs:** `docs/tech/socket-events.md`

## Related Documentation

- [Socket Events Reference](../tech/socket-events.md)
- [WebRTC Integration Guide](./webrtc-integration.md)
- [API Reference](../tech/api-reference.md)
