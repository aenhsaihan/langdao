# Bug Reports

This directory contains bug reports generated from video analysis sessions using Google AI Studio.

## 📁 File Naming Convention

Bug reports follow this naming pattern:

```
bug-report-YYYY-MM-DD-[brief-description].md
```

**Examples:**

- `bug-report-2025-01-18-tutor-student-ux-issues.md`
- `bug-report-2025-01-21-webrtc-session-flow.md`
- `bug-report-2025-01-25-payment-processing.md`

## 📋 Current Bug Reports

| Date       | File                                                                                                                                             | Description                                                                         | Status       | Tasks    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------ | -------- |
| 2025-01-18 | [bug-report-2025-01-18-tutor-student-ux-issues.md](./bug-report-2025-01-18-tutor-student-ux-issues.md)                                           | Tutor dashboard & student session start flow UX issues                              | ✅ COMPLETED | 3/3 done |
| 2025-01-21 | [bug-report-2025-01-21-student-session-warning-and-language-flicker.md](./bug-report-2025-01-21-student-session-warning-and-language-flicker.md) | Missing student session warning & language dropdown flicker                         | ✅ COMPLETED | 2/2 done |
| 2025-01-22 | [bug-report-2025-01-22-ux-polish-and-navigation-issues.md](./bug-report-2025-01-22-ux-polish-and-navigation-issues.md)                           | UX polish & navigation issues (ghost toast, broken button, flicker, language codes) | 🔴 TODO      | 0/4 done |

## 🎯 Workflow

1. **Record Video:** Record screen showing the bugs/issues
2. **Analyze with Google AI Studio:** Upload video and get text analysis
3. **Create Bug Report:**
   - Copy `bug-report-template.md` to new file with date and description
   - Fill in the template with AI Studio analysis
   - Add to this README table
4. **Create Kanban Tasks:** Create tasks in Vibe Kanban from the bug report
5. **Track Progress:** Update status in bug report as tasks are completed

## 📝 Template

Use [`bug-report-template.md`](./bug-report-template.md) as a starting point for new bug reports.

## 🔍 Status Legend

- 🔴 **CRITICAL** - Blocks core functionality, must fix immediately
- 🟡 **MEDIUM** - Affects UX but doesn't block functionality
- 🟢 **LOW** - Minor issues, nice to have fixes

---

**Last Updated:** 2025-01-22
