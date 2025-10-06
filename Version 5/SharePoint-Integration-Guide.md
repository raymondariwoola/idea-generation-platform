# Think Space (Idea Generation Platform) — SharePoint Integration Guide

This short guide shows exactly what to create in SharePoint and where the app connects for:
- Uploading files to a document library
- Creating/updating items in a list
- Reading items from lists (including Status Dictionary)
- Admin-only actions and permissions

The guide covers both `app.js` (user portal) and `admin.js` (admin portal).

---

## 1) Site and permissions

- Host the pages (e.g., `index.html`, `admin.html`) in the same SharePoint Web (subsite) where your lists/libraries live.
- In code, `siteUrl` should be the web URL (for example: `https://<tenant>.sharepoint.com/sites/GCE/thinkspace`).
  - In `app.js` this is auto-detected via `_spPageContextInfo.webAbsoluteUrl`.
  - For `admin.js`, set its `sharePointConfig.siteUrl` to the same web (or adopt the same auto-detection if you prefer).
- Permissions (minimum):
  - Regular users: Contribute on the list `InnovationIdeas` and Add items to the library `IdeaAttachments`.
  - Admins: Add your admins to the SharePoint group "Innovation Portal Administrators" (or grant Edit/Full Control directly).

---

## 2) Lists and libraries to create

Create the following in the target subsite:

### A. List: InnovationIdeas
- List name: `InnovationIdeas`
- Purpose: Stores submitted ideas.
- Columns (internal name → display name, type):
  - Title → Title: Single line of text (built-in)
  - Category → Category: Choice (e.g., Tech, Process, Sustainability, Customer) or Single line of text
  - Department → Department: Single line of text (or Choice if you prefer)
  - Problem → Problem: Multiple lines of text (plain text)
  - Solution → Solution: Multiple lines of text (plain text)
  - ExpectedImpact → Expected Impact: Single line of text (or Multiple lines)
  - EstimatedEffort → Estimated Effort: Choice (e.g., Low, Medium, High) or Single line of text
  - RequiredResources → Required Resources: Multiple lines of text (plain text)
  - SubmitterName → Submitter Name: Single line of text
  - SubmitterEmail → Submitter Email: Single line of text
  - IsAnonymous → Is Anonymous: Yes/No
  - Tags → Tags: Single line of text (semicolon-separated)
  - Status → Status: Choice
    - Recommended choices: Submitted, In review, Accepted, Rejected, Deferred, On hold, Duplicate, Needs Info, Implemented, Archived
    - Default value: Submitted
  - AttachmentUrls → Attachment Urls: Multiple lines of text (plain text). Stores semicolon-separated file URLs returned from the library upload.
  - Votes → Votes: Number (optional; used for analytics/UI)
  - AdminNotes → Admin Notes: Multiple lines of text (optional; used by Admin UI)
  - StatusHistory → Status History: Multiple lines of text (plain text; optional; JSON payload the Admin UI may use)

Notes
- The code works if some optional columns are missing, but creating them unlocks full functionality of `admin.js`.

### B. Document library: IdeaAttachments
- Library name: `IdeaAttachments`
- Purpose: Stores uploaded files for ideas.
- No custom columns are required by the code. Optionally, you may add `IdeaId` (Single line) if you want to relate files back to an idea, but the app already stores file URLs in the `AttachmentUrls` field of `InnovationIdeas`.

### C. List: StatusDictionary
- List name: `StatusDictionary`
- Purpose: Maps raw workflow states to friendly labels, descriptions, and optional color/icon used by the UI.
- Columns (internal name → display name, type):
  - RawStatus → Raw Status: Single line of text (Required) — This must match your raw status values in `InnovationIdeas.Status` (e.g., "In review").
  - FriendlyStatus → Friendly Status: Single line of text — Short, user-friendly label.
  - Description → Description: Multiple lines of text (plain text) — Tooltip/longer copy.
  - ColorHex → Color Hex: Single line of text (optional) — e.g., `#3b82f6`.
  - Icon → Icon: Single line of text (optional) — a CSS class or key, e.g., `fas fa-check`.

Seed rows (example values you can paste in):

| RawStatus   | FriendlyStatus   | Description                               | ColorHex | Icon          |
|-------------|------------------|-------------------------------------------|---------|---------------|
| Submitted   | Received         | Your idea has been received.              | #60a5fa | fas fa-inbox  |
| In review   | Under review     | Your idea is being assessed.              | #f59e0b | fas fa-search |
| Accepted    | Moving forward   | Selected to proceed.                      | #10b981 | fas fa-check  |
| Rejected    | Not selected     | Not proceeding at this time.              | #ef4444 | fas fa-times  |
| Deferred    | Future consideration | Revisit in a future cycle.           | #a78bfa | fas fa-clock  |
| On hold     | Paused           | Temporarily on hold.                      | #6b7280 | fas fa-pause  |
| Duplicate   | Already addressed| Similar idea already exists.              | #94a3b8 | fas fa-copy   |
| Needs Info  | More info needed | More details requested.                   | #f97316 | fas fa-info   |
| Implemented | Delivered        | Implemented and available.                | #22c55e | fas fa-rocket |
| Archived    | Closed           | No further action.                        | #64748b | fas fa-archive|

