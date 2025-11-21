# Bug Report - UX Polish & Navigation Issues

**Date:** 2025-01-22  
**Session:** User Acceptance Testing (Wave 3)  
**Source:** Video analysis via Google AI Studio  
**Status:** 🔴 TODO

---

## 📋 Summary

**Project:** LangDAO  
**Scope:** Student/Tutor connection flow, Routing, and Notifications  
**Context:** User Acceptance Testing identified 4 distinct issues ranging from critical navigation failures to UI polish problems affecting the overall user experience.

---

## 🎥 Video Analysis

**Video Timestamps:**
- **0:15 - 0:35:** Ghost Toast Notification - Student sees irrelevant "Global Tutor removed" message
- **1:05 - 1:30:** Broken "Get Started" Button - Tutor onboarding button doesn't navigate
- **1:58 - 2:40:** Root Route Flicker - Landing page flashes before redirect
- **4:10 - 4:20:** Language Code Display - Shows "es" instead of "Spanish"

---

## 🐛 Bugs Identified

### Bug 1: Ghost Toast Notification ("Global Tutor Removed") ✅ FIXED

**Priority:** 🟡 MEDIUM  
**Status:** ✅ FIXED (2025-01-22)

**Location:** StudentDashboard and global SocketProvider (WebSocket event handlers)

**Current Behavior:**
- When a Student navigates away from their dashboard or refreshes, a toast notification appears saying "Global Tutor removed."
- This message is irrelevant to the student and confusing
- The notification appears on the student's own screen erroneously

**Expected Behavior:**
- Connection/disconnection toasts should be context-aware
- "Tutor removed" notification should only show if a partner disconnects during an active session
- If the current user is navigating, suppress the notification

**Steps to Reproduce:**
1. Navigate to Student Dashboard
2. Navigate away or refresh the page
3. Observe: "Global Tutor removed" toast appears incorrectly

**Video Timestamp:** 0:15 - 0:35

**Technical Details:**
- Check WebSocket disconnection or component unmount logic
- Investigate where the "Global Tutor removed" toast is triggered
- Ensure toasts are context-aware based on user role and session state

**Fix Applied:**
- Removed global debug toasts for `tutor:available-updated` and `tutor:became-unavailable` events in SocketProvider
- These toasts were showing irrelevant "Global Tutor removed" messages to all users (including students)
- Components (TutorAvailabilityFlow, StudentTutorFinder) already handle these events contextually where appropriate
- Students no longer see confusing tutor-related notifications when navigating away or refreshing

**Files Modified:**
- `webapp/packages/nextjs/lib/socket/socketContext.tsx`

---

### Bug 2: Broken "Get Started" Button (Tutor Onboarding) ✅ FIXED

**Priority:** 🔴 CRITICAL  
**Status:** ✅ FIXED (2025-01-22)

**Location:** Welcome or Onboarding component (page with green "Get Started" button)

**Current Behavior:**
- Clicking "Get Started" logs "Onboarding completed" in the console
- UI does nothing - user is stuck on the same page
- No navigation occurs after button click

**Expected Behavior:**
- After clicking "Get Started", user should be redirected to tutor dashboard
- Navigation should occur (e.g., `router.push('/tutor/dashboard')` or update local state)

**Steps to Reproduce:**
1. Navigate to Tutor onboarding/welcome page
2. Click the green "Get Started" button
3. Observe: Console logs success but page doesn't change

**Video Timestamp:** 1:05 - 1:30

**Technical Details:**
- Check the `handleGetStarted` function
- Missing navigation logic after console log
- Should redirect to `/tutor/dashboard` or show dashboard state

**Fix Applied:**
- Added Next.js router navigation to "Get Started" button in OnboardingFlow
- Tutors are now redirected to `/tutor` route (TutorAvailabilityFlow)
- Students are redirected to `/find-tutor` route
- Added fallback logic to determine role from registration status if selectedRole is not set
- Button now properly navigates users after onboarding completion

**Files Modified:**
- `webapp/packages/nextjs/components/onboarding/OnboardingFlow.tsx`

---

### Bug 3: Root Route "Flicker" (FOUC - Flash of Unstyled Content)

**Priority:** 🟡 MEDIUM

**Location:** Root page `index.tsx/jsx` or main App router/Authentication Guard

**Current Behavior:**
- When navigating to root (`/`), the app rapidly flashes through multiple views:
  - Landing Page → Status Check → Dashboard
- Creates jarring user experience
- App is checking auth status/roles sequentially and rendering intermediate states

**Expected Behavior:**
- Implement a "Loading" or "SplashScreen" state
- Do not render any content (Landing page or Dashboard) until authentication and role checks are fully resolved
- Show loading indicator during auth/role resolution

**Steps to Reproduce:**
1. Navigate to `localhost:3000` (root route)
2. Observe: Rapid flickering through Landing Page → Status Check → Dashboard

**Video Timestamp:** 1:58 - 2:40

**Technical Details:**
- Check authentication guard logic
- Check role checking sequence
- Implement loading state that prevents rendering until all checks complete

---

### Bug 4: Language Code Display (ISO Code Instead of Name)

**Priority:** 🟢 LOW

**Location:** "Request Accepted" or "Session Details" component (where it lists "Language vs Budget")

**Current Behavior:**
- UI displays the raw ISO code (e.g., "Language: es") instead of human-readable name
- Creates confusion for users who don't know language codes

**Expected Behavior:**
- Display human-readable language name (e.g., "Spanish" instead of "es")
- Use proper language name mapping

**Steps to Reproduce:**
1. Accept a tutor request or view session details
2. Observe: Language field shows "es" instead of "Spanish"

