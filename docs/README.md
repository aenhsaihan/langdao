# LangDAO Documentation

Welcome to the LangDAO documentation! This folder contains all project documentation organized by category.

## 📁 Documentation Structure

### `/architecture` - System Architecture
- **[overview.md](architecture/overview.md)** - Complete, accurate architecture documentation
  - Tech stack, user flows, payment system
  - Environment variables, deployment info
  - Known issues and workarounds

### `/product` - Product Documentation
- **[overview.md](product/overview.md)** - Product vision and value proposition
- **[scope-mvp.md](product/scope-mvp.md)** - MVP scope and success criteria
- **[roadmap.md](product/roadmap.md)** - Development milestones
- **[testbed-latam.md](product/testbed-latam.md)** - Latin America testbed strategy

### `/guides` - How-To Guides
- **[language-matching-fix.md](guides/language-matching-fix.md)** - Language matching issue and solutions
- **[webrtc-integration.md](guides/webrtc-integration.md)** - WebRTC integration details

### `/tech` - Technical Documentation
- **[integrations.md](tech/integrations.md)** - Third-party integrations (WebRTC, PYUSD)
- **[dao-vetting.md](tech/dao-vetting.md)** - DAO vetting system (planned)
- **[architecture.md](tech/architecture.md)** - ⚠️ OUTDATED - Original planned architecture

### `/project` - Project Management
- **[audit.md](project/audit.md)** - Comprehensive project audit
- **[documentation-status.md](project/documentation-status.md)** - Doc accuracy status
- **[cleanup-summary.md](project/cleanup-summary.md)** - Documentation cleanup summary
- **[huddle01-to-webrtc.md](project/huddle01-to-webrtc.md)** - Huddle01 → WebRTC migration

### `/research` - Research & Decisions
- **[assumptions.md](research/assumptions.md)** - Project assumptions

### `/adr` - Architecture Decision Records
- **[0001-huddle01.md](adr/0001-huddle01.md)** - WebRTC implementation decision (superseded Huddle01)

## 🚀 Quick Start

**New to the project?** Start here:
1. Read [architecture/overview.md](architecture/overview.md) - Understand the system
2. Read [product/overview.md](product/overview.md) - Understand the vision
3. Read [guides/webrtc-integration.md](guides/webrtc-integration.md) - Understand video calls
4. Check [project/documentation-status.md](project/documentation-status.md) - See what's accurate

**Want to contribute?** Check:
- [project/audit.md](project/audit.md) - What needs work
- [product/roadmap.md](product/roadmap.md) - What's planned
- Root `CONTRIBUTING.md` - How to contribute

## 📖 Documentation Site

This documentation is also available as a website built with MkDocs:

```bash
# Install MkDocs
pip install mkdocs mkdocs-material

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

Visit: https://aenhsaihan.github.io/langdao-ethonline2025

## 🔍 Finding Information

**Looking for:**
- **Architecture details?** → `architecture/overview.md`
- **How payments work?** → `architecture/overview.md` (Payment System section)
- **How to fix language matching?** → `guides/language-matching-fix.md`
- **What's implemented vs planned?** → `project/audit.md`
- **WebRTC integration?** → `guides/webrtc-integration.md`
- **Product vision?** → `product/overview.md`
- **What's next?** → `product/roadmap.md`

## 📝 Documentation Standards

When adding new documentation:

1. **Choose the right folder:**
   - Architecture docs → `/architecture`
   - How-to guides → `/guides`
   - Product specs → `/product`
   - Technical specs → `/tech`
   - Project management → `/project`

2. **Use clear filenames:**
   - Use kebab-case: `my-document.md`
   - Be descriptive: `webrtc-integration.md` not `integration.md`

3. **Add to mkdocs.yml:**
   - Update the navigation structure
   - Keep it organized and logical

4. **Keep it accurate:**
   - Mark outdated docs clearly
   - Update related docs when making changes
   - Link to related documentation

## 🗂️ Root Directory Files

The root directory contains only essential project files:
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community guidelines
- `SECURITY.md` - Security policy
- `LICENSE` - Project license

All other documentation lives in this `docs/` folder.

## 📊 Documentation Status

See [project/documentation-status.md](project/documentation-status.md) for:
- Which docs are accurate ✅
- Which are outdated ⚠️
- What's missing 📋
- Priority actions 🎯

---

**Questions?** Open an issue or check the [project audit](project/audit.md) for known issues.