If the dictionary is missing, the app falls back to built‑in labels, so the UI still works. Adding the list lets you tune labels/colors without code changes.

### D. List (optional): AdminAuditLog
- List name: `AdminAuditLog`
- Purpose: Optional audit log for admin actions.
- Columns:
  - Title → Title: Single line of text (built-in; used for event type, e.g., `ADMIN_ACCESS_GRANTED`)
  - EventData → Event Data: Multiple lines of text (plain text) — JSON payload describing the event.

---

## 3) Where the code talks to SharePoint

### In `app.js` (user portal)
- Upload file to library
  - Function: `uploadFileToSharePoint(file, fileName)`
  - Endpoint: `POST {siteUrl}/_api/web/lists/getbytitle('IdeaAttachments')/RootFolder/Files/Add(url='{fileName}',overwrite=true)`
  - Returns the file URL, which is stored in `AttachmentUrls` (semicolon-separated) on the idea item.

- Save a new idea to list
  - Function: `saveIdeaToSharePoint(ideaData)`
  - Endpoint: `POST {siteUrl}/_api/web/lists/getbytitle('InnovationIdeas')/items`
  - Payload fields written: `Title, Category, Department, Problem, Solution, ExpectedImpact, EstimatedEffort, RequiredResources, SubmitterName, SubmitterEmail, Tags, Status, AttachmentUrls, IsAnonymous`

- Read ideas from list
  - Function: `loadIdeasFromSharePoint()`
  - Endpoint: `GET {siteUrl}/_api/web/lists/getbytitle('InnovationIdeas')/items?$orderby=Created desc`
  - Fields read: `Id, Title, Category, Department, Problem, Solution, ExpectedImpact, EstimatedEffort, RequiredResources, SubmitterName, SubmitterEmail, Tags, Status, Modified, Votes, AttachmentUrls`

- Read Status Dictionary
  - Function: `loadStatusDictionaryFromSharePoint()`
  - Endpoint: `GET {siteUrl}/_api/web/lists/getbytitle('StatusDictionary')/items?$select=RawStatus,FriendlyStatus,Description,ColorHex,Icon`

- Request digest for POST operations
  - Function: `getRequestDigest()`
  - Endpoint: `POST {siteUrl}/_api/contextinfo`

Notes
- All REST calls include `credentials: 'include'` so SharePoint auth cookies are sent.
- The app auto-detects `siteUrl` to the current subsite; host the page within that subsite.

### In `admin.js` (admin portal)
- Configuration keys (top of file): `sharePointConfig.siteUrl`, `listName = 'InnovationIdeas'`, `libraryName = 'IdeaAttachments'`, `adminGroupName = 'Innovation Portal Administrators'`.
- Uses `sp-helpers.js` (`SPClient`) for most reads/updates:
  - Read ideas: `this.spClient.getListItems('InnovationIdeas', { select: 'Id,Title,Category,Department,Problem,Solution,ExpectedImpact,EstimatedEffort,RequiredResources,SubmitterName,SubmitterEmail,IsAnonymous,Tags,Status,Created,Modified,Votes,AttachmentUrls,AdminNotes' })`
  - Update idea status: `this.spClient.updateListItem('InnovationIdeas', itemId, { Status: 'Accepted' })`
- Optional audit logging:
  - Function: `logAuditEvent(eventType, eventData)`
  - Endpoint: `POST {siteUrl}/_api/web/lists/getbytitle('AdminAuditLog')/items`
  - Writes: `Title` (event type), `EventData` (JSON text)

Recommendation
- Make `admin.js` use the same web URL detection as `app.js` or hard‑set `sharePointConfig.siteUrl` to your subsite to avoid 401s when the page is hosted elsewhere.

---

## 4) Quick checklist

- [ ] Create the list `InnovationIdeas` with the columns above (Status default = Submitted)
- [ ] Create the library `IdeaAttachments`
- [ ] Create the list `StatusDictionary` and seed with the table provided
- [ ] (Optional) Create `AdminAuditLog` with `EventData` (Multiple lines)
- [ ] Put admins in the group "Innovation Portal Administrators" (or grant equivalent perms)
- [ ] Host `index.html` and `admin.html` in the same subsite and confirm API URLs start with that subsite path

That’s it. Once the lists and library exist with these column names, the app will read/write without further code changes.