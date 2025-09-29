const sharePointClient = window.SharePointClient ?? null;
const sharePointEnabled = Boolean(sharePointClient?.isAvailable?.());

const toastEl = document.getElementById('toast');
const board = document.getElementById('admin-board');
const statusFilter = document.getElementById('admin-status-filter');
const searchFilter = document.getElementById('admin-search-filter');
const refreshButton = document.getElementById('refresh-board');
const template = document.getElementById('admin-card-template');

const metricTotal = document.getElementById('metric-total');
const metricUnderReview = document.getElementById('metric-under-review');
const metricFastTrack = document.getElementById('metric-fast-track');
const metricReleased = document.getElementById('metric-released');

const statusClass = {
  'under-review': 'under-review',
  'in-progress': 'in-progress',
  pilot: 'pilot',
  released: 'released',
  rejected: 'rejected'
};

const adminState = {
  ideas: [],
  filterStatus: 'all',
  searchTerm: ''
};

let toastTimeout;

if (!sharePointEnabled) {
  renderUnavailableState();
} else {
  bindEvents();
  loadIdeas();
}

function showToast(message, variant = 'info') {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = 'toast';
  if (variant === 'success') {
    toastEl.classList.add('toast--success');
  } else if (variant === 'error') {
    toastEl.classList.add('toast--error');
  }
  toastEl.classList.add('toast--visible');
  clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove('toast--visible');
  }, 4200);
}

function renderUnavailableState() {
  if (refreshButton) {
    refreshButton.disabled = true;
  }
  board.innerHTML = '';
  const card = document.createElement('article');
  card.className = 'idea-card';
  card.innerHTML =
    '<h3>SharePoint context unavailable</h3><p class="idea-summary">Open this console within SharePoint to manage submissions.</p>';
  board.appendChild(card);
  showToast('SharePoint context not detected. Admin console is read-only.', 'error');
}

async function loadIdeas(options = {}) {
  const { showFeedback = false } = options;
  setLoading(true);
  try {
    const ideas = await sharePointClient.fetchIdeas();
    adminState.ideas = ideas.map((idea) => ({
      ...idea,
      statusLabel: idea.statusLabel ?? sharePointClient.statusSlugToLabel?.[idea.status] ?? idea.status
    }));
    renderMetrics();
    renderBoard();
    if (showFeedback) {
      showToast('Latest SharePoint data loaded.', 'success');
    }
  } catch (error) {
    console.error('Unable to load SharePoint ideas', error);
    showToast('Failed to load ideas from SharePoint.', 'error');
    if (!adminState.ideas.length) {
      board.innerHTML = '';
      const card = document.createElement('article');
      card.className = 'idea-card';
      card.innerHTML =
        '<h3>Unable to fetch data</h3><p class="idea-summary">Refresh or check your permissions to continue.</p>';
      board.appendChild(card);
    }
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (refreshButton) {
    refreshButton.disabled = isLoading;
    refreshButton.textContent = isLoading ? 'Refreshing…' : 'Refresh';
  }
  if (isLoading && !adminState.ideas.length) {
    board.innerHTML = '';
    const card = document.createElement('article');
    card.className = 'idea-card';
    card.innerHTML =
      '<h3>Loading ideas…</h3><p class="idea-summary">Pulling the latest data from SharePoint.</p>';
    board.appendChild(card);
  }
}

function renderMetrics() {
  const total = adminState.ideas.length;
  const underReview = adminState.ideas.filter((idea) => idea.status === 'under-review').length;
  const fastTrack = adminState.ideas.filter((idea) => idea.fastTrack).length;
  const released = adminState.ideas.filter((idea) => idea.status === 'released').length;

  metricTotal.textContent = total;
  metricUnderReview.textContent = underReview;
  metricFastTrack.textContent = fastTrack;
  metricReleased.textContent = released;
}

function renderBoard() {
  const filtered = getFilteredIdeas();
  board.innerHTML = '';

  if (!filtered.length) {
    const card = document.createElement('article');
    card.className = 'idea-card';
    card.innerHTML =
      '<h3>No ideas match the current filters</h3><p class="idea-summary">Adjust status or search criteria to see more.</p>';
    board.appendChild(card);
    return;
  }

  filtered.forEach((idea) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('.idea-title').textContent = idea.title;
    fragment.querySelector('.idea-meta').textContent = `${idea.submitter} · ${idea.team}`;
    fragment.querySelector('.status-chip').textContent = idea.statusLabel;
    fragment.querySelector('.idea-summary').textContent = idea.summary;
    fragment.querySelector('.idea-impact').textContent = idea.impact;
    fragment.querySelector('.idea-horizon').textContent = idea.horizon;
    fragment.querySelector('.idea-investment').textContent = idea.investment;
    fragment.querySelector('.idea-updated').textContent = formatUpdatedStamp(idea);

    const tagContainer = fragment.querySelector('.idea-tags');
    idea.tags.forEach((tag) => tagContainer.appendChild(createTagElement(tag)));

    const noteField = fragment.querySelector('.note-input');
    noteField.value = idea.adminNote ?? '';

    const confidenceEl = fragment.querySelector('.admin-meta-item.confidence');
    confidenceEl.textContent = `Confidence: ${idea.confidence ?? '—'}%`;

    const fastTrackEl = fragment.querySelector('.admin-meta-item.fast-track');
    if (idea.fastTrack) {
      fastTrackEl.textContent = 'Fast-track flag enabled';
      fastTrackEl.classList.add('fast-track');
    } else {
      fastTrackEl.textContent = 'Standard review cadence';
      fastTrackEl.classList.remove('fast-track');
    }

    const supportLink = fragment.querySelector('.admin-link');
    if (idea.links) {
      supportLink.href = idea.links;
      supportLink.textContent = 'Supporting link';
      supportLink.classList.remove('is-disabled');
    } else {
      supportLink.href = '#';
      supportLink.textContent = 'No supporting link';
      supportLink.classList.add('is-disabled');
    }

    const card = fragment.querySelector('.idea-card');
    card.dataset.sharepointId = idea.sharePointId;
    card.classList.add(statusClass[idea.status] ?? 'under-review');

    board.appendChild(fragment);
  });
}