**Video Timestamp:** 4:10 - 4:20

**Technical Details:**
- Create or use a utility function to map language codes to names
- Implementation: Use `new Intl.DisplayNames(['en'], { type: 'language' }).of('es')` or a lookup object
- Render "Spanish" instead of "es"

---

## 🤖 Agent-Friendly Task Breakdown

### Task 1: Fix Ghost Toast Notification ("Global Tutor Removed")

**Priority:** 🟡 MEDIUM

**Problem:**
Students see irrelevant "Global Tutor removed" toast notifications when navigating away or refreshing their dashboard. This is confusing and creates a poor user experience.

**Current Behavior:**
- Toast appears when student navigates away or refreshes
- Message is irrelevant to student context
- Notification appears on student's own screen erroneously

**Expected Behavior:**
- Toast should only appear if a tutor disconnects during an active session
- Suppress notification when current user is navigating
- Make toasts context-aware based on user role and session state

**Implementation:**
- Locate where "Global Tutor removed" toast is triggered (likely in SocketProvider or WebSocket event handlers)
- Add context check: only show if user is in active session and partner disconnects
- Suppress notification on component unmount or navigation
- Check if notification is meant for tutors only

**Files to Modify:**
- `webapp/packages/nextjs/lib/socket/socketContext.tsx` (likely)
- `webapp/packages/nextjs/components/dashboard/StudentDashboard.tsx` (check for toast handlers)
- Any WebSocket event handlers that emit tutor-related notifications

**Estimated Effort:** Small (30 minutes - 1 hour)

---

### Task 2: Fix Broken "Get Started" Button (Tutor Onboarding)

**Priority:** 🔴 CRITICAL

**Problem:**
The "Get Started" button on the tutor onboarding/welcome page logs success but doesn't navigate, leaving users stuck.

**Current Behavior:**
- Button click logs "Onboarding completed" to console
- No UI change occurs
- User remains on same page

**Expected Behavior:**
- After clicking "Get Started", redirect to tutor dashboard
- Navigation should occur via router or state update

**Implementation:**
- Locate the Welcome/Onboarding component with green "Get Started" button
- Find `handleGetStarted` function
- Add navigation logic after console log:
  - Use `router.push('/tutor/dashboard')` or similar
  - Or update local state to show dashboard view
- Test that navigation works correctly

**Files to Modify:**
- Welcome/Onboarding component (need to locate - check `webapp/packages/nextjs/components/onboarding/` or similar)
- Check for `handleGetStarted` function

**Estimated Effort:** Small (15-30 minutes)

---

### Task 3: Fix Root Route "Flicker" (FOUC)

**Priority:** 🟡 MEDIUM

**Problem:**
Navigating to root route (`/`) causes rapid flickering through multiple views (Landing Page → Status Check → Dashboard) as auth/role checks resolve sequentially.

**Current Behavior:**
- App renders intermediate states during auth/role checks
- Creates jarring flicker effect
- Multiple views flash in sequence

**Expected Behavior:**
- Show loading/splash screen during auth/role resolution
- Don't render any content until all checks complete
- Smooth transition to final view

**Implementation:**
- Locate root page (`index.tsx` or main router)
- Find authentication guard and role checking logic
- Add loading state that prevents rendering until:
  - Authentication status is resolved
  - User role is determined
  - All checks are complete
- Show loading indicator/splash screen during this time
- Only render Landing Page or Dashboard after all checks complete

**Files to Modify:**
- `webapp/packages/nextjs/app/page.tsx` (root page)
- Authentication guard component (if separate)
- Main app router/layout

**Estimated Effort:** Medium (1-2 hours)

---

### Task 4: Map Language Codes to Names

**Priority:** 🟢 LOW

**Problem:**
UI displays raw ISO language codes (e.g., "es") instead of human-readable names (e.g., "Spanish") in session details.

**Current Behavior:**
- Language field shows "Language: es"
- Users see ISO codes instead of readable names

**Expected Behavior:**
- Display "Language: Spanish" instead of "Language: es"
- Use proper language name mapping

**Implementation:**
- Locate "Request Accepted" or "Session Details" component
- Find where language code is displayed
- Create utility function to map codes to names:
  - Option 1: Use `new Intl.DisplayNames(['en'], { type: 'language' }).of('es')`
  - Option 2: Create lookup object mapping codes to names
- Replace code display with mapped name
- Consider using existing LANGUAGES constant if available

**Files to Modify:**
- "Request Accepted" component (need to locate)
- "Session Details" component (need to locate)
- Create or update language utility function
- Check `webapp/packages/nextjs/lib/constants/contracts.ts` for existing LANGUAGES constant

**Estimated Effort:** Small (30 minutes - 1 hour)

---

## ✅ Completion Status

- [x] Bug 1 / Task 1 - Fix Ghost Toast Notification - ✅ FIXED
- [x] Bug 2 / Task 2 - Fix Broken "Get Started" Button - ✅ FIXED
- [ ] Bug 3 / Task 3 - Fix Root Route "Flicker" - 🟡 TODO
- [ ] Bug 4 / Task 4 - Map Language Codes to Names - 🟢 TODO

---

## 📝 Notes

- All issues identified during User Acceptance Testing (Wave 3)
- Task 2 (Broken Button) is critical as it blocks tutor onboarding flow
- Task 3 (Flicker) affects first impression and perceived app quality
- Task 4 is low priority but improves UX polish

---

## 🔗 Related Issues

- Previous bug report: `bug-report-2025-01-21-student-session-warning-and-language-flicker.md` (also dealt with language display issues)

