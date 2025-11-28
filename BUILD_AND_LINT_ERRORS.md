# Build and Lint Errors Report

Generated: November 28, 2025

## Summary

- **Total Errors**: 60
- **Total Warnings**: 12
- **Files with Errors**: 13
- **Files with Warnings**: 8

---

## Error Ranking by Severity and File

### 🔴 Critical Errors (Blocking Build) - 60 errors

#### 1. **components/session/ActiveSessionPrompt.tsx** - 18 errors
   - **Priority: HIGHEST** - Most errors in a single file
   - **Errors**:
     - Line 284: 6 unused variables (token, endTime, ratePerSecond, totalPaid, languageId, sessionId)
     - Line 375: 9 unused variables (student, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive)
     - Line 404: 9 unused variables (student, tutor, token, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive)
   - **Fix**: Remove unused destructured variables or prefix with underscore

#### 2. **components/student/StudentTutorFinder.tsx** - 12 errors
   - **Priority: HIGH** - Many unused variables
   - **Errors**:
     - Line 6: 'AnimatePresence' imported but never used
     - Line 32: 'onSessionStart' parameter never used
     - Line 35: 'emit' assigned but never used
     - Line 44: 'availableTutors' and 'setAvailableTutors' never used
     - Line 75: 'startSessionWrite' and 'isStartingSession' never used
     - Line 88: 'studentBalance' never used
     - Line 95: 'tokenAllowance' never used
     - Line 116: 'tutorInfoData' never used
     - Line 259: 't' parameter never used
     - Line 365: 6 unused destructured variables (token, endTime, ratePerSecond, totalPaid, languageId)
     - Line 1004: Unescaped apostrophe
   - **Fix**: Remove unused variables/imports, fix apostrophe

#### 3. **components/tutor/TutorAvailabilityFlow.tsx** - 10 errors
   - **Priority: HIGH** - Includes React Hook violation
   - **Errors**:
     - Line 43: **CRITICAL** - React Hook called inside callback (react-hooks/rules-of-hooks)
     - Line 103: 'languages' never used
     - Line 133: 'originalOn' never used
     - Line 362: 6 unused destructured variables (tutor, token, endTime, ratePerSecond, totalPaid, languageId)
     - Lines 729, 911, 1020: 3 unescaped apostrophes
   - **Fix**: Move hook outside callback, remove unused vars, escape apostrophes

#### 4. **components/onboarding/** - 4 errors
   - **Priority: MEDIUM** - All unescaped apostrophes
   - **Files**:
     - `OnboardingFlow.tsx` (Line 178)
     - `RoleSelection.tsx` (Line 22)
     - `StudentRegistration.tsx` (Line 127)
   - **Fix**: Replace `'` with `&apos;` or use proper quotes

#### 5. **components/deposit/DepositFlow.tsx** - 2 errors
   - **Priority: MEDIUM**
   - **Errors**:
     - Line 32: 'isAllowanceLoading' never used
     - Line 221: Unescaped apostrophe
   - **Fix**: Remove unused variable, escape apostrophe

#### 6. **lib/socket/socketContext.tsx** - 2 errors
   - **Priority: MEDIUM**
   - **Errors**:
     - Line 40: 'connect' assigned but never used
     - Line 112: 'disconnect' assigned but never used
   - **Fix**: Remove unused variables or use them

#### 7. **components/scaffold-eth/MockTokenFaucet.tsx** - 2 errors
   - **Priority: LOW** - Scaffold component, may be for testing
   - **Errors**:
     - Line 11: 'localWalletClient' never used
     - Line 45: 'getMockTokenAddress' never used
   - **Fix**: Remove or comment out unused code

#### 8. **app/page.tsx** - 1 error
   - **Priority: MEDIUM**
   - **Error**: Line 202: 'onBackToHome' parameter never used
   - **Fix**: Remove parameter or use it

#### 9. **components/Header.tsx** - 1 error
   - **Priority: MEDIUM**
   - **Error**: Line 53: 'disconnectedMenuLinks' never used
   - **Fix**: Remove or use variable

#### 10. **components/dashboard/StudentDashboard.tsx** - 1 error
   - **Priority: MEDIUM**
   - **Error**: Line 19: 'onStartLearning' parameter never used
   - **Fix**: Remove parameter or implement functionality