function getFilteredIdeas() {
  const statusValue = statusFilter?.value ?? 'all';
  const searchValue = searchFilter?.value?.trim().toLowerCase() ?? '';
  const filtered = adminState.ideas.filter((idea) => {
    const matchesStatus = statusValue === 'all' || idea.status === statusValue;
    const matchesSearch =
      !searchValue ||
      idea.title.toLowerCase().includes(searchValue) ||
      idea.summary.toLowerCase().includes(searchValue) ||
      idea.team.toLowerCase().includes(searchValue) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(searchValue));
    return matchesStatus && matchesSearch;
  });

  return filtered.sort((a, b) => {
    const aTime = a.updatedAtISO ? new Date(a.updatedAtISO).getTime() : 0;
    const bTime = b.updatedAtISO ? new Date(b.updatedAtISO).getTime() : 0;
    return bTime - aTime;
  });
}

function formatUpdatedStamp(idea) {
  if (idea.updatedAtISO) {
    return `Last updated ${relativeTimeFromNow(idea.updatedAtISO)}`;
  }
  return idea.updatedAt || 'Last updated just now';
}

function relativeTimeFromNow(isoDate) {
  if (!isoDate) return 'just now';
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return isoDate;
  }
  const diff = Date.now() - timestamp;
  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} min ago`;
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))} hr ago`;
  if (diff < day * 7) {
    const days = Math.max(1, Math.round(diff / day));
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function createTagElement(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
}

function bindEvents() {
  statusFilter?.addEventListener('change', () => {
    adminState.filterStatus = statusFilter.value;
    renderBoard();
  });

  searchFilter?.addEventListener('input', () => {
    adminState.searchTerm = searchFilter.value;
    window.requestAnimationFrame(renderBoard);
  });

  refreshButton?.addEventListener('click', () => {
    loadIdeas({ showFeedback: true });
  });

  board.addEventListener('click', handleBoardClick);
}

function handleBoardClick(event) {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  const card = event.target.closest('.idea-card');
  if (!card) return;

  const ideaId = Number(card.dataset.sharepointId);
  if (!ideaId) return;

  const idea = adminState.ideas.find((item) => item.sharePointId === ideaId);
  if (!idea) return;

  if (action === 'save-note') {
    const noteField = card.querySelector('.note-input');
    const note = noteField.value.trim();
    updateIdeaNote(card, idea, note);
    return;
  }

  const statusMap = {
    review: 'under-review',
    accept: 'in-progress',
    pilot: 'pilot',
    release: 'released',
    reject: 'rejected'
  };

  const newStatus = statusMap[action];
  if (!newStatus || idea.status === newStatus) {
    return;
  }

  updateIdeaStatus(card, idea, newStatus);
}

async function updateIdeaStatus(card, idea, status) {
  setCardBusy(card, true);
  try {
    await sharePointClient.updateIdea(idea.sharePointId, { status });
    idea.status = status;
    idea.statusLabel = sharePointClient.statusSlugToLabel?.[status] ?? status;
    idea.updatedAtISO = new Date().toISOString();
    renderMetrics();
    renderBoard();
    showToast(`Idea marked as ${idea.statusLabel}.`, 'success');
  } catch (error) {
    console.error('Status update failed', error);
    showToast('Unable to update status. Try again.', 'error');
  } finally {
    setCardBusy(card, false);
  }
}

async function updateIdeaNote(card, idea, note) {
  setCardBusy(card, true);
  try {
    await sharePointClient.updateIdea(idea.sharePointId, { adminNote: note });
    idea.adminNote = note;
    idea.updatedAtISO = new Date().toISOString();
    renderBoard();
    showToast('Note saved.', 'success');
  } catch (error) {
    console.error('Note update failed', error);
    showToast('Unable to save note. Try again.', 'error');
  } finally {
    setCardBusy(card, false);
  }
}

function setCardBusy(card, isBusy) {
  card.classList.toggle('is-updating', isBusy);
  card.querySelectorAll('button[data-action]').forEach((button) => {
    button.disabled = isBusy;
  });
}
