// Enhanced Innovation Portal V5 - Best of V3 & V4
// Combines V3's lightweight architecture with V4's comprehensive features

class InnovationPortal {
    constructor() {
        this.currentView = 'home';
        this.ideas = [];
        this.currentUser = {
            name: 'John Doe',
            department: 'Engineering',
            email: 'john.doe@company.com',
            id: 'user123'
        };
        this.drafts = this.loadDrafts();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.setupSubmitForm();
        this.setupTrackingView();
        this.setupModals();
        this.loadSampleData();
        this.renderAll();
        this.animateKPIs();
        console.log('🚀 Innovation Portal V5 initialized');
    }

    // ===== NAVIGATION SYSTEM =====
    setupNavigation() {
        // Enhanced navigation combining V3's hash routing with V4's functionality
        const navButtons = document.querySelectorAll('.nav-btn');
        const ctaButton = document.querySelector('.btn-cta');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.getAttribute('data-view');
                this.switchView(targetView);
            });
        });

        // CTA button actions
        ctaButton?.addEventListener('click', () => this.switchView('submit'));
        
        // Hero action buttons
        document.querySelectorAll('[data-action="submit-idea"]').forEach(btn => {
            btn.addEventListener('click', () => this.switchView('submit'));
        });

        // Brand logo navigation
        document.querySelector('.nav-brand')?.addEventListener('click', () => {
            this.switchView('home');
        });
    }

    switchView(viewName) {
        // Enhanced view switching with smooth transitions
        const views = document.querySelectorAll('.view');
        const navButtons = document.querySelectorAll('.nav-btn');

        views.forEach(view => view.classList.remove('active'));
        navButtons.forEach(btn => btn.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}-view`);
        const targetNav = document.querySelector(`[data-view="${viewName}"]`);

        if (targetView && targetNav) {
            targetView.classList.add('active');
            targetNav.classList.add('active');
            this.currentView = viewName;

            // View-specific actions
            if (viewName === 'home') {
                this.renderIdeasGrid();
                this.updateKPIs();
            } else if (viewName === 'track') {
                this.renderTrackingView();
            }

            // Update URL hash for better UX
            window.location.hash = viewName;
        }
    }

    // ===== ENHANCED SEARCH SYSTEM (V3 + V4) =====
    setupSearch() {
        const globalSearch = document.getElementById('global-search');
        const searchButton = document.getElementById('do-search');
        const categoryPills = document.querySelectorAll('.pill');

        // Global search functionality
        if (globalSearch) {
            globalSearch.addEventListener('input', debounce(() => {
                this.performSearch();
            }, 300));

            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }

        // Category pills
        categoryPills.forEach(pill => {
            pill.addEventListener('click', () => {
                categoryPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.performSearch();
            });
        });
    }

    performSearch() {
        const query = document.getElementById('global-search')?.value.toLowerCase() || '';
        const activeCategory = document.querySelector('.pill.active')?.dataset.chip || 'all';
        
        let filteredIdeas = this.ideas.filter(idea => {
            const matchesSearch = !query || 
                idea.title.toLowerCase().includes(query) ||
                idea.problem.toLowerCase().includes(query) ||
                idea.solution.toLowerCase().includes(query) ||
                (idea.tags || []).some(tag => tag.toLowerCase().includes(query));

            const matchesCategory = activeCategory === 'all' || idea.category === activeCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderIdeasGrid(filteredIdeas);
    }

    // ===== ADVANCED FILTERS (V3) =====
    setupFilters() {
        const filterStatus = document.getElementById('filter-status');
        const filterCategory = document.getElementById('filter-category');
        const filterDepartment = document.getElementById('filter-department');
        const clearFilters = document.getElementById('clear-filters');

        [filterStatus, filterCategory, filterDepartment].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        if (filterDepartment) {
            filterDepartment.addEventListener('input', debounce(() => {
                this.applyFilters();
            }, 300));
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                if (filterStatus) filterStatus.value = '';
                if (filterCategory) filterCategory.value = '';
                if (filterDepartment) filterDepartment.value = '';
                document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                document.querySelector('.pill[data-chip="all"]')?.classList.add('active');
                document.getElementById('global-search').value = '';
                this.renderIdeasGrid();
            });
        }
    }

    applyFilters() {
        const status = document.getElementById('filter-status')?.value || '';
        const category = document.getElementById('filter-category')?.value || '';
        const department = document.getElementById('filter-department')?.value.toLowerCase() || '';

        let filteredIdeas = this.ideas.filter(idea => {
            const matchesStatus = !status || idea.status === status;
            const matchesCategory = !category || idea.category === category;
            const matchesDepartment = !department || 
                (idea.dept || '').toLowerCase().includes(department);

            return matchesStatus && matchesCategory && matchesDepartment;
        });

        this.renderIdeasGrid(filteredIdeas);
    }

    // ===== ENHANCED SUBMIT FORM (V3 + V4) =====
    setupSubmitForm() {
        const form = document.getElementById('idea-form');
        const saveDraftBtn = document.getElementById('save-draft');
        const fileUpload = document.getElementById('attachments');
        const fileUploadArea = document.getElementById('file-upload-area');

        if (!form) return;

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIdea();
        });

        // Save draft functionality
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // File upload handling
        if (fileUploadArea && fileUpload) {
            this.setupFileUpload(fileUploadArea, fileUpload);
        }

        // Form progress tracking
        this.setupFormProgress();

        // Cancel button
        document.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
            this.switchView('home');
        });
    }

    setupFileUpload(area, input) {
        area.addEventListener('click', () => input.click());
        
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.style.borderColor = 'var(--brand-primary)';
            area.style.background = 'rgba(106, 227, 255, 0.05)';
        });

        area.addEventListener('dragleave', () => {
            area.style.borderColor = 'var(--glass-border)';
            area.style.background = 'var(--bg-elevated)';
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.borderColor = 'var(--glass-border)';
            area.style.background = 'var(--bg-elevated)';
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
    }

    setupFormProgress() {
        const form = document.getElementById('idea-form');
        if (!form) return;

        const sections = {
            'basic-progress': ['idea-title', 'category'],
            'solution-progress': ['problem', 'solution'],
            'impact-progress': ['impact', 'effort'],
            'submitter-progress': ['owner', 'email']
        };

        const updateProgress = () => {
            let totalProgress = 0;
            let sectionCount = 0;

            Object.entries(sections).forEach(([progressId, fieldIds]) => {
                const sectionProgress = this.updateSectionProgress(progressId, fieldIds);
                totalProgress += sectionProgress;
                sectionCount++;
            });

            const overallProgress = totalProgress / sectionCount;
            this.updateOverallProgress(overallProgress);
        };

        // Add listeners to all form fields
        const allFields = Object.values(sections).flat();
        allFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', updateProgress);
                field.addEventListener('change', updateProgress);
            }
        });

        updateProgress();
    }

    updateSectionProgress(progressId, fieldIds) {
        const progressBar = document.getElementById(progressId);
        if (!progressBar) return 0;

        const filledFields = fieldIds.filter(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        const percentage = (filledFields.length / fieldIds.length) * 100;
        progressBar.style.width = `${percentage}%`;
        return percentage;
    }

    updateOverallProgress(percentage) {
        const progressText = document.querySelector('.progress-text');
        const progressRing = document.querySelector('.progress-ring::before');
        
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}%`;
        }

        // Update circular progress
        if (progressRing) {
            const rotation = (percentage / 100) * 360;
            progressRing.style.transform = `rotate(${rotation}deg)`;
        }
    }

    handleFiles(files) {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showNotification('File size too large. Maximum 10MB allowed.', 'error');
                return;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button type="button" class="file-remove" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    submitIdea() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        this.showLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            const idea = {
                id: this.generateId(),
                ...formData,
                status: 'Submitted',
                updated: Date.now(),
                progress: Math.floor(Math.random() * 20) + 10,
                owner: formData.anonymous ? 'Anonymous' : (formData.owner || 'Anonymous'),
                self: true,
                votes: 0,
                comments: []
            };

            this.ideas.unshift(idea);
            this.saveIdeas();
            this.clearForm();
            this.showLoading(false);
            this.showNotification('Idea submitted successfully! 🎉', 'success');
            
            setTimeout(() => {
                this.switchView('track');
            }, 1500);
        }, 2000);
    }

    saveDraft() {
        const formData = this.getFormData();
        const draftId = this.generateId();
        
        const draft = {
            id: draftId,
            ...formData,
            savedAt: Date.now()
        };

        this.drafts.push(draft);
        this.saveDrafts();
        this.showNotification('Draft saved successfully! 💾', 'success');
    }

    getFormData() {
        const form = document.getElementById('idea-form');
        if (!form) return {};

        return {
            title: document.getElementById('idea-title')?.value || '',
            category: document.getElementById('category')?.value || '',
            dept: document.getElementById('department')?.value || '',
            tags: (document.getElementById('tags')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
            problem: document.getElementById('problem')?.value || '',
            solution: document.getElementById('solution')?.value || '',
            impact: document.getElementById('impact')?.value || '',
            effort: document.getElementById('effort')?.value || '',
            resources: document.getElementById('resources')?.value || '',
            owner: document.getElementById('owner')?.value || '',
            email: document.getElementById('email')?.value || '',
            anonymous: document.getElementById('anonymous')?.checked || false
        };
    }

    validateForm(data) {
        const required = ['title', 'category', 'problem', 'solution', 'impact', 'effort'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');

        if (missing.length > 0) {
            this.showNotification(`Please fill in required fields: ${missing.join(', ')}`, 'error');
            return false;
        }

        return true;
    }

    clearForm() {
        const form = document.getElementById('idea-form');
        if (form) {
            form.reset();
            
            const fileList = document.getElementById('file-list');
            if (fileList) fileList.innerHTML = '';

            // Reset progress bars
            document.querySelectorAll('.progress-fill').forEach(bar => {
                bar.style.width = '0%';
            });

            this.updateOverallProgress(0);
        }
    }

    // ===== TRACKING VIEW (V3 TABLE + V4 CARDS) =====
    setupTrackingView() {
        // View mode toggle
        const viewModes = document.querySelectorAll('.view-mode');
        viewModes.forEach(btn => {
            btn.addEventListener('click', () => {
                viewModes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.getAttribute('data-mode');
                this.toggleTrackingView(mode);
            });
        });
    }

    toggleTrackingView(mode) {
        const tableView = document.getElementById('table-view');
        const cardsView = document.getElementById('cards-view');

        if (mode === 'table') {
            tableView?.classList.add('active');
            cardsView?.classList.remove('active');
        } else {
            tableView?.classList.remove('active');
            cardsView?.classList.add('active');
        }

        this.renderTrackingView();
    }

    renderTrackingView() {
        const myIdeas = this.ideas.filter(idea => idea.self);
        this.updateMyStats(myIdeas);
        this.renderMyIdeasTable(myIdeas);
        this.renderMyIdeasCards(myIdeas);
    }

    updateMyStats(myIdeas) {
        const total = myIdeas.length;
        const pending = myIdeas.filter(i => ['Submitted', 'In review'].includes(i.status)).length;
        const accepted = myIdeas.filter(i => i.status === 'Accepted').length;
        const score = myIdeas.reduce((sum, idea) => {
            const points = {
                'Accepted': 100,
                'In review': 50,
                'Submitted': 25
            };
            return sum + (points[idea.status] || 0);
        }, 0);

        this.updateElement('my-total', total);
        this.updateElement('my-pending', pending);
        this.updateElement('my-accepted', accepted);
        this.updateElement('my-score', score);
    }

    renderMyIdeasTable(ideas) {
        const tbody = document.getElementById('my-ideas-table');
        if (!tbody) return;

        if (ideas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No submissions yet. <a href="#" onclick="app.switchView('submit')" style="color: var(--brand-primary);">Submit your first idea!</a>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ideas.map(idea => this.createTableRow(idea)).join('');
    }

    createTableRow(idea) {
        const date = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);

        return `
            <tr onclick="app.showIdeaDetails('${idea.id}')" style="cursor: pointer;">
                <td><strong>${idea.title}</strong></td>
                <td>${idea.category}</td>
                <td><span class="idea-status ${statusClass}">${idea.status}</span></td>
                <td>${date}</td>
                <td>
                    <div class="idea-progress-bar">
                        <div class="idea-progress-fill" style="width: ${idea.progress}%"></div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-ghost" onclick="event.stopPropagation(); app.advanceIdea('${idea.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        Advance
                    </button>
                </td>
            </tr>
        `;
    }

    renderMyIdeasCards(ideas) {
        const container = document.getElementById('my-ideas-cards');
        if (!container) return;

        if (ideas.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
                    <i class="fas fa-lightbulb" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No ideas submitted yet</h3>
                    <p>Start by <a href="#" onclick="app.switchView('submit')" style="color: var(--brand-primary);">submitting your first innovative idea!</a></p>
                </div>
            `;
            return;
        }

        container.innerHTML = ideas.map(idea => this.createIdeaCard(idea, true)).join('');
    }

    // ===== IDEAS GRID RENDERING (ENHANCED V3 + V4) =====
    renderIdeasGrid(filteredIdeas = null) {
        const container = document.getElementById('ideas-grid');
        if (!container) return;

        const ideasToShow = filteredIdeas || this.ideas;

        if (ideasToShow.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No ideas found</h3>
                    <p>Try adjusting your search criteria or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ideasToShow.map(idea => this.createIdeaCard(idea)).join('');
    }

    createIdeaCard(idea, isMyIdea = false) {
        const date = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const tags = (idea.tags || []).slice(0, 3).map(tag => 
            `<span class="idea-tag">#${tag}</span>`
        ).join(' ');

        return `
            <div class="idea-card" onclick="app.showIdeaDetails('${idea.id}')" data-category="${idea.category}" data-status="${idea.status}">
                <div class="idea-header">
                    <div>
                        <h3 class="idea-title">${idea.title}</h3>
                        <div class="idea-meta">
                            <span class="idea-tag">${idea.category}</span>
                            ${idea.dept ? `<span class="idea-tag">${idea.dept}</span>` : ''}
                            ${tags}
                        </div>
                    </div>
                    <span class="idea-status ${statusClass}">${idea.status}</span>
                </div>
                <p class="idea-description">${idea.problem}</p>
                <div class="idea-footer">
                    <div class="idea-date">
                        <div class="idea-progress-label">Updated</div>
                        <div>${date}</div>
                    </div>
                    <div class="idea-progress">
                        <div class="idea-progress-label">Progress</div>
                        <div class="idea-progress-bar">
                            <div class="idea-progress-fill" style="width: ${idea.progress}%"></div>
                        </div>
                    </div>
                </div>
                ${isMyIdea ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                        <button class="btn btn-ghost" onclick="event.stopPropagation(); app.advanceIdea('${idea.id}')" style="width: 100%; font-size: 0.85rem;">
                            Advance Status
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStatusClass(status) {
        const statusMap = {
            'Submitted': 'status-submitted',
            'In review': 'status-in-review',
            'Accepted': 'status-accepted',
            'Rejected': 'status-rejected'
        };
        return statusMap[status] || 'status-submitted';
    }

    // ===== KPI DASHBOARD (ENHANCED V3) =====
    updateKPIs() {
        const total = this.ideas.length;
        const accepted = this.ideas.filter(i => i.status === 'Accepted').length;
        const inReview = this.ideas.filter(i => i.status === 'In review').length;
        const participants = new Set(this.ideas.map(i => i.owner)).size;

        this.animateCounter('kpi-total', total);
        this.animateCounter('kpi-accepted', accepted);
        this.animateCounter('kpi-inreview', inReview);
        this.animateCounter('kpi-participants', participants);

        // Update quarter progress
        const goal = 150;
        const progress = Math.min(100, (total / goal) * 100);
        this.updateElement('quarter-progress', progress, el => {
            el.style.width = `${progress}%`;
        });

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    animateKPIs() {
        // Intersection Observer for KPI animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateKPIs();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const kpiDashboard = document.querySelector('.kpi-dashboard');
        if (kpiDashboard) {
            observer.observe(kpiDashboard);
        }
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const start = 0;
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = start;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    }

    // ===== MODAL SYSTEM (V4) =====
    setupModals() {
        const modal = document.getElementById('idea-modal');
        const closeBtn = document.getElementById('modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    showIdeaDetails(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const modal = document.getElementById('idea-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = idea.title;
        modalBody.innerHTML = this.createIdeaDetailsContent(idea);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    createIdeaDetailsContent(idea) {
        const date = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const tags = (idea.tags || []).map(tag => `<span class="idea-tag">#${tag}</span>`).join(' ');

        return `
            <div class="idea-details">
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
                        <span style="color: var(--text-muted);"><i class="fas fa-user"></i> ${idea.owner}</span>
                        ${idea.dept ? `<span style="color: var(--text-muted);"><i class="fas fa-building"></i> ${idea.dept}</span>` : ''}
                        <span style="color: var(--text-muted);"><i class="fas fa-clock"></i> ${date}</span>
                        <span class="idea-status ${statusClass}">${idea.status}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Category:</strong> ${idea.category}
                        ${tags ? `<div style="margin-top: 0.5rem;">${tags}</div>` : ''}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--brand-primary); margin-bottom: 0.75rem;">Problem Statement</h4>
                    <p style="color: var(--text-secondary); line-height: 1.6;">${idea.problem}</p>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--brand-primary); margin-bottom: 0.75rem;">Proposed Solution</h4>
                    <p style="color: var(--text-secondary); line-height: 1.6;">${idea.solution}</p>
                </div>

                ${idea.impact ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--brand-primary); margin-bottom: 0.75rem;">Expected Impact</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">${idea.impact}</p>
                    </div>
                ` : ''}

                ${idea.effort ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--brand-primary); margin-bottom: 0.75rem;">Estimated Effort</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">${idea.effort}</p>
                    </div>
                ` : ''}

                ${idea.resources ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--brand-primary); margin-bottom: 0.75rem;">Required Resources</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6;">${idea.resources}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--glass-border);">
                    <button class="btn btn-primary" onclick="app.voteForIdea('${idea.id}')">
                        <i class="fas fa-thumbs-up"></i>
                        Vote (${idea.votes || 0})
                    </button>
                    <button class="btn btn-secondary" onclick="app.shareIdea('${idea.id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                    ${idea.self ? `
                        <button class="btn btn-ghost" onclick="app.advanceIdea('${idea.id}')">
                            <i class="fas fa-arrow-up"></i>
                            Advance
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    hideModal() {
        const modal = document.getElementById('idea-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ===== IDEA ACTIONS =====
    voteForIdea(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (idea) {
            idea.votes = (idea.votes || 0) + 1;
            this.saveIdeas();
            this.showNotification('Vote recorded! 👍', 'success');
            
            // Refresh views
            this.renderAll();
            
            // Update modal if open
            if (document.getElementById('idea-modal').classList.contains('active')) {
                this.showIdeaDetails(ideaId);
            }
        }
    }

    shareIdea(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (idea && navigator.share) {
            navigator.share({
                title: idea.title,
                text: idea.problem,
                url: window.location.href + '#idea=' + ideaId
            });
        } else {
            const url = `${window.location.href}#idea=${ideaId}`;
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link copied to clipboard! 📋', 'success');
            });
        }
    }

    advanceIdea(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const flow = ['Submitted', 'In review', 'Accepted'];
        const currentIndex = flow.indexOf(idea.status);
        
        if (currentIndex < flow.length - 1) {
            idea.status = flow[currentIndex + 1];
            idea.progress = Math.min(100, idea.progress + 30);
            idea.updated = Date.now();
            
            this.saveIdeas();
            this.showNotification(`Status advanced to ${idea.status}! 🚀`, 'success');
            this.renderAll();
            
            // Update modal if open
            if (document.getElementById('idea-modal').classList.contains('active')) {
                this.showIdeaDetails(ideaId);
            }
        } else {
            this.showNotification('Idea is already at final status! ✅', 'info');
        }
    }

    // ===== SAMPLE DATA (ENHANCED V3) =====
    loadSampleData() {
        if (this.ideas.length === 0) {
            this.ideas = [
                {
                    id: this.generateId(),
                    title: 'AI-Powered Code Review Assistant',
                    category: 'Tech',
                    dept: 'Engineering',
                    tags: ['AI', 'automation', 'code-quality'],
                    status: 'Accepted',
                    owner: 'Alice Johnson',
                    updated: Date.now() - 86400000 * 5,
                    progress: 85,
                    impact: 'Operational efficiency',
                    effort: 'Medium',
                    problem: 'Manual code reviews are time-consuming and can miss subtle issues, leading to technical debt and potential security vulnerabilities.',
                    solution: 'Deploy machine learning models trained on best practices and common bug patterns to provide instant, comprehensive code analysis.',
                    resources: 'ML engineer, cloud computing resources, integration with existing CI/CD pipeline',
                    self: false,
                    votes: 23
                },
                {
                    id: this.generateId(),
                    title: 'Employee Wellness Dashboard',
                    category: 'Process',
                    dept: 'Human Resources',
                    tags: ['wellness', 'dashboard', 'analytics'],
                    status: 'In review',
                    owner: 'Michael Chen',
                    updated: Date.now() - 86400000 * 2,
                    progress: 45,
                    impact: 'Customer experience',
                    effort: 'High',
                    problem: 'Employee burnout and health issues are affecting productivity and job satisfaction across the organization.',
                    solution: 'Create a comprehensive dashboard that tracks employee wellness metrics, provides personalized health recommendations, and connects with local fitness facilities.',
                    resources: 'Full-stack developer, UX designer, partnerships with health providers',
                    self: false,
                    votes: 18
                },
                {
                    id: this.generateId(),
                    title: 'Sustainable Office Energy Management',
                    category: 'Sustainability',
                    dept: 'Operations',
                    tags: ['IoT', 'energy', 'sustainability'],
                    status: 'Submitted',
                    owner: 'Sarah Williams',
                    updated: Date.now() - 86400000 * 1,
                    progress: 15,
                    impact: 'Cost reduction',
                    effort: 'Low',
                    problem: 'Current energy consumption is inefficient, with lights, HVAC, and equipment running unnecessarily during off-hours.',
                    solution: 'Implement IoT sensors and smart controls to optimize energy usage throughout office buildings, reducing environmental impact and operational costs.',
                    resources: 'IoT hardware, electrical contractor, building management system integration',
                    self: false,
                    votes: 31
                },
                {
                    id: this.generateId(),
                    title: 'Customer Journey Analytics Platform',
                    category: 'Customer',
                    dept: 'Marketing',
                    tags: ['analytics', 'customer', 'journey'],
                    status: 'In review',
                    owner: 'David Rodriguez',
                    updated: Date.now() - 86400000 * 3,
                    progress: 60,
                    impact: 'Revenue growth',
                    effort: 'Medium',
                    problem: 'Customer data is siloed across different departments, making it difficult to understand the complete customer journey and identify pain points.',
                    solution: 'Build a real-time analytics platform that tracks customer interactions across all touchpoints to identify optimization opportunities and improve user experience.',
                    resources: 'Data engineers, cloud infrastructure, integration with existing CRM and support systems',
                    self: false,
                    votes: 12
                }
            ];
            this.saveIdeas();
        }
    }

    // ===== UTILITY METHODS =====
    renderAll() {
        this.renderIdeasGrid();
        this.updateKPIs();
        this.renderTrackingView();
    }

    updateElement(id, value, customUpdater = null) {
        const element = document.getElementById(id);
        if (element) {
            if (customUpdater) {
                customUpdater(element);
            } else {
                element.textContent = value;
            }
        }
    }

    showLoading(show) {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading"></div> Submitting...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Idea';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('.notification-icon');
        const text = notification.querySelector('.notification-text');
        const close = notification.querySelector('.notification-close');

        if (!notification) return;

        // Reset classes
        notification.className = 'notification';
        
        // Set content and type
        text.textContent = message;
        notification.classList.add(type);

        // Set icon
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        icon.className = `notification-icon ${icons[type] || icons.info}`;

        // Show notification
        notification.classList.add('show');

        // Close button
        close.onclick = () => {
            notification.classList.remove('show');
        };

        // Auto hide
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    generateId() {
        return 'idea-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // ===== LOCAL STORAGE =====
    saveIdeas() {
        localStorage.setItem('innovation-portal-v5-ideas', JSON.stringify(this.ideas));
    }

    loadIdeas() {
        const stored = localStorage.getItem('innovation-portal-v5-ideas');
        return stored ? JSON.parse(stored) : [];
    }

    saveDrafts() {
        localStorage.setItem('innovation-portal-v5-drafts', JSON.stringify(this.drafts));
    }

    loadDrafts() {
        const stored = localStorage.getItem('innovation-portal-v5-drafts');
        return stored ? JSON.parse(stored) : [];
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new InnovationPortal();
    
    // Load existing data
    app.ideas = app.loadIdeas();
    
    // If no data, load samples
    if (app.ideas.length === 0) {
        app.loadSampleData();
    }
    
    // Initial render
    app.renderAll();

    // Handle URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'submit', 'track'].includes(hash)) {
        app.switchView(hash);
    }
});

// Global app reference for onclick handlers
window.app = app;