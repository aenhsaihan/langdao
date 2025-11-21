# Bug Report - Authentication Routing and UI Issues

**Date:** 2025-01-22  
**Session:** Wave 3 UX Testing  
**Source:** Video analysis via Google AI Studio  
**Status:** 🔴 TODO

---

## 📋 Summary

**Project:** LangDAO  
**Scope:** Authentication Routing, Dashboard UI, and Error Handling  
**Context:** Wave 3 UX Testing session involving Student and Tutor dashboards. Issues identified during dashboard reloads, budget display, error handling, and button interactions.

---

## 🎥 Video Analysis

**Video Timestamps:**
- 0:15 - 1:00: Authentication/Route flicker on dashboard reload
- 3:30: $0.00/hr budget display issue in "You're Live!" card
- 4:10: Language code display (already fixed in previous bug report)
- 4:40: Generic error message when user rejects MetaMask transaction

---

## 🐛 Bugs Identified

### Bug 1: Authentication/Route "Flicker"

**Priority:** 🔴 CRITICAL  
**Status:** 🔴 TODO (Partial fix attempted - student flicker improved but still present, tutor flicker still quite bad)

**Location:** Main App router, AuthProvider, or root index page

**Current Behavior:**
- When reloading the dashboard (Student or Tutor), the app rapidly cycles through multiple views
- Sequence: Landing Page → Checking Status → Loading → Dashboard
- Creates disorienting "flicker" effect
- User sees intermediate states before final dashboard loads

**Expected Behavior:**
- Show a steady loading state during authentication check
- Do not render any route content (especially Landing Page) until authentication check is complete
- Display simple white screen or spinner during check to prevent UI flash

**Steps to Reproduce:**
1. Navigate to Student or Tutor dashboard
2. Reload the page (Cmd+R / Ctrl+R)
3. Observe: Rapid flickering through multiple views before dashboard appears

**Video Timestamp:** 0:15 - 1:00

**Technical Details:**
- Check main App router logic
- Check AuthProvider or authentication guard
- Check root index page (`app/page.tsx`)
- Implement global `isLoading` or `isCheckingAuth` state
- Prevent rendering route content until auth check completes

**Partial Fix Attempted:**
- Created `AuthGuard` component that prevents rendering until authentication state is determined
- Wrapped `/tutor` and `/find-tutor` routes with `AuthGuard`
- Student flicker improved but still present
- Tutor flicker still quite bad - needs further investigation
- May need to check OnboardingFlow registration checks or other async operations causing flicker

**Files Modified:**
- `webapp/packages/nextjs/components/auth/AuthGuard.tsx` (new file)
- `webapp/packages/nextjs/app/tutor/page.tsx`
- `webapp/packages/nextjs/app/find-tutor/page.tsx`

---

### Bug 2: "$0.00/hr" Budget Display ✅ FIXED

**Priority:** 🟡 MEDIUM  
**Status:** ✅ FIXED (2025-01-22)

**Location:** TutorLiveDashboard or "You're Live!" component

**Current Behavior:**
- In the "You're Live!" card, under the stats section
- Budget display reads "$0.00/hr" even though session rate is set to $1.00/hr
- Incorrect calculation or prop passing for hourly rate

**Expected Behavior:**
- Display the actual active session rate (e.g., "$1.00/hr")
- Correctly calculate or inherit the session rate from active session data

**Steps to Reproduce:**
1. Navigate to Tutor dashboard
2. Go live and start a session
3. Check the "You're Live!" card stats section
4. Observe: Budget shows "$0.00/hr" instead of actual rate

**Video Timestamp:** 3:30

**Technical Details:**
- Check TutorLiveDashboard or "You're Live!" component
- Trace `budget` or `hourlyRate` prop being passed
- Verify calculation logic for hourly rate from session data
- Ensure it uses actual active session rate instead of defaulting to zero

**Fix Applied:**
- Updated rate calculation to prioritize active session rate over tutor rate
- If active session exists, use `ratePerSecond` from `activeSessionData`
- Otherwise, use `tutorRate` from contract query
- Added loading state check - shows "..." instead of "$0.00" while rate is loading
- Added `enabled` condition to `getTutorRate` query to only run when account and language are available
- Prevents showing $0.00/hr when rate is actually set but still loading

**Files Modified:**
- `webapp/packages/nextjs/components/tutor/TutorAvailabilityFlow.tsx`

---

### Bug 3: Generic Wallet Rejection Error Handling

**Priority:** 🟡 MEDIUM

**Location:** `handleStartSession` or transaction submission logic in Student dashboard

**Current Behavior:**
- When user rejects MetaMask transaction, app shows generic error
- Error message: "Failed to start session. Please try again."
- Does not distinguish between user rejection and actual failure

**Expected Behavior:**
- Catch specific error code from wallet provider (error code 4001 for User Rejected)
- Display specific, neutral message: "Transaction cancelled by user"
- Only show generic failure error for actual transaction failures

**Steps to Reproduce:**
1. Navigate to Student dashboard
2. Click "Find a Tutor" and accept a tutor
3. When MetaMask popup appears, click "Reject"
4. Observe: Generic error message appears

**Video Timestamp:** 4:40

**Technical Details:**
- Check `handleStartSession` function in Student dashboard
- Check transaction submission logic
- Add error code detection (4001 = User Rejected)
- Implement conditional error messages based on error type

---

### Bug 4: Missing Loading State on "Find Tutor" Button

**Priority:** 🟡 MEDIUM

**Location:** StudentDashboard or FindTutorButton component

**Current Behavior:**
- Clicking "Find a Tutor" causes UI to hang for a few seconds
- No visual feedback during the process
- Button appears unresponsive while logic runs in background
- User may click multiple times thinking it didn't work

