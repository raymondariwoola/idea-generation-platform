(function (global) {
  const hasContext = typeof _spPageContextInfo !== 'undefined';

  const statusSlugToLabel = {
    'under-review': 'Under review',
    'in-progress': 'In progress',
    pilot: 'Pilot',
    released: 'Released',
    rejected: 'Rejected'
  };

  const statusLabelToSlug = Object.entries(statusSlugToLabel).reduce((acc, [slug, label]) => {
    acc[label.toLowerCase()] = slug;
    return acc;
  }, {});

  const config = {
    enabled: hasContext,
    webUrl: hasContext ? _spPageContextInfo.webAbsoluteUrl.replace(/\/$/, '') : '',
    listTitle: 'Enterprise Innovation Ideas',
    currentUserId: hasContext ? _spPageContextInfo.userId : null,
    fieldMap: {
      submitter: 'SubmitterName',
      summary: 'Summary',
      team: 'Team',
      impact: 'ImpactFocus',
      horizon: 'DeliveryHorizon',
      investment: 'EffortLevel',
      tags: 'StrategicTags',
      links: 'SupportingLinks',
      confidence: 'ConfidenceIndex',
      fastTrack: 'FastTrack',
      status: 'Status',
      adminNote: 'AdminNotes'
    }
  };

  const digestCache = { value: null, expires: 0 };
  const listMeta = { itemType: null };

  function ensureEnabled() {
    if (!config.enabled) {
      throw new Error('SharePoint context is not available in this environment.');
    }
  }

  function escapeListTitle(title) {
    return title.replace(/'/g, "''");
  }

  function buildListUrl(path) {
    const base = config.webUrl;
    if (!base) return path;
    if (path.startsWith('http')) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  async function getDigest(force = false) {
    ensureEnabled();
    const now = Date.now();
    if (!force && digestCache.value && digestCache.expires > now + 30000) {
      return digestCache.value;
    }

    const response = await fetch(buildListUrl('/_api/contextinfo'), {
      method: 'POST',
      headers: { Accept: 'application/json;odata=verbose' }
    });

    if (!response.ok) {
      throw new Error(`Failed to acquire request digest: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const digest = payload?.d?.GetContextWebInformation?.FormDigestValue;
    const timeoutSeconds = payload?.d?.GetContextWebInformation?.FormDigestTimeoutSeconds ?? 1800;

    if (!digest) {
      throw new Error('SharePoint did not return a form digest.');
    }

    digestCache.value = digest;
    digestCache.expires = now + timeoutSeconds * 1000;
    return digest;
  }

  async function ensureListType() {
    ensureEnabled();
    if (listMeta.itemType) {
      return listMeta.itemType;
    }

    const response = await fetch(
      buildListUrl(
        `/_api/web/lists/GetByTitle('${escapeListTitle(config.listTitle)}')?$select=ListItemEntityTypeFullName`
      ),
      {
        headers: { Accept: 'application/json;odata=verbose' }
      }
    );

    if (!response.ok) {
      throw new Error(`Unable to resolve list metadata: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const entityType = payload?.d?.ListItemEntityTypeFullName;
    if (!entityType) {
      throw new Error('ListItemEntityTypeFullName missing from SharePoint response.');
    }

    listMeta.itemType = entityType;
    return entityType;
  }

  function mapSharePointItem(item) {
    const tagsRaw = item[config.fieldMap.tags] || '';
    const statusLabel = item[config.fieldMap.status] || statusSlugToLabel['under-review'];
    return {
      sharePointId: item.Id,
      id: item.Id,
      title: item.Title || 'Untitled concept',
      summary: item[config.fieldMap.summary] || '',
      submitter: item[config.fieldMap.submitter] || item.Author?.Title || 'Unknown contributor',
      team: item[config.fieldMap.team] || 'Unassigned team',
      impact: item[config.fieldMap.impact] || '—',
      horizon: item[config.fieldMap.horizon] || '—',
      investment: item[config.fieldMap.investment] || '—',
      tags: tagsRaw
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      links: item[config.fieldMap.links] || '',
      confidence: item[config.fieldMap.confidence] ?? null,
      fastTrack: Boolean(item[config.fieldMap.fastTrack]),
      status: statusLabelToSlug[statusLabel?.toLowerCase?.() ?? ''] || 'under-review',
      statusLabel,
      updatedAtISO: item.Modified,
      updatedAt: item.Modified,
      adminNote: item[config.fieldMap.adminNote] || ''
    };
  }

  function buildListEndpoint() {
    return buildListUrl(
      `/_api/web/lists/GetByTitle('${escapeListTitle(config.listTitle)}')/items`
    );
  }

  async function createIdea(domainIdea) {
    ensureEnabled();
    const digest = await getDigest();
    const itemType = await ensureListType();
    const endpoint = buildListEndpoint();

    const statusLabel = statusSlugToLabel[domainIdea.status] || statusSlugToLabel['under-review'];

    const payload = {
      __metadata: { type: itemType },
      Title: domainIdea.title,
      [config.fieldMap.submitter]: domainIdea.submitter,
      [config.fieldMap.summary]: domainIdea.summary,
      [config.fieldMap.team]: domainIdea.team,
      [config.fieldMap.impact]: domainIdea.impact,
      [config.fieldMap.horizon]: domainIdea.horizon,
      [config.fieldMap.investment]: domainIdea.investment,
      [config.fieldMap.tags]: domainIdea.tags.join(', '),
      [config.fieldMap.links]: domainIdea.links || null,
      [config.fieldMap.confidence]: parseInt(domainIdea.confidence, 10) || 0,
      [config.fieldMap.fastTrack]: Boolean(domainIdea.fastTrack),
      [config.fieldMap.status]: statusLabel
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SharePoint create failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const created = await response.json();
    return mapSharePointItem(created?.d ?? created);
  }

  async function fetchIdeas(options = {}) {
    ensureEnabled();
    const selectFields = [
      'Id',
      'Title',
      config.fieldMap.submitter,
      config.fieldMap.summary,
      config.fieldMap.team,
      config.fieldMap.impact,
      config.fieldMap.horizon,
      config.fieldMap.investment,
      config.fieldMap.tags,
      config.fieldMap.links,
      config.fieldMap.confidence,
      config.fieldMap.fastTrack,
      config.fieldMap.status,
      config.fieldMap.adminNote,
      'Modified'
    ];
    const expandParts = ['Author'];
    const queryParts = [
      `$select=${selectFields.join(',')},Author/Title`,
      `$expand=${expandParts.join(',')}`,
      '$orderby=Modified desc'
    ];

    if (options.mine && config.currentUserId) {
      queryParts.push(`$filter=AuthorId eq ${config.currentUserId}`);
    } else if (options.filter) {
      queryParts.push(`$filter=${options.filter}`);
    }

    if (options.top) {
      queryParts.push(`$top=${options.top}`);
    }

    const endpoint = `${buildListEndpoint()}?${queryParts.join('&')}`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json;odata=verbose' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SharePoint fetch failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const payload = await response.json();
    const results = payload?.d?.results ?? [];
    return results.map(mapSharePointItem);
  }

  async function updateIdea(id, updates = {}) {
    ensureEnabled();
    if (!id) {
      throw new Error('updateIdea requires a SharePoint item id.');
    }

    const digest = await getDigest();
    const itemType = await ensureListType();
    const endpoint = `${buildListEndpoint()}(${id})`;

    const bodyPayload = { __metadata: { type: itemType } };

    if (updates.status) {
      bodyPayload[config.fieldMap.status] = statusSlugToLabel[updates.status] || updates.status;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'adminNote')) {
      bodyPayload[config.fieldMap.adminNote] = updates.adminNote ?? null;
    }

    if (updates.confidence !== undefined) {
      bodyPayload[config.fieldMap.confidence] = parseInt(updates.confidence, 10) || 0;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'links')) {
      bodyPayload[config.fieldMap.links] = updates.links ?? null;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*',
        'X-RequestDigest': digest
      },
      body: JSON.stringify(bodyPayload)
    });

    if (response.status === 204 || response.ok) {
      return true;
    }

    const errorText = await response.text();
    throw new Error(`SharePoint update failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  global.SharePointClient = {
    config,
    statusSlugToLabel,
    statusLabelToSlug,
    createIdea,
    fetchIdeas,
    updateIdea,
    isAvailable: () => config.enabled
  };
})(window);
