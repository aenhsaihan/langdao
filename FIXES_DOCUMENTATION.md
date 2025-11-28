# Build and Lint Fixes Documentation

**Date:** November 28, 2025 (Updated: January 2025)  
**Branch:** main  
**Status:** ✅ All critical errors fixed, build passes with warnings only

---

## Summary

Fixed **60+ critical errors** and **8 unescaped apostrophes** that were blocking production builds. The build now compiles successfully with only non-blocking warnings remaining.

**Before:** 60+ Errors + 12 Warnings  
**After:** 0 Errors + 12 Warnings (non-blocking)

**Latest Build Fixes (January 2025):**
- Fixed TypeScript type errors in 7 files
- Fixed `@ts-expect-error` directive placement in `TutorRegistration.tsx`
- Fixed missing imports (`hardhat` from `viem/chains` in `MockTokenFaucet.tsx`)
- Fixed `toast.info()` calls (replaced with `toast()` in `StudentSocketEvents.tsx` and `TutorSocketEvents.tsx`)
- Fixed contract function name (`tutorRates` → `getTutorRate` in `StudentTutorFinder.tsx`)
- Fixed `useScaffoldReadContract` query options (40+ instances in `TutorAvailabilityFlow.tsx`)
- Fixed args array type error in `ActiveSessionPrompt.tsx`

---

## Files Modified

### Critical Fixes (React Hook Violations)

#### 1. `components/tutor/TutorAvailabilityFlow.tsx`
**Issue:** React Hook `useScaffoldReadContract` was called inside a `.map()` callback (line 42-48), violating React's Rules of Hooks.

**Fix:** Moved all 38 hook calls to the top level of the component. Each hook is now called individually with proper `query: { enabled: ... }` conditions.

