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
        
        // SharePoint Configuration
        this.sharePointConfig = {
            siteUrl: window.location.origin, // Adjust as needed
            listName: 'InnovationIdeas',
            libraryName: 'IdeaAttachments',
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
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.setupSubmitForm();
        this.setupTrackingView();
        this.setupModals();
        await this.loadSampleData();
        this.renderAll();
        this.animateKPIs();
        console.log('🚀 Innovation Portal V5 initialized with SharePoint integration');
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
            } else if (viewName === 'submit') {
                // Initialize progress tracking for submit form
                setTimeout(() => {
                    this.setupFormProgress();
                }, 100);
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
            console.log(`📊 Progress Update: ${Math.round(overallProgress)}% (${Math.round(totalProgress)}/${sectionCount * 100})`);
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
    }

    animateNumber(element, start, end) {
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
        const celebration = document.createElement('div');
        celebration.className = 'completion-celebration';
        celebration.innerHTML = `
            <div class="sparkle sparkle-1">✨</div>
            <div class="sparkle sparkle-2">🎉</div>
            <div class="sparkle sparkle-3">⭐</div>
            <div class="sparkle sparkle-4">💫</div>
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
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

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
                ...formData,
                attachmentUrls
            };
            
            const savedIdea = await this.saveIdeaToSharePoint(ideaData);
            
            // Update local state
            const idea = {
                id: savedIdea.d.Id.toString(),
                ...formData,
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
            
            setTimeout(() => {
                this.switchView('track');
            }, 1500);
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showLoading(false);
            this.showNotification('Failed to submit idea. Please try again.', 'error');
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

    // ===== DATA LOADING (SHAREPOINT INTEGRATION) =====
    async loadSampleData() {
        try {
            // Try to load from SharePoint first
            const sharepointIdeas = await this.loadIdeasFromSharePoint();
            if (sharepointIdeas.length > 0) {
                this.ideas = sharepointIdeas;
                return;
            }
        } catch (error) {
            console.warn('Could not load from SharePoint, using sample data:', error);
        }
        
        // Fallback to sample data if SharePoint is not available
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

    // ===== SHAREPOINT API METHODS =====
    async getRequestDigest() {
        try {
            const response = await fetch(`${this.sharePointConfig.siteUrl}/_api/contextinfo`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                }
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
                    body: arrayBuffer
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
                        'SubmitterEmail': ideaData.email,
                        'Tags': ideaData.tags ? ideaData.tags.join(';') : '',
                        'Status': 'Submitted',
                        'AttachmentUrls': ideaData.attachmentUrls ? ideaData.attachmentUrls.join(';') : '',
                        'IsAnonymous': ideaData.anonymous
                    })
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

    async loadIdeasFromSharePoint() {
        try {
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.listName}')/items?$orderby=Created desc`,
                {
                    headers: {
                        'Accept': 'application/json;odata=verbose'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Load failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.d.results.map(item => ({
                id: item.Id.toString(),
                title: item.Title,
                category: item.Category,
                dept: item.Department,
                problem: item.Problem,
                solution: item.Solution,
                impact: item.ExpectedImpact,
                effort: item.EstimatedEffort,
                resources: item.RequiredResources,
                owner: item.IsAnonymous ? 'Anonymous' : item.SubmitterName,
                email: item.SubmitterEmail,
                tags: item.Tags ? item.Tags.split(';') : [],
                status: item.Status || 'Submitted',
                updated: new Date(item.Modified).getTime(),
                progress: this.calculateProgress(item.Status),
                self: item.SubmitterEmail === this.currentUser.email,
                votes: item.Votes || 0,
                attachmentUrls: item.AttachmentUrls ? item.AttachmentUrls.split(';') : []
            }));
        } catch (error) {
            console.error('Error loading ideas from SharePoint:', error);
            return [];
        }
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

document.addEventListener('DOMContentLoaded', async () => {
    app = new InnovationPortal();
    
    // Handle URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'submit', 'track'].includes(hash)) {
        app.switchView(hash);
    }
});

// Global app reference for onclick handlers
window.app = app;