const sharePointClient = window.SharePointClient ?? null;
const sharePointEnabled = Boolean(sharePointClient?.isAvailable?.());

const viewButtons = document.querySelectorAll('[data-target]');
const views = document.querySelectorAll('.view');
const tabs = document.querySelectorAll('.tab-button');
const ideaForm = document.getElementById('idea-form');
const ideaBoard = document.getElementById('idea-board');
const statusFilter = document.getElementById('status-filter');
const searchFilter = document.getElementById('search-filter');
const confidenceInput = document.getElementById('confidence');
const confidenceValue = document.getElementById('confidence-value');
const toastEl = document.getElementById('toast');
const submitButton = ideaForm.querySelector('button[type="submit"]');
const fastTrackInput = document.getElementById('fast-track');

const previewMap = {
  title: document.getElementById('preview-title'),
  summary: document.getElementById('preview-summary'),
  impact: document.getElementById('preview-impact'),
  horizon: document.getElementById('preview-horizon'),
  investment: document.getElementById('preview-investment'),
  tags: document.getElementById('preview-tags')
};

const STORAGE_KEY = 'idea-fusion-ideas::v2';
const fallbackIdeas = [
  {
    id: crypto.randomUUID(),
    title: 'Ambient intelligence for hybrid campuses',
    summary:
      'Deploy adaptive sensors and predictive energy routing to reduce facilities cost by 18% while improving on-site experience.',
    submitter: 'Maya Rodriguez',
    team: 'Workplace Evolution Lab',
    impact: 'Operational efficiency',
    horizon: '3 - 6 months',
    investment: 'Moderate',
    tags: ['IoT', 'Sustainability', 'Hybrid'],
    links: '',
    status: 'in-progress',
    updatedAtISO: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: 'Last touch · 2 days ago',
    confidence: 74,
    fastTrack: false
  },
  {
    id: crypto.randomUUID(),
    title: 'Generative QA assistant for policy wikis',
    summary:
      'Fine-tune an internal large language model on policy archives to accelerate onboarding and reduce compliance tickets.',
    submitter: 'Aiden Clark',
    team: 'Risk & Controls',
    impact: 'Risk reduction / resilience',
    horizon: '0 - 3 months',
    investment: 'Light lift',
    tags: ['AI', 'Knowledge'],
    links: '',
    status: 'under-review',
    updatedAtISO: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: 'Last touch · 4 hours ago',
    confidence: 65,
    fastTrack: false
  },
  {
    id: crypto.randomUUID(),
    title: 'Personalized benefit concierge',
    summary:
      'Unified benefit concierge that anticipates life moments and recommends programs, boosting retention by 6%.',
    submitter: 'Noah Patel',
    team: 'Employee Experience Studio',
    impact: 'Customer experience',
    horizon: '6+ months',
    investment: 'Significant',
    tags: ['Experience', 'Engagement'],
    links: '',
    status: 'pilot',
    updatedAtISO: new Date(Date.now() - 518400000).toISOString(),
    updatedAt: 'Last touch · 6 days ago',
    confidence: 58,
    fastTrack: false
  }
];

const statusCopy = {
  'under-review': 'Under review',
  'in-progress': 'In progress',
  pilot: 'Pilot',
  released: 'Released',
  rejected: 'Rejected'
};

const statusClass = {
  'under-review': 'under-review',
  'in-progress': 'in-progress',
  pilot: 'pilot',
  released: 'released',
  rejected: 'rejected'
};

const state = {
  ideas: loadIdeasFromStorage()
};

let toastTimeout;

if (!state.ideas.length) {
  state.ideas = fallbackIdeas;
}

renderIdeas();
initPreview();
bindEvents();
bootstrapIdeas();

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

function loadIdeasFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to read stored ideas:', error);
  }
  return [];
}

function persistIdeas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ideas));
  } catch (error) {
    console.warn('Unable to persist ideas:', error);
  }
}

function mergeIdeas(remote, current) {
  const merged = new Map();
  [...remote, ...current].forEach((idea) => {
    const key = idea.sharePointId ?? idea.id;
    if (!merged.has(key)) {
      merged.set(key, idea);
    }
  });
  return Array.from(merged.values());
}

