# Bug Report - Student Session Warning & Language Flicker

**Date:** 2025-01-21  
**Session:** 2  
**Source:** Video analysis via Google AI Studio  
**Status:** 🟡 PARTIALLY FIXED (Bug 1 fixed, Bug 2 pending)

---

## 📋 Summary

**Project:** LangDAO  
**Scope:** Student Dashboard & Session Management  
**Context:** Two UX critical bugs identified: missing session warnings for students (who are paying) and a UI "flicker" regarding language defaults.

---

## 🎥 Video Analysis

**Video Timestamps:**

- **0:00 - 1:05:** Missing Student Warning - Tutor shows red warning modal, Student shows nothing despite being charged
- **2:25 - 3:10:** Language Flicker - Target Language dropdown shows "English" initially, then snaps to "Spanish"

---

## 🐛 Bugs Identified

### Bug 1: Missing "Active Session" Warning for Students ✅ FIXED

**Priority:** 🔴 CRITICAL  
**Status:** ✅ FIXED (2025-01-21)

**Location:** Student Dashboard (compare with Tutor Dashboard)

**Current Behavior:**

- When a Tutor enters the dashboard with an ongoing session, they see a red modal: "Active Session Detected! You have an ongoing tutoring session. Please end it..."
- When a Student (who is paying for the session) enters the dashboard with an ongoing session, they see nothing
- Students are unaware they are being charged

**Expected Behavior:**

- Students should see the same "Active Session Detected" warning modal as tutors
- Students should be able to "End Session Now" if they return to the app while a session is technically still active on the blockchain

**Steps to Reproduce:**

1. Start a session as a student
2. Navigate away from the session (or return to dashboard)
3. Observe: Student sees no warning, but is still being charged
4. Compare with tutor view: Tutor sees red warning modal

**Video Timestamp:** 0:00 - 1:05

**Technical Details:**

- Need to locate the logic and UI component used for Tutor's "Active Session Detected" modal
- Port/replicate this logic to Student Dashboard
- Component likely: `ActiveSessionPrompt` or similar in tutor flow

**Fix Applied:**

- Made storage reading reactive using `useState` and `useEffect` to detect when tutor address becomes available
- Added filtering to exclude invalid/zero session data from tutor queries
- Implemented fallback: when `isStudying` is true but tutor address is missing from storage, query `SessionStarted` events to find the tutor address
- Prioritized student session data over tutor session data
- Enhanced logging for better debugging

**Files Modified:**
- `webapp/packages/nextjs/components/session/ActiveSessionPrompt.tsx`

---

### Bug 2: Language Default "Flicker" (English to Spanish)

**Priority:** 🟡 MEDIUM

**Location:** Find Tutor component / "Find Your Perfect Tutor" screen

**Current Behavior:**

- When student clicks "Find a Tutor," the "Target Language" dropdown briefly shows "English" by default
- A split second later, it updates to the correct registered language (e.g., "Spanish") fetched from the smart contract/backend
- Creates jarring UI flicker and incorrect initial state

**Expected Behavior:**

- Language dropdown should not show incorrect default
- Either show loading state or wait until registered language is fetched before rendering
- Component should mount with correct language immediately

**Steps to Reproduce:**

1. Click "Find a Tutor" as a student
2. Observe "Target Language" field
3. See it briefly shows "English" then snaps to correct language (e.g., "Spanish")

**Video Timestamp:** 2:25 - 3:10

**Technical Details:**

- `targetLanguage` state likely initialized to 'English' hardcoded
- Fix: Change initial state to null or show loading skeleton
- Do not render language dropdown until `registeredLanguage` fetch is complete
- Alternatively: Ensure fetch happens earlier so component mounts with correct language

---

## 🤖 Agent-Friendly Task Breakdown

### Task 1: Implement "Active Session" Warning for Students

**Priority:** 🔴 CRITICAL

**Problem:**
Students who are paying for sessions don't see any warning when they have an active session, unlike tutors who see a red modal. This means students are unaware they're being charged when they return to the dashboard.

**Current Behavior:**

- Tutor dashboard shows red "Active Session Detected" modal when session is active
- Student dashboard shows nothing when session is active
- Students continue to be charged without warning

**Expected Behavior:**

- Student dashboard should show the same "Active Session Detected" warning modal as tutor dashboard
- Students should be able to "End Session Now" from the warning
- Warning should appear when student navigates to dashboard with active session

**Implementation:**

- Locate the component/logic used for tutor's active session warning (likely `ActiveSessionPrompt` or similar)
- Check if it's already checking for student sessions or only tutor sessions
- Ensure the component checks `activeSessions` mapping for both student and tutor addresses
- Verify the component is rendered in student dashboard/flow
- Test that warning appears when student has active session

**Files to Modify:**

- `webapp/packages/nextjs/components/session/ActiveSessionPrompt.tsx` (likely)
- Student dashboard component (need to locate)
- Check if component already exists but isn't being used for students

**Estimated Effort:** Small-Medium (1-2 hours)

---

### Task 2: Fix Language Default "Flicker" (English to Spanish)

**Priority:** 🟡 MEDIUM

**Problem:**
When student clicks "Find a Tutor," the language dropdown briefly shows "English" as default before updating to the correct registered language, creating a jarring UI flicker.

**Current Behavior:**

- `targetLanguage` or `language` state initialized to "English" (hardcoded)
- Component renders with "English" before smart contract data loads
- After fetch completes, it updates to correct language (e.g., "Spanish")
- Creates visible flicker/jump in UI

**Expected Behavior:**

- No incorrect default shown
- Either show loading state or wait for data before rendering language field
- Component should mount with correct language from the start

**Implementation:**

- Find where language state is initialized in `StudentTutorFinder` or similar component
- Change initial state from hardcoded "English" to `null` or loading state
- Add conditional rendering: only show language dropdown when data is loaded
- Alternatively: Ensure `useEffect` that fetches student info runs before component renders language field
- Consider using loading skeleton or placeholder until language is determined

**Files to Modify:**

- `webapp/packages/nextjs/components/student/StudentTutorFinder.tsx` (likely)
- Check `useState` initialization for language
- Check `useEffect` that pre-fills language from `studentInfo`

**Estimated Effort:** Small (30 minutes - 1 hour)

---

## ✅ Completion Status

- [x] Bug 1 / Task 1 - Implement "Active Session" Warning for Students - ✅ FIXED
- [ ] Bug 2 / Task 2 - Fix Language Default "Flicker" - 🟡 TODO

---

## 📝 Notes

- Both issues are UX-focused and affect user experience
- Task 1 is critical as it affects billing/charging awareness
- Task 2 is medium priority but creates poor first impression
- Both should be relatively straightforward fixes

---

## 🔗 Related Issues

- Previous bug report: `bug-report-2025-01-18-tutor-student-ux-issues.md` (also dealt with student-tutor flow UX)
