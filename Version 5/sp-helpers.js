/*
  SharePoint REST Helpers (Browser)
  - Lightweight client for SharePoint Online/On-Prem REST API
  - Works with classic <script> include or as an ES module
  - Exposes window.SPClient when loaded via <script>
*/
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    const api = factory();
    global.SPClient = api;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  const ODATA_HEADERS = {
    Accept: 'application/json;odata=verbose',
  };

  class SharePointClient {
    constructor(options = {}) {
      this.siteUrl = options.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      this._digest = null;
      this._digestExpiry = 0;
      this.verboseLogging = !!options.verboseLogging;
    }

    // ===== Core fetch helpers =====
    _log(...args) {
      if (this.verboseLogging) console.log('[SPClient]', ...args);
    }

    _ensureAbsolute(url) {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      const base = this.siteUrl.replace(/\/$/, '');
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }

    async _fetchJson(url, options = {}) {
      const response = await fetch(this._ensureAbsolute(url), {
        ...options,
        headers: {
          ...ODATA_HEADERS,
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
      }
      const data = await response.json();
      // Unwrap odata=verbose
      if (data && data.d !== undefined) return data.d;
      return data;
    }

    async _get(url) {
      return this._fetchJson(url, { method: 'GET' });
    }

    async _post(url, body, headers = {}) {
      const digest = await this.getRequestDigest();
      return this._fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          ...headers,
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });
    }

    async _update(url, body, etag = '*') {
      const digest = await this.getRequestDigest();
      return this._fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': etag,
        },
        body: JSON.stringify(body),
      });
    }

    async _delete(url, etag = '*') {
      const digest = await this.getRequestDigest();
      const res = await fetch(this._ensureAbsolute(url), {
        method: 'POST',
        headers: {
          ...ODATA_HEADERS,
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'DELETE',
          'IF-MATCH': etag,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE ${res.status} ${res.statusText}: ${text}`);
      }
      return true;
    }

    // ===== Context Info / Digest =====
    async getRequestDigest(force = false) {
      const now = Date.now();
      if (!force && this._digest && now < this._digestExpiry) {
        return this._digest;
      }
      const d = await this._postContextInfo();
      this._digest = d.FormDigestValue;
      // Usually valid for ~30 minutes; set renew a bit earlier
      this._digestExpiry = now + Math.max(1, d.FormDigestTimeoutSeconds - 60) * 1000;
      this._log('New digest acquired, expires in', d.FormDigestTimeoutSeconds, 'seconds');
      return this._digest;
    }

    async _postContextInfo() {
      const res = await fetch(this._ensureAbsolute('/_api/contextinfo'), {
        method: 'POST',
        headers: { ...ODATA_HEADERS },
      });
      if (!res.ok) throw new Error(`Failed to get contextinfo: ${res.statusText}`);
      const data = await res.json();
      return data.d.GetContextWebInformation;
    }

    // ===== Utilities =====
    toClaimsLogin(account) {
      // Best-effort for SPO membership provider vs. Windows auth
      if (!account) return '';
      if (account.includes('@')) {
        return `i:0#.f|membership|${account}`.toLowerCase();
      }
      if (account.includes('\\')) {
        return `i:0#.w|${account}`.toLowerCase();
      }
      return account; // Already a claims login or ID
    }

    // ===== Web / Permissions =====
    async getCurrentUser(select = 'Id,Title,Email,LoginName,IsSiteAdmin') {
      return this._get(`/_api/web/currentuser?$select=${encodeURIComponent(select)}`);
    }

    async getEffectiveBasePermissions() {
      return this._get('/_api/web/effectiveBasePermissions');
    }

    async isUserInGroup(groupName, userId) {
      const enc = encodeURIComponent(groupName);
      const data = await this._get(`/_api/web/sitegroups/getbyname('${enc}')/users?$select=Id,Email,LoginName,Title&$filter=Id eq ${userId}`);
      return Array.isArray(data.results) ? data.results.length > 0 : (data && data.results && data.results.length > 0);
    }

    async getSiteGroups() {
      return this._get('/_api/web/sitegroups');
    }

    // ===== Users / Profiles =====
    async ensureUser(loginOrEmail) {
      const digest = await this.getRequestDigest();
      return this._fetchJson('/_api/web/ensureuser', {
        method: 'POST',
        headers: {
          ...ODATA_HEADERS,
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({ logonName: loginOrEmail }),
      });
    }

    async getUserById(userId, select = 'Id,Title,Email,LoginName') {
      return this._get(`/_api/web/getuserbyid(${userId})?$select=${encodeURIComponent(select)}`);
    }

    async getUserProfile(loginOrEmail) {
      const account = this.toClaimsLogin(loginOrEmail);
      const enc = encodeURIComponent(account);
      return this._get(`/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName='${enc}')`);
    }

    async getUserDetails({ userId, loginName, email } = {}) {
      // Resolve user core info
      let core;
      if (userId) core = await this.getUserById(userId);
      else if (loginName) core = await this.ensureUser(loginName);
      else if (email) core = await this.ensureUser(email);
      else core = await this.getCurrentUser();

      const login = core.LoginName || loginName || (email ? this.toClaimsLogin(email) : null);
      let profile = null;
      try {
        if (login) profile = await this.getUserProfile(login);
      } catch (e) {
        this._log('User profile fetch failed (non-fatal):', e.message);
      }

      const profileProps = {};
      if (profile && profile.UserProfileProperties && profile.UserProfileProperties.results) {
        for (const p of profile.UserProfileProperties.results) {
          profileProps[p.Key] = p.Value;
        }
      }

      return {
        id: core.Id,
        loginName: core.LoginName || login,
        title: core.Title,
        email: core.Email || profileProps.WorkEmail || email || null,
        firstName: profileProps.FirstName || null,
        lastName: profileProps.LastName || null,
        displayName: profile ? profile.DisplayName : core.Title,
        department: profileProps.Department || null,
        jobTitle: profileProps.Title || null,
        office: profileProps.Office || profileProps.OfficeLocation || null,
        manager: profileProps.Manager || null,
        pictureUrl: profile ? profile.PictureUrl : null,
        isSiteAdmin: typeof core.IsSiteAdmin === 'boolean' ? core.IsSiteAdmin : null,
        raw: { core, profile, profileProps },
      };
    }

    async searchUsers(query, maxResults = 10) {
      const enc = encodeURIComponent(query);
      const data = await this._get(`/_api/search/query?querytext='${enc}'&rowlimit=${maxResults}&sourceid='b09a7990-05ea-4af9-81ef-edfab16c4e31'`);
      return data; // Caller can parse Search results schema
    }

    // ===== Lists / Items =====
    _buildQuery({ select, filter, top, orderby, expand } = {}) {
      const parts = [];
      if (select) parts.push(`$select=${encodeURIComponent(select)}`);
      if (filter) parts.push(`$filter=${encodeURIComponent(filter)}`);
      if (orderby) parts.push(`$orderby=${encodeURIComponent(orderby)}`);
      if (expand) parts.push(`$expand=${encodeURIComponent(expand)}`);
      if (top) parts.push(`$top=${encodeURIComponent(top)}`);
      return parts.length ? `?${parts.join('&')}` : '';
    }

    async getListItems(listTitle, query = {}) {
      const q = this._buildQuery(query);
      return this._get(`/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items${q}`);
    }

    async getListItemById(listTitle, id, select = '*') {
      return this._get(`/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})?$select=${encodeURIComponent(select)}`);
    }

    async createListItem(listTitle, payload, entityTypeFullName) {
      const body = {
        __metadata: { type: entityTypeFullName || `SP.Data.${listTitle.replace(/\s+/g, '_x0020_')}ListItem` },
        ...payload,
      };
      return this._post(`/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items`, body);
    }

    async updateListItem(listTitle, id, payload, etag = '*', entityTypeFullName) {
      const body = {
        __metadata: { type: entityTypeFullName || `SP.Data.${listTitle.replace(/\s+/g, '_x0020_')}ListItem` },
        ...payload,
      };
      return this._update(`/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})`, body, etag);
    }

    async deleteListItem(listTitle, id, etag = '*') {
      return this._delete(`/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items(${id})`, etag);
    }

    // ===== Files / Libraries =====
    async uploadFile(libraryServerRelativeUrl, file, overwrite = true) {
      // libraryServerRelativeUrl: e.g. "/sites/site/IdeaAttachments"
      const digest = await this.getRequestDigest();
      const uploadUrl = `${this._ensureAbsolute('/_api/web/GetFolderByServerRelativeUrl(\'' + libraryServerRelativeUrl + '\')/Files/add(url=\'' + encodeURIComponent(file.name) + '\', overwrite=' + overwrite + ')')}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: file,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`File upload failed: ${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json();
      return data.d;
    }

    async getFileByServerRelativeUrl(fileServerRelativeUrl) {
      return this._get(`/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileServerRelativeUrl)}')`);
    }
  }

  return SharePointClient;
});