function switchView(viewName) {
  views.forEach((view) => {
    view.classList.toggle('is-active', view.dataset.view === viewName);
  });
  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.target === viewName);
  });
  const targetOffset = viewName === 'submit' ? ideaForm.getBoundingClientRect().top + window.scrollY - 120 : 0;
  window.scrollTo({ top: Math.max(targetOffset, 0), behavior: 'smooth' });
}

function normalizeStatus(status) {
  return statusCopy[status] ?? status;
}

function createTagElement(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
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

function formatUpdatedStamp(idea) {
  if (idea.updatedAtISO) {
    return `Last updated ${relativeTimeFromNow(idea.updatedAtISO)}`;
  }
  return idea.updatedAt || 'Last updated just now';
}

function renderIdeas() {
  ideaBoard.innerHTML = '';
  const filtered = getFilteredIdeas();
  if (!filtered.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'idea-card';
    emptyState.innerHTML =
      '<h3>No ideas found</h3><p class="idea-summary">Adjust your filters or submit a new idea to populate this space.</p>';
    ideaBoard.appendChild(emptyState);
    return;
  }

  const template = document.getElementById('idea-card-template');
  filtered.forEach((idea) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('.idea-title').textContent = idea.title;
    fragment.querySelector('.idea-meta').textContent = `${idea.submitter} · ${idea.team}`;
    const statusChip = fragment.querySelector('.status-chip');
    statusChip.textContent = idea.statusLabel ?? normalizeStatus(idea.status);
    fragment.querySelector('.idea-summary').textContent = idea.summary;
    fragment.querySelector('.idea-impact').textContent = idea.impact;
    fragment.querySelector('.idea-horizon').textContent = idea.horizon;
    fragment.querySelector('.idea-investment').textContent = idea.investment;
    fragment.querySelector('.idea-updated').textContent = formatUpdatedStamp(idea);

    const tagContainer = fragment.querySelector('.idea-tags');
    idea.tags.forEach((tag) => tagContainer.appendChild(createTagElement(tag)));

    const linkEl = fragment.querySelector('.ghost-link');
    if (linkEl) {
      if (idea.links) {
        linkEl.textContent = 'Open supporting link';
        linkEl.href = idea.links;
        linkEl.target = '_blank';
        linkEl.rel = 'noreferrer noopener';
      } else {
        linkEl.textContent = 'View collaboration thread';
        linkEl.href = '#';
        linkEl.removeAttribute('target');
        linkEl.rel = '';
      }
    }

    const card = fragment.querySelector('.idea-card');
    card.dataset.status = idea.status;
    if (idea.sharePointId) {
      card.dataset.sharepointId = idea.sharePointId;
    }
    card.classList.add(statusClass[idea.status] ?? 'under-review');
    ideaBoard.appendChild(fragment);
  });
}

function getFilteredIdeas() {
  const statusValue = statusFilter?.value ?? 'all';
  const searchValue = searchFilter?.value?.trim().toLowerCase() ?? '';
  const filtered = state.ideas.filter((idea) => {
    const matchesStatus = statusValue === 'all' || idea.status === statusValue;
    const matchesSearch =
      !searchValue ||
      idea.title.toLowerCase().includes(searchValue) ||
      idea.summary.toLowerCase().includes(searchValue) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(searchValue));
    return matchesStatus && matchesSearch;
  });

  return filtered.sort((a, b) => {
    const aTime = a.updatedAtISO ? new Date(a.updatedAtISO).getTime() : 0;
    const bTime = b.updatedAtISO ? new Date(b.updatedAtISO).getTime() : 0;
    return bTime - aTime;
  });
}

function hydratePreview(formData) {
  previewMap.title.textContent = formData.get('title')?.trim() || 'Idea title in progress';
  previewMap.summary.textContent =
    formData.get('summary')?.trim() || 'Your narrative will appear here as you build it out.';
  previewMap.impact.textContent = formatSelectCopy(formData.get('impact'));
  previewMap.horizon.textContent = formatSelectCopy(formData.get('horizon'));
  previewMap.investment.textContent = formatSelectCopy(formData.get('investment'));

  previewMap.tags.innerHTML = '';
  const tags = formData
    .get('tags')
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tags?.length) {
    tags.forEach((tag) => previewMap.tags.appendChild(createTagElement(tag)));
  }
}

