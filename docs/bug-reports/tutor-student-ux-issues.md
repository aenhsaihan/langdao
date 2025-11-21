Here is a structured, **Agentic-Friendly Bug Report** tailored for Cursor. You can copy and paste the prompt section directly into Cursor’s "Composer" (Cmd+I / Ctrl+I) or Chat.

I have broken this down into three distinct tasks based on the issues highlighted in the video.

---

### 📋 Bug Report & Feature Request Summary

**Project:** LangDAO
**Scope:** Tutor Dashboard & Student Session Start Flow
**Context:** The video highlights three specific UI/UX issues occurring during the "Find a Tutor" -> "Accept Request" -> "Start Session" flow.

---

### 🤖 Prompt for Cursor (Copy & Paste this)

**Context for the Agent:**
We are fixing UI/UX issues in the LangDAO React application. The flow involves a Student finding a Tutor, the Tutor selecting a language, the Tutor accepting a request, and the Student starting the session (which triggers a wallet transaction).

**Please perform the following 3 fixes:**

#### Task 1: Auto-Select Single Language (Tutor Side) ✅ COMPLETED

**Location:** `webapp/packages/nextjs/components/tutor/TutorAvailabilityFlow.tsx`
**Current Behavior:** The user sees a list of registered languages. Even if there is only one language (e.g., Spanish), they must manually click it to select it.
**Expected Behavior:**

- Check the length of the registered languages array.
- **Logic:** `if (languages.length === 1)`, automatically set that language as the `selectedLanguage` on component mount.
- The "Select Language" button should become active immediately without user intervention.

**Implementation:**
- ✅ Added `useEffect` hook that auto-selects language when `tutorLanguages.length === 1`
- ✅ Only auto-selects when in "setup" state and no language is currently selected
- ✅ Waits for tutor info to finish loading before auto-selecting
- ✅ Implemented in `TutorAvailabilityFlow.tsx` (lines 53-62)

#### Task 2: Fix Persistent Notification Toast (Tutor Side)

**Location:** Look for the "Incoming Requests" logic or the "New Student Request" toast/notification component (likely triggered via a Socket event).
**Current Behavior:** When a student requests a session, a top-level Toast notification appears _and_ a card appears in the main dashboard. When the Tutor clicks "Accept" on the _dashboard card_, the top-level Toast notification remains on screen ("lingers") and does not disappear.
**Expected Behavior:**

- Ensure that the state controlling the visibility of the "New Student Request" Toast is tied to the request status.
- **Fix:** When the request is `Accepted` (via the main card button), strictly force the Toast notification to close/dismiss. Check for a `setShowNotification(false)` or similar cleanup function that is missing in the `handleAccept` handler.

#### Task 3: Add Loading State to "Start Session" Button (Student Side)

**Location:** Look for the component showing "Perfect Match Found!" (likely `StudentMatchFound` or `SessionStart`).
**Current Behavior:** When the Student clicks "Start Session Now," the button provides no visual feedback. The app waits for a MetaMask wallet signature in the background, making the UI look unresponsive.
**Expected Behavior:**

- Add an `isProcessing` or `isLoading` state to the "Start Session Now" button.
- **Logic:**
  1.  `onClick` -> Set `isLoading(true)`.
  2.  Show a spinner or change text to "Waiting for Wallet..." and disable the button.
  3.  Once the transaction is submitted or fails, reset the state.

---

### 🛠️ Technical Context (For the Developer)

If you are manually reviewing the code before running the agent, here are the timestamps and specific behaviors observed:

1.  **0:59 - 1:15 (Language Select):** The UI forces a click on "Spanish" even though it's the solitary option.
2.  **1:45 - 2:05 (Ghost Notification):** The "New Student Request" banner at the top of the screen persists after the session has already moved to "Waiting for Student to Start." This creates UI clutter and confusion.
3.  **2:15 - 2:35 (Unresponsive Button):** The "Start Session Now" button is clicked, but remains green and clickable with no spinner, despite the fact that a blockchain transaction is being prepared in the background.

_(Note: The 404 error at the end of the video was explicitly excluded from this report as per your instructions to focus on the previous bugs.)_