#### 11. **lib/constants/contracts.ts** - 1 error
   - **Priority: LOW** - May be used elsewhere
   - **Error**: Line 1: 'deployedContracts' imported but never used
   - **Fix**: Remove import or export it if needed

---

### ⚠️ Warnings (Non-blocking) - 12 warnings

#### 1. **React Hooks Exhaustive Dependencies** - 9 warnings
   - **Priority: MEDIUM** - Can cause bugs
   - **Files**:
     - `components/session/ActiveSessionPrompt.tsx` (Line 370)
     - `components/socket/SocketNotifications.tsx` (Line 149)
     - `components/socket/StudentSocketEvents.tsx` (Line 117)
     - `components/socket/TutorSocketEvents.tsx` (Line 124)
     - `components/student/StudentTutorFinder.tsx` (Line 331)
     - `components/tutor/TutorAvailabilityFlow.tsx` (Lines 63, 333)
     - `lib/socket/socketContext.tsx` (Lines 110, 248)
   - **Fix**: Add missing dependencies to dependency arrays

#### 2. **React Hook Variable Assignments** - 2 warnings
   - **Priority: LOW** - Performance optimization
   - **File**: `components/Globe.tsx`
   - **Lines**: 75 (width), 86 (phi)
   - **Fix**: Use useRef for mutable values

#### 3. **Next.js Image Optimization** - 1 warning
   - **Priority: LOW** - Performance suggestion
   - **File**: `components/testimonials.tsx` (Line 59)
   - **Fix**: Replace `<img>` with Next.js `<Image />` component

---

## Fix Priority Order

### Phase 1: Critical Blocking Errors (Must Fix)
1. ✅ `components/tutor/TutorAvailabilityFlow.tsx` - React Hook violation (Line 43)
2. ✅ `components/session/ActiveSessionPrompt.tsx` - 18 unused variables
3. ✅ `components/student/StudentTutorFinder.tsx` - 12 unused variables/imports
4. ✅ `components/tutor/TutorAvailabilityFlow.tsx` - Remaining 9 errors

### Phase 2: Medium Priority Errors
5. ✅ Unescaped apostrophes (5 files)
6. ✅ Unused variables in smaller files (6 files)

### Phase 3: Warnings (Optional but Recommended)
7. ⚠️ React Hook dependency arrays (9 warnings)
8. ⚠️ React Hook variable assignments (2 warnings)
9. ⚠️ Next.js image optimization (1 warning)

---

## Error Types Breakdown

| Error Type | Count | Severity |
|------------|-------|----------|
| `@typescript-eslint/no-unused-vars` | 50 | Error |
| `react/no-unescaped-entities` | 8 | Error |
| `react-hooks/rules-of-hooks` | 1 | Error |
| `react-hooks/exhaustive-deps` | 9 | Warning |
| `@next/next/no-img-element` | 1 | Warning |
| React Hook variable assignments | 2 | Warning |

---

## Files Affected

1. `app/page.tsx`
2. `components/Globe.tsx`
3. `components/Header.tsx`
4. `components/dashboard/StudentDashboard.tsx`
5. `components/deposit/DepositFlow.tsx`
6. `components/onboarding/OnboardingFlow.tsx`
7. `components/onboarding/RoleSelection.tsx`
8. `components/onboarding/StudentRegistration.tsx`
9. `components/scaffold-eth/MockTokenFaucet.tsx`
10. `components/session/ActiveSessionPrompt.tsx`
11. `components/socket/SocketNotifications.tsx`
12. `components/socket/StudentSocketEvents.tsx`
13. `components/socket/TutorSocketEvents.tsx`
14. `components/student/StudentTutorFinder.tsx`
15. `components/testimonials.tsx`
16. `components/tutor/TutorAvailabilityFlow.tsx`
17. `lib/constants/contracts.ts`
18. `lib/socket/socketContext.tsx`

---

## Notes

- All errors must be fixed for production build
- Warnings are recommended but not blocking
- Most errors are unused variables that can be safely removed
- The React Hook violation in `TutorAvailabilityFlow.tsx` is the most critical issue
- Unescaped apostrophes are easy fixes (replace with `&apos;` or use proper quotes)