function formatSelectCopy(value) {
  if (!value) return '—';
  switch (value) {
    case 'efficiency':
      return 'Operational efficiency';
    case 'revenue':
      return 'New revenue';
    case 'experience':
      return 'Customer experience';
    case 'resilience':
      return 'Risk reduction / resilience';
    case 'now':
      return '0 - 3 months';
    case 'mid':
      return '3 - 6 months';
    case 'future':
      return '6+ months';
    case 'light':
      return 'Light lift';
    case 'moderate':
      return 'Moderate';
    case 'significant':
      return 'Significant';
    default:
      return value;
  }
}

async function captureForm(event) {
  event.preventDefault();
  const data = new FormData(ideaForm);
  const tags =
    data
      .get('tags')
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];
  const confidence = data.get('confidence') || '60';
  const fastTrack = data.get('fastTrack');
  const links = data.get('links')?.trim() ?? '';

  const idea = {
    id: crypto.randomUUID(),
    title: data.get('title')?.trim() || 'Untitled concept',
    summary: data.get('summary')?.trim() || '',
    submitter: data.get('submitter')?.trim() || 'Unknown contributor',
    team: data.get('team')?.trim() || 'Unknown team',
    impact: formatSelectCopy(data.get('impact')),
    horizon: formatSelectCopy(data.get('horizon')),
    investment: formatSelectCopy(data.get('investment')),
    tags,
    links,
    confidence,
    fastTrack: Boolean(fastTrack),
    status: fastTrack ? 'in-progress' : 'under-review',
    updatedAtISO: new Date().toISOString(),
    updatedAt: fastTrack
      ? `Fast-track engaged · Confidence ${confidence}%`
      : `Just now · Confidence ${confidence}%`
  };

  setSubmitting(true);
  let created;
  if (sharePointEnabled) {
    try {
      created = await sharePointClient.createIdea(idea);
      idea.sharePointId = created.sharePointId;
      idea.status = created.status;
      idea.statusLabel = created.statusLabel;
      idea.updatedAtISO = created.updatedAtISO ?? idea.updatedAtISO;
      idea.updatedAt = formatUpdatedStamp(idea);
      idea.links = created.links ?? idea.links;
      showToast('Idea delivered to SharePoint.', 'success');
    } catch (error) {
      console.error('SharePoint submission failed', error);
      showToast('Unable to reach SharePoint right now. Idea saved locally.', 'error');
    }
  } else {
    showToast('Idea captured locally. SharePoint integration inactive.', 'success');
  }

  state.ideas = [idea, ...state.ideas];
  persistIdeas();
  renderIdeas();
  ideaForm.reset();
  confidenceInput.value = 60;
  confidenceValue.textContent = '60%';
  hydratePreview(new FormData(ideaForm));
  setSubmitting(false);
  switchView('track');
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Submitting…' : 'Submit idea';
}

async function bootstrapIdeas() {
  if (!sharePointEnabled) {
    return;
  }
  try {
    const remoteIdeas = await sharePointClient.fetchIdeas({ mine: true });
    if (remoteIdeas.length) {
      state.ideas = mergeIdeas(remoteIdeas, state.ideas).map((idea) => ({
        ...idea,
        statusLabel: idea.statusLabel ?? normalizeStatus(idea.status)
      }));
      persistIdeas();
      renderIdeas();
    }
  } catch (error) {
    console.warn('Unable to load SharePoint items', error);
    showToast('Could not sync with SharePoint. Showing local cache.', 'error');
  }
}

function initPreview() {
  hydratePreview(new FormData(ideaForm));
}

function bindEvents() {
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (!target) return;
      switchView(target);
    });
  });

  ideaForm.addEventListener('submit', captureForm);

  ideaForm.addEventListener('input', () => {
    hydratePreview(new FormData(ideaForm));
  });

  confidenceInput.addEventListener('input', () => {
    confidenceValue.textContent = `${confidenceInput.value}%`;
  });

  statusFilter?.addEventListener('change', renderIdeas);
  searchFilter?.addEventListener('input', () => {
    window.requestAnimationFrame(renderIdeas);
  });
}
