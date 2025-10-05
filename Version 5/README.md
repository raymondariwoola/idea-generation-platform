# Innovation Portal V5

Enterprise-grade platform for capturing, evaluating, and tracking innovation ideas with SharePoint integration, advanced security controls, and intelligent onboarding.

## Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
  - [SharePoint Deployment](#sharepoint-deployment)
  - [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Core Experience](#core-experience)
  - [Admin Dashboard](#admin-dashboard)
  - [Security Stack](#security-stack)
  - [Onboarding System](#onboarding-system)
  - [SharePoint Helpers](#sharepoint-helpers)
- [Data Model](#data-model)
- [Security Implementation](#security-implementation)
  - [PCI DSS Detection Patterns](#pci-dss-detection-patterns)
  - [Sanitization Flow](#sanitization-flow)
  - [Testing and Validation](#testing-and-validation)
  - [Security Troubleshooting](#security-troubleshooting)
- [Admin Dashboard Enhancements](#admin-dashboard-enhancements)
  - [Bulk Operations](#bulk-operations)
  - [Analytics Suite](#analytics-suite)
  - [Filtering and Search](#filtering-and-search)
  - [Export Capabilities](#export-capabilities)
  - [Future Admin Enhancements](#future-admin-enhancements)
- [Local Testing Workflow](#local-testing-workflow)
- [Tutorial System](#tutorial-system)
  - [Console Commands](#console-commands)
  - [Storage and Completion Tracking](#storage-and-completion-tracking)
  - [Customization](#customization)
  - [Tutorial Troubleshooting](#tutorial-troubleshooting)
- [SharePoint Helper Reference](#sharepoint-helper-reference)
- [Sample Data Reference](#sample-data-reference)
- [Performance](#performance)
- [Compliance](#compliance)
- [Roadmap and Opportunities](#roadmap-and-opportunities)
- [Support](#support)
- [Changelog and Bug Fixes](#changelog-and-bug-fixes)

---

## Overview
Innovation Portal V5 blends the lightweight feel of Version 3 with the feature depth of Version 4. The platform delivers a modern glassmorphism interface, context-aware onboarding, and enterprise-grade security that keeps sensitive data out of SharePoint lists.

Key goals:
- Maintain a futuristic but performant user experience across desktop and mobile.
- Provide administrators with deep insight and tooling without overwhelming end users.
- Keep security always-on with PCI DSS redaction and XSS sanitization.
- Ensure the documentation is centralized, comprehensive, and easy to keep current.

---

## Quick Start

### SharePoint Deployment
1. **Upload Files**: Copy everything in `Version 5/` to your SharePoint Site Assets (or equivalent) library.
2. **Reference Pages**: Publish `index.html` for idea submitters and `admin.html` for administrators.
3. **Create Lists**:
   - `InnovationIdeas` (main list) with fields shown in [Data Model](#data-model).
   - `IdeaAttachments` (document library) with versioning enabled and a 10 MB limit.
   - `Innovation Portal Administrators` (SharePoint group) containing authorized admins.
4. **Configure Permissions**: Grant the admin group Full Control or Design rights. End users only need Contribute access to `InnovationIdeas`.
5. **Verify Script Order**: Ensure `pci-dss-checker.js`, `xss-protection.js`, and `sp-helpers.js` load before `app.js` or `admin.js`.
6. **Test Authentication**: Open `admin.html` as a real admin to confirm access, charts, and bulk actions.

### Local Development
1. **Start a Static Server** (examples):
   ```powershell
   cd "d:\GitHub\idea-generation-platform\Version 5"
   python -m http.server 8000
   ```
2. **Open the Portal**:
   - User view: `http://localhost:8000/index.html`
   - Admin view: `http://localhost:8000/admin.html`
3. **Automatic Data Fallback**:
   - Loads `sample-data.json` first (6 ideas, 5 users).
   - Falls back to SharePoint if the JSON is missing.
   - Uses built-in sample data as a final safety net.
4. **Mock Security**: Security libraries run locally. Console logs confirm detections without sending data anywhere.
5. **Tutorial Testing**: Run `tutorialManager.resetAll()` in the console and reload to replay onboarding flows.

---

## Project Structure
```
Version 5/
|-- index.html               # Main idea submission portal
|-- admin.html               # Administrator dashboard
|-- styles.css               # Main portal styling
|-- admin-styles.css         # Admin-specific styling
|-- app.js                   # Portal application logic
|-- admin.js                 # Admin dashboard logic
|-- onboarding-tutorial.js   # Context-aware onboarding system
|-- onboarding-tutorial.css  # Tutorial styling
|-- pci-dss-checker.js       # PCI DSS redaction engine
|-- xss-protection.js        # XSS sanitization utility
|-- sp-helpers.js            # SharePoint REST helper client
|-- sample-data.json         # Local development data
|-- test-security.html       # Manual security regression page
\`-- README.md                # This consolidated guide
```

---

## Architecture

### Core Experience
- Single-page experience driven by `app.js` with views for Home, Submit, and Track.
- Persistent drafts stored in `localStorage` (`innovation-portal-v5-drafts`).
- Global search with debounced input, category pills, and advanced filters.
- Status dictionary loaded from SharePoint with local fallback for consistent labeling.

### Admin Dashboard
- Managed by `admin.js` with modular sections for dashboard, ideas, analytics, users, and settings.
- Uses `sp-helpers.js` for all SharePoint interactions, removing redundant fetch logic.
- Supports bulk operations, CSV exports, advanced filtering, and real analytics via Chart.js.
- Sample data provides realistic workflows without requiring SharePoint connectivity during development.

### Security Stack
- `pci-dss-checker.js` performs pattern scanning, redaction, and warning surfaces on all text inputs and textareas.
- `xss-protection.js` sanitizes strings before persistence, defending against script injection and inline event abuse.
- Security banner components provide real-time visual feedback and reinforce safe data handling.

### Onboarding System
- `onboarding-tutorial.js` delivers step-based tours per context (Home or Submit) with SVG mask cutouts.
- `TutorialManager` singleton governs initialization, storage, and replay logic.
- Steps scroll to elements smoothly, highlight hot spots, and explain key actions.

### SharePoint Helpers
- `sp-helpers.js` wraps REST calls with digest management, user resolution, and list/file helpers.
- Provides consistent logging, batching options, and easier unit testing by allowing mocks.

---

## Data Model

### InnovationIdeas List
| Field | Type | Notes |
|-------|------|-------|
| Title | Single line | Idea title |
| Category | Choice | Process, Product, Customer, Technology, Sustainability, Workplace |
| Department | Single line | Submitter department |
| Problem | Multiple lines | Problem statement |
| Solution | Multiple lines | Proposed solution |
| ExpectedImpact | Choice | Cost reduction, Revenue growth, Customer experience, etc. |
| EstimatedEffort | Choice | Low, Medium, High |
| RequiredResources | Multiple lines | Resources needed |
| SubmitterName | Single line | Name of submitter |
| SubmitterEmail | Single line | Email of submitter |
| Tags | Single line | Semicolon-separated keywords |
| Status | Choice | Submitted, In review, Accepted, Rejected, Deferred, etc. |
| AttachmentUrls | Multiple lines | Semicolon-separated SharePoint URLs |
| IsAnonymous | Yes/No | Tracks anonymous submissions |
| Votes | Number | Idea upvotes |
| StatusHistory | Multiple lines | JSON string with status timeline |
| AdminNotes | Multiple lines | Internal notes |
| EstimatedROI | Single line | Optional ROI commentary |
| ImplementationDate | Date | When the idea was delivered |

### Sample Data Entities
- Six ideas covering multiple departments, statuses, and ROI scenarios.
- Five user profiles with submission and acceptance counts.
- Mirrors production schema for drop-in local testing.

---

## Security Implementation

Security is delivered through layered defense:
1. **Detection and Redaction**: Sensitive patterns are replaced in real time with non-sensitive placeholders.
2. **Sanitization**: All outbound strings pass through XSS scrubbing before SharePoint persistence.
3. **Access Control**: Admin features locked behind SharePoint group checks with optional fallback emails.
4. **Visual Feedback**: Banners and warnings inform users when content is redacted or blocked.

### PCI DSS Detection Patterns
- **Credit Cards**: 13-19 digits with optional separators validated through the Luhn algorithm.
- **Bank / Account Numbers**: 8-17 digits once confirmed not to be valid credit cards.
- **Emirates ID**: `784-YYYY-NNNNNNN-N` format.
- **SSN / National IDs**: `XXX-XX-XXXX` and regional variants.
- **Passport Numbers**: Common UAE formats with alphanumeric prefixes.
- **IBAN**: International standard including country codes and spacing.
- **CVV / PIN**: Keyword proximity checks to catch 3-4 digit codes.

Detection order prioritizes credit cards, then accounts, followed by national identifiers to reduce false positives.

### Sanitization Flow
```javascript
sanitizeFormData(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'string') {
            sanitized[key] = value;
            continue;
        }

        let clean = value;

        if (window.pciChecker) {
            clean = window.pciChecker.sanitize(clean);
        }

        if (window.xssProtection) {
            clean = window.xssProtection.sanitize(clean);
        }

        sanitized[key] = clean;
    }

    return sanitized;
}
```
- Invoke `sanitizeFormData()` before saving to SharePoint or local storage.
- PCI checker attaches `input`, `blur`, `change`, and `paste` listeners to every monitored field.
- XSS protection removes scripts, dangerous protocols, inline events, and disallowed tags.

### Testing and Validation
1. Open `test-security.html` locally.
2. Type or paste sample numbers (Visa, MasterCard, Emirate ID, SSN). All should be redacted.
3. Confirm warning messages appear and console logs show detections.
4. Submit a form through `index.html` and verify sanitized payloads in SharePoint.
5. Run console checks:
   ```javascript
   console.log('PCI Checker', window.pciChecker);
   console.log('XSS Protection', window.xssProtection);
   ```

### Security Troubleshooting
| Symptom | Resolution |
|---------|------------|
| Sensitive data stored unredacted | Confirm security scripts load before `app.js`. Ensure `sanitizeFormData()` runs before persistence. |
| Redaction misses spaced cards | Verify updated regex `/\d([\s\-]?\d){12,18}/g` is deployed. Clear cache. |
| Admin blocked from dashboard | Check SharePoint group membership or fallback email list in `admin.js`. |
| Warning UI missing | Ensure security banner markup from `index.html` is intact and styles from `styles.css` are loaded. |

---

## Admin Dashboard Enhancements

### Bulk Operations
- Multi-select ideas to approve, reject, or move back to review in a single action.
- "Select all" toggle honors filters and pagination.
- Progress notifications surface completion status and errors.

### Analytics Suite
- Chart.js powers five live charts: submission trends, category mix, status distribution, department participation, and ROI analysis.
- Responsive canvases resize with the layout for kiosks, desktops, or tablets.
- Real sample data drives the visuals for local testing.

### Filtering and Search
- Combined filters for status, priority, category, department, and date ranges.
- Debounced text search improves performance on large datasets.
- Filter states persist until reset, even after performing bulk actions.

### Export Capabilities
- CSV export includes all rich fields with proper escaping and ISO date formatting.
- Supports exporting either visible results or only selected ideas.
- Uses `Blob` streaming to keep the UI responsive.

### Future Admin Enhancements
- Real-time notifications through WebSockets.
- Virtualized table rendering for thousands of ideas.
- Enhanced audit logging and activity timelines.
- Configurable analytics widgets per administrator.
- External integration hooks (Teams, Power Automate).

---

## Local Testing Workflow
- `admin.js` first attempts to load `sample-data.json`. Missing JSON triggers a graceful fallback to SharePoint.
- When SharePoint is unavailable, built-in fixtures keep the dashboard functional.
- All SharePoint calls are centralized in `sp-helpers.js`, eliminating duplicate fetch logic.
- Console logging clearly states which data source is active:
  - `Loaded 6 ideas and 5 users from sample-data.json`
  - `Loading ideas from SharePoint...`
  - `SharePoint not available - updates stored locally only`
- Local mode uses a mock admin profile with full capabilities for end-to-end UI testing.

---

## Tutorial System

- Two independent flows: **Home (7 steps)** and **Submit (8 steps)**.
- Auto-starts once per context with `localStorage` keys such as `innovationPortal_tutorial_home_completed`.
- SVG mask cutouts focus attention while leaving the rest of the screen dimmed.
- Step metadata defines target selectors, copy, positioning, and optional callbacks.
- Auto-scroll centers the target element, respecting viewport boundaries.

### Console Commands
```javascript
// Global manager reference
window.tutorialManager

// Reset all progress
tutorialManager.resetAll()

// Force start a tutorial
tutorialManager.get('home').forceStart()

tutorialManager.get('submit').forceStart()

// Check completion status
tutorialManager.get('home').hasCompletedTutorial()

tutorialManager.get('submit').hasCompletedTutorial()
```

### Storage and Completion Tracking
- `innovationPortal_tutorial_home_completed` stores completion state for the Home flow.
- `innovationPortal_tutorial_home_completed_date` records ISO timestamps for audits.
- Equivalent keys exist for the Submit flow.

### Customization
1. Update `getHomeSteps()` or `getSubmitSteps()` with new step objects.
2. Provide `target`, `title`, `content`, `position`, and optional `action` callback.
3. Extend `TutorialManager` to register additional contexts if new views are introduced.
4. When migrating to SharePoint tracking, replace `localStorage` calls with helper methods using `sp-helpers.js`.

### Tutorial Troubleshooting
| Issue | Remedy |
|-------|--------|
| Tutorial does not start | Run `tutorialManager.resetAll()`, confirm DOM selectors still exist. |
| Tooltip appears off-screen | Built-in positioning fallback centers the tooltip; verify styles are loaded. |
| SVG cutout misaligned | Ensure scroll listener is active; inspect console for warnings. |
| Auto-scroll feels abrupt | Adjust scroll behavior in step actions (see [Roadmap](#roadmap-and-opportunities) for reduced-motion support). |

---

## SharePoint Helper Reference

### Instantiation
```javascript
const spClient = new SPClient({
    siteUrl: window.location.origin,
    verboseLogging: false
});
```

### Current User and Permissions
- `getCurrentUser(select?)` → `{ Id, Title, Email, LoginName, IsSiteAdmin }`
- `isUserInGroup(groupName, userId)` → `boolean`
- `getEffectiveBasePermissions()` → `{ High, Low }`
- `getUserDetails({ email?, loginName?, userId? })` → combined core and profile metadata

### List Operations
```javascript
await spClient.getListItems('InnovationIdeas', {
    select: 'Id,Title,Status,Created,Author/Title',
    expand: 'Author',
    filter: "Status ne 'Rejected'",
    orderby: 'Created desc',
    top: 50
});

const idea = await spClient.createListItem('InnovationIdeas', payload);
await spClient.updateListItem('InnovationIdeas', idea.Id, { Status: 'In review' });
await spClient.deleteListItem('InnovationIdeas', idea.Id);
```

### File Operations
```javascript
const uploadResult = await spClient.uploadFile('/sites/innovation/IdeaAttachments', file, true);
const fileInfo = await spClient.getFileByServerRelativeUrl(uploadResult.ServerRelativeUrl);
```

### Tips
- Digest tokens are cached and auto-refreshed via `getRequestDigest()`.
- Use `verboseLogging: true` during development to trace REST calls.
- `ensureUser(email)` normalizes login names when working with claims.

---

## Sample Data Reference
- `sample-data.json` mirrors the SharePoint schema for seamless swaps between local and production.
- Includes:
  - Six richly populated ideas (comments, status history, ROI, implementation data).
  - Five user profiles with submission counts and acceptance metrics.
- Update the file to craft targeted QA scenarios without touching production data.

---

## Performance
| Metric | Value | Notes |
|--------|-------|-------|
| Security libraries | ~5 KB minified | Negligible footprint |
| Tutorial system | ~8 KB minified | Lightweight overlay logic |
| App initialization | ~50 ms | Measured on modern laptops |
| Memory footprint | ~2 MB | Includes cached ideas and drafts |
| First paint | < 1 s | Dark theme with gradients preloads quickly |

Performance is maintained by debounced listeners, memoized status dictionaries, and lightweight DOM updates.

---

## Compliance
- **PCI DSS**: Requirements 3, 4, 6, and 8 addressed through redaction, encryption-ready transmission, secure coding, and authenticated access.
- **OWASP Top 10**: Covers Injection (A03) and Security Misconfiguration (A05) via sanitation and defaults.
- **Auditability**: Admin actions can be extended with SharePoint audit logs and tracked via `statusHistory` fields.

---

## Roadmap and Opportunities
1. **Reduced Motion Support**: Respect `prefers-reduced-motion` in animations and tutorial scroll behavior.
2. **Theming Engine**: Add automatic light/dark detection using `prefers-color-scheme` with a manual toggle.
3. **Server-Side Persistence for Tutorials**: Store completion state in SharePoint for true roam-anywhere experiences.
4. **Real-Time Admin Updates**: Introduce push notifications or polling hooks for live collaboration.
5. **Advanced Analytics**: Predictive scoring, clustering of idea topics, and integration with Power BI.
6. **Accessibility Enhancements**: ARIA landmarks, keyboard shortcuts for tutorial navigation, and high-contrast mode support.
7. **Automated Testing**: UI smoke tests using Playwright and security regression scripts for PCI patterns.

---

## Support
1. Review this README for setup, security, and troubleshooting guidance.
2. Use browser developer tools for console logs from security and SharePoint helpers.
3. Validate permissions and group membership when admin features appear restricted.
4. Keep `sp-helpers.js`, `pci-dss-checker.js`, and `xss-protection.js` up to date when threat patterns evolve.

---

## Changelog and Bug Fixes
- Updated credit card detection regex to handle spaces, dashes, and contiguous digits.
- Prevented account-number pattern from intercepting full credit card numbers by adding Luhn checks.
- Added `change` event listeners to strengthen paste detection reliability.
- Documented complete testing scenarios in `test-security.html`.
- Consolidated documentation from nine Markdown guides into this single reference.

---

**Version**: 5.0
**Last Updated**: October 5, 2025
**Maintainers**: Innovation Platform Team
