const viewButtons = document.querySelectorAll('[data-target]');
const views = document.querySelectorAll('.view');
const tabs = document.querySelectorAll('.tab-button');
const ideaForm = document.getElementById('idea-form');
const ideaBoard = document.getElementById('idea-board');
const statusFilter = document.getElementById('status-filter');
const searchFilter = document.getElementById('search-filter');
const confidenceInput = document.getElementById('confidence');
const confidenceValue = document.getElementById('confidence-value');
const previewMap = {
  title: document.getElementById('preview-title'),
  summary: document.getElementById('preview-summary'),
  impact: document.getElementById('preview-impact'),
  horizon: document.getElementById('preview-horizon'),
  investment: document.getElementById('preview-investment'),
  tags: document.getElementById('preview-tags')
};

const STORAGE_KEY = 'idea-fusion-ideas';
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
    status: 'in-progress',
    updatedAt: 'Last touch · 2 days ago'
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
    status: 'under-review',
    updatedAt: 'Last touch · 4 hours ago'
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
    status: 'pilot',
    updatedAt: 'Last touch · 6 days ago'
  }
];

const statusCopy = {
  'under-review': 'Under review',
  'in-progress': 'In progress',
  pilot: 'Pilot',
  released: 'Released'
};

const statusClass = {
  'under-review': 'under-review',
  'in-progress': 'in-progress',
  pilot: 'pilot',
  released: 'released'
};

const state = {
  ideas: []
};

try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      state.ideas = parsed;
    }
  }
} catch (error) {
  console.warn('Unable to read stored ideas:', error);
}

if (!state.ideas.length) {
  state.ideas = fallbackIdeas;
}

function persistIdeas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ideas));
  } catch (error) {
    console.warn('Unable to persist ideas:', error);
  }
}

function switchView(viewName) {
  views.forEach((view) => {
    view.classList.toggle('is-active', view.dataset.view === viewName);
  });
  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.target === viewName);
  });
  const topOffset = viewName === 'submit' ? ideaForm.offsetTop - 120 : 0;
  window.scrollTo({ top: Math.max(topOffset, 0), behavior: 'smooth' });
}

function normalizeStatus(status) {
  return statusCopy[status] ?? status;
}

function createTagElement(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
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
    fragment.querySelector('.status-chip').textContent = normalizeStatus(idea.status);
    fragment.querySelector('.idea-summary').textContent = idea.summary;
    fragment.querySelector('.idea-impact').textContent = idea.impact;
    fragment.querySelector('.idea-horizon').textContent = idea.horizon;
    fragment.querySelector('.idea-investment').textContent = idea.investment;
    fragment.querySelector('.idea-updated').textContent = idea.updatedAt;

    const tagContainer = fragment.querySelector('.idea-tags');
    idea.tags.forEach((tag) => tagContainer.appendChild(createTagElement(tag)));

    const card = fragment.querySelector('.idea-card');
    card.dataset.status = idea.status;
    card.classList.add(statusClass[idea.status] ?? 'under-review');
    ideaBoard.appendChild(fragment);
  });
}

function getFilteredIdeas() {
  const statusValue = statusFilter.value;
  const searchValue = searchFilter.value.trim().toLowerCase();
  return state.ideas.filter((idea) => {
    const matchesStatus = statusValue === 'all' || idea.status === statusValue;
    const matchesSearch =
      !searchValue ||
      idea.title.toLowerCase().includes(searchValue) ||
      idea.summary.toLowerCase().includes(searchValue) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(searchValue));
    return matchesStatus && matchesSearch;
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

function captureForm(event) {
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
    status: fastTrack ? 'in-progress' : 'under-review',
    updatedAt: fastTrack
      ? `Fast-track engaged · Confidence ${confidence}%`
      : `Just now · Confidence ${confidence}%`
  };

  state.ideas = [idea, ...state.ideas];
  persistIdeas();
  renderIdeas();
  ideaForm.reset();
  confidenceInput.value = 60;
  confidenceValue.textContent = '60%';
  hydratePreview(new FormData(ideaForm));
  switchView('track');
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

  statusFilter.addEventListener('change', renderIdeas);
  searchFilter.addEventListener('input', () => {
    window.requestAnimationFrame(renderIdeas);
  });
}

renderIdeas();
initPreview();
bindEvents();
