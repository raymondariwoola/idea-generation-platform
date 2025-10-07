# Think Space End-to-End Test Plan

This checklist walks through the full user journey across **Welcome**, **Index (user portal)**, and **Admin** experiences, including SharePoint integrations. Use the checkboxes to mark each test case as you validate. For any failures, mark the corresponding "Bug" checkbox and add investigation notes.

> **Legend**: `[x] Pass` means the scenario behaves correctly. `[x] Bug` flags a regression—capture the observed behavior, SP list/library data, console output, and screenshots.

## 0. Prerequisites & Environment Sanity

| # | Step | Pass | Bug | Notes |
|---|------|:----:|:---:|-------|
| P0.1 | Confirm SharePoint site/web URL matches the subsite used in configuration ( `_spPageContextInfo.webAbsoluteUrl` ) | [x] | [ ] | |
| P0.2 | Ensure SharePoint lists/libraries exist with required columns:<br/>• `InnovationIdeas` (Title, Category, Department, Problem, Solution, ExpectedImpact, EstimatedEffort, RequiredResources, SubmitterName, SubmitterEmail, Tags, Status, AttachmentUrls, IsAnonymous, Votes)<br/>• `StatusDictionary`<br/>• `IdeaAttachments` library | [x] | [ ] | |
| P0.3 | Verify current account has permissions to read/write the above lists and libraries | [x] | [ ] | |
| P0.4 | Clear browser cache/localStorage to start from a clean state (so theme choices, drafts, etc. reset) | [x] | [ ] | |
| P0.5 | Open browser dev tools (Console + Network) to monitor requests and errors while testing | [x] | [ ] | |

## 1. Welcome Page (`welcome.html`)

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| W1.1 | Page loads without errors; background animations and typography render correctly | [x] | [ ] | |
| W1.2 | Initial theme defaults to **Futuristic** if `think-space-theme` is absent | [x] | [ ] | |
| W1.3 | Toggle to **Brand** theme updates colors instantly and persists to localStorage | [x] | [ ] | |
| W1.4 | Refresh page—theme persists (matches last selection) | [x] | [ ] | |
| W1.5 | Toggle back to Futuristic; verify localStorage updates accordingly | [x] | [ ] | |
| W1.6 | CTA "Click to enter" navigates to `index.html` after the ripple animation (ENTER key also works) | [ ] | [x] |It directly and immediatly goes to the next page, there is no ripple or loading animation to the next page, it just loads the page immediately |
| W1.7 | Accessibility: ensure focus styles are visible on toggle buttons and CTA; screen reader announces toggle state | [x] | [ ] | |
| W1.8 | No console errors/warnings during interactions | [x] | [ ] | |

## 2. Main Portal – Home View (`index.html` > `app.js`)

### 2.1 Initial Load & Global State

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| H1.1 | Opening `index.html` shows spinner (“Loading ideas…”) until first SharePoint page returns | [x] | [ ] | |
| H1.2 | KPI cards animate with counts matching SharePoint totals (`Total ideas` reflects `__count` when available) | [x] | [ ] | |
| H1.3 | Theme from Welcome page persists; toggling within the nav updates localStorage and UI | [x] | [ ] | |
| H1.4 | Navigation buttons highlight the current view; URL hash updates (`#home`, `#submit`, `#track`) | [x] | [ ] | |
| H1.5 | No failed network requests in console (pay attention to `_api` calls) | [ ] | [ ] | |

### 2.2 Ideas Feed – Pagination, Search & Filters

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| H2.1 | Default grid shows newest ideas first (ordered by `Created desc`) | [ ] | [ ] | |
| H2.2 | "Load more ideas" fetches the next SharePoint page, appends without duplicates, updates summary counts | [ ] | [ ] | |
| H2.3 | Switching to list view retains current filters/search state | [ ] | [ ] | |
| H2.4 | Search by keyword filters client-side results within loaded pages; loading more retains search criteria | [ ] | [ ] | |
| H2.5 | Category pills filter as expected; combination with search works | [ ] | [ ] | |
| H2.6 | Status + Department filters work together (case-insensitive for department) | [ ] | [ ] | |
| H2.7 | "Reset" clears filters, pills, and search, returning to the default dataset | [ ] | [ ] | |
| H2.8 | Hovering cards shows subtle elevation; clicking launches modal with correct details (see H3 tests) | [ ] | [ ] | |

### 2.3 Idea Modal & Actions

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| H3.1 | Clicking an idea opens modal with accurate data (status label, department, tags, problem/solution text) | [ ] | [ ] | |
| H3.2 | Close button (×) and ESC key dismiss modal; background scroll restored | [ ] | [ ] | |
| H3.3 | "Vote" increments vote count locally; (optional) confirm SharePoint integration if extended later | [ ] | [ ] | |
| H3.4 | "Share" uses navigator.share when available; gracefully falls back otherwise | [ ] | [ ] | |
| H3.5 | "Advance" button respects status flow (`Submitted → In review → Accepted`, then disables) | [ ] | [ ] | |

