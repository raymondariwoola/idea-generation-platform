// Enhanced Innovation Portal V5 - Best of V3 & V4
// Combines V3's lightweight architecture with V4's comprehensive features

class InnovationPortal {
    constructor() {
        this.currentView = 'home';
        this.ideas = [];
        // Track Ideas section view mode (grid | list)
        this.ideasView = 'grid';
        this.currentUser = {
            name: 'John Doe',
            department: 'Engineering',
            email: 'john.doe@company.com',
            id: 'user123'
        };
        this.drafts = this.loadDrafts();
        this.setupMotionPreference();
        
        this.themeStorageKey = 'think-space-theme';
        this.currentTheme = this.loadThemePreference();
        this.applyTheme(this.currentTheme, { persist: false });
        
        // Status dictionary (SharePoint-backed with code fallback)
        this.statusDictionaryMap = {}; // { RawStatus: { label, description, colorHex?, icon? } }
        this.defaultStatusDictionary = {
            'Submitted': { label: 'Received', description: 'Your idea has been received.' },
            'In review': { label: 'Under review', description: 'Your idea is being assessed.' },
            'Accepted': { label: 'Moving forward', description: 'Selected to proceed.' },
            'Rejected': { label: 'Not selected', description: 'Not proceeding at this time.' },
            'Deferred': { label: 'Future consideration', description: 'Revisit in a future cycle.' },
            'On hold': { label: 'Paused', description: 'Temporarily on hold.' },
            'Duplicate': { label: 'Already addressed', description: 'Similar idea already exists.' },
            'Needs Info': { label: 'Needs info', description: 'More details requested.' },
            'Implemented': { label: 'Delivered', description: 'Implemented and available.' },
            'Archived': { label: 'Closed', description: 'No further action.' }
        };
        
        // SharePoint Configuration
        this.sharePointConfig = {
            // IMPORTANT: Use the current Web (subsite) URL, not just the origin.
            // Hitting the tenant root (e.g., https://contoso.com/_api/...) often triggers 401s
            // and repeated auth prompts if you don’t have root access. This detects the current
            // web URL via _spPageContextInfo and falls back to a safe heuristic.
            siteUrl: (window._spPageContextInfo && window._spPageContextInfo.webAbsoluteUrl)
                || inferSharePointWebUrl(window.location),
            listName: 'InnovationIdeas',
            libraryName: 'IdeaAttachments',
            statusDictionaryListName: 'StatusDictionary',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'],
            allowedMimeTypes: [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ]
        };
        
        this.uploadedFiles = [];
        this.pageSize = 25;
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        this.homePagination = {
            nextLink: null,
            loading: false,
            cacheTimestamp: 0,
            totalCount: null
        };
        this.myIdeasCache = [];
        this.myIdeasPagination = {
            nextLink: null,
            loading: false,
            cacheTimestamp: 0,
            totalCount: null
        };
        this.isFilteringHome = false;
        this.lastRenderTrigger = 'default';
        this.init();
    }

    setupMotionPreference() {
        if (typeof window.matchMedia !== 'function') {
            this.prefersReducedMotion = false;
            return;
        }

        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion = preference.matches;
        this.motionPreference = preference;

        const handleChange = (event) => {
            this.prefersReducedMotion = event.matches;
        };
        this.motionPreferenceHandler = handleChange;

        if (typeof preference.addEventListener === 'function') {
            preference.addEventListener('change', handleChange);
        } else if (typeof preference.addListener === 'function') {
            preference.addListener(handleChange);
        }

        const cleanup = () => {
            if (typeof preference.removeEventListener === 'function') {
                preference.removeEventListener('change', handleChange);
            } else if (typeof preference.removeListener === 'function') {
                preference.removeListener(handleChange);
            }
        };
        this.motionPreferenceCleanup = cleanup;
        window.addEventListener('beforeunload', cleanup, { once: true });
    }

    loadThemePreference() {
        try {
            const stored = localStorage.getItem(this.themeStorageKey);
            if (stored === 'brand' || stored === 'futuristic') {
                return stored;
            }
        } catch (error) {
            console.warn('Unable to access saved theme preference.', error);
        }
        return 'futuristic';
    }

    applyTheme(theme, options = {}) {
        const normalized = theme === 'brand' ? 'brand' : 'futuristic';
        const { persist = true } = options;

        this.currentTheme = normalized;

        const body = document.body;
        if (body) {
            body.classList.toggle('brand-theme', normalized === 'brand');
            body.classList.toggle('futuristic-theme', normalized === 'futuristic');
            body.dataset.theme = normalized;
        }

        const root = document.documentElement;
        if (root) {
            root.dataset.theme = normalized;
            root.style.setProperty('color-scheme', normalized === 'brand' ? 'light' : 'dark');
        }

        if (persist) {
            try {
                localStorage.setItem(this.themeStorageKey, normalized);
            } catch (error) {
                console.warn('Unable to persist theme preference.', error);
            }
        }

        this.updateProgressVisualTheme(normalized);
        this.syncThemeToggle(normalized);
    }