**Changes:**
- Replaced `.map()` callback with 38 individual hook calls (`tutorLang0` through `tutorLang37`)
- Changed `enabled: !!account?.address` to `query: { enabled: !!account?.address }` (user's fix)
- Created `tutorLanguageChecks` array to collect all hook results
- Fixed unused variables: removed `languages`, `originalOn`, and unused destructured variables
- Fixed unescaped apostrophes: `You're` → `You&apos;re`, `You've` → `You&apos;ve`

**Lines Changed:** ~200 lines (added 38 hook calls)

---

### Unused Variables Fixes

#### 2. `components/session/ActiveSessionPrompt.tsx`
**Issues:** 
- 18 unused destructured variables from `activeSessionData`
- Type error: `Type '[0x${string}] | undefined' is not assignable to type 'readonly [string | undefined]'`

**Fixes:**
- Line 284: Changed `const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive]` to `const [student, tutor, , startTime, , , , , , isActive]` (only keeping used vars)
- Line 375: Changed to `const [, tutor] = activeSessionData` (only tutor needed)
- Line 404: Changed to `const [, , , startTime] = activeSessionData` (only startTime needed)
- Fixed args array type error: Changed from `args: tutorAddressFromStorage ? [tutorAddressFromStorage as \`0x${string}\`] : undefined` to `args: [tutorAddressFromStorage ? (tutorAddressFromStorage as \`0x${string}\`) : undefined]`
- The fix ensures args is always an array (with optional undefined element) instead of conditionally being undefined

**Lines Changed:** 4 locations

---

#### 3. `components/student/StudentTutorFinder.tsx`
**Issues:** 
- 12 unused variables/imports
- Type error: `Type '"tutorRates"' is not assignable to type '...'` (function doesn't exist)
- Type error: `Type '[0x${string}]' is not assignable to type 'readonly [string | undefined, number | undefined]'` (wrong number of args)

**Fixes:**
- Removed unused import: `AnimatePresence` from `framer-motion`
- Removed unused parameter: `onSessionStart` from props
- Removed unused variable: `emit` from `useSocket()` destructuring
- Removed unused state: `availableTutors` and `setAvailableTutors`
- Removed unused hooks: `startSessionWrite`, `isStartingSession`, `studentBalance`, `tokenAllowance`, `tutorInfoData`
- Removed unused import: `useScaffoldWriteContract`
- Fixed unused parameter: `(t: any)` → `() =>` in toast callback
- Fixed destructuring: Line 365 - only keep `student, tutor, startTime, sessionId, isActive`
- Fixed unescaped apostrophe: `tutor's` → `tutor&apos;s`
- Added language ID lookup: `const selectedLanguageId = language ? LANGUAGES.find(l => l.code === language)?.id : undefined`
- Changed function name: `"tutorRates"` → `"getTutorRate"` (correct function name)
- Added language ID parameter: `args: [currentTutor?.tutorAddress as \`0x${string}\`, selectedLanguageId ?? 0]` (function requires 2 args: address and languageId)

**Lines Changed:** ~17 locations

---

#### 4. `components/deposit/DepositFlow.tsx`
**Issues:** 
- Unused variable: `isAllowanceLoading`
- Unescaped apostrophe: `don't`

**Fixes:**
- Removed `isLoading: isAllowanceLoading` from destructuring
- Fixed apostrophe: `don't` → `don&apos;t`

**Lines Changed:** 2 locations

---

#### 5. `components/dashboard/StudentDashboard.tsx`
**Issue:** Unused parameter `onStartLearning`

**Fix:**
- Removed `onStartLearning` from props destructuring

**Lines Changed:** 1 location

---

#### 6. `components/Header.tsx`
**Issue:** Unused variable `disconnectedMenuLinks`

**Fix:**
- Commented out `disconnectedMenuLinks` array with note for future use

**Lines Changed:** 1 location

---

#### 7. `app/page.tsx`
**Issues:**
- Unused parameter `onBackToHome` in `HowItWorksView`
- Unused variable `showHome`

**Fixes:**
- Removed `onBackToHome` parameter from `HowItWorksView` component
- Removed `showHome` from `usePageView()` destructuring
- Removed `onBackToHome={showHome}` prop from JSX

**Lines Changed:** 3 locations

---

#### 8. `components/scaffold-eth/MockTokenFaucet.tsx`
**Issues:** 
- Unused imports: `useEffect`, `createWalletClient`, `http`
- Unused variables: `localWalletClient`, `getMockTokenAddress`
- Typo: `placeHolder` → `placeholder`
- Missing import: `hardhat` from `viem/chains` (used on line 69)
- Type error: `Cannot find name 'hardhat'`

**Fixes:**
- Removed `useEffect` from React imports
- Removed `createWalletClient` and `http` from viem imports
- Added missing import: `import { hardhat } from "viem/chains";`
- Commented out `localWalletClient` with note
- Commented out `getMockTokenAddress` function with note
- Fixed typo: `placeHolder` → `placeholder`

**Lines Changed:** ~6 locations

---

#### 9. `lib/constants/contracts.ts`
**Issue:** Unused import `deployedContracts`

**Fix:**
- Commented out import with note for future use

**Lines Changed:** 1 location

---

#### 10. `lib/socket/socketContext.tsx`
**Issues:** Unused functions `connect` and `disconnect`

**Fixes:**
- Prefixed with underscore: `_connect` and `_disconnect`
- Added `eslint-disable-next-line @typescript-eslint/no-unused-vars` comments

**Lines Changed:** 2 locations

---

### Unescaped Apostrophes Fixes

#### 11. `components/onboarding/OnboardingFlow.tsx`
**Fix:** `you're` → `you&apos;re` (line 178)

#### 12. `components/onboarding/RoleSelection.tsx`
**Fix:** `you'd` → `you&apos;d` (line 22)

#### 13. `components/onboarding/StudentRegistration.tsx`
**Fix:** `You'll` → `You&apos;ll` (line 127)

#### 14. `components/tutor/TutorAvailabilityFlow.tsx`
**Fixes:**
- `You're` → `You&apos;re` (line 993)
- `You've` → `You&apos;ve` (line 1167)
- `You're` → `You&apos;re` (line 1284)

#### 15. `components/student/StudentTutorFinder.tsx`
**Fix:** `tutor's` → `tutor&apos;s` (line 984)

#### 16. `components/deposit/DepositFlow.tsx`
**Fix:** `don't` → `don&apos;t` (line 221)

---

### TypeScript Type Errors

#### 17. `components/onboarding/TutorRegistration.tsx`
**Issues:** 
- Type error - `bigint[]` not assignable to `readonly number[]`
- Unused `@ts-expect-error` directive (TypeScript error on wrong line)

**Fixes:**
- Moved `@ts-expect-error` directive to the correct line (on the `args` property, line 50)
- The directive now properly suppresses the type error: `Type 'bigint[]' is not assignable to type 'readonly number[]'`

**Code:**
```typescript
await writeContractAsync({
  functionName: "registerTutor",
  // @ts-expect-error - Type mismatch: bigint[] vs readonly number[]
  args: [selectedLanguages.map(id => BigInt(id)), BigInt(ratePerSecond)],
});
```

**Lines Changed:** 1 location (moved directive)

---

### Empty File Fixes

#### 18. `app/dashboard/page.tsx`
**Issue:** Empty file causing "not a module" error

**Fix:**
- Added minimal default export: `export default function DashboardPage() { return null; }`

**Lines Changed:** Created file with 3 lines

---

### Latest Build Fixes (January 2025)

#### 19. `components/socket/StudentSocketEvents.tsx`
**Issues:**
- Type error: `Parameter 't' implicitly has an 'any' type` in toast callback
- Type error: `Property 'info' does not exist on type` (react-hot-toast doesn't have `info` method)

**Fixes:**
- Added `Toast` type import: `import toast, { Toast } from "react-hot-toast";`
- Typed toast callback parameter: `(t: Toast) =>` instead of `t =>`
- Replaced all `toast.info()` calls with `toast()` (4 instances):
  - Line 80: `toast.info("A tutor declined your request")` → `toast("A tutor declined your request")`
  - Line 98: `toast.info("Tutor became unavailable...")` → `toast("Tutor became unavailable...")`
  - Line 145: `toast.info("Tutor rejected...")` → `toast("Tutor rejected...")`
  - Line 157: `toast.info("Request cancelled")` → `toast("Request cancelled")`

**Lines Changed:** 5 locations

---

#### 20. `components/socket/TutorSocketEvents.tsx`
**Issues:**
- Type error: `Parameter 't' implicitly has an 'any' type` in toast callback
- Type error: `Property 'info' does not exist on type` (react-hot-toast doesn't have `info` method)

**Fixes:**
- Added `Toast` type import: `import toast, { Toast } from "react-hot-toast";`
- Typed toast callback parameter: `(t: Toast) =>` instead of `t =>`
- Replaced all `toast.info()` calls with `toast()` (2 instances):
  - Line 87: `toast.info("Request declined")` → `toast("Request declined")`
  - Line 93: `toast.info("Student rejected you...")` → `toast("Student rejected you...")`

**Lines Changed:** 4 locations

---

#### 21. `components/tutor/TutorAvailabilityFlow.tsx` (Additional Fixes)
**Issues:**
- Type error: `'enabled' does not exist in type 'UseScaffoldReadConfig<...>'` (40 instances)
- The `enabled` property must be nested inside `query` object

**Fixes:**
- Changed all 40 instances from `enabled: !!account?.address` to `query: { enabled: !!account?.address }`
- Changed 2 other instances with different conditions:
  - `enabled: !!currentSession?.studentAddress` → `query: { enabled: !!currentSession?.studentAddress }`
  - `enabled: !!account?.address && selectedLanguageId !== null` → `query: { enabled: !!account?.address && selectedLanguageId !== null }`

**Lines Changed:** 42 locations (40 language checks + 2 other queries)

---

## Import Changes Summary

### Removed Imports:
1. `AnimatePresence` from `framer-motion` (StudentTutorFinder.tsx)
2. `useEffect` from `react` (MockTokenFaucet.tsx)
3. `createWalletClient`, `http` from `viem` (MockTokenFaucet.tsx)
4. `useScaffoldWriteContract` from hooks (StudentTutorFinder.tsx)
5. `deployedContracts` from contracts (commented out in contracts.ts)

### Added Imports:
1. `hardhat` from `viem/chains` (MockTokenFaucet.tsx)
2. `Toast` from `react-hot-toast` (StudentSocketEvents.tsx, TutorSocketEvents.tsx)

### Modified Imports:
- None (only removals and additions)

---

## API/Function Call Changes

### 1. `useScaffoldReadContract` Hook Changes
**Before:**
```typescript
enabled: !!account?.address
```

**After:**
```typescript
query: { enabled: !!account?.address }
```

**Files Affected:**
- `components/tutor/TutorAvailabilityFlow.tsx` (40 instances total: 38 language checks + 2 other queries)

### 2. Contract Function Call Changes
**File:** `components/student/StudentTutorFinder.tsx`

**Before:**
```typescript
functionName: "tutorRates",
args: [currentTutor?.tutorAddress as `0x${string}`],
```

**After:**
```typescript
functionName: "getTutorRate",
args: [currentTutor?.tutorAddress as `0x${string}`, selectedLanguageId ?? 0],
```

**Reason:** Changed to use `getTutorRate` with language ID parameter instead of `tutorRates`.

---

## Type Assertions and Type Errors

### 1. TutorRegistration.tsx - BigInt Array Type Error
**Problem:** 
- TypeScript error: `Type 'readonly bigint[]' is not assignable to type 'readonly number[]'`
- Unused `@ts-expect-error` directive (directive was on wrong line)

**Solution:** 
- Moved `@ts-expect-error` directive to the line with the actual error (on `args` property)
- The directive now correctly suppresses: `Type 'bigint[]' is not assignable to type 'readonly number[]'`

**Location:** Line 50 (moved from line 46)

### 2. ActiveSessionPrompt.tsx - Args Array Type Error
**Problem:** TypeScript error: `Type '[0x${string}] | undefined' is not assignable to type 'readonly [string | undefined]'`

**Solution:** Changed conditional args from `undefined` to array with undefined element:
- Before: `args: tutorAddressFromStorage ? [tutorAddressFromStorage] : undefined`
- After: `args: [tutorAddressFromStorage ? tutorAddressFromStorage : undefined]`

**Location:** Line 96

### 3. StudentTutorFinder.tsx - Function Name and Args Error
**Problem:** 
- Type error: `Type '"tutorRates"' is not assignable` (function doesn't exist)
- Type error: Wrong number of arguments (function requires 2 args, only 1 provided)

**Solution:**
- Changed function name: `"tutorRates"` → `"getTutorRate"`
- Added language ID lookup and parameter: `args: [tutorAddress, selectedLanguageId ?? 0]`

**Location:** Lines 98-102

### 4. StudentSocketEvents.tsx & TutorSocketEvents.tsx - Toast Type Errors
**Problem:**
- Type error: `Parameter 't' implicitly has an 'any' type`
- Type error: `Property 'info' does not exist` (react-hot-toast doesn't have `info` method)

**Solution:**
- Added `Toast` type import and typed callback: `(t: Toast) =>`
- Replaced `toast.info()` with `toast()` (react-hot-toast only has `success`, `error`, `loading`, and base `toast()`)

**Locations:** StudentSocketEvents.tsx (5 changes), TutorSocketEvents.tsx (4 changes)

### 5. TutorAvailabilityFlow.tsx - Query Options Type Error
**Problem:** Type error: `'enabled' does not exist in type 'UseScaffoldReadConfig'` (40 instances)

**Solution:** Changed `enabled:` to `query: { enabled: ... }` format (required by hook API)

**Location:** 40 instances throughout the file

---

## React Hook Dependency Warnings (Not Fixed)

These warnings remain but are **non-blocking**:

1. `components/Globe.tsx` - width and phi variable assignments
2. `components/session/ActiveSessionPrompt.tsx` - missing dependencies in useEffect
3. `components/socket/SocketNotifications.tsx` - missing dependencies
4. `components/socket/StudentSocketEvents.tsx` - missing dependencies
5. `components/socket/TutorSocketEvents.tsx` - missing dependencies
6. `components/student/StudentTutorFinder.tsx` - missing dependencies
7. `components/tutor/TutorAvailabilityFlow.tsx` - missing dependencies (2 instances)
8. `lib/socket/socketContext.tsx` - missing dependencies (2 instances)
9. `components/testimonials.tsx` - Next.js Image optimization suggestion

**Note:** These can be fixed later as they don't block the build.

---

## Testing Recommendations

After these fixes, test the following flows:

1. **Tutor Registration Flow:**
   - Register as tutor with multiple languages
   - Verify all 38 language checks work correctly
   - Test language selection and rate setting

2. **Student Flow:**
   - Search for tutors
   - Accept tutor requests
   - Start sessions

3. **Session Management:**
   - Active session prompts display correctly
   - Session ending works properly
   - WebRTC connections work

4. **Onboarding:**
   - Student registration
   - Tutor registration
   - Deposit flow

---

## Breaking Changes

### None
All changes are backward compatible. No breaking API changes.

---

## Files That Need Future Attention

1. **React Hook Dependencies:** 9 warnings about missing dependencies in useEffect/useCallback hooks
2. **Image Optimization:** Consider replacing `<img>` with Next.js `<Image />` in `components/testimonials.tsx`
3. **Reserved Functions:** Several functions are commented out as "reserved for future use":
   - `disconnectedMenuLinks` in Header.tsx
   - `localWalletClient` and `getMockTokenAddress` in MockTokenFaucet.tsx
   - `_connect` and `_disconnect` in socketContext.tsx
   - `deployedContracts` import in contracts.ts

---

## Build Commands

```bash
# Frontend build
cd webapp/packages/nextjs
npm run build

# Frontend lint
npm run lint

# Format code
npm run format
```

---

## Notes for Next Developer

1. **React Hooks:** All hooks must be called at the top level of components, never inside loops, conditions, or callbacks.

2. **Type Assertions:** The `@ts-expect-error` directive in TutorRegistration.tsx is intentional due to a type definition mismatch. The contract expects `bigint[]` but the generated types say `number[]`. The directive must be placed directly before the line with the error (on the `args` property).

3. **Query Options:** The `useScaffoldReadContract` hook uses `query: { enabled: ... }` syntax instead of direct `enabled` prop. This is required by the hook's type definition.

4. **Toast Notifications:** `react-hot-toast` doesn't have an `info()` method. Use `toast()` for informational messages, or `toast.success()`, `toast.error()`, `toast.loading()` for other types.

5. **Toast Callbacks:** When using toast with a render function, type the parameter as `(t: Toast) =>` to avoid implicit `any` type errors.

4. **Apostrophes in JSX:** Always use `&apos;` instead of `'` in JSX text content to avoid React warnings.

5. **Unused Variables:** When destructuring arrays/objects, use empty slots (`,`) or underscore prefix (`_variable`) for unused values.

---

## Related Files

### Configuration Files (Not Modified):
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `.prettierrc.js`

### Files Created:
- `app/dashboard/page.tsx` (was empty, now has minimal export)
- `BUILD_AND_LINT_ERRORS.md` (error report)
- `FIXES_DOCUMENTATION.md` (this file)

---

## Git Status

All changes are on the `main` branch. Ready for production deployment after testing.

---

## Contact

If you encounter issues with these fixes, check:
1. The original error report: `BUILD_AND_LINT_ERRORS.md`
2. This documentation for specific file changes
3. The git diff for exact line-by-line changes