## 3. Submit Idea Flow

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| S1.1 | Navigate to Submit view; section progress bars and overall progress initialize at 0% | [ ] | [ ] | |
| S1.2 | Required fields validation triggers when attempting submission with missing data | [ ] | [ ] | |
| S1.3 | Toggle attachments ON/OFF hides/shows drag-drop area; state persists during session | [ ] | [ ] | |
| S1.4 | Upload valid file types (e.g., PDF, DOCX); file list shows icon, size, delete button | [ ] | [ ] | |
| S1.5 | Attempt unsupported type (>10MB or invalid extension) prompts warning and blocks addition | [ ] | [ ] | |
| S1.6 | PCI/XSS sanitization removes risky strings (e.g., enter `<script>` or card numbers) before submission | [ ] | [ ] | |
| S1.7 | Successful submission flow:
- Shows loading state
- Uploads attachments to `IdeaAttachments`
- Creates item in `InnovationIdeas`
- Plays success animation
- Navigates automatically to Track view | [ ] | [ ] | |
| S1.8 | Draft saving stores entry in localStorage; confirm draft appears in future session; clearing works | [ ] | [ ] | |
| S1.9 | Rapid double-submit is blocked (guard flag) | [ ] | [ ] | |

## 4. Track View (My Ideas)

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| T1.1 | Track view loads spinner if needed, then shows only current user’s SharePoint submissions (AuthorId/SubmitterEmail match) | [ ] | [ ] | |
| T1.2 | Stats cards (Your Ideas, Pending, Accepted, Impact Score) match filtered dataset | [ ] | [ ] | |
| T1.3 | Table rows display newest first; clicking opens modal; "Advance" respects flow | [ ] | [ ] | |
| T1.4 | Cards view mirrors table content and allows status advancement; grid/list toggle persists mode | [ ] | [ ] | |
| T1.5 | "Load more of your ideas" appears when SharePoint `__next` link exists; click fetches next page without duplicates | [ ] | [ ] | |
| T1.6 | Refresh Track view (navigate away/back) honors cache TTL (5 minutes) and refresh behavior | [ ] | [ ] | |

## 5. SharePoint Data Validation

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| SP1.1 | New idea appears in `InnovationIdeas` with correct field values (SubmitterEmail, attachments list, Status=Submitted) | [ ] | [ ] | |
| SP1.2 | Attachments uploaded to `IdeaAttachments` have expected naming convention (`timestamp_filename`) | [ ] | [ ] | |
| SP1.3 | Status dictionary loads correctly (friendly labels in filters/cards). If list missing, fallback dictionary applies without errors | [ ] | [ ] | |
| SP1.4 | List item updates (e.g., status changes) persist and reflect on reload | [ ] | [ ] | |

## 6. Admin Portal (`admin.html` / `admin.js`)

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| A1.1 | Admin page loads with correct site URL detection (no auth prompts/401) | [ ] | [ ] | |
| A1.2 | Ideas grid/table populate with SharePoint data; pagination or filtering works as designed (if applicable) | [ ] | [ ] | |
| A1.3 | Status updates/approvals work and write back to `InnovationIdeas`; Track view respects changes | [ ] | [ ] | |
| A1.4 | Audit logging (if enabled) writes to `AdminAuditLog` with credentials included | [ ] | [ ] | |
| A1.5 | Theme toggle (if present) mirrors main app preference | [ ] | [ ] | |
| A1.6 | No console errors; all fetch calls include `credentials: 'include'` | [ ] | [ ] | |

## 7. Cross-Cutting & Responsive Checks

| # | Scenario | Pass | Bug | Notes |
|---|----------|:----:|:---:|-------|
| X1.1 | Resize to tablet/mobile widths—layouts gracefully adapt; navigation remains usable | [ ] | [ ] | |
| X1.2 | Welcome, Index, Admin pages respect `prefers-reduced-motion` (animations tone down) | [ ] | [ ] | |
| X1.3 | Browser back/forward navigation respects view state via URL hash | [ ] | [ ] | |
| X1.4 | LocalStorage keys (`think-space-theme`, drafts) clean up appropriately when clearing data | [ ] | [ ] | |
| X1.5 | Accessibility quick pass: headings hierarchy, ARIA attributes (modals, load indicators), focus traps | [ ] | [ ] | |
| X1.6 | Session timeout / re-auth: observe behavior if SharePoint session expires (should prompt gracefully) | [ ] | [ ] | |

## 8. Watchlist & Potential Regression Areas

These areas are more complex or recently modified—test carefully and log findings in the **Notes** column above.

- **Paged SharePoint Fetching**: Verify `__next` handling for both global ideas and “My Ideas.” Look for duplicates or skipped records when filters/search are active.
- **Track View Caching**: Cache TTL is five minutes; ensure switching between views triggers refresh after TTL and respects rapid navigation.
- **Theme Persistence**: Welcome, Index, and Admin must stay in sync through the shared `think-space-theme` key. Test switching themes on each page.
- **Sanitization Libraries**: If `pci-dss-checker.js` or `xss-protection.js` fail to load, form submission should still work but log console warnings—watch for false negatives.
- **Attachment Uploads**: Large files or slow networks may expose timeouts; verify retries/notifications. Confirm `IdeaAttachments` library permissions.
- **Status Dictionary**: When SharePoint list is unavailable, fallback dictionary should populate filters/cards without breaking API calls.
- **Modal Accessibility**: Ensure focus trapping remains intact after recent UI changes; screen reader should not read background content while modal is open.
- **Success Animation Overlay**: Confirm overlay always removes itself, even if navigation is interrupted (e.g., user clicks elsewhere quickly).

---

### Usage Tips
- Duplicate this file per test cycle or copy individual tables into your tracking document.
- Consider pairing with browser dev tools’ “Preserve log” option to capture exact requests for any failing scenario.
- When marking a test as a bug, note the SharePoint item ID, timestamp, or payload observed for faster debugging.

Happy testing! Capture any surprises so we can harden the platform further.