    syncThemeToggle(theme) {
        const toggleButtons = document.querySelectorAll('.theme-toggle-option');
        if (!toggleButtons.length) {
            return;
        }

        toggleButtons.forEach(button => {
            const buttonTheme = button.dataset.theme === 'brand' ? 'brand' : 'futuristic';
            const isActive = buttonTheme === theme;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        const toggleContainer = document.querySelector('.theme-toggle');
        if (toggleContainer) {
            toggleContainer.setAttribute('data-active-theme', theme);
        }
    }

    setupThemeToggle() {
        const buttons = Array.from(document.querySelectorAll('.theme-toggle-option'));
        if (!buttons.length) {
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const requested = button.dataset.theme === 'brand' ? 'brand' : 'futuristic';
                if (requested !== this.currentTheme) {
                    this.applyTheme(requested);
                } else {
                    this.syncThemeToggle(requested);
                }
            });

            button.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    const requested = event.key === 'ArrowRight' ? 'brand' : 'futuristic';
                    this.applyTheme(requested);
                    const targetButton = buttons.find(btn => {
                        const btnTheme = btn.dataset.theme === 'brand' ? 'brand' : 'futuristic';
                        return btnTheme === requested;
                    });
                    if (targetButton) {
                        targetButton.focus();
                    }
                }
            });
        });

        this.syncThemeToggle(this.currentTheme);
    }

    async init() {
        // Resolve the current SharePoint user so we can filter "My Ideas"
        await this.resolveCurrentUser();
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupSearch();
        this.setupFilters();
        this.setupIdeasViewToggle();
        this.setupSubmitForm();
        this.setupTrackingView();
        this.setupModals();
        await this.loadStatusDictionary();
        // Ensure Status filter reflects friendly labels after dictionary load
        this.applyFriendlyLabelsToStatusFilter();
        await this.loadSampleData();
        this.renderAll();
        this.animateKPIs();
        // console.log('🚀 Innovation Portal V5 initialized with SharePoint integration');
    }

    // Resolve current user from SharePoint for accurate filtering of "My Ideas"
    async resolveCurrentUser() {
        try {
            // Prefer SharePoint page context when available
            const spctx = window._spPageContextInfo;
            if (spctx && (spctx.userEmail || spctx.userLoginName)) {
                this.currentUser.email = spctx.userEmail || this.currentUser.email;
                this.currentUser.name = spctx.userDisplayName || this.currentUser.name;
                this.currentUser.id = (spctx.userId || this.currentUser.id).toString();
                return;
            }

            // Fallback to SPClient helper if loaded
            if (typeof SPClient !== 'undefined') {
                const sp = new SPClient({ siteUrl: this.sharePointConfig.siteUrl, verboseLogging: false });
                const me = await sp.getCurrentUser('Id,Title,Email,LoginName');
                if (me) {
                    this.currentUser.email = me.Email || this.currentUser.email;
                    this.currentUser.name = me.Title || this.currentUser.name;
                    this.currentUser.id = (me.Id || this.currentUser.id).toString();
                }
            }
        } catch (e) {
            console.warn('Could not resolve current SharePoint user; using defaults.', e);
        }
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
                const staleHomeFeed = !this.homePagination.loading && (Date.now() - this.homePagination.cacheTimestamp > this.cacheTTL);
                if (staleHomeFeed) {
                    this.loadHomeIdeas({ reset: true, force: true })
                        .then(() => {
                            this.lastRenderTrigger = 'default';
                            this.renderIdeas();
                            this.updateKPIs();
                        })
                        .catch(err => console.warn('Home feed refresh failed', err));
                }
                this.lastRenderTrigger = 'default';
                this.renderIdeas();
                this.updateKPIs();
                
                // Start home tutorial for first-time visitors
                if (window.tutorialManager) {
                    setTimeout(() => {
                        window.tutorialManager.startForView('home');
                    }, 1000);
                }
            } else if (viewName === 'track') {
                this.refreshTrackView();
            } else if (viewName === 'submit') {
                // Initialize progress tracking for submit form
                setTimeout(() => {
                    this.setupFormProgress();
                }, 100);
                
                // Start submit tutorial for first-time visitors
                if (window.tutorialManager) {
                    setTimeout(() => {
                        window.tutorialManager.startForView('submit');
                    }, 1000);
                }
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
        const isSearchActive = !!query || activeCategory !== 'all';
        
        let filteredIdeas = this.ideas.filter(idea => {
            const matchesSearch = !query || 
                idea.title.toLowerCase().includes(query) ||
                idea.problem.toLowerCase().includes(query) ||
                idea.solution.toLowerCase().includes(query) ||
                (idea.tags || []).some(tag => tag.toLowerCase().includes(query));

            const matchesCategory = activeCategory === 'all' || idea.category === activeCategory;

            return matchesSearch && matchesCategory;
        });

        this.lastRenderTrigger = isSearchActive ? 'search' : 'default';
        this.renderIdeas(filteredIdeas);
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
                this.lastRenderTrigger = 'default';
                this.renderIdeas();
            });
        }

        // Apply user-friendly labels to Status dropdown on load
        this.applyFriendlyLabelsToStatusFilter();
    }

    applyFilters() {
        const status = document.getElementById('filter-status')?.value || '';
        const category = document.getElementById('filter-category')?.value || '';
        const department = document.getElementById('filter-department')?.value.toLowerCase() || '';

        let filteredIdeas = this.ideas.filter(idea => {
            const matchesStatus = !status || (idea.status || '').toLowerCase() === status.toLowerCase();
            const matchesCategory = !category || idea.category === category;
            const matchesDepartment = !department || 
                (idea.dept || '').toLowerCase().includes(department);

            return matchesStatus && matchesCategory && matchesDepartment;
        });

        const hasFilters = !!status || !!category || !!department;
        this.lastRenderTrigger = hasFilters ? 'filter' : 'default';
        this.renderIdeas(filteredIdeas);
    }

    // Update Status filter options to show friendly labels while keeping raw values
    applyFriendlyLabelsToStatusFilter() {
        const select = document.getElementById('filter-status');
        if (!select) return;
        [...select.options].forEach(opt => {
            if (!opt.value) return; // keep "Any"
            const normalized = this.normalizeRawStatus(opt.value);
            opt.value = normalized; // ensure value matches canonical raw status
            const meta = this.getUserFriendlyStatus(normalized);
            if (meta && meta.label) {
                opt.textContent = meta.label;
                opt.title = `${normalized} — ${meta.description || meta.label}`;
            }
        });
    }

    // Normalize common raw status variants to canonical form
    normalizeRawStatus(raw) {
        const map = {
            'submitted': 'Submitted',
            'in review': 'In review',
            'in-review': 'In review',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'deferred': 'Deferred',
            'on hold': 'On hold',
            'on-hold': 'On hold',
            'duplicate': 'Duplicate',
            'needs info': 'Needs Info',
            'needs-info': 'Needs Info',
            'implemented': 'Implemented',
            'archived': 'Archived'
        };
        const key = (raw || '').trim().toLowerCase();
        return map[key] || raw;
    }

    // ===== IDEAS VIEW TOGGLE (GRID/LIST) =====
    setupIdeasViewToggle() {
        const toggles = document.querySelectorAll('.ideas-header .view-toggle');
        if (!toggles || toggles.length === 0) return;

        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-view');
                if (!mode || (mode !== 'grid' && mode !== 'list')) return;

                // Update active state
                toggles.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Set current mode and re-render
                this.ideasView = mode;
                if (this.lastRenderTrigger === 'search') {
                    this.performSearch();
                } else if (this.lastRenderTrigger === 'filter') {
                    this.applyFilters();
                } else {
                    this.lastRenderTrigger = 'default';
                    this.renderIdeas();
                }
            });
        });
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

        // Add attachment checkbox for optional file uploads
        this.createAttachmentToggle();

        const updateProgress = () => {
            let totalProgress = 0;
            let sectionCount = 0;

            Object.entries(sections).forEach(([progressId, fieldIds]) => {
                const sectionProgress = this.updateSectionProgress(progressId, fieldIds);
                totalProgress += sectionProgress;
                sectionCount++;
            });

            // Note: Attachments are completely excluded from progress calculation
            // Users can submit with or without attachments regardless of completion

            const overallProgress = totalProgress / sectionCount;
            this.updateOverallProgress(overallProgress);
            
            // Debug logging
            // console.log(`📊 Progress Update: ${Math.round(overallProgress)}% (${Math.round(totalProgress)}/${sectionCount * 100})`);
        };

        // Add listeners to all form fields including textareas and selects
        const allFields = Object.values(sections).flat();
        allFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', updateProgress);
                field.addEventListener('change', updateProgress);
                field.addEventListener('blur', updateProgress);
            }
        });

        // Listen for file upload changes
        const fileInput = document.getElementById('attachments');
        if (fileInput) {
            fileInput.addEventListener('change', updateProgress);
        }

        // Listen for attachment checkbox changes
        const attachmentToggle = document.getElementById('attachment-toggle');
        if (attachmentToggle) {
            attachmentToggle.addEventListener('change', (e) => {
                // Update file upload visibility based on toggle state
                this.toggleFileUploadVisibility(e.target.checked);
                // Update progress calculation
                updateProgress();
            });
        }

        // Initial progress calculation
        updateProgress();
        
        // Initialize submit button state
        const submitButton = document.querySelector('.submit-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('disabled');
            submitButton.innerHTML = '<i class="fas fa-tasks"></i> Complete Form (0%)';
        }
    }

    createAttachmentToggle() {
        const fileUploadArea = document.getElementById('file-upload-area');
        if (!fileUploadArea) return;

        // Check if toggle already exists
        if (document.getElementById('attachment-toggle')) return;

        const toggleHTML = `
            <div class="attachment-toggle-container">
                <label class="toggle-switch">
                    <input type="checkbox" id="attachment-toggle">
                    <span class="toggle-slider"></span>
                </label>
                <div class="toggle-content">
                    <span class="toggle-label">Add supporting documents (optional)</span>
                    <small class="toggle-hint">Attachments don't affect form completion progress</small>
                </div>
            </div>
        `;

        // Insert before the file upload area
        fileUploadArea.insertAdjacentHTML('beforebegin', toggleHTML);
        
        // Set initial state: hide file upload area
        this.toggleFileUploadVisibility(false);
    }

    toggleFileUploadVisibility(show) {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileRestrictions = document.querySelector('.file-restrictions');
        const fileList = document.getElementById('file-list');
        
        if (fileUploadArea) {
            if (show) {
                fileUploadArea.style.display = 'flex';
                fileUploadArea.style.opacity = '1';
                fileUploadArea.style.transform = 'translateY(0)';
                fileUploadArea.style.pointerEvents = 'auto';
                
                // Enable the file input
                const fileInput = document.getElementById('attachments');
                if (fileInput) {
                    fileInput.disabled = false;
                }
            } else {
                fileUploadArea.style.opacity = '0';
                fileUploadArea.style.transform = 'translateY(-10px)';
                fileUploadArea.style.pointerEvents = 'none';
                
                // After animation, hide completely
                setTimeout(() => {
                    if (fileUploadArea.style.opacity === '0') {
                        fileUploadArea.style.display = 'none';
                    }
                }, 300);
                
                // Disable and clear the file input
                const fileInput = document.getElementById('attachments');
                if (fileInput) {
                    fileInput.disabled = true;
                    fileInput.value = '';
                    
                    // Clear any uploaded files from memory
                    this.uploadedFiles = [];
                }
                
                // Clear file list display
                if (fileList) {
                    fileList.innerHTML = '';
                }
            }
        }
        
        // Show/hide file restrictions
        if (fileRestrictions) {
            fileRestrictions.style.display = show ? 'block' : 'none';
        }
    }

    updateSectionProgress(progressId, fieldIds) {
        const progressBar = document.getElementById(progressId);
        if (!progressBar) return 0;

        const filledFields = fieldIds.filter(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return false;
            
            // Handle different field types
            if (field.tagName === 'SELECT') {
                return field.value && field.value !== '';
            } else if (field.tagName === 'TEXTAREA') {
                return field.value.trim().length >= 10; // Require minimum content for text areas
            } else {
                return field.value.trim() !== '';
            }
        });

        const percentage = (filledFields.length / fieldIds.length) * 100;
        
        // Update section progress bar with animation
        progressBar.style.transition = 'width 0.4s ease';
        progressBar.style.width = `${percentage}%`;
        
        // Update section progress indicator (add checkmark when complete)
        const sectionElement = progressBar.closest('.form-section');
        if (sectionElement) {
            const header = sectionElement.querySelector('h3');
            if (header) {
                const checkmark = header.querySelector('.section-checkmark');
                if (percentage === 100) {
                    if (!checkmark) {
                        const check = document.createElement('i');
                        check.className = 'fas fa-check-circle section-checkmark';
                        check.style.color = '#00d4ff';
                        check.style.marginLeft = '8px';
                        header.appendChild(check);
                    }
                } else if (checkmark) {
                    checkmark.remove();
                }
            }
        }
        
        return percentage;
    }

    updateOverallProgress(percentage) {
        // Update the percentage text with smooth counting animation
        const progressTextElement = document.querySelector('.overall-progress .progress-text');
        if (progressTextElement) {
            this.animateNumber(progressTextElement, parseInt(progressTextElement.textContent), Math.round(percentage));
        }

        // Update SVG circular progress with fluid animation
        this.updateSVGProgress(percentage);
        
        // Add completion class when 100%
        const progressContainer = document.querySelector('.progress-circle');
        if (progressContainer) {
            if (percentage === 100) {
                progressContainer.classList.add('complete');
                if (!progressContainer.querySelector('.completion-celebration')) {
                    this.addCompletionCelebration(progressContainer);
                }
            } else {
                progressContainer.classList.remove('complete');
                const celebration = progressContainer.querySelector('.completion-celebration');
                if (celebration) celebration.remove();
            }
        }

        // Enable/disable submit button based on completion
        const submitButton = document.querySelector('.submit-btn');
        if (submitButton) {
            if (percentage === 100) {
                submitButton.disabled = false;
                submitButton.classList.remove('disabled');
                submitButton.innerHTML = '<i class="fas fa-rocket"></i> Submit Idea';
            } else {
                submitButton.disabled = true;
                submitButton.classList.add('disabled');
                submitButton.innerHTML = `<i class="fas fa-tasks"></i> Complete Form (${Math.round(percentage)}%)`;
            }
        }

        // Update progress message
        const progressMessage = document.querySelector('.overall-progress p');
        if (progressMessage) {
            if (percentage === 100) {
                progressMessage.textContent = '✅ Ready to submit your brilliant idea!';
                progressMessage.style.color = '#00ff88';
            } else if (percentage >= 75) {
                progressMessage.textContent = '🚀 Almost there! Just a few more fields.';
                progressMessage.style.color = '#fbbf24';
            } else if (percentage >= 50) {
                progressMessage.textContent = '⚡ Great progress! Keep going.';
                progressMessage.style.color = '#8b5cf6';
            } else if (percentage >= 25) {
                progressMessage.textContent = '📝 Good start! Continue filling out the form.';
                progressMessage.style.color = '#06b6d4';
            } else {
                progressMessage.textContent = 'Complete all sections to submit your idea';
                progressMessage.style.color = '#9ca3af';
            }
        }
    }

    updateSVGProgress(percentage) {
        let svgProgress = document.querySelector('.svg-progress');
        
        // Create SVG if it doesn't exist
        if (!svgProgress) {
            const progressRing = document.querySelector('.progress-ring');
            if (progressRing) {
                progressRing.innerHTML = `
                    <svg class="svg-progress" width="80" height="80" viewBox="0 0 80 80">
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#7c3aed;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#00ff88;stop-opacity:1" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge> 
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <!-- Background circle -->
                        <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
                        <!-- Progress circle -->
                        <circle class="progress-path" cx="40" cy="40" r="35" fill="none" 
                                stroke="url(#progressGradient)" stroke-width="4" 
                                stroke-linecap="round" 
                                stroke-dasharray="219.8" 
                                stroke-dashoffset="219.8"
                                filter="url(#glow)"
                                transform="rotate(-90 40 40)"/>
                        <!-- Center percentage text -->
                        <text class="progress-text" x="40" y="40" text-anchor="middle" dy=".3em" 
                              fill="#e8f0ff" font-size="14" font-weight="700" font-family="Inter, sans-serif">0%</text>
                    </svg>
                `;
                svgProgress = document.querySelector('.svg-progress');
            }
        }

        // Animate the progress path
        const progressPath = document.querySelector('.progress-path');
        if (progressPath) {
            const circumference = 219.8;
            const offset = circumference - (percentage / 100) * circumference;
            
            // Smooth animation
            progressPath.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            progressPath.style.strokeDashoffset = offset;
            
            // Add pulsing effect for completion
            if (percentage === 100) {
                progressPath.style.animation = 'progressPulse 2s ease-in-out infinite';
            } else {
                progressPath.style.animation = 'none';
            }
        }

        this.updateProgressVisualTheme();
    }

    updateProgressVisualTheme(theme = this.currentTheme) {
        const activeTheme = theme || this.currentTheme || 'futuristic';

        const svgProgress = document.querySelector('.svg-progress');
        if (svgProgress) {
            const gradient = svgProgress.querySelector('#progressGradient');
            if (gradient) {
                const stops = gradient.querySelectorAll('stop');
                if (stops.length >= 3) {
                    const colorSets = {
                        brand: ['#072447', '#155ac4', '#49b2ff'],
                        futuristic: ['#00d4ff', '#7c3aed', '#00ff88']
                    };
                    const chosen = activeTheme === 'brand' ? colorSets.brand : colorSets.futuristic;
                    stops.forEach((stop, index) => {
                        const color = chosen[Math.min(index, chosen.length - 1)];
                        stop.setAttribute('stop-color', color);
                        stop.setAttribute('stop-opacity', '1');
                        stop.setAttribute('style', `stop-color:${color};stop-opacity:1`);
                    });
                }
            }

            const backgroundCircle = svgProgress.querySelector('circle:not(.progress-path)');
            if (backgroundCircle) {
                const stroke = activeTheme === 'brand' ? 'rgba(7, 36, 71, 0.18)' : 'rgba(255,255,255,0.1)';
                backgroundCircle.setAttribute('stroke', stroke);
            }

            const progressPath = svgProgress.querySelector('.progress-path');
            if (progressPath) {
                progressPath.setAttribute('stroke', 'url(#progressGradient)');
                if (activeTheme === 'brand') {
                    progressPath.removeAttribute('filter');
                    progressPath.style.filter = 'drop-shadow(0 6px 18px rgba(7, 36, 71, 0.25))';
                } else {
                    progressPath.setAttribute('filter', 'url(#glow)');
                    progressPath.style.filter = '';
                }
            }

            const progressText = svgProgress.querySelector('.progress-text');
            if (progressText) {
                const fillColor = activeTheme === 'brand' ? '#000000' : '#e8f0ff';
                progressText.setAttribute('fill', fillColor);
                progressText.style.fill = fillColor;
                progressText.style.opacity = activeTheme === 'brand' ? '0.9' : '1';
            }
        }

        const legacyText = document.querySelector('.progress-circle > .progress-text');
        if (legacyText) {
            legacyText.style.color = activeTheme === 'brand' ? '#000000' : '#e6ecf8';
        }
    }

    animateNumber(element, start, end) {
        if (this.prefersReducedMotion) {
            element.textContent = `${end}%`;
            return;
        }

        const duration = 600;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOutCubic);
            
            element.textContent = `${current}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    addCompletionCelebration(container) {
        if (this.prefersReducedMotion) {
            return;
        }

        const celebration = document.createElement('div');
        celebration.className = 'completion-celebration';
        celebration.innerHTML = `
            <div class="sparkle sparkle-1">&#10024;</div>
            <div class="sparkle sparkle-2">&#10024;&#10024;</div>
            <div class="sparkle sparkle-3">&#10024;</div>
            <div class="sparkle sparkle-4">&#10024;&#10024;</div>
        `;
        container.appendChild(celebration);

        // Remove celebration after animation
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.remove();
            }
        }, 3000);
    }

    handleFiles(files) {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        files.forEach(file => {
            // Validate file size
            if (file.size > this.sharePointConfig.maxFileSize) {
                this.showNotification(`File "${file.name}" is too large. Maximum ${this.formatFileSize(this.sharePointConfig.maxFileSize)} allowed.`, 'error');
                return;
            }

            // Validate file type
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const isValidType = this.sharePointConfig.allowedFileTypes.includes(fileExtension) || 
                               this.sharePointConfig.allowedMimeTypes.includes(file.type);
            
            if (!isValidType) {
                this.showNotification(`File type "${fileExtension}" is not allowed. Supported types: Images, PDF, Word documents, and Text files.`, 'error');
                return;
            }

            // Check if file already exists
            if (this.uploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
                this.showNotification(`File "${file.name}" is already selected.`, 'warning');
                return;
            }

            // Add to uploaded files array
            this.uploadedFiles.push(file);

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileName = file.name;
            
            const fileIcon = this.getFileIcon(fileExtension);
            const fileSize = this.formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="${fileIcon}" style="margin-right: 0.5rem; color: var(--brand-primary);"></i>
                    <div>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                </div>
                <button type="button" class="file-remove" onclick="app.removeFile('${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
        
        this.updateFileUploadUI();
    }

    async submitIdea() {
        // Guard against double-submission (rapid clicks or Enter presses)
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            this.isSubmitting = false;
            return;
        }

        // Failsafe: Final sanitization before submission
        const sanitizedData = this.sanitizeFormData(formData);

        this.showLoading(true);
        
        try {
            // Upload files to SharePoint first
            const attachmentUrls = [];
            if (this.uploadedFiles.length > 0) {
                this.showNotification('Uploading files...', 'info');
                
                for (const file of this.uploadedFiles) {
                    const timestamp = new Date().getTime();
                    const fileName = `${timestamp}_${file.name}`;
                    const fileUrl = await this.uploadFileToSharePoint(file, fileName);
                    attachmentUrls.push(fileUrl);
                }
            }
            
            // Save idea to SharePoint
            const ideaData = {
                ...sanitizedData,
                attachmentUrls
            };
            
            const savedIdea = await this.saveIdeaToSharePoint(ideaData);
            
            // Update local state
            const idea = {
                id: savedIdea.d.Id.toString(),
                ...sanitizedData,
                status: 'Submitted',
                updated: Date.now(),
                progress: 25,
                owner: formData.anonymous ? 'Anonymous' : (formData.owner || 'Anonymous'),
                self: true,
                votes: 0,
                comments: [],
                attachmentUrls
            };

            this.ideas.unshift(idea);
            this.clearForm();
            this.showLoading(false);
            this.showNotification('Idea submitted successfully! 🎉', 'success');
            // Subtle success animation before navigating to Track view
            await this.playSubmitSuccessAnimation();
            // Refresh paged caches from SharePoint (server is source of truth)
            try {
                await this.loadHomeIdeas({ reset: true, force: true });
                await this.loadMyIdeas({ reset: true, force: true });
                this.lastRenderTrigger = 'default';
                this.renderIdeas();
                this.updateKPIs();
            } catch (refreshError) {
                console.warn('Post-submit refresh failed; cached data may be stale.', refreshError);
            }
            this.switchView('track');
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showLoading(false);
            this.showNotification('Failed to submit idea. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
        }
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

    sanitizeFormData(data) {
        // Failsafe: Apply both PCI DSS and XSS sanitization before submission
        const sanitized = {};
        
        // Check if security libraries are available
        const hasPCIChecker = typeof window.pciChecker !== 'undefined';
        const hasXSSProtection = typeof window.xssProtection !== 'undefined';
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                let clean = value;
                
                // Apply PCI DSS sanitization
                if (hasPCIChecker) {
                    clean = window.pciChecker.sanitize(clean);
                }
                
                // Apply XSS protection
                if (hasXSSProtection) {
                    clean = window.xssProtection.sanitize(clean);
                }
                
                sanitized[key] = clean;
            } else {
                sanitized[key] = value;
            }
        }
        
        // Log if any sanitization occurred
        const changed = Object.keys(data).some(key => 
            typeof data[key] === 'string' && data[key] !== sanitized[key]
        );
        
        if (changed) {
            console.warn('⚠️ Form data was sanitized before submission for security compliance');
        }
        
        return sanitized;
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
            
            // Reset uploaded files array
            this.uploadedFiles = [];
            
            // Reset file upload UI
            this.updateFileUploadUI();

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

    async refreshTrackView(force = false) {
        const now = Date.now();
        const cacheStale = force || !this.myIdeasCache.length || (now - this.myIdeasPagination.cacheTimestamp > this.cacheTTL);

        if (cacheStale && !this.myIdeasPagination.loading) {
            try {
                await this.loadMyIdeas({ reset: true, force: true });
            } catch (err) {
                console.warn('Could not refresh ideas from SharePoint for Track view.', err);
            }
        }

        this.renderTrackingView();
    }

    renderTrackingView() {
        const myIdeas = this.myIdeasCache.length > 0
            ? this.myIdeasCache
            : this.ideas.filter(idea => idea.self);
        this.updateMyStats(myIdeas);
        this.renderMyIdeasTable(myIdeas);
        this.renderMyIdeasCards(myIdeas);
        this.updateMyIdeasLoadMoreControl();
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

    updateMyIdeasLoadMoreControl() {
        const panelContent = document.querySelector('.track-content .panel-content');
        if (!panelContent) return;

        let container = document.getElementById('my-ideas-load-more');
        if (!container) {
            container = document.createElement('div');
            container.id = 'my-ideas-load-more';
            container.className = 'load-more-container';
            panelContent.appendChild(container);
        }

        container.innerHTML = '';

        if (this.myIdeasPagination.loading) {
            const loading = document.createElement('div');
            loading.className = 'loading-text';
            loading.textContent = 'Loading your ideas...';
            container.appendChild(loading);
            return;
        }

        const hasIdeas = this.myIdeasCache.length > 0;
        const total = this.myIdeasPagination.totalCount ?? (hasIdeas ? this.myIdeasCache.length : 0);

        if (!hasIdeas && !this.myIdeasPagination.nextLink) {
            container.innerHTML = '';
            return;
        }

        if (hasIdeas) {
            const summary = document.createElement('div');
            summary.className = 'load-more-summary';
            summary.textContent = total
                ? `Showing ${this.myIdeasCache.length} of ${total} ideas you submitted.`
                : `Showing ${this.myIdeasCache.length} ideas you submitted.`;
            container.appendChild(summary);
        }

        if (this.myIdeasPagination.nextLink) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = 'Load more of your ideas';
            btn.addEventListener('click', () => this.loadMoreMyIdeas());
            container.appendChild(btn);
        }
    }

    // ===== IDEAS RENDERING (GRID/LIST) =====
    renderIdeas(filteredIdeas = null) {
        const isFiltered = Array.isArray(filteredIdeas);
        this.isFilteringHome = isFiltered;

        if (this.ideasView === 'list') {
            this.renderIdeasList(isFiltered ? filteredIdeas : null);
        } else {
            this.renderIdeasGrid(isFiltered ? filteredIdeas : null);
        }

        this.updateHomeLoadMoreControl();
    }

    // ===== IDEAS GRID RENDERING (ENHANCED V3 + V4) =====
    renderIdeasGrid(filteredIdeas = null) {
        const container = document.getElementById('ideas-grid');
        if (!container) return;

        // Ensure proper class for grid layout
        container.classList.add('ideas-grid');
        container.classList.remove('ideas-list');

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

    // ===== IDEAS LIST RENDERING =====
    renderIdeasList(filteredIdeas = null) {
        const container = document.getElementById('ideas-grid');
        if (!container) return;

        // Switch container to list layout (remove grid styles)
        container.classList.remove('ideas-grid');
        container.classList.add('ideas-list');

        const ideasToShow = filteredIdeas || this.ideas;

        if (ideasToShow.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No ideas found</h3>
                    <p>Try adjusting your search criteria or filters.</p>
                </div>
            `;
            return;
        }

        const rows = ideasToShow.map(idea => this.createIdeasListRow(idea)).join('');
        container.innerHTML = `
            <div class="list-wrapper" style="grid-column: 1 / -1;">
                <table class="ideas-table">
                    <thead>
                        <tr>
                            <th>Idea</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    updateHomeLoadMoreControl() {
        const ideasMain = document.querySelector('.ideas-main');
        if (!ideasMain) return;

        let container = document.getElementById('ideas-load-more');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ideas-load-more';
            container.className = 'load-more-container';
            ideasMain.appendChild(container);
        }

        container.innerHTML = '';

        if (this.homePagination.loading) {
            const loading = document.createElement('div');
            loading.className = 'loading-text';
            loading.textContent = 'Loading ideas...';
            container.appendChild(loading);
            return;
        }

        if (this.isFilteringHome) {
            const note = document.createElement('div');
            note.className = 'load-more-summary';
            note.textContent = 'Showing filtered results from loaded ideas.';
            container.appendChild(note);

            if (this.homePagination.nextLink && !this.homePagination.loading) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary';
                btn.textContent = 'Load more ideas';
                btn.addEventListener('click', () => this.loadMoreHomeIdeas());
                container.appendChild(btn);
            }
            return;
        }

        if (this.ideas.length === 0) {
            container.innerHTML = '';
            return;
        }

        const total = this.homePagination.totalCount ?? this.ideas.length;
        const summary = document.createElement('div');
        summary.className = 'load-more-summary';
        summary.textContent = total
            ? `Showing ${this.ideas.length} of ${total} ideas.`
            : `Showing ${this.ideas.length} ideas.`;
        container.appendChild(summary);

        if (this.homePagination.nextLink) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = 'Load more ideas';
            btn.addEventListener('click', () => this.loadMoreHomeIdeas());
            container.appendChild(btn);
        }
    }

    createIdeasListRow(idea) {
        const date = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const friendly = this.getUserFriendlyStatus(idea.status);
        return `
            <tr onclick="app.showIdeaDetails('${idea.id}')" style="cursor: pointer;">
                <td><strong>${idea.title}</strong></td>
                <td>${idea.category}${idea.dept ? ` · <span style='color: var(--text-muted)'>${idea.dept}</span>` : ''}</td>
                <td><span class="idea-status ${statusClass}" title="${idea.status} — ${friendly.description}">${friendly.label}</span></td>
                <td>${date}</td>
                <td>
                    <div class="idea-progress-bar">
                        <div class="idea-progress-fill" style="width: ${idea.progress}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }

    createIdeaCard(idea, isMyIdea = false) {
        const date = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const tags = (idea.tags || []).slice(0, 3).map(tag => 
            `<span class="idea-tag">#${tag}</span>`
        ).join(' ');

        const friendly = this.getUserFriendlyStatus(idea.status);
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
                    <span class="idea-status ${statusClass}" title="${idea.status} — ${friendly.description}">${friendly.label}</span>
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

    // ===== STATUS DICTIONARY (SharePoint + Fallback) =====
    async loadStatusDictionary() {
        const map = await this.loadStatusDictionaryFromSharePoint();
        if (map && Object.keys(map).length) {
            this.statusDictionaryMap = map;
        } else {
            this.statusDictionaryMap = { ...this.defaultStatusDictionary };
        }
    }

    async loadStatusDictionaryFromSharePoint() {
        try {
            const url = `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.statusDictionaryListName}')/items?$select=RawStatus,FriendlyStatus,Description,ColorHex,Icon`;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json;odata=verbose' },
                credentials: 'include'
            });
            if (!res.ok) return null;
            const data = await res.json();
            const map = {};
            (data?.d?.results || []).forEach(item => {
                if (!item.RawStatus) return;
                map[item.RawStatus] = {
                    label: item.FriendlyStatus || this.defaultStatusDictionary[item.RawStatus]?.label || item.RawStatus,
                    description: item.Description || this.defaultStatusDictionary[item.RawStatus]?.description || item.RawStatus,
                    colorHex: item.ColorHex || null,
                    icon: item.Icon || null
                };
            });
            return map;
        } catch (e) {
            return null; // fallback silently
        }
    }

    getUserFriendlyStatus(rawStatus) {
        if (!rawStatus) return { label: '', description: '' };
        const entry = this.statusDictionaryMap[rawStatus] || this.defaultStatusDictionary[rawStatus];
        return entry ? entry : { label: rawStatus, description: rawStatus };
    }

    // ===== KPI DASHBOARD (ENHANCED V3) =====
    updateKPIs() {
        const total = this.homePagination.totalCount ?? this.ideas.length;
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

        if (this.prefersReducedMotion) {
            element.textContent = target;
            return;
        }

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

        requestAnimationFrame(updateCounter);
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
        const friendly = this.getUserFriendlyStatus(idea.status);
        const tags = (idea.tags || []).map(tag => `<span class="idea-tag">#${tag}</span>`).join(' ');

        return `
            <div class="idea-details">
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
                        <span style="color: var(--text-muted);"><i class="fas fa-user"></i> ${idea.owner}</span>
                        ${idea.dept ? `<span style="color: var(--text-muted);"><i class="fas fa-building"></i> ${idea.dept}</span>` : ''}
                        <span style="color: var(--text-muted);"><i class="fas fa-clock"></i> ${date}</span>
                        <span class="idea-status ${statusClass}" title="${idea.status} — ${friendly.description}">${friendly.label}</span>
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

    // ===== DATA LOADING (SHAREPOINT INTEGRATION) =====
    async loadSampleData() {
        try {
            await this.loadHomeIdeas({ reset: true, force: true });
            await this.loadMyIdeas({ reset: true, force: true });
            if (this.ideas.length > 0) {
                return;
            }
        } catch (error) {
            console.warn('Could not load from SharePoint, using sample data:', error);
        }

        // Fallback to sample data if SharePoint is not available
        if (this.ideas.length === 0) {
            const fallbackIdeas = [
                {
                    id: this.generateId(),
                    title: 'AI-Powered Code Review Assistant',
                    category: 'Tech',
                    dept: 'Engineering',
                    tags: ['AI', 'automation', 'code-quality'],
                    status: 'Accepted',
                    userFriendlyStatus: (this.getUserFriendlyStatus && this.getUserFriendlyStatus('Accepted').label) || 'Moving forward',
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
                    userFriendlyStatus: (this.getUserFriendlyStatus && this.getUserFriendlyStatus('In review').label) || 'Under review',
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
                    userFriendlyStatus: (this.getUserFriendlyStatus && this.getUserFriendlyStatus('Submitted').label) || 'Received',
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
                    userFriendlyStatus: (this.getUserFriendlyStatus && this.getUserFriendlyStatus('In review').label) || 'Under review',
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

            this.ideas = fallbackIdeas;
            this.homePagination.nextLink = null;
            this.homePagination.totalCount = fallbackIdeas.length;
            this.homePagination.cacheTimestamp = Date.now();

            this.myIdeasCache = fallbackIdeas.filter(idea => idea.self);
            this.myIdeasPagination.nextLink = null;
            this.myIdeasPagination.totalCount = this.myIdeasCache.length;
            this.myIdeasPagination.cacheTimestamp = Date.now();

            this.saveIdeas();
        }
    }

    // ===== SHAREPOINT API METHODS =====
    async getRequestDigest() {
        try {
            const response = await fetch(`${this.sharePointConfig.siteUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            return data.d.GetContextWebInformation.FormDigestValue;
        } catch (error) {
            console.error('Error getting request digest:', error);
            throw error;
        }
    }

    async uploadFileToSharePoint(file, fileName) {
        try {
            const digest = await this.getRequestDigest();
            const arrayBuffer = await file.arrayBuffer();
            
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.libraryName}')/RootFolder/Files/Add(url='${fileName}',overwrite=true)`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest
                    },
                    body: arrayBuffer,
                    credentials: 'include'
                }
            );
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.d.ServerRelativeUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async saveIdeaToSharePoint(ideaData) {
        try {
            const digest = await this.getRequestDigest();
            
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.listName}')/items`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest
                    },
                    body: JSON.stringify({
                        '__metadata': { 'type': `SP.Data.${this.sharePointConfig.listName}ListItem` },
                        'Title': ideaData.title,
                        'Category': ideaData.category,
                        'Department': ideaData.dept,
                        'Problem': ideaData.problem,
                        'Solution': ideaData.solution,
                        'ExpectedImpact': ideaData.impact,
                        'EstimatedEffort': ideaData.effort,
                        'RequiredResources': ideaData.resources,
                        'SubmitterName': ideaData.owner,
                        // Always store the currently authenticated user's email for reliable filtering
                        'SubmitterEmail': this.currentUser?.email || ideaData.email,
                        'Tags': ideaData.tags ? ideaData.tags.join(';') : '',
                        'Status': 'Submitted',
                        'AttachmentUrls': ideaData.attachmentUrls ? ideaData.attachmentUrls.join(';') : '',
                        'IsAnonymous': ideaData.anonymous
                    }),
                    credentials: 'include'
                }
            );
            
            if (!response.ok) {
                throw new Error(`Save failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving idea to SharePoint:', error);
            throw error;
        }
    }

    async loadIdeasFromSharePoint({ onlyMine = false, nextLink = null, top = this.pageSize } = {}) {
        try {
            const rawEmail = (this.currentUser && this.currentUser.email)
                ? this.currentUser.email.trim()
                : '';
            const currentEmail = rawEmail ? rawEmail.toLowerCase() : '';
            const currentUserId = this.currentUser?.id ? parseInt(this.currentUser.id, 10) : null;

            const selectFields = [
                'Id', 'Title', 'Category', 'Department', 'Problem', 'Solution',
                'ExpectedImpact', 'EstimatedEffort', 'RequiredResources',
                'SubmitterName', 'SubmitterEmail', 'Tags', 'Status',
                'AttachmentUrls', 'IsAnonymous', 'Modified', 'Votes',
                'Author/Id', 'Author/Title', 'Author/EMail', 'AuthorId'
            ];

            let requestUrl = nextLink;
            if (!requestUrl) {
                const baseUrl = `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.listName}')/items`;
                const params = [
                    `$orderby=Created desc`,
                    `$select=${selectFields.join(',')}`,
                    `$expand=Author`,
                    `$top=${top}`,
                    `$inlinecount=allpages`
                ];

                const filters = [];
                if (onlyMine) {
                    if (Number.isInteger(currentUserId)) {
                        filters.push(`Author/Id eq ${currentUserId}`);
                    }
                    if (rawEmail) {
                        filters.push(`SubmitterEmail eq '${escapeODataString(rawEmail)}'`);
                    }
                }

                if (filters.length > 0) {
                    params.push(`$filter=${filters.map(f => `(${f})`).join(' or ')}`);
                }

                requestUrl = `${baseUrl}?${params.join('&')}`;
            }

            const response = await fetch(requestUrl, {
                headers: {
                    'Accept': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Load failed: ${response.statusText}`);
            }

            const data = await response.json();
            const items = (data.d && data.d.results) ? data.d.results : [];
            const nextLinkResponse = (data.d && data.d.__next) ? data.d.__next : null;
            const totalCount = data.d && typeof data.d.__count !== 'undefined'
                ? parseInt(data.d.__count, 10)
                : null;

            const ideas = items.map(item => {
                const author = item.Author || {};
                const authorIdValue = author.Id ?? item.AuthorId;
                const authorId = authorIdValue ? parseInt(authorIdValue, 10) : null;
                const authorEmail = (author.EMail || '').toLowerCase();
                const authorName = author.Title || '';

                const submitterEmail = (item.SubmitterEmail || '').trim().toLowerCase();
                const isMineById = Number.isInteger(currentUserId) && Number.isInteger(authorId)
                    ? authorId === currentUserId
                    : false;
                const isMineByEmail = currentEmail && submitterEmail
                    ? submitterEmail === currentEmail
                    : false;

                const ownerName = item.IsAnonymous
                    ? 'Anonymous'
                    : (item.SubmitterName || authorName || 'Unknown submitter');
                const ownerEmail = item.IsAnonymous ? '' : (item.SubmitterEmail || authorEmail || '');

                return {
                    id: item.Id.toString(),
                    title: item.Title,
                    category: item.Category,
                    dept: item.Department,
                    problem: item.Problem,
                    solution: item.Solution,
                    impact: item.ExpectedImpact,
                    effort: item.EstimatedEffort,
                    resources: item.RequiredResources,
                    owner: ownerName,
                    email: ownerEmail,
                    tags: item.Tags ? item.Tags.split(';').filter(Boolean) : [],
                    status: item.Status || 'Submitted',
                    updated: new Date(item.Modified).getTime(),
                    progress: this.calculateProgress(item.Status),
                    self: isMineById || isMineByEmail,
                    votes: item.Votes || 0,
                    attachmentUrls: item.AttachmentUrls ? item.AttachmentUrls.split(';').filter(Boolean) : []
                };
            });

            return {
                items: ideas,
                nextLink: nextLinkResponse,
                totalCount: Number.isNaN(totalCount) ? null : totalCount
            };
        } catch (error) {
            console.error('Error loading ideas from SharePoint:', error);
            throw error;
        }
    }

    async loadHomeIdeas({ reset = false, useNextLink = false, force = false } = {}) {
        if (this.homePagination.loading) return;

        const now = Date.now();
        const hasData = this.ideas.length > 0;
        const cacheFresh = !reset && !useNextLink && !force && hasData && (now - this.homePagination.cacheTimestamp < this.cacheTTL);
        if (cacheFresh) return;

        this.homePagination.loading = true;
        if (reset) {
            this.homePagination.nextLink = null;
            this.homePagination.totalCount = null;
            this.ideas = [];
        }
        this.updateHomeLoadMoreControl();

        try {
            const options = (useNextLink && this.homePagination.nextLink)
                ? { nextLink: this.homePagination.nextLink }
                : { top: this.pageSize };

            const { items, nextLink, totalCount } = await this.loadIdeasFromSharePoint({ ...options, onlyMine: false });
            const shouldReset = reset || (!useNextLink && (!hasData || force));
            this.mergeIdeaCollections(this.ideas, items, { reset: shouldReset });
            this.homePagination.nextLink = nextLink || null;
            if (typeof totalCount === 'number' && !Number.isNaN(totalCount)) {
                this.homePagination.totalCount = totalCount;
            } else if (this.homePagination.totalCount == null && !useNextLink) {
                this.homePagination.totalCount = this.ideas.length;
            }
            this.homePagination.cacheTimestamp = Date.now();
        } catch (error) {
            console.error('Failed to load home ideas from SharePoint:', error);
            if (reset) throw error;
        } finally {
            this.homePagination.loading = false;
            this.updateHomeLoadMoreControl();
        }
    }

    async loadMoreHomeIdeas() {
        if (!this.homePagination.nextLink || this.homePagination.loading) return;
        await this.loadHomeIdeas({ useNextLink: true, force: true });
        if (this.lastRenderTrigger === 'search') {
            this.performSearch();
        } else if (this.lastRenderTrigger === 'filter') {
            this.applyFilters();
        } else {
            this.lastRenderTrigger = 'default';
            this.renderIdeas();
        }
        this.updateKPIs();
    }

    async loadMyIdeas({ reset = false, useNextLink = false, force = false } = {}) {
        if (this.myIdeasPagination.loading) return;

        const now = Date.now();
        const hasData = this.myIdeasCache.length > 0;
        const cacheFresh = !reset && !useNextLink && !force && hasData && (now - this.myIdeasPagination.cacheTimestamp < this.cacheTTL);
        if (cacheFresh) return;

        this.myIdeasPagination.loading = true;
        if (reset) {
            this.myIdeasPagination.nextLink = null;
            this.myIdeasPagination.totalCount = null;
            this.myIdeasCache = [];
        }
        this.updateMyIdeasLoadMoreControl();

        try {
            const options = (useNextLink && this.myIdeasPagination.nextLink)
                ? { nextLink: this.myIdeasPagination.nextLink }
                : { top: this.pageSize, onlyMine: true };

            const { items, nextLink, totalCount } = await this.loadIdeasFromSharePoint(options);
            const shouldReset = reset || (!useNextLink && force);
            this.mergeIdeaCollections(this.myIdeasCache, items, { reset: shouldReset });
            this.myIdeasPagination.nextLink = nextLink || null;
            if (typeof totalCount === 'number' && !Number.isNaN(totalCount)) {
                this.myIdeasPagination.totalCount = totalCount;
            } else if (this.myIdeasPagination.totalCount == null && !useNextLink) {
                this.myIdeasPagination.totalCount = this.myIdeasCache.length;
            }
            this.myIdeasPagination.cacheTimestamp = Date.now();
        } catch (error) {
            console.error('Failed to load user ideas from SharePoint:', error);
            if (reset) throw error;
        } finally {
            this.myIdeasPagination.loading = false;
            this.updateMyIdeasLoadMoreControl();
        }
    }

    async loadMoreMyIdeas() {
        if (!this.myIdeasPagination.nextLink || this.myIdeasPagination.loading) return;
        await this.loadMyIdeas({ useNextLink: true, force: true });
        this.renderTrackingView();
    }

    // Lightweight success animation before navigating to Track view
    async playSubmitSuccessAnimation() {
        return new Promise(resolve => {
            try {
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.inset = '0';
                overlay.style.pointerEvents = 'none';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'transparent';
                overlay.style.zIndex = '9999';

                const check = document.createElement('div');
                check.innerHTML = '<i class="fas fa-check-circle"></i>';
                check.style.fontSize = '64px';
                check.style.color = 'var(--brand-primary, #2563eb)';
                check.style.opacity = '0';
                check.style.transform = 'scale(0.8)';
                check.style.transition = 'transform 300ms ease, opacity 300ms ease';
                overlay.appendChild(check);

                document.body.appendChild(overlay);
                requestAnimationFrame(() => {
                    check.style.opacity = '1';
                    check.style.transform = 'scale(1)';
                });

                setTimeout(() => {
                    check.style.opacity = '0';
                    check.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 250);
                }, 650);
            } catch {
                resolve();
            }
        });
    }

    calculateProgress(status) {
        const progressMap = {
            'Submitted': 25,
            'In review': 60,
            'Accepted': 100,
            'Rejected': 0
        };
        return progressMap[status] || 25;
    }

    // ===== FILE MANAGEMENT UTILITIES =====
    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        
        const fileItem = document.querySelector(`[data-file-name="${fileName}"]`);
        if (fileItem) {
            fileItem.remove();
        }
        
        this.updateFileUploadUI();
        this.showNotification(`File "${fileName}" removed.`, 'info');
    }

    updateFileUploadUI() {
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileCount = this.uploadedFiles.length;
        const maxFiles = 5; // Reasonable limit
        
        if (fileUploadArea) {
            const uploadText = fileUploadArea.querySelector('p');
            if (uploadText) {
                if (fileCount >= maxFiles) {
                    uploadText.innerHTML = `Maximum ${maxFiles} files allowed. Remove files to add more.`;
                    fileUploadArea.style.opacity = '0.6';
                    fileUploadArea.style.pointerEvents = 'none';
                } else {
                    uploadText.innerHTML = `Drag and drop files here or click to browse<br><small>Max ${this.formatFileSize(this.sharePointConfig.maxFileSize)} per file • ${fileCount}/${maxFiles} files selected</small>`;
                    fileUploadArea.style.opacity = '1';
                    fileUploadArea.style.pointerEvents = 'auto';
                }
            }
        }
    }

    getFileIcon(extension) {
        const iconMap = {
            '.pdf': 'fas fa-file-pdf',
            '.doc': 'fas fa-file-word',
            '.docx': 'fas fa-file-word',
            '.txt': 'fas fa-file-alt',
            '.jpg': 'fas fa-file-image',
            '.jpeg': 'fas fa-file-image',
            '.png': 'fas fa-file-image',
            '.gif': 'fas fa-file-image'
        };
        return iconMap[extension] || 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ===== UTILITY METHODS =====
    mergeIdeaCollections(target, items, { reset = false } = {}) {
        if (!Array.isArray(target) || !Array.isArray(items)) return;

        if (reset) {
            target.splice(0, target.length);
        }

        const indexMap = new Map();
        target.forEach((idea, idx) => {
            if (idea && idea.id) {
                indexMap.set(idea.id, idx);
            }
        });

        items.forEach(item => {
            if (!item || !item.id) return;
            if (indexMap.has(item.id)) {
                const existingIndex = indexMap.get(item.id);
                target[existingIndex] = { ...target[existingIndex], ...item };
            } else {
                indexMap.set(item.id, target.length);
                target.push(item);
            }
        });
    }

    renderAll() {
        this.lastRenderTrigger = 'default';
        this.renderIdeas();
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

function escapeODataString(value = '') {
    return String(value).replace(/'/g, "''");
}

// Short, user-friendly fallback labels (used if SharePoint dictionary isn't available)
const DEFAULT_STATUS_DICTIONARY = {
  'Submitted':  { label: 'Received',       description: 'We’ve got your idea and will review it shortly.' },
  'In review':  { label: 'Under review',   description: 'Experts are evaluating your idea.' },
  'Accepted':   { label: 'Moving forward', description: 'Your idea is advancing to the next step.' },
  'Rejected':   { label: 'Not selected',   description: 'Thanks for contributing—this one won’t move ahead right now.' },
  'Deferred':   { label: 'Future consideration', description: 'We’ll revisit this later.' },
  'On hold':    { label: 'Paused',         description: 'Temporarily on hold.' },
  'Duplicate':  { label: 'Already covered',description: 'A similar idea already exists.' },
  'Needs Info': { label: 'More info needed', description: 'Please add a few details to proceed.' },
  'Implemented':{ label: 'Delivered',      description: 'Implemented and closed.' },
  'Archived':   { label: 'Closed',         description: 'Archived for reference.' },
};

// Cache (SharePoint result merges over this)
window.tsStatusDict = { ...DEFAULT_STATUS_DICTIONARY };

// Try to load the StatusDictionary list from SharePoint. Falls back silently if not available.
async function loadStatusDictionary() {
  try {
    if (window.SPHelpers && typeof SPHelpers.getListItems === 'function') {
      const rows = await SPHelpers.getListItems('StatusDictionary', {
        select: ['RawStatus', 'FriendlyStatus', 'Description']
      });
      if (Array.isArray(rows) && rows.length) {
        const dict = {};
        for (const r of rows) {
          const raw = (r.RawStatus || '').trim();
          if (!raw) continue;
          dict[raw] = {
            label: (r.FriendlyStatus || '').trim() || raw,
            description: (r.Description || '').trim() || ''
          };
        }
        window.tsStatusDict = { ...DEFAULT_STATUS_DICTIONARY, ...dict };
      }
    }
  } catch (err) {
    console.warn('StatusDictionary: using fallback mapping', err);
  } finally {
    applyFriendlyLabelsToStatusFilter();
    document.dispatchEvent(new CustomEvent('status-dictionary-ready', { detail: window.tsStatusDict }));
  }
}

function getFriendlyStatusMeta(raw) {
  if (!raw) return null;
  // Normalize minor variants like "In Review" vs "In review"
  const candidates = [raw, raw.toLowerCase(), raw.replace(/Review/i, 'review')];
  for (const key of Object.keys(window.tsStatusDict)) {
    if (candidates.includes(key) || candidates.includes(key.toLowerCase())) {
      return window.tsStatusDict[key];
    }
  }
  return null;
}

// Update the Status filter dropdown: keep value=raw, show friendly text, add hover tooltip.
function applyFriendlyLabelsToStatusFilter() {
  const select = document.getElementById('filter-status');
  if (!select) return;

  [...select.options].forEach(opt => {
    if (!opt.value) return; // keep "Any"
    const meta = getFriendlyStatusMeta(opt.value);
    if (meta && meta.label) {
      opt.textContent = meta.label; // visible label (short/friendly)
      opt.title = `${opt.value} — ${meta.description || meta.label}`; // hover detail
    }
  });
}

// Ensure dropdown is updated immediately and again after any async SP load.
document.addEventListener('DOMContentLoaded', () => {
  applyFriendlyLabelsToStatusFilter(); // fallback mapping now
  loadStatusDictionary();              // attempt SharePoint override (no-op if unavailable)
});

// ===== UTILITY FUNCTIONS =====
// Best‑effort helper: infer the current SharePoint Web URL from location when
// _spPageContextInfo is not available (e.g., classic/aspx page embeds).
function inferSharePointWebUrl(loc) {
    try {
        const url = new URL(loc.href);
        // Common SP path roots: /sites/<collection>/<web>/..., /teams/<collection>/...
        // We preserve up to the page library or web root.
        const parts = url.pathname.split('/').filter(Boolean);
        const prefixes = ['sites', 'teams'];
        const idx = parts.findIndex(p => prefixes.includes(p.toLowerCase()));
        if (idx >= 0) {
            // Keep up to at least collection; if deeper webs exist, keep until 'Pages' or 'SitePages'
            let end = parts.length;
            const stopAt = parts.findIndex(p => /^(pages|sitepages)$/i.test(p));
            if (stopAt > idx) end = stopAt; // stop before Pages/SitePages for a clean web URL
            const webPath = [''].concat(parts.slice(0, Math.max(idx + 2, end))).join('/');
            return `${url.origin}${webPath}`;
        }
        // Fallback to origin if structure is unknown
        return url.origin;
    } catch {
        return window.location.origin;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new InnovationPortal();
    window.app = app;

    // Handle URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'submit', 'track'].includes(hash)) {
        app.switchView(hash);
    } else {
        // Default to home view and start home tutorial if first visit
        if (window.tutorialManager) {
            setTimeout(() => {
                window.tutorialManager.startForView('home');
            }, 1000);
        }
    }
});