**Expected Behavior:**
- Add immediate `isLoading` state to button onClick
- Show spinner or disable button immediately
- Provide visual feedback that process has started
- Prevent multiple clicks while fetching available tutors

**Steps to Reproduce:**
1. Navigate to Student dashboard
2. Click "Find a Tutor" button
3. Observe: No visual feedback for 2-3 seconds before navigation

**Video Timestamp:** Not specified (mentioned in task description)

**Technical Details:**
- Check StudentDashboard component
- Check FindTutorButton component
- Add loading state management
- Disable button and show spinner during tutor fetch/navigation

---

## 🤖 Agent-Friendly Task Breakdown

### Task 1: Fix Authentication/Route "Flicker"

**Priority:** 🔴 CRITICAL

**Problem:**
When reloading the dashboard (Student or Tutor), the app rapidly cycles through multiple views (Landing Page → Checking Status → Loading → Dashboard) instead of showing a steady loading state. This causes a disorienting "flicker."

**Current Behavior:**
- App renders Landing Page before authentication check completes
- Multiple intermediate states flash in sequence
- Creates jarring user experience

**Expected Behavior:**
- Implement global `isLoading` or `isCheckingAuth` state in routing logic
- Do not render any route content (especially Landing Page) until authentication check is strictly complete
- Show simple white screen or spinner during check to prevent UI flash

**Implementation:**
- Locate main App router, AuthProvider, or root index page
- Add global loading state that prevents rendering until auth check completes
- Ensure authentication check happens before any route content renders
- Show loading indicator during check

**Files to Modify:**
- `webapp/packages/nextjs/app/page.tsx` (root page)
- Authentication guard component (if separate)
- Main app router/layout

**Estimated Effort:** Medium (1-2 hours)

---

### Task 2: Fix "$0.00/hr" Budget Display

**Priority:** 🟡 MEDIUM

**Problem:**
In the "You're Live!" card, under the stats section, the budget display reads "$0.00/hr" even though the session rate is set to $1.00/hr.

**Current Behavior:**
- Budget display shows "$0.00/hr" instead of actual rate
- Calculation or prop passing is incorrect

**Expected Behavior:**
- Display actual active session rate (e.g., "$1.00/hr")
- Correctly calculate or inherit session rate from active session data

**Implementation:**
- Locate TutorLiveDashboard or "You're Live!" component
- Trace `budget` or `hourlyRate` prop being passed
- Verify calculation logic for hourly rate from session data
- Ensure it uses actual active session rate instead of defaulting to zero

**Files to Modify:**
- TutorLiveDashboard component (need to locate)
- "You're Live!" component (check TutorAvailabilityFlow or similar)
- Session rate calculation logic

**Estimated Effort:** Small (30 minutes - 1 hour)

---

### Task 3: Improve Wallet Rejection Error Handling

**Priority:** 🟡 MEDIUM

**Problem:**
When a user rejects the MetaMask transaction, the app shows a generic error: "Failed to start session. Please try again." This doesn't distinguish between user rejection and actual failure.

**Current Behavior:**
- Generic error message for all transaction failures
- No distinction between user rejection and actual failure

**Expected Behavior:**
- Catch specific error code from wallet provider (error code 4001 for User Rejected)
- Display specific, neutral message: "Transaction cancelled by user"
- Only show generic failure error for actual transaction failures

**Implementation:**
- Locate `handleStartSession` or transaction submission logic in Student dashboard
- Add error code detection (4001 = User Rejected)
- Implement conditional error messages based on error type
- Update error handling to be more user-friendly

**Files to Modify:**
- Student dashboard component (StudentTutorFinder or similar)
- Transaction submission logic
- Error handling utilities

**Estimated Effort:** Small (30 minutes - 1 hour)

---

### Task 4: Add Loading State to "Find Tutor" Button

**Priority:** 🟡 MEDIUM

**Problem:**
Clicking "Find a Tutor" causes the UI to hang for a few seconds with no visual feedback before navigating.

**Current Behavior:**
- Button click provides no immediate feedback
- UI appears unresponsive during tutor fetch/navigation
- User may click multiple times

**Expected Behavior:**
- Add immediate `isLoading` state to button onClick
- Show spinner or disable button immediately
- Provide visual feedback that process has started
- Prevent multiple clicks while fetching available tutors

**Implementation:**
- Locate StudentDashboard or FindTutorButton component
- Add loading state management
- Disable button and show spinner during tutor fetch/navigation
- Ensure loading state is set immediately on click

**Files to Modify:**
- StudentDashboard component
- FindTutorButton component (if separate)
- Navigation/tutor fetch logic

**Estimated Effort:** Small (15-30 minutes)

---

## ✅ Completion Status

- [ ] Bug 1 / Task 1 - Fix Authentication/Route "Flicker" - 🔴 TODO (Partial fix - needs more work)
- [x] Bug 2 / Task 2 - Fix "$0.00/hr" Budget Display - ✅ FIXED
- [ ] Bug 3 / Task 3 - Improve Wallet Rejection Error Handling - 🟡 TODO
- [ ] Bug 4 / Task 4 - Add Loading State to "Find Tutor" Button - 🟡 TODO

---

## 📝 Notes

- All issues identified during Wave 3 UX Testing session
- Bug 1 (Flicker) is similar to Bug 3 from previous report but focuses specifically on authentication routing
- Bug 2 may be related to session rate calculation or prop passing
- Bug 3 improves user experience by providing clearer error feedback
- Bug 4 is a UX polish issue to improve perceived responsiveness

---

## 🔗 Related Issues

- Related to: `bug-report-2025-01-22-ux-polish-and-navigation-issues.md` (Bug 3: Root Route "Flicker" - already fixed, but this is a different aspect)

