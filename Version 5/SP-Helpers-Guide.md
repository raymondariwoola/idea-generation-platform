# SharePoint REST Helpers Guide

A lightweight client you can load in your portal to call SharePoint REST APIs with clean, reusable functions.

- File: `sp-helpers.js`
- Global (script tag): `window.SPClient`
- Module (bundlers): `import SPClient from './sp-helpers.js'`

## Quick Start

1. Include the helper in your page before `app.js`:

```html
<script src="./sp-helpers.js"></script>
<script src="./app.js"></script>
```

1. Create a client instance (siteUrl optional, defaults to current origin):

```js
const sp = new SPClient({ siteUrl: window.location.origin, verboseLogging: true });
```

## Core Concepts

- Uses SharePoint REST API with `odata=verbose` compatibility
- Auto-handles `X-RequestDigest` and caches it until expiry
- Works with current site by default; pass `siteUrl` for cross-site
- Returns plain objects with unwrapped `d` payload when present

## API Reference

### new SPClient(options)

- `siteUrl?: string` Base site (default: current origin)
- `verboseLogging?: boolean` Console logging

### Web / Context

- `getRequestDigest(force?: boolean)` → string
- `getCurrentUser(select?: string)` → `{ Id, Title, Email, LoginName, IsSiteAdmin }`
- `getEffectiveBasePermissions()` → `{ High, Low }`
- `isUserInGroup(groupName: string, userId: number)` → boolean
- `getSiteGroups()` → `{ results: [...] }`

Example:

```js
const me = await sp.getCurrentUser();
const isAdmin = await sp.isUserInGroup('Innovation Portal Administrators', me.Id);
```

### Users / Profiles

- `ensureUser(loginOrEmail: string)` → core user info (resolves claims)
- `getUserById(userId: number, select?: string)` → core user
- `getUserProfile(loginOrEmail: string)` → full profile via PeopleManager
- `getUserDetails(params?: { userId?, loginName?, email? })` → rich user object

Example (by current user):

```js
const details = await sp.getUserDetails();
console.log(details.department, details.displayName, details.email);
```

Example (by email):

```js
const user = await sp.getUserDetails({ email: 'someone@contoso.com' });
console.log(user.department, user.manager);
```

### Lists / Items

- `getListItems(listTitle: string, query?: { select, filter, top, orderby, expand })`
- `getListItemById(listTitle: string, id: number, select?: string)`
- `createListItem(listTitle: string, payload: object, entityTypeFullName?: string)`
- `updateListItem(listTitle: string, id: number, payload: object, etag?: string, entityTypeFullName?: string)`
- `deleteListItem(listTitle: string, id: number, etag?: string)`

Examples:

```js
// Query items
const ideas = await sp.getListItems('InnovationIdeas', {
  select: 'Id,Title,Status,Created,Author/Title',
  expand: 'Author',
  filter: "Status ne 'Rejected'",
  orderby: 'Created desc',
  top: 50,
});

// CRUD
const created = await sp.createListItem('InnovationIdeas', { Title: 'New Idea', Status: 'Submitted' });
await sp.updateListItem('InnovationIdeas', created.Id, { Status: 'In Review' });
await sp.deleteListItem('InnovationIdeas', created.Id);
```

### Files / Libraries

- `uploadFile(libraryServerRelativeUrl: string, file: Blob, overwrite?: boolean)`
- `getFileByServerRelativeUrl(fileServerRelativeUrl: string)`

Examples:

```js
// Upload a file to a library
const file = document.querySelector('#attachments').files[0];
const uploaded = await sp.uploadFile('/sites/innovation/IdeaAttachments', file, true);
console.log('Uploaded to:', uploaded.ServerRelativeUrl);

// Get file metadata
const fileInfo = await sp.getFileByServerRelativeUrl(uploaded.ServerRelativeUrl);
```

## Rich User Details Helper

`getUserDetails` combines core user + PeopleManager profile into one useful shape:

```ts
{
  id: number,
  loginName: string,
  title: string,
  email: string | null,
  firstName: string | null,
  lastName: string | null,
  displayName: string,
  department: string | null,
  jobTitle: string | null,
  office: string | null,
  manager: string | null,
  pictureUrl: string | null,
  isSiteAdmin: boolean | null,
  raw: { core, profile, profileProps }
}
```

## Using in your App (`app.js`)

```html
<!-- index.html -->
<script src="./sp-helpers.js"></script>
<script src="./app.js"></script>
```

```js
// app.js
const sp = new SPClient({ siteUrl: window.location.origin });

(async () => {
  const me = await sp.getUserDetails();
  console.log('Welcome', me.displayName, 'from', me.department);

  const ideas = await sp.getListItems('InnovationIdeas', {
    select: 'Id,Title,Status',
    orderby: 'Created desc',
    top: 10
  });
  console.table(ideas.results || ideas);
})();
```

## Tips & Notes

- Ensure your page is hosted in SharePoint or authenticated to the tenant (SSO)
- For cross-site calls, set `siteUrl` to the target site collection
- PeopleManager API requires user profiles to be enabled
- For large lists, combine `$top` with `$filter` and `$orderby` for performance
- Use `verboseLogging: true` during development for helpful console output

## Troubleshooting

- 401/403 errors: verify permissions and that the user is logged in
- Digest errors: the helper auto-renews; if needed call `getRequestDigest(true)`
- Claims format: use `ensureUser(email)` or `toClaimsLogin(email)` to normalize

---

Happy building! If you want more helpers (taxonomy, search parsing, sharing APIs), I can extend this file. 😊
