# Vibe Kanban Workflow Manual

## Overview

This manual documents the established workflow for using Vibe Kanban MCP with Cursor to manage and execute coding tasks. This workflow ensures proper isolation, testing, and review before merging code to main.

**Last Updated:** November 16, 2025  
**Status:** Working, continuously improving

---

## Table of Contents

1. [Initial Setup & Connection](#initial-setup--connection)
   - [MCP Configuration](#mcp-configuration)
   - [Handling Port Changes](#handling-port-changes)
2. [Initial Issues & Solutions](#initial-issues--solutions)
3. [Finalized Workflow](#finalized-workflow)
   - [Planning Phase](#0-planning-phase-optional-but-recommended)
   - [Task Selection & Agent Assessment](#1-task-selection--agent-assessment)
   - [Starting Tasks](#2-start-task-attempt)
   - [Monitoring Progress](#3-monitor-task-progress)
   - [Reviewing Work](#4-review-agent-work)
   - [Testing](#5-test-in-isolation-before-merge)
   - [Merging](#6-merge-to-main)
   - [Cleanup](#7-cleanup-worktree--branch)
   - [Updating Kanban](#10-update-kanban)
4. [Agent Selection Guide](#agent-selection-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup & Connection

### MCP Configuration

Vibe Kanban MCP server configuration in Cursor settings:

```json
{
  "mcp_servers": {
    "vibe_kanban": {
      "command": "npx",
      "args": ["-y", "vibe-kanban@latest", "--mcp"],
      "env": {
        "VIBE_KANBAN_URL": "http://127.0.0.1:63894"
      }
    }
  }
}
```

**Note:** Update the `VIBE_KANBAN_URL` environment variable if the server port changes. After updating Cursor settings, restart Cursor for the changes to take effect.

### Handling Port Changes

Vibe Kanban server may change ports when restarted. When this happens, you need to update the MCP configuration to reconnect.

#### Detecting Port Changes

**Symptoms:**
- MCP functions fail with error: `Failed to connect to VK API`
- Error details show: `error sending request for url (http://127.0.0.1:OLD_PORT/api/...)`
- MCP commands return `{"success": false, "error": "Failed to connect to VK API"}`

**How to Find the New Port:**
1. Check the Vibe Kanban UI/browser - the URL will show the current port
2. Or check the terminal where Vibe Kanban is running - it will display the port on startup
3. The port is typically in the format: `http://127.0.0.1:PORT`

#### Updating MCP Configuration

1. **Open Cursor Settings:**
   - Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Or go to `Cursor > Settings` (Mac) / `File > Preferences > Settings` (Windows/Linux)

2. **Find MCP Servers Configuration:**
   - Search for "MCP" or "mcp_servers" in settings
   - Or navigate to the MCP servers configuration section

3. **Update the Environment Variable:**
   - Locate the `vibe_kanban` server configuration
   - Update the `VIBE_KANBAN_URL` in the `env` section:
   ```json
   {
     "mcp_servers": {
       "vibe_kanban": {
         "command": "npx",
         "args": ["-y", "vibe-kanban@latest", "--mcp"],
         "env": {
           "VIBE_KANBAN_URL": "http://127.0.0.1:NEW_PORT"
         }
       }
     }
   }
   ```
   - Replace `NEW_PORT` with the actual port number (e.g., `63894`)

4. **Restart Cursor:**
   - **Important:** You must restart Cursor completely for MCP configuration changes to take effect
   - Close all Cursor windows and reopen
   - Or use `Cmd+Q` (Mac) / `Alt+F4` (Windows) to fully quit, then restart

#### Verifying the Connection

After updating and restarting, verify the connection works:

1. **Test with curl (Terminal):**
   ```bash
   curl http://127.0.0.1:NEW_PORT/api/projects
   ```
   - Should return JSON with `{"success": true, "data": [...]}`
   - If this fails, the server isn't running or the port is wrong

2. **Test with MCP Function:**
   - Try listing projects: `mcp_vibe-kanban_list_projects`
   - Should return `{"success": true, "data": [...]}`
   - If it still fails, check:
     - Did you restart Cursor completely?
     - Is the port number correct?
     - Is the server actually running on that port?

3. **Update Documentation:**
   - Update this manual's port reference in the "Verification" section below
   - Update any other documentation that references the port

#### Quick Reference: Port Change Checklist

- [ ] Identify new port from Vibe Kanban UI or terminal
- [ ] Update `VIBE_KANBAN_URL` in Cursor MCP settings
- [ ] Restart Cursor completely
- [ ] Test connection with `curl http://127.0.0.1:NEW_PORT/api/projects`
- [ ] Test MCP function: `mcp_vibe-kanban_list_projects`
- [ ] Update documentation with new port

### Verification

- Vibe Kanban runs at: `http://127.0.0.1:63894` (⚠️ Port may change - check Vibe Kanban UI)
- MCP functions available:
  - `mcp_vibe-kanban_list_projects`
  - `mcp_vibe-kanban_list_tasks`
  - `mcp_vibe-kanban_get_task`
  - `mcp_vibe-kanban_create_task`
  - `mcp_vibe-kanban_start_task_attempt`
  - `mcp_vibe-kanban_update_task`
  - `mcp_vibe-kanban_delete_task`

---

## Initial Issues & Solutions

### Issue 1: Bypassing Vibe Kanban

**Problem:** Initially, we were implementing tasks directly on `main` branch, bypassing Vibe Kanban's orchestration.

**Solution:** 
- Use `mcp_vibe-kanban_start_task_attempt` to let Vibe Kanban create worktrees and branches
- Do NOT implement code directly - let the agent do the work
- Our role is to oversee, review, and merge

### Issue 2: Stale vk/ Branches

**Problem:** Found stale `vk/` branches that were historical markers, not active feature branches. They were created by Vibe Kanban but work was done directly on main.

**Solution:**
- Identified branches were in worktrees at `/private/var/folders/.../vibe-kanban/worktrees/`
- Removed worktrees first: `git worktree remove <path>`
- Then deleted branches: `git branch -d <branch-name>`

### Issue 3: Agent Not Executing

**Problem:** Task showed "in-progress" but no code was being written. Agent was stuck with "System initialized with model: Auto".

**Solution:**
- Stopped the stuck attempt
- Restarted with `CODEX` executor instead of `CURSOR_AGENT`
- Avoided "Auto" model selection - use specific executors

### Issue 4: Testing Before Merge

**Problem:** Initially considered merging first, then testing (bad practice).

**Solution:**
- Always test in isolation from worktree before merging
- Copy `.env` to worktree: `cp main/.env worktree/.env`
- Install dependencies in worktree: `npm install --legacy-peer-deps`
- Test with Amplify sandbox: `npx ampx sandbox --once`
- Only merge after successful test

---

## Finalized Workflow

### Step-by-Step Process

#### 0. Planning Phase (Optional but Recommended)

**Best Practice: Create Implementation Plan First**

Before creating tasks, it's helpful to create a comprehensive implementation plan that maps out the architecture and phases:

1. **Create Plan Document:**
   - Use plan feature to map out project architecture
   - Break down into phases and sub-tasks
   - Document dependencies and relationships
   - Example: `safecontracts-mvp-implementation.plan.md`

2. **Plan Structure:**
   - High-level architecture overview
   - Phase-by-phase breakdown
   - Task dependencies
   - File structure
   - Implementation notes

3. **Create Kanban Tasks from Plan:**
   - Review plan phases
   - Create tasks for each phase/sub-task
   - Use plan as reference for task descriptions
   - Maintain plan as tasks are completed

**Benefits:**
- Clear roadmap before starting
- Better task organization
- Easier to identify dependencies
- Can track progress against plan
- Plan serves as documentation

**Example:**
```
1. Create plan: safecontracts-mvp-implementation.plan.md
   - Phase 1: Project Setup & Infrastructure
   - Phase 2: Data Models
   - Phase 3: Lambda Function
   - etc.

2. Create kanban tasks from plan:
   - Task: "Create S3 bucket resource with versioning" (Phase 1.2)
   - Task: "Define ContractExchange and ContractFile data models" (Phase 2.1)
   - etc.

3. Execute tasks, update plan as you go
```

#### 1. Task Selection & Agent Assessment

```typescript
// Check available tasks
mcp_vibe-kanban_list_tasks(project_id, status: "todo")

// Get task details
mcp_vibe-kanban_get_task(task_id)

// Assess which agent is best:
// - CODEX: Code completion, incremental changes
// - CURSOR_AGENT: General coding, setup, implementation
```

**Available Agents (with API access):**
- `CODEX` - Code completion focused, **RECOMMENDED DEFAULT**
- `CURSOR_AGENT` - General coding tasks, **USE WITH CAUTION**

**Agent Selection Guide:**
- **CODEX**: **Default choice** - Works reliably for most tasks:
  - Code generation and file creation
  - Server utilities and helpers
  - Test scripts
  - Component creation
  - Incremental changes and fixes
  - **Always respects executor parameter** ✅
- **CURSOR_AGENT**: Use only if necessary - **Known to default to "Auto"**:
  - May ignore executor parameter ⚠️
  - Requires immediate verification
  - Often needs restart with CODEX
  - **Not recommended for parallel execution**

#### 2. Start Task Attempt

```typescript
mcp_vibe-kanban_start_task_attempt(
  task_id: string,
  executor: "CODEX" | "CURSOR_AGENT",  // ⚠️ NEVER use "Auto" or undefined
  base_branch: "main"
)
```

**What Vibe Kanban Does:**
- Creates worktree at `/private/var/folders/.../vibe-kanban/worktrees/{attempt-id}-{task-slug}`
- Creates branch: `vk/{attempt-id}-{task-slug}`
- Sets task status to `in-progress`
- Agent begins working in the isolated worktree

**⚠️ CRITICAL: Verify Executor Immediately**
After starting, immediately check:
1. Task status shows `in-progress` (not stuck)
2. Vibe Kanban UI doesn't show "System initialized with model: Auto"
3. If "Auto" appears, STOP and restart with explicit executor

**Common Mistake:**
- Starting task without verifying executor → Agent uses "Auto" → Task hangs
- **Solution:** Always verify executor is set correctly before moving on

#### 3. Monitor Task Progress

- **DO NOT** work on the task directly
- **MCP Communication Model:**
  - MCP is **request-response only** (we query, kanban responds)
  - Kanban **cannot proactively notify** us via MCP
  - We must **poll/check** kanban status using MCP commands
  - The "moo" sound is a **UI feature**, not MCP notification

- **How to Monitor:**
  ```typescript
  // Option 1: Poll specific task status
  mcp_vibe-kanban_get_task(task_id)
  // Check if status changed from "in-progress" to "in-review"
  
  // Option 2: List tasks by status (more efficient for multiple tasks)
  mcp_vibe-kanban_list_tasks(project_id, status: "in-review")
  mcp_vibe-kanban_list_tasks(project_id, status: "in-progress")
  ```

- **Monitoring Strategy:**
  - **User notification:** Wait for "moo" sound (UI-level notification)
  - **Or polling:** Periodically check task status via MCP
  - Status will change from `in-progress` → `in-review` when done
  - After user notifies us, verify status with MCP before reviewing

- **Browser snapshots are only needed for:**
  - Verifying executor model (checking for "Auto" vs "CODEX" in UI)
  - Debugging executor issues
  - Checking specific UI details not available in MCP response

#### 4. Review Agent Work

**Best Practice: Review in Worktree Without Switching Main Branch**

You can review the code directly from the worktree path without ever leaving the main branch:

```bash
# Review from worktree path (use absolute path, no need to cd or switch branches)
# Worktree path: /private/var/folders/.../vibe-kanban/worktrees/{attempt-id}-{task-slug}

# Check what was created (using absolute path)
cd /path/to/worktree
git status
git log --oneline -5
git diff main...HEAD

# Read files directly from worktree (using absolute paths)
cat /path/to/worktree/src/components/auth/Auth.tsx
read_file /path/to/worktree/src/components/auth/Auth.tsx

# Check files created
ls -la /path/to/worktree/amplify/backend/functions/...
```

**Key Benefits:**
- ✅ **Main branch stays clean** - never switch away from main
- ✅ **Isolated review** - all review happens in worktree
- ✅ **No branch switching** - use absolute paths to read files
- ✅ **Parallel reviews** - can review multiple tasks independently
- ✅ **Safe testing** - test in worktree without affecting main

**Review Checklist:**
- [ ] Check git status in worktree
- [ ] Review files created/modified
- [ ] Verify code quality and structure
- [ ] Check for TypeScript/compilation errors (if applicable)
- [ ] Verify dependencies are correct
- [ ] Ensure no unintended files (like manual updates) are included

#### 5. Test in Isolation (Before Merge)

```bash
# Copy .env to worktree
cp /path/to/main/.env /path/to/worktree/.env

# Install dependencies
cd /path/to/worktree
npm install --legacy-peer-deps

# Test with Amplify sandbox
export $(cat .env | grep -v '^#' | xargs)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
npx ampx sandbox --once
```

**Why Test Before Merge:**
- ✅ Catches issues early
- ✅ No need to revert if test fails
- ✅ Can fix issues in branch before merge
- ✅ Maintains clean main branch

#### 6. Merge to Main

```bash
# From main branch (you're already here, never left!)
cd /path/to/main/repo
git merge --no-ff vk/{attempt-id}-{task-slug} -m "feat: description of changes"

# Verify merge
git log --oneline -3
ls -la src/components/...  # verify files are there
```

**Merge Best Practices:**
- Use `--no-ff` to preserve branch history
- Write descriptive commit messages
- Verify files are correctly merged
- Check that no unintended files (like manual updates) are included
- **You never left main branch** - merge happens from main

#### 7. Cleanup Worktree & Branch

```bash
# Remove worktree
git worktree remove /path/to/worktree

# Delete merged branch
git branch -d vk/{attempt-id}-{task-slug}

# Verify cleanup
git worktree list
git branch -a
```

#### 8. Merge to Main

```bash
# From main branch, merge the worktree branch
cd /path/to/main/repo
git merge --no-ff vk/{attempt-id}-{task-slug} -m "feat: description of changes"

# Verify merge
git log --oneline -3
ls -la src/components/...  # verify files are there
```

**Merge Best Practices:**
- Use `--no-ff` to preserve branch history
- Write descriptive commit messages
- Verify files are correctly merged
- Check that no unintended files (like manual updates) are included

#### 9. Cleanup Worktree & Branch

```bash
# Remove worktree
git worktree remove /path/to/worktree

# Delete merged branch
git branch -d vk/{attempt-id}-{task-slug}

# Verify cleanup
git worktree list
git branch -a
```

#### 10. Update Kanban

```typescript
// Task status may auto-update to "done" when branch is merged
// But we should manually update to ensure it's marked complete:
mcp_vibe-kanban_update_task(task_id, status: "done")
```

**Note:** After merging and cleanup, the task should be marked "done" in Vibe Kanban. If it doesn't auto-update, manually update it.

**⚠️ Important: Kanban Status May Not Persist**

**Observation (November 16, 2025):**
- Task was merged successfully to main
- Kanban status was updated to "done"
- Later, task showed as "in-review" again in kanban
- Status update didn't persist

**What to Do:**
- After merging, always verify kanban status with MCP:
  ```typescript
  mcp_vibe-kanban_get_task(task_id)
  // Check if status is actually "done"
  ```
- If status is incorrect (e.g., shows "in-review" but task is merged):
  - Verify merge actually happened (check git log, files in main)
  - Update kanban status again: `mcp_vibe-kanban_update_task(task_id, status: "done")`
  - This may be a timing/sync issue with kanban

**Why This Matters:**
- Kanban status updates may not persist reliably
- Always verify status after updating
- Don't assume status update worked - check it
- If user reports task still in review, verify merge and update again

---

## Agent Selection Guide

### CODEX

**Best For:**
- Code completion tasks
- Incremental changes
- Small fixes and refactoring
- TypeScript/JavaScript code generation
- **Reliable fallback** when CURSOR_AGENT defaults to "Auto"

**Example Tasks:**
- "Create contractsFunction Lambda structure" ✅ (worked well)
- "Create crypto-utils helper" ✅ (worked well)
- Code completion in existing files
- Adding dependencies to package.json

**Reliability:**
- ✅ **Always respects executor parameter** - never defaults to "Auto"
- ✅ **Proven to work** - multiple successful tasks completed
- ✅ **Use as fallback** when CURSOR_AGENT has issues

### CURSOR_AGENT

**Best For:**
- Full feature implementation
- Setting up project structure
- Creating new components from scratch
- Complex multi-file changes

**Example Tasks:**
- "Create Auth component wrapper" (attempted, but defaulted to "Auto" - switched to CODEX)
- "Create server-side Amplify utilities" (attempted, but defaulted to "Auto" - switched to CODEX)
- Setting up new features
- Component architecture setup

**⚠️ CRITICAL WARNING:**
- **Frequently defaults to "Auto"** - even when explicitly specified in `start_task_attempt`
- **Multiple occurrences:** This has happened repeatedly:
  - Task 2: "Create Auth component wrapper" (defaulted to "Auto")
  - Task 2: "Create server-side Amplify utilities" (defaulted to "Auto" in parallel execution)
  - Multiple other attempts
- **If "Auto" appears:** Stop immediately and restart with CODEX
- **Verification required:** Check UI within 5-10 seconds to confirm it's not using "Auto"
- **Recommendation:** **Use CODEX by default** - CURSOR_AGENT is unreliable

**Known Issue:**
- The `executor: "CURSOR_AGENT"` parameter in `start_task_attempt` may be ignored by Vibe Kanban
- This appears to be a systemic issue, not just a one-time bug
- CODEX consistently works when specified, CURSOR_AGENT does not
- **Occurs in both sequential and parallel execution** - not limited to specific scenarios

### Executor Selection Decision Tree

```
Start Task
    ↓
Choose Executor
    ↓
    ├─→ CODEX (RECOMMENDED - Default Choice)
    │       ↓
    │   Verify in UI (5-10 seconds)
    │       ↓
    │   ├─→ "Auto" detected? → STOP → Investigate (shouldn't happen with CODEX)
    │   └─→ "gpt-5-codex" or "gpt-4-codex"? → Continue ✅
    │
    └─→ CURSOR_AGENT (Use with Caution - Known Issues)
            ↓
        Verify in UI IMMEDIATELY (5-10 seconds)
            ↓
        ├─→ "Auto" detected? → STOP → Restart with CODEX
        └─→ Working correctly? → Continue (but monitor closely)
```

**Updated Recommendation (November 16, 2025):**
- **Default to CODEX** for all tasks unless there's a specific reason to use CURSOR_AGENT
- CODEX works reliably for:
  - Code generation
  - File creation
  - Server utilities
  - Test scripts
  - Component creation
  - Most coding tasks
- **Only use CURSOR_AGENT** if:
  - You absolutely need its specific capabilities
  - You can verify immediately it's not using "Auto"
  - You're prepared to restart with CODEX if it fails

**Key Principle:** **Never execute with "Auto" - always verify and switch to CODEX if needed**

### Model Selection

**Avoid:** "Auto" model selection (causes issues)  
**Use:** Specific executor (CODEX or CURSOR_AGENT)

---

## Best Practices

### 1. Review in Worktree Without Switching Main Branch

**The Isolated Review Pattern:**

When reviewing a task's work, you can review it directly from the worktree path without ever leaving the main branch:

```bash
# Main branch stays on main
cd /path/to/main/repo  # stay here

# Review using absolute paths to worktree
read_file /path/to/worktree/src/components/auth/Auth.tsx
run_terminal_cmd "cd /path/to/worktree && git status"
run_terminal_cmd "cd /path/to/worktree && git diff main"

# Test in worktree
run_terminal_cmd "cd /path/to/worktree && npm test"

# Merge from main
cd /path/to/main/repo
git merge --no-ff vk/branch-name
```

**Why This Works:**
- Worktrees are separate directories, so you can access them via absolute paths
- Main branch never needs to switch away
- Multiple tasks can be reviewed in parallel
- Clean separation between review and main branch state

**Benefits:**
- ✅ Main branch always stays clean
- ✅ Review happens in complete isolation
- ✅ No risk of accidentally committing to wrong branch
- ✅ Can review multiple tasks simultaneously
- ✅ Easy to test without affecting main

### 2. Parallel Task Execution

**Best Practice: Use CODEX for Parallel Tasks**

When running multiple tasks in parallel:
- **Default to CODEX** for all parallel tasks
- CURSOR_AGENT is unreliable and may default to "Auto" even in parallel execution
- CODEX works consistently and reduces verification overhead

#### Determining Maximum Safe Parallel Execution

**The 5-Way Parallel Execution Breakthrough (November 16, 2025)**

We successfully executed **5 tasks in parallel** with zero conflicts. Here's how we determined the maximum safe count:

**Step 1: List All Remaining Tasks**
```typescript
mcp_vibe-kanban_list_tasks(project_id, status: "todo")
```

**Step 2: Analyze File Targets for Each Task**
For each task, identify:
- What file(s) will be created/modified?
- What directory path(s) will be affected?
- Are there any dependencies on other tasks?

**Step 3: Group Tasks by Non-Conflicting Paths**

Create a mapping:
```
Task 1: amplify/auth/resource.ts (NEW/MODIFY)
Task 2: amplify/backend/functions/contractsFunction/src/handler.ts (MODIFY - adds function)
Task 3: src/app/exchanges/new/page.tsx (NEW)
Task 4: src/app/exchanges/[id]/page.tsx (NEW)
Task 5: src/components/contracts/* (NEW component)
```

**Step 4: Identify Conflict Risks**

⚠️ **CONFLICT RISKS (Must run separately):**
- Tasks that modify the same file (e.g., both modify `handler.ts`)
- Tasks that modify files in the same directory that might overlap
- Tasks that have dependencies on each other

✅ **SAFE FOR PARALLEL:**
- Tasks that create NEW files in different directories
- Tasks that modify different files
- Tasks with no dependencies

**Step 5: Calculate Maximum Safe Count**

The maximum safe parallel count = number of tasks with:
- Different file targets
- No overlapping paths
- No dependencies

**Example Analysis (5-Way Execution):**

```
✅ SAFE PARALLEL SET (5 tasks):

1. Configure Cognito authentication
   → amplify/auth/resource.ts
   → No conflicts

2. Implement encryptAndUpload operation
   → amplify/backend/functions/contractsFunction/src/handler.ts
   → Adds new function (different from decrypt)
   → No conflicts

3. Implement create exchange page
   → src/app/exchanges/new/page.tsx
   → New route, different from detail page
   → No conflicts

4. Implement exchange detail page
   → src/app/exchanges/[id]/page.tsx
   → New route, different from create page
   → No conflicts

5. Create file upload form component
   → src/components/contracts/* (new component file)
   → New component, different directory
   → No conflicts

Result: ALL 5 TASKS CREATE/MODIFY DIFFERENT FILES
        ZERO CONFLICT RISK
        MAXIMUM SAFE PARALLEL EXECUTION = 5
```

**Key Principles:**
1. **Different directories = Safe** (e.g., `amplify/auth/` vs `src/app/exchanges/`)
2. **Different routes = Safe** (e.g., `exchanges/new/` vs `exchanges/[id]/`)
3. **Different files = Safe** (e.g., `resource.ts` vs `handler.ts`)
4. **Same file = Conflict risk** (e.g., both modify `handler.ts` - must run separately)
5. **Dependencies = Conflict risk** (e.g., Task B needs Task A's output - must run sequentially)

**Workflow for Maximum Parallel Execution:**

1. **List all remaining tasks**
2. **Get task descriptions** to understand file targets
3. **Map each task to its file/directory target**
4. **Identify conflict groups** (tasks that touch same files)
5. **Select maximum non-conflicting set**
6. **Start all selected tasks with CODEX**
7. **Verify executors immediately** (all should show CODEX, not "Auto")
8. **Review and merge as each completes** (don't wait for all)

**Success Metrics (5-Way Execution):**
- ✅ 5 tasks started simultaneously
- ✅ All used CODEX executor (no "Auto" issues)
- ✅ All completed successfully
- ✅ Zero merge conflicts
- ✅ All merged independently
- ✅ All worktrees/branches cleaned up
- ✅ All kanban statuses updated correctly

**Replication Checklist:**
- [ ] List all remaining tasks
- [ ] Analyze file targets for each task
- [ ] Map tasks to file/directory paths
- [ ] Identify conflict risks
- [ ] Group tasks by non-conflicting paths
- [ ] Calculate maximum safe count
- [ ] Start all selected tasks with CODEX
- [ ] Verify executors (all CODEX, no "Auto")
- [ ] Monitor progress (listen for "moo" sounds)
- [ ] Review and merge as each completes
- [ ] Clean up worktrees and branches
- [ ] Update kanban statuses
- Each task runs in its own isolated worktree, so no conflicts

**Verification for Parallel Tasks:**
- Verify each task's executor immediately after starting (5-10 seconds)
- Check UI for each task to confirm it's not using "Auto"
- If any task shows "Auto", stop it and restart with CODEX
- Don't assume parallel execution will work differently - same issues apply

**Example:**
```typescript
// Start Task 1
mcp_vibe-kanban_start_task_attempt(task1_id, "CODEX", "main")
// Verify Task 1 executor in UI

// Start Task 2
mcp_vibe-kanban_start_task_attempt(task2_id, "CODEX", "main")  // Use CODEX, not CURSOR_AGENT
// Verify Task 2 executor in UI

// Both tasks run in parallel, both use CODEX reliably
```

**Why CODEX for Parallel:**
- Reduces verification burden (no need to check for "Auto")
- Consistent behavior across all tasks
- Faster recovery if issues occur (just restart with CODEX)
- Less cognitive overhead when managing multiple tasks

**Real-World Example (November 16, 2025):**
- Started 2 tasks in parallel: Task 1 (CODEX) ✅, Task 2 (CURSOR_AGENT) ⚠️
- Task 1 worked correctly with CODEX
- Task 2 defaulted to "Auto" despite specifying CURSOR_AGENT
- Restarted Task 2 with CODEX - worked immediately ✅
- **Lesson:** Use CODEX for all parallel tasks to avoid issues

### 3. Use MCP Commands for Status Checks

**Best Practice: Prefer MCP Commands Over Browser Snapshots**

**Understanding MCP Communication:**
- MCP is **request-response only** - we query, kanban responds
- Kanban **cannot push notifications** via MCP
- We must **poll/check** status using MCP commands
- The "moo" sound is a **UI feature** (browser notification), not MCP

**For routine status checks and monitoring:**
- **Use MCP commands** - More efficient and programmatic
  ```typescript
  // Check task status
  mcp_vibe-kanban_get_task(task_id)
  
  // List tasks by status
  mcp_vibe-kanban_list_tasks(project_id, status: "in-review")
  mcp_vibe-kanban_list_tasks(project_id, status: "in-progress")
  ```

**Monitoring Approaches:**
1. **User Notification (Recommended):**
   - Wait for user to notify when "moo" sound plays
   - Then verify status with MCP before reviewing
   - Most efficient - no polling needed

2. **Polling (Alternative):**
   - Periodically check task status via MCP
   - Useful when user is not available to notify
   - Less efficient but works autonomously

**When to Use Browser Snapshots:**
- Verifying executor model in UI (checking for "Auto" vs "CODEX")
- Debugging executor issues
- Checking specific UI details not available in MCP response
- Visual verification of task state

**Why This Matters:**
- MCP commands are faster and more reliable
- Browser snapshots are slower and require navigation
- MCP provides structured data, easier to parse
- Reduces unnecessary browser automation overhead
- **No push notifications** - must poll or wait for user notification

**Example Workflow:**
```typescript
// ✅ Good: Use MCP for status check (after user notification)
// User: "Task is done" (heard "moo" sound)
const task = mcp_vibe-kanban_get_task(task_id);
if (task.status === "in-review") {
  // Review the task
}

// ✅ Alternative: Polling approach
const tasks = mcp_vibe-kanban_list_tasks(project_id, status: "in-review");
if (tasks.count > 0) {
  // Review tasks
}

// ⚠️ Only use browser snapshot when needed
// (e.g., verifying executor is not "Auto")
if (needExecutorVerification) {
  browser_navigate(task_url);
  browser_snapshot();
}
```

### 4. Always Test Before Merge

```bash
# Test in worktree isolation
# Only merge after successful test
```

### 2. Clean Up After Merge

```bash
# Remove worktrees
# Delete merged branches
# Keep main clean
```

### 3. Use Descriptive Commit Messages

```bash
git merge vk/xxx --no-ff -m "feat: clear description of what was added"
```

### 4. Review Agent Work Thoroughly

- Check file structure
- Verify code quality
- Test compilation
- Verify dependencies

### 5. Update Implementation Plan

After merging, update `safecontracts-mvp-implementation.plan.md` to reflect completed tasks.

---

## Troubleshooting

### Issue: MCP Connection Failed - Port Changed

**Problem:** MCP functions fail with connection errors after Vibe Kanban server restarts.

**Symptoms:**
- Error: `Failed to connect to VK API`
- Error details: `error sending request for url (http://127.0.0.1:OLD_PORT/api/...)`
- All MCP functions return `{"success": false, "error": "Failed to connect to VK API"}`
- MCP commands that worked before suddenly stop working

**Root Cause:**
- Vibe Kanban server changed ports when restarted
- MCP configuration still points to old port
- Cursor hasn't been restarted after configuration change

**Solution:**

1. **Find the New Port:**
   - Check Vibe Kanban browser UI - URL shows current port
   - Or check terminal where Vibe Kanban is running
   - Example: `http://127.0.0.1:63894` → port is `63894`

2. **Verify Server is Running:**
   ```bash
   curl http://127.0.0.1:NEW_PORT/api/projects
   ```
   - Should return JSON response
   - If this fails, server isn't running or port is wrong

3. **Update Cursor MCP Settings:**
   - Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
   - Find MCP servers configuration
   - Update `VIBE_KANBAN_URL` in `env` section:
   ```json
   "env": {
     "VIBE_KANBAN_URL": "http://127.0.0.1:NEW_PORT"
   }
   ```

4. **Restart Cursor:**
   - **Critical:** Must fully restart Cursor (not just reload window)
   - Close all windows and reopen
   - Or quit completely (`Cmd+Q` / `Alt+F4`) and restart

5. **Verify Connection:**
   ```typescript
   mcp_vibe-kanban_list_projects()
   ```
   - Should return `{"success": true, "data": [...]}`
   - If still failing, double-check port and restart again

**Prevention:**
- Check Vibe Kanban port before starting work session
- Keep documentation updated with current port
- Note port changes in workflow documentation

**Example (December 2025):**
- Port changed from `49739` to `63894`
- MCP functions started failing
- Updated `VIBE_KANBAN_URL` to `http://127.0.0.1:63894`
- Restarted Cursor
- Connection restored ✅

---

### Issue: Kanban Status Doesn't Persist

**Problem:** Task was merged and kanban status was updated to "done", but later the task shows as "in-review" again.

**Symptoms:**
- Task shows "in-review" in kanban
- But task was already merged to main
- File exists in main branch
- Merge commit exists in git history

**Root Cause:**
- Kanban status updates may not persist reliably
- Possible timing/sync issue with kanban system
- Status update may be lost or reverted

**Solution:**
1. **Verify merge actually happened:**
   ```bash
   git log --oneline | grep "task description"
   ls -la path/to/merged/file
   ```

2. **Update kanban status again:**
   ```typescript
   mcp_vibe-kanban_update_task(task_id, status: "done")
   ```

3. **Verify status updated:**
   ```typescript
   const task = mcp_vibe-kanban_get_task(task_id);
   if (task.status !== "done") {
     // Update again or investigate
   }
   ```

**Prevention:**
- Always verify kanban status after updating
- Don't assume status update worked - check it
- If user reports task still in review, verify merge and update again

**Example (November 16, 2025):**
- Task: "Create server-side Amplify utilities"
- Merged successfully to main (commit: 1f064dd)
- Updated kanban to "done"
- Later, task showed "in-review" again
- Verified merge, updated status again - worked

---

## Troubleshooting (Legacy)

### Agent Stuck / Not Writing Code

**Symptoms:**
- Task shows "in-progress"
- No commits in branch
- UI shows "Loading draft…" or "System initialized with model: Auto"

**Solution:**
1. Stop the attempt (via UI or wait for timeout)
2. Restart with different executor (try CODEX if CURSOR_AGENT stuck)
3. Avoid "Auto" model selection

### Worktree Already Exists Error

**Error:** `fatal: 'vk/xxx' is already used by worktree`

**Solution:**
```bash
# Remove the worktree first
git worktree remove /path/to/worktree

# Then delete branch
git branch -d vk/xxx
```

### Cannot Checkout Branch (Worktree Conflict)

**Error:** Branch exists in worktree, can't checkout in main repo

**Solution:**
- Work directly in the worktree for testing
- Don't try to checkout in main repo
- Merge from main: `git merge vk/xxx` (works even if branch is in worktree)

### Test Fails in Worktree

**Options:**
1. Fix issues in worktree branch, commit, then merge
2. If unfixable, stop attempt, update task description, restart

### Agent Uses Wrong Versions

**Example:** Function uses AWS SDK 3.520.0, root uses 3.932.0

**Solution:**
- Can fix in follow-up commit after merge
- Or fix in worktree before merge (preferred)

---

## Workflow Summary

```
1. List tasks in Kanban (todo status)
2. Select task and assess best agent (CODEX vs CURSOR_AGENT)
3. Start task attempt via MCP
4. Wait for agent completion (listen for "moo" or check status)
5. Review agent work in worktree
6. Test in isolation (copy .env, install deps, run tests)
7. If test passes: Merge to main
8. Clean up worktrees and branches
9. Update Kanban status (auto-updates on merge)
10. Update implementation plan
```

---

## Key Learnings

1. **Never bypass Vibe Kanban** - Let it orchestrate tasks
2. **Always test in isolation** - Use worktree before merging
3. **Clean up after merge** - Remove worktrees and branches
4. **Choose right agent** - CODEX for completion, CURSOR_AGENT for setup
5. **Avoid "Auto" model** - Use specific executors
6. **Review thoroughly** - Check structure, code, dependencies
7. **Update documentation** - Keep implementation plan current
8. **Maximum parallel execution is achievable** - With careful analysis, 5+ tasks can run safely in parallel
9. **File target analysis is critical** - Understanding what files each task touches prevents conflicts
10. **CODEX is reliable for parallel execution** - Consistent performance across multiple simultaneous tasks

---

## Major Milestones

### 5-Way Parallel Execution Breakthrough (November 16, 2025)

**Achievement:** Successfully executed 5 tasks in parallel with zero conflicts.

**Tasks Executed:**
1. Configure Cognito authentication → `amplify/auth/resource.ts`
2. Implement encryptAndUpload operation → `amplify/backend/functions/contractsFunction/src/handler.ts`
3. Implement create exchange page → `src/app/exchanges/new/page.tsx`
4. Implement exchange detail page → `src/app/exchanges/[id]/page.tsx`
5. Create file upload form component → `src/components/contracts/*`

**Results:**
- ✅ All 5 tasks completed successfully
- ✅ Zero merge conflicts
- ✅ All tasks merged independently
- ✅ All worktrees/branches cleaned up
- ✅ All kanban statuses updated correctly

**Key Success Factors:**
- **Careful file target analysis** before starting - mapped each task to its file/directory target
- **All tasks targeted different files/directories** - no overlapping paths
- **All tasks used CODEX executor** - no "Auto" model issues
- **Sequential review and merge** - reviewed and merged as each completed, not waiting for all

**Methodology Developed:**
1. List all remaining tasks
2. Analyze file targets for each task
3. Map tasks to file/directory paths
4. Identify conflict risks
5. Group tasks by non-conflicting paths
6. Calculate maximum safe count
7. Start all selected tasks with CODEX
8. Verify executors immediately
9. Review and merge as each completes

**Impact:**
- Demonstrated **maximum safe parallel execution capability**
- Validated **workflow scalability** - can handle 5+ tasks simultaneously
- Proved **conflict-free parallel execution** is achievable with proper analysis
- Established **reproducible methodology** for future large-scale parallel execution
- Set new **benchmark for parallel task execution** in Vibe Kanban workflow

**Replication:**
The complete methodology is documented in the "Determining Maximum Safe Parallel Execution" section above. Follow the step-by-step process and replication checklist to achieve similar results.

---

## Continuous Improvement

This workflow is still evolving as we:
- Discover new agent capabilities
- Encounter edge cases
- Optimize the process
- Add new tools and integrations

**Current Status:** ✅ Working well for Lambda function structure creation  
**Next Steps:** Apply to more complex tasks (encryptAndUpload, decryptAndDownload operations)

---

## Post-Mortem: "Auto" Model Issue in Parallel Execution

### Issue Recurrence (November 16, 2025)

**What Happened:**
When attempting parallel task execution for the first time, Task 2 (Create Auth component wrapper) got stuck using "Auto" model selection, even though we explicitly specified `CURSOR_AGENT` as the executor.

**Root Cause:**
- When starting multiple tasks in parallel, we may have inadvertently triggered a default behavior
- The `start_task_attempt` function may have a fallback to "Auto" if the executor parameter isn't properly validated
- We didn't verify the executor was correctly set before the agent started working

**Why It Happened Again:**
1. **Rushed parallel execution setup** - When starting 2 tasks quickly, we didn't verify each one's configuration
2. **Assumed executor parameter was sufficient** - Didn't check if Vibe Kanban actually used the specified executor
3. **No immediate verification step** - Started tasks and moved on without confirming they were using the right model

**How to Prevent:**
1. **Always verify executor after starting** - Check task status immediately after `start_task_attempt`
2. **Check Vibe Kanban UI** - After starting, quickly check the task in UI to confirm it's not using "Auto"
3. **Add verification step to workflow** - Make it a mandatory step: "Start attempt → Verify executor → Continue"
4. **Monitor first few seconds** - Watch the task for 10-15 seconds to catch "Auto" model issues early

**Updated Workflow Step:**
```typescript
// Step 2.5: Verify Executor (NEW)
mcp_vibe-kanban_start_task_attempt(task_id, executor, base_branch)

// IMMEDIATELY verify:
// 1. Check task status
// 2. Check Vibe Kanban UI for "Auto" model warning
// 3. If "Auto" detected, stop and restart with explicit executor
```

**Lesson Learned:**
- Never assume the executor parameter is being used correctly
- Always verify immediately after starting a task attempt
- When running parallel tasks, verify each one individually
- "Auto" model is a red flag - catch it early, don't wait for timeout

**Prevention Checklist:**
- [ ] Verify executor is specified (CODEX or CURSOR_AGENT)
- [ ] Check task status immediately after starting
- [ ] Monitor first 15 seconds for "Auto" model warnings
- [ ] If "Auto" detected, stop immediately and restart
- [ ] Document which executor worked for similar tasks

---

### Critical Discovery: Executor Parameter May Not Work

**Second Failure (November 16, 2025 - Same Day):**

**What Happened:**
After documenting the first failure and implementing prevention steps, we attempted to fix Task 2 by:
1. Resetting task status to "todo"
2. Cleaning up all old worktrees
3. Starting fresh with explicit `CURSOR_AGENT` executor

**Result:** The attempt STILL showed "System initialized with model: Auto" in the UI, despite explicitly passing `executor: "CURSOR_AGENT"` to `start_task_attempt`.

**Root Cause Analysis:**
- The `executor` parameter in `start_task_attempt` may not be working as expected
- Vibe Kanban may be ignoring the executor parameter and defaulting to "Auto"
- There may be a bug in Vibe Kanban's MCP implementation
- Or the executor needs to be specified differently (e.g., via UI, not MCP)

**Why This Is Critical:**
- We cannot rely on the `executor` parameter to work correctly
- Even with proper workflow (reset → cleanup → start fresh), the issue persists
- This suggests a systemic problem, not just a workflow mistake

**Investigation Needed:**
1. Check if executor parameter is actually being passed correctly
2. Verify if Vibe Kanban UI has a way to set executor that works
3. Test if CODEX works differently than CURSOR_AGENT
4. Document workaround if executor parameter is broken

**Temporary Workaround:**
- If executor parameter doesn't work, we may need to:
  - Use Vibe Kanban UI to manually set executor before starting
  - Or accept that some attempts will use "Auto" and stop/restart them
  - Or investigate if there's a different MCP function or parameter format

**Status:** ⚠️ **UNRESOLVED** - Executor parameter appears to be ignored by Vibe Kanban

**Update (November 16, 2025 - Parallel Execution):**
- Issue occurred again when running 2 tasks in parallel
- Task 1 (CODEX) worked correctly ✅
- Task 2 (CURSOR_AGENT) defaulted to "Auto" again ⚠️
- Restarted Task 2 with CODEX - worked immediately ✅
- **Conclusion:** CURSOR_AGENT is unreliable in both sequential and parallel execution

---

### Resolution: CODEX Works, CURSOR_AGENT May Not

**Third Attempt (November 16, 2025 - Same Day):**

**What Happened:**
After stopping the stuck attempt and resetting the task, we tried starting with `CODEX` executor (which worked successfully for Task 1).

**Result:** ✅ **SUCCESS!** The attempt shows "model: gpt-5-codex" in the UI and the agent is actively working.

**Key Discovery:**
- **CODEX executor works correctly** when specified via `start_task_attempt`
- **CURSOR_AGENT may have issues** - all attempts with CURSOR_AGENT defaulted to "Auto"
- The executor parameter **does work**, but only for certain executors (CODEX)

**Why This Matters:**
- Not all executors behave the same way
- CODEX appears to respect the executor parameter
- CURSOR_AGENT may ignore it or have a bug

**Solution:**
- **Use CODEX for tasks** until CURSOR_AGENT executor issue is resolved
- If CURSOR_AGENT is needed, verify it's actually using the specified model
- Document which executors work correctly

**⚠️ CRITICAL INSIGHT: The "Auto" Model is the Real Problem**

**The Core Issue:**
- **"Auto" model is the main blocker** - as long as we avoid "Auto", we should be fine
- Both CODEX and CURSOR_AGENT can work, but CODEX is more reliable at respecting the executor parameter
- The goal is to **never execute with "Auto"** - always use an explicit executor

**Executor Selection Strategy:**
- **Primary choice:** Use the executor that best fits the task (CODEX for code completion, CURSOR_AGENT for full features)
- **Fallback strategy:** If CURSOR_AGENT defaults to "Auto", immediately switch to CODEX
- **Verification required:** Always verify the executor is actually being used (check for "model: gpt-5-codex" or similar, NOT "Auto")

**When to Use Each Executor:**
- **CODEX:** 
  - Reliable fallback when CURSOR_AGENT fails
  - Good for code completion and incremental changes
  - Always respects executor parameter
  - Use when you need guaranteed execution without "Auto"
  
- **CURSOR_AGENT:**
  - Preferred for full feature implementation
  - Better for setting up project structure
  - **BUT:** Must verify it's not using "Auto" - if it does, switch to CODEX immediately

**Best Practice (Updated November 16, 2025):**
1. **Default to CODEX** for all tasks - it works reliably
2. Only use CURSOR_AGENT if absolutely necessary
3. **Immediately verify** CURSOR_AGENT is not using "Auto" (within 5-10 seconds)
4. If "Auto" appears, stop and restart with CODEX
5. **For parallel execution:** Use CODEX for all tasks to avoid verification overhead
6. CODEX is the reliable default that prevents "Auto" issues

**Updated Workflow:**
1. Stop stuck attempt (via UI Stop button)
2. Reset task to "todo"
3. Clean up old worktree
4. Start with **CODEX** executor (known to work) OR try CURSOR_AGENT first if preferred
5. **IMMEDIATELY verify** in UI: should show "model: gpt-5-codex" or "model: gpt-4-codex" (CODEX) or similar for CURSOR_AGENT, but **NOT "Auto"**
6. If "Auto" appears, stop immediately and restart with CODEX
7. Monitor agent progress

**Status:** ✅ **RESOLVED** - Avoid "Auto" model at all costs. CODEX is reliable fallback when CURSOR_AGENT defaults to "Auto"

---

### User Experience Divergence: UI Verification Challenges

**Fourth Attempt (November 16, 2025 - Same Day):**

**What Happened:**
After successfully restarting the task with CODEX, there was a divergence in what the user and assistant were seeing:
- **Assistant's view:** Could see "model: gpt-5-codex" in the UI snapshot, confirming CODEX was working
- **User's view:** Initially couldn't see the difference in their UI, thought it wasn't working
- **Reality:** CODEX was actually working correctly all along

**Why the Divergence Occurred:**
1. **UI Refresh Timing:** The user's browser may not have refreshed immediately when the attempt started
2. **Different Views:** The assistant was viewing the attempt detail page, while the user may have been on a different page (task list, etc.)
3. **UI Loading States:** The "Loading draft…" and "DEFAULT" button may have appeared before the model indicator loaded
4. **Visual Confirmation Needed:** The user needed to see active agent behavior (commands running, files being created) to confirm it was working

**How We Aligned:**
1. **Stopped and Restarted:** We stopped the attempt to verify the Stop button worked
2. **Restarted with CODEX:** Started fresh with explicit CODEX executor
3. **Verified in UI:** Both confirmed "model: gpt-5-codex" appeared in the attempt detail page
4. **Observed Active Work:** Both saw the agent actively exploring the repository and preparing to create files

**Key Lessons:**
- **UI may lag:** The model indicator might not appear immediately - wait a few seconds
- **Check the right page:** Make sure you're viewing the attempt detail page, not just the task list
- **Look for activity:** Active agent behavior (commands, file operations) is a better indicator than just the model text
- **Refresh if needed:** If unsure, refresh the browser or navigate to the attempt detail page
- **Verify in detail view:** The model indicator ("model: gpt-5-codex" or "System initialized with model: Auto") appears in the attempt detail view, not always in the task list

**Verification Checklist:**
- [ ] Navigate to the attempt detail page (click on the attempt in the attempts list)
- [ ] Wait 3-5 seconds for UI to load
- [ ] Look for "model: gpt-5-codex" or "model: gpt-4-codex" (CODEX working) OR "System initialized with model: Auto" (problem)
- [ ] Check for active agent behavior (commands running, files being created)
- [ ] If you see "Auto", stop immediately and restart with CODEX
- [ ] If you see "gpt-5-codex" or "gpt-4-codex", the agent is working correctly

**Status:** ✅ **RESOLVED** - Both user and assistant can now verify CODEX is working via UI

---

## Quick Reference

### MCP Functions

```typescript
// List tasks
mcp_vibe-kanban_list_tasks(project_id, status: "todo" | "in-progress" | "in-review" | "done")

// Get task details
mcp_vibe-kanban_get_task(task_id)

// Start task attempt
mcp_vibe-kanban_start_task_attempt(
  task_id,
  executor: "CODEX" | "CURSOR_AGENT",
  base_branch: "main"
)

// Update task status
mcp_vibe-kanban_update_task(task_id, status: "done" | "in-review" | ...)
```

### Git Commands

```bash
# List worktrees
git worktree list

# Remove worktree
git worktree remove /path/to/worktree

# Merge branch
git merge vk/xxx --no-ff -m "feat: description"

# Delete branch
git branch -d vk/xxx
```

---

**Remember:** The goal is to let Vibe Kanban orchestrate, agents execute, and we oversee, review, and merge. This ensures proper isolation, testing, and code quality.

