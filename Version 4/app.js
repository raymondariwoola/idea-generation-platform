// Application State
class AppState {
    constructor() {
        this.currentView = 'home';
        this.ideas = [];
        this.currentUser = {
            name: 'John Doe',
            department: 'Engineering',
            id: 'user123'
        };
        this.drafts = this.loadDrafts();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupFormHandlers();
        this.setupTrackingView();
        this.setupModals();
        this.loadSampleIdeas();
        this.animateStats();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const views = document.querySelectorAll('.view');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.getAttribute('data-view');
                this.switchView(targetView);
                
                // Update active nav button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Hero action buttons
        document.querySelector('[data-action="submit-idea"]')?.addEventListener('click', () => {
            this.switchView('submit');
        });

        document.querySelector('[data-action="explore"]')?.addEventListener('click', () => {
            this.switchView('track');
        });
    }

    switchView(viewName) {
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Update nav buttons
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

            // Trigger view-specific actions
            if (viewName === 'track') {
                this.refreshIdeasList();
            }
        }
    }

    setupFormHandlers() {
        const form = document.getElementById('idea-form');
        const fileUpload = document.getElementById('attachments');
        const fileUploadArea = document.getElementById('file-upload-area');
        
        if (!form) return;

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIdea();
        });

        // Save draft
        document.getElementById('save-draft')?.addEventListener('click', () => {
            this.saveDraft();
        });

        // File upload handling
        if (fileUploadArea && fileUpload) {
            fileUploadArea.addEventListener('click', () => fileUpload.click());
            
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = 'var(--primary-color)';
                fileUploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.style.borderColor = 'var(--dark-border)';
                fileUploadArea.style.background = 'transparent';
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.borderColor = 'var(--dark-border)';
                fileUploadArea.style.background = 'transparent';
                
                const files = Array.from(e.dataTransfer.files);
                this.handleFiles(files);
            });

            fileUpload.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
            });
        }

        // Form progress tracking
        this.setupFormProgress();
    }

    setupFormProgress() {
        const form = document.getElementById('idea-form');
        if (!form) return;

        const basicFields = ['idea-title', 'category', 'department'];
        const detailFields = ['description', 'problem', 'solution'];
        const impactFields = ['impact', 'timeline'];

        const updateProgress = () => {
            this.updateSectionProgress('basic-progress', basicFields);
            this.updateSectionProgress('details-progress', detailFields);
            this.updateSectionProgress('impact-progress', impactFields);
        };

        // Add event listeners to all form fields
        const allFields = [...basicFields, ...detailFields, ...impactFields];
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
        if (!progressBar) return;

        const filledFields = fieldIds.filter(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        const percentage = (filledFields.length / fieldIds.length) * 100;
        progressBar.style.width = `${percentage}%`;
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

        // Simulate API call
        this.showLoading(true);
        
        setTimeout(() => {
            const idea = {
                id: this.generateId(),
                ...formData,
                status: 'submitted',
                submittedAt: new Date().toISOString(),
                submittedBy: this.currentUser.name,
                department: formData.department,
                votes: 0,
                comments: []
            };

            this.ideas.unshift(idea);
            this.saveIdeas();
            this.clearForm();
            this.showLoading(false);
            this.showNotification('Idea submitted successfully!', 'success');
            
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
            savedAt: new Date().toISOString()
        };

        this.drafts.push(draft);
        this.saveDrafts();
        this.showNotification('Draft saved successfully!', 'success');
    }

    getFormData() {
        const form = document.getElementById('idea-form');
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    validateForm(data) {
        const requiredFields = ['title', 'category', 'department', 'description', 'problem', 'solution'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');

        if (missingFields.length > 0) {
            this.showNotification('Please fill in all required fields.', 'error');
            return false;
        }

        return true;
    }

    clearForm() {
        const form = document.getElementById('idea-form');
        if (form) {
            form.reset();
            
            // Clear file list
            const fileList = document.getElementById('file-list');
            if (fileList) {
                fileList.innerHTML = '';
            }

            // Reset progress bars
            document.querySelectorAll('.progress-fill').forEach(bar => {
                bar.style.width = '0%';
            });
        }
    }

    setupTrackingView() {
        // Filter functionality
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-ideas');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterIdeas());
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterIdeas());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterIdeas());
        }

        // View toggle
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.getAttribute('data-view');
                this.toggleIdeasView(view);
            });
        });
    }

    filterIdeas() {
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const searchTerm = document.getElementById('search-ideas')?.value.toLowerCase() || '';

        let filteredIdeas = this.ideas.filter(idea => {
            const matchesStatus = !statusFilter || idea.status === statusFilter;
            const matchesCategory = !categoryFilter || idea.category === categoryFilter;
            const matchesSearch = !searchTerm || 
                idea.title.toLowerCase().includes(searchTerm) ||
                idea.description.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesCategory && matchesSearch;
        });

        this.renderIdeas(filteredIdeas);
    }

    toggleIdeasView(view) {
        const ideasList = document.getElementById('ideas-list');
        if (!ideasList) return;

        if (view === 'grid') {
            ideasList.style.display = 'grid';
            ideasList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
            ideasList.style.gap = 'var(--spacing-6)';
        } else {
            ideasList.style.display = 'flex';
            ideasList.style.flexDirection = 'column';
            ideasList.style.gap = 'var(--spacing-4)';
        }
    }

    refreshIdeasList() {
        this.renderIdeas(this.ideas);
        this.updateOverviewStats();
    }

    renderIdeas(ideas) {
        const ideasList = document.getElementById('ideas-list');
        if (!ideasList) return;

        if (ideas.length === 0) {
            ideasList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: var(--spacing-16); color: var(--gray-400);">
                    <i class="fas fa-lightbulb" style="font-size: var(--font-size-5xl); margin-bottom: var(--spacing-4); opacity: 0.3;"></i>
                    <h3 style="margin-bottom: var(--spacing-2);">No ideas found</h3>
                    <p>Start by submitting your first innovative idea!</p>
                </div>
            `;
            return;
        }

        ideasList.innerHTML = ideas.map(idea => this.createIdeaCard(idea)).join('');
    }

    createIdeaCard(idea) {
        const timeAgo = this.getTimeAgo(idea.submittedAt);
        const statusClass = `status-${idea.status.replace(' ', '-')}`;

        return `
            <div class="idea-card" onclick="app.showIdeaDetails('${idea.id}')">
                <div class="idea-header">
                    <div>
                        <h3 class="idea-title">${idea.title}</h3>
                        <div class="idea-meta">
                            <span><i class="fas fa-user"></i> ${idea.submittedBy}</span>
                            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                            <span><i class="fas fa-building"></i> ${idea.department}</span>
                        </div>
                    </div>
                    <span class="idea-status ${statusClass}">${this.formatStatus(idea.status)}</span>
                </div>
                <p class="idea-description">${idea.description}</p>
                <div class="idea-footer">
                    <span class="idea-category">${this.formatCategory(idea.category)}</span>
                    <div style="display: flex; gap: var(--spacing-4); align-items: center;">
                        ${idea.votes > 0 ? `<span><i class="fas fa-thumbs-up"></i> ${idea.votes}</span>` : ''}
                        ${idea.comments?.length > 0 ? `<span><i class="fas fa-comments"></i> ${idea.comments.length}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    updateOverviewStats() {
        const stats = this.calculateStats();
        
        // Update overview cards
        const overviewCards = document.querySelectorAll('.overview-number');
        if (overviewCards.length >= 4) {
            overviewCards[0].textContent = stats.total;
            overviewCards[1].textContent = stats.underReview;
            overviewCards[2].textContent = stats.implemented;
            overviewCards[3].textContent = stats.impactScore;
        }
    }

    calculateStats() {
        const total = this.ideas.length;
        const underReview = this.ideas.filter(idea => 
            ['submitted', 'under-review'].includes(idea.status)
        ).length;
        const implemented = this.ideas.filter(idea => 
            idea.status === 'implemented'
        ).length;
        const impactScore = this.ideas.reduce((score, idea) => {
            const points = {
                'implemented': 100,
                'in-development': 50,
                'approved': 30,
                'under-review': 10,
                'submitted': 5
            };
            return score + (points[idea.status] || 0);
        }, 0);

        return { total, underReview, implemented, impactScore };
    }

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

        // ESC key to close modal
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
        const timeAgo = this.getTimeAgo(idea.submittedAt);
        const statusClass = `status-${idea.status.replace(' ', '-')}`;

        return `
            <div class="idea-details">
                <div class="detail-header" style="margin-bottom: var(--spacing-6);">
                    <div class="detail-meta" style="display: flex; gap: var(--spacing-6); margin-bottom: var(--spacing-4); flex-wrap: wrap;">
                        <span><i class="fas fa-user"></i> ${idea.submittedBy}</span>
                        <span><i class="fas fa-building"></i> ${idea.department}</span>
                        <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                        <span class="idea-status ${statusClass}">${this.formatStatus(idea.status)}</span>
                    </div>
                    <div class="detail-category" style="margin-bottom: var(--spacing-4);">
                        <strong>Category:</strong> ${this.formatCategory(idea.category)}
                    </div>
                </div>

                <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                    <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Description</h4>
                    <p style="color: var(--gray-300); line-height: 1.6;">${idea.description}</p>
                </div>

                <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                    <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Problem Statement</h4>
                    <p style="color: var(--gray-300); line-height: 1.6;">${idea.problem}</p>
                </div>

                <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                    <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Proposed Solution</h4>
                    <p style="color: var(--gray-300); line-height: 1.6;">${idea.solution}</p>
                </div>

                ${idea.impact ? `
                    <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                        <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Expected Impact</h4>
                        <p style="color: var(--gray-300); line-height: 1.6;">${this.formatImpact(idea.impact)}</p>
                    </div>
                ` : ''}

                ${idea.timeline ? `
                    <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                        <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Implementation Timeline</h4>
                        <p style="color: var(--gray-300); line-height: 1.6;">${this.formatTimeline(idea.timeline)}</p>
                    </div>
                ` : ''}

                ${idea.resources ? `
                    <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                        <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Required Resources</h4>
                        <p style="color: var(--gray-300); line-height: 1.6;">${idea.resources}</p>
                    </div>
                ` : ''}

                ${idea.benefits ? `
                    <div class="detail-section" style="margin-bottom: var(--spacing-6);">
                        <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-3);">Expected Benefits</h4>
                        <p style="color: var(--gray-300); line-height: 1.6;">${idea.benefits}</p>
                    </div>
                ` : ''}

                <div class="detail-actions" style="display: flex; gap: var(--spacing-4); margin-top: var(--spacing-8); padding-top: var(--spacing-6); border-top: 1px solid var(--dark-border);">
                    <button class="btn btn-primary" onclick="app.voteForIdea('${idea.id}')">
                        <i class="fas fa-thumbs-up"></i>
                        Vote (${idea.votes || 0})
                    </button>
                    <button class="btn btn-secondary" onclick="app.shareIdea('${idea.id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
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

    voteForIdea(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (idea) {
            idea.votes = (idea.votes || 0) + 1;
            this.saveIdeas();
            this.refreshIdeasList();
            this.showNotification('Vote recorded!', 'success');
            
            // Update the modal if it's open
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
                text: idea.description,
                url: window.location.href
            });
        } else {
            // Fallback to copying to clipboard
            const url = `${window.location.href}?idea=${ideaId}`;
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            });
        }
    }

    animateStats() {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateStatNumbers();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }

    animateStatNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateNumber = () => {
                current += step;
                if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = target;
                }
            };

            updateNumber();
        });
    }

    loadSampleIdeas() {
        const sampleIdeas = [
            {
                id: 'idea-1',
                title: 'AI-Powered Code Review Assistant',
                description: 'Implement an AI system that can automatically review code submissions, identify potential bugs, suggest optimizations, and ensure coding standards compliance.',
                problem: 'Manual code reviews are time-consuming and can miss subtle issues, leading to technical debt and potential security vulnerabilities.',
                solution: 'Deploy machine learning models trained on best practices and common bug patterns to provide instant, comprehensive code analysis.',
                category: 'technology',
                department: 'Engineering',
                status: 'implemented',
                submittedAt: '2024-01-15T10:30:00Z',
                submittedBy: 'Alice Johnson',
                votes: 23,
                impact: 'high',
                timeline: 'medium',
                resources: 'ML engineer, cloud computing resources, integration with existing CI/CD pipeline',
                benefits: 'Reduced bug count by 40%, faster development cycles, improved code quality standards',
                comments: []
            },
            {
                id: 'idea-2',
                title: 'Employee Wellness Dashboard',
                description: 'Create a comprehensive dashboard that tracks employee wellness metrics, provides personalized health recommendations, and connects with local fitness facilities.',
                problem: 'Employee burnout and health issues are affecting productivity and job satisfaction across the organization.',
                solution: 'Develop a web-based platform that integrates with wearable devices and provides actionable insights for both employees and HR.',
                category: 'workplace',
                department: 'Human Resources',
                status: 'in-development',
                submittedAt: '2024-02-08T14:20:00Z',
                submittedBy: 'Michael Chen',
                votes: 18,
                impact: 'medium',
                timeline: 'long',
                resources: 'Full-stack developer, UX designer, partnerships with health providers',
                benefits: 'Improved employee satisfaction, reduced healthcare costs, better work-life balance',
                comments: []
            },
            {
                id: 'idea-3',
                title: 'Sustainable Office Energy Management',
                description: 'Implement IoT sensors and smart controls to optimize energy usage throughout office buildings, reducing environmental impact and operational costs.',
                problem: 'Current energy consumption is inefficient, with lights, HVAC, and equipment running unnecessarily during off-hours.',
                solution: 'Deploy smart sensors that detect occupancy and automatically adjust lighting, temperature, and equipment based on real-time usage patterns.',
                category: 'sustainability',
                department: 'Operations',
                status: 'approved',
                submittedAt: '2024-03-12T09:45:00Z',
                submittedBy: 'Sarah Williams',
                votes: 31,
                impact: 'high',
                timeline: 'short',
                resources: 'IoT hardware, electrical contractor, building management system integration',
                benefits: '25% reduction in energy costs, improved environmental footprint, automated building operations',
                comments: []
            },
            {
                id: 'idea-4',
                title: 'Customer Journey Analytics Platform',
                description: 'Build a real-time analytics platform that tracks customer interactions across all touchpoints to identify optimization opportunities and improve user experience.',
                problem: 'Customer data is siloed across different departments, making it difficult to understand the complete customer journey and identify pain points.',
                solution: 'Create a unified analytics platform that aggregates data from all customer touchpoints and provides actionable insights through machine learning.',
                category: 'customer',
                department: 'Marketing',
                status: 'under-review',
                submittedAt: '2024-03-20T16:10:00Z',
                submittedBy: 'David Rodriguez',
                votes: 12,
                impact: 'high',
                timeline: 'medium',
                resources: 'Data engineers, cloud infrastructure, integration with existing CRM and support systems',
                benefits: 'Improved customer satisfaction scores, increased conversion rates, reduced churn',
                comments: []
            },
            {
                id: 'idea-5',
                title: 'Automated Invoice Processing System',
                description: 'Develop an AI-powered system that can automatically process, validate, and approve invoices, reducing manual work and improving accuracy.',
                problem: 'Manual invoice processing is prone to errors, time-consuming, and creates bottlenecks in the payment process.',
                solution: 'Implement OCR and machine learning algorithms to extract data from invoices, validate against purchase orders, and route for appropriate approvals.',
                category: 'process',
                department: 'Finance',
                status: 'submitted',
                submittedAt: '2024-03-25T11:30:00Z',
                submittedBy: 'Lisa Thompson',
                votes: 8,
                impact: 'medium',
                timeline: 'short',
                resources: 'AI/ML developer, integration with accounting software, document management system',
                benefits: '60% reduction in processing time, improved accuracy, better vendor relationships',
                comments: []
            }
        ];

        // Only load sample data if no ideas exist
        if (this.ideas.length === 0) {
            this.ideas = sampleIdeas;
            this.saveIdeas();
        }
    }

    // Utility methods
    generateId() {
        return 'idea-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    formatStatus(status) {
        const statusMap = {
            'draft': 'Draft',
            'submitted': 'Submitted',
            'under-review': 'Under Review',
            'approved': 'Approved',
            'in-development': 'In Development',
            'implemented': 'Implemented',
            'declined': 'Declined'
        };
        return statusMap[status] || status;
    }

    formatCategory(category) {
        const categoryMap = {
            'technology': 'Technology & Innovation',
            'process': 'Process Improvement',
            'product': 'Product Development',
            'customer': 'Customer Experience',
            'sustainability': 'Sustainability',
            'workplace': 'Workplace Enhancement',
            'other': 'Other'
        };
        return categoryMap[category] || category;
    }

    formatImpact(impact) {
        const impactMap = {
            'low': 'Low - Minor improvements',
            'medium': 'Medium - Significant improvements',
            'high': 'High - Major transformation'
        };
        return impactMap[impact] || impact;
    }

    formatTimeline(timeline) {
        const timelineMap = {
            'immediate': 'Immediate (< 1 month)',
            'short': 'Short-term (1-3 months)',
            'medium': 'Medium-term (3-6 months)',
            'long': 'Long-term (6+ months)'
        };
        return timelineMap[timeline] || timeline;
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
        const notificationIcon = notification.querySelector('.notification-icon');
        const notificationText = notification.querySelector('.notification-text');

        if (!notification || !notificationIcon || !notificationText) return;

        // Reset classes
        notification.className = 'notification';
        
        // Set content
        notificationText.textContent = message;
        
        // Set type and icon
        notification.classList.add(type);
        if (type === 'success') {
            notificationIcon.className = 'notification-icon fas fa-check-circle';
        } else if (type === 'error') {
            notificationIcon.className = 'notification-icon fas fa-exclamation-circle';
        }

        // Show notification
        notification.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Local storage methods
    saveIdeas() {
        localStorage.setItem('innovation-portal-ideas', JSON.stringify(this.ideas));
    }

    loadIdeas() {
        const stored = localStorage.getItem('innovation-portal-ideas');
        return stored ? JSON.parse(stored) : [];
    }

    saveDrafts() {
        localStorage.setItem('innovation-portal-drafts', JSON.stringify(this.drafts));
    }

    loadDrafts() {
        const stored = localStorage.getItem('innovation-portal-drafts');
        return stored ? JSON.parse(stored) : [];
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new AppState();
    
    // Load existing ideas from localStorage
    app.ideas = app.loadIdeas();
    
    // If no ideas in localStorage, load sample ideas
    if (app.ideas.length === 0) {
        app.loadSampleIdeas();
    }
    
    // Refresh the tracking view
    app.refreshIdeasList();
});

// Global helper functions (needed for onclick handlers in dynamically generated content)
window.app = app;