// Enhanced Innovation Portal Admin V5
// Comprehensive admin dashboard for managing ideas and analytics

class InnovationAdminPortal {
    constructor() {
        this.currentView = 'dashboard';
        this.ideas = [];
        this.users = [];
        this.selectedIdeas = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            status: '',
            category: '',
            priority: ''
        };
        
        // SharePoint Configuration
        this.sharePointConfig = {
            siteUrl: window.location.origin, // Adjust as needed
            listName: 'InnovationIdeas',
            libraryName: 'IdeaAttachments',
            adminGroupName: 'Innovation Portal Administrators', // SharePoint group name
            fallbackAdminEmails: [
                'admin@company.com',
                'innovation-admin@company.com',
                'system-admin@company.com'
            ]
        };
        
        this.currentAdmin = {
            name: 'Admin User',
            email: 'admin@company.com',
            role: 'System Administrator',
            id: 'admin123',
            isAuthenticated: false,
            permissions: []
        };
        
        this.isAuthorized = false;
        this.authCheckComplete = false;
        
        this.init();
    }

    async init() {
        try {
            // First check authentication and authorization
            await this.checkAdminAuthentication();
            
            if (!this.isAuthorized) {
                this.showUnauthorizedView();
                return;
            }
            
            this.setupNavigation();
            this.setupEventListeners();
            this.setupModals();
            await this.loadData();
            this.renderCurrentView();
            this.startRealTimeUpdates();
            // console.log('🚀 Innovation Admin Portal V5 initialized for authorized user');
        } catch (error) {
            console.error('Admin portal initialization failed:', error);
            this.showAuthenticationError(error);
        }
    }

    // ===== AUTHENTICATION & AUTHORIZATION =====
    async checkAdminAuthentication() {
        try {
            // Get current user from SharePoint
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser) {
                throw new Error('Unable to authenticate user');
            }
            
            this.currentAdmin = {
                name: currentUser.Title,
                email: currentUser.Email,
                id: currentUser.Id.toString(),
                loginName: currentUser.LoginName,
                isAuthenticated: true,
                permissions: []
            };
            
            // Check if user is in admin group
            const isInAdminGroup = await this.checkAdminGroupMembership(currentUser.Id);
            
            // Check fallback admin emails if group check fails
            const isFallbackAdmin = this.sharePointConfig.fallbackAdminEmails.includes(currentUser.Email.toLowerCase());
            
            // Check site permissions as additional verification
            const hasSiteAdminPermissions = await this.checkSiteAdminPermissions();
            
            this.isAuthorized = isInAdminGroup || isFallbackAdmin || hasSiteAdminPermissions;
            
            if (this.isAuthorized) {
                this.currentAdmin.role = this.determineAdminRole(isInAdminGroup, isFallbackAdmin, hasSiteAdminPermissions);
                this.logAdminAccess();
            } else {
                this.logUnauthorizedAccess();
            }
            
            this.authCheckComplete = true;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.authCheckComplete = true;
            throw error;
        }
    }
    
    async getCurrentUser() {
        try {
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/currentuser`,
                {
                    headers: {
                        'Accept': 'application/json;odata=verbose'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to get current user: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.d;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }
    
    async checkAdminGroupMembership(userId) {
        try {
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/sitegroups/getbyname('${this.sharePointConfig.adminGroupName}')/users?$filter=Id eq ${userId}`,
                {
                    headers: {
                        'Accept': 'application/json;odata=verbose'
                    }
                }
            );
            
            if (!response.ok) {
                // Group might not exist, return false
                console.warn(`Admin group '${this.sharePointConfig.adminGroupName}' not found`);
                return false;
            }
            
            const data = await response.json();
            return data.d.results.length > 0;
        } catch (error) {
            console.error('Error checking group membership:', error);
            return false;
        }
    }
    
    async checkSiteAdminPermissions() {
        try {
            // Check if user has full control or manage permissions
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/effectiveBasePermissions`,
                {
                    headers: {
                        'Accept': 'application/json;odata=verbose'
                    }
                }
            );
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            const permissions = data.d.EffectiveBasePermissions;
            
            // Check for ManageWeb (63) or FullMask (65) permissions
            // These are high-level permissions that indicate admin access
            const hasManageWeb = this.hasPermission(permissions, 63);
            const hasFullControl = this.hasPermission(permissions, 65);
            
            return hasManageWeb || hasFullControl;
        } catch (error) {
            console.error('Error checking site permissions:', error);
            return false;
        }
    }
    
    hasPermission(permissions, permissionBit) {
        // SharePoint permission checking logic
        const high = permissions.High;
        const low = permissions.Low;
        
        if (permissionBit >= 32) {
            return (high & (1 << (permissionBit - 32))) !== 0;
        } else {
            return (low & (1 << permissionBit)) !== 0;
        }
    }
    
    determineAdminRole(isInAdminGroup, isFallbackAdmin, hasSiteAdminPermissions) {
        if (hasSiteAdminPermissions) {
            return 'Site Administrator';
        } else if (isInAdminGroup) {
            return 'Innovation Administrator';
        } else if (isFallbackAdmin) {
            return 'System Administrator';
        } else {
            return 'Administrator';
        }
    }
    
    logAdminAccess() {
        // console.log(`Admin access granted to ${this.currentAdmin.email} (${this.currentAdmin.role})`);
        
        // Optional: Log to SharePoint list for audit trail
        this.logAuditEvent('ADMIN_ACCESS_GRANTED', {
            user: this.currentAdmin.email,
            role: this.currentAdmin.role,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: 'Client-side logged' // Server-side would capture real IP
        });
    }
    
    logUnauthorizedAccess() {
        console.warn(`Unauthorized admin access attempt by ${this.currentAdmin.email}`);
        
        // Log unauthorized access attempt
        this.logAuditEvent('ADMIN_ACCESS_DENIED', {
            user: this.currentAdmin.email,
            reason: 'Insufficient permissions',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
    }
    
    async logAuditEvent(eventType, eventData) {
        try {
            // Optional: Create audit log in SharePoint
            const digest = await this.getRequestDigest();
            
            await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('AdminAuditLog')/items`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest
                    },
                    body: JSON.stringify({
                        '__metadata': { 'type': 'SP.Data.AdminAuditLogListItem' },
                        'Title': eventType,
                        'EventData': JSON.stringify(eventData)
                    })
                }
            );
        } catch (error) {
            // Audit logging is optional, don't fail if it doesn't work
            console.warn('Could not log audit event:', error);
        }
    }
    
    showUnauthorizedView() {
        document.body.innerHTML = `
            <div class="unauthorized-container">
                <div class="unauthorized-content">
                    <div class="unauthorized-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to access the Innovation Portal Admin Dashboard.</p>
                    <div class="unauthorized-details">
                        <p><strong>User:</strong> ${this.currentAdmin.email}</p>
                        <p><strong>Required:</strong> Innovation Portal Administrator permissions</p>
                    </div>
                    <div class="unauthorized-actions">
                        <a href="index.html" class="btn btn-primary">
                            <i class="fas fa-arrow-left"></i>
                            Return to User Portal
                        </a>
                        <button class="btn btn-secondary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i>
                            Try Again
                        </button>
                    </div>
                    <div class="unauthorized-help">
                        <p>Need access? Contact your system administrator.</p>
                    </div>
                </div>
            </div>
            <style>
                .unauthorized-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
                    font-family: 'Inter', sans-serif;
                    color: #e8f0ff;
                    padding: 2rem;
                }
                .unauthorized-content {
                    text-align: center;
                    max-width: 500px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 3rem;
                    backdrop-filter: blur(20px);
                }
                .unauthorized-icon {
                    font-size: 4rem;
                    color: #ff6b6b;
                    margin-bottom: 2rem;
                }
                .unauthorized-content h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .unauthorized-content p {
                    color: #b8c8e8;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }
                .unauthorized-details {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                    text-align: left;
                }
                .unauthorized-details p {
                    margin: 0.5rem 0;
                    font-size: 0.9rem;
                }
                .unauthorized-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin: 2rem 0;
                    flex-wrap: wrap;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    text-decoration: none;
                    font-family: inherit;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #00d4ff, #7c3aed);
                    color: #08101a;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(0, 212, 255, 0.4);
                }
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #e8f0ff;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.12);
                }
                .unauthorized-help {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .unauthorized-help p {
                    font-size: 0.85rem;
                    color: #8a9bc8;
                }
            </style>
        `;
    }
    
    showAuthenticationError(error) {
        document.body.innerHTML = `
            <div class="auth-error-container">
                <div class="auth-error-content">
                    <div class="auth-error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1>Authentication Error</h1>
                    <p>Unable to verify your credentials. Please try again.</p>
                    <div class="error-details">
                        <p><strong>Error:</strong> ${error.message}</p>
                    </div>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i>
                            Retry Authentication
                        </button>
                        <a href="index.html" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i>
                            Return to Portal
                        </a>
                    </div>
                </div>
            </div>
            <style>
                .auth-error-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
                    font-family: 'Inter', sans-serif;
                    color: #e8f0ff;
                    padding: 2rem;
                }
                .auth-error-content {
                    text-align: center;
                    max-width: 500px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 3rem;
                    backdrop-filter: blur(20px);
                }
                .auth-error-icon {
                    font-size: 4rem;
                    color: #fbbf24;
                    margin-bottom: 2rem;
                }
                .auth-error-content h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .error-details {
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                    text-align: left;
                }
                .error-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                    flex-wrap: wrap;
                }
            </style>
        `;
    }
    
    // Method to re-check authorization (useful for testing)
    async refreshAuthorization() {
        this.isAuthorized = false;
        this.authCheckComplete = false;
        await this.checkAdminAuthentication();
        
        if (this.isAuthorized) {
            window.location.reload();
        } else {
            this.showUnauthorizedView();
        }
    }

    // ===== NAVIGATION SYSTEM =====
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.getAttribute('data-view');
                this.switchView(targetView);
            });
        });
    }

    switchView(viewName) {
        const views = document.querySelectorAll('.admin-view');
        const navButtons = document.querySelectorAll('.nav-btn');

        views.forEach(view => view.classList.remove('active'));
        navButtons.forEach(btn => btn.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}-view`);
        const targetNav = document.querySelector(`[data-view="${viewName}"]`);

        if (targetView && targetNav) {
            targetView.classList.add('active');
            targetNav.classList.add('active');
            this.currentView = viewName;
            
            this.renderCurrentView();
            window.location.hash = viewName;
        }
    }

    // ===== EVENT LISTENERS SETUP =====
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('admin-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filters.search = searchInput.value;
                this.filterAndRenderIdeas();
            }, 300));
        }

        // Filter controls
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const priorityFilter = document.getElementById('priority-filter');

        [statusFilter, categoryFilter, priorityFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filters.status = statusFilter?.value || '';
                    this.filters.category = categoryFilter?.value || '';
                    this.filters.priority = priorityFilter?.value || '';
                    this.filterAndRenderIdeas();
                });
            }
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk actions
        document.querySelectorAll('[data-bulk]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.bulk;
                this.handleBulkAction(action);
            });
        });

        // Quick actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));

        // Export and bulk actions
        const exportBtn = document.getElementById('export-data');
        const bulkActionsBtn = document.getElementById('bulk-actions');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
        if (bulkActionsBtn) bulkActionsBtn.addEventListener('click', () => this.showBulkActionsPanel());
    }

    // ===== DATA LOADING (SHAREPOINT INTEGRATION) =====
    async loadData() {
        try {
            await this.loadIdeasFromSharePoint();
            this.generateMockUsers();
            this.updateDashboardKPIs();
        } catch (error) {
            console.warn('Could not load from SharePoint, using sample data:', error);
            this.loadSampleData();
        }
    }

    async loadIdeasFromSharePoint() {
        try {
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.listName}')/items?$orderby=Created desc&$top=1000`,
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
            this.ideas = data.d.results.map(item => ({
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
                priority: this.calculatePriority(item),
                submitted: new Date(item.Created).getTime(),
                updated: new Date(item.Modified).getTime(),
                votes: item.Votes || 0,
                attachmentUrls: item.AttachmentUrls ? item.AttachmentUrls.split(';') : [],
                comments: [],
                adminNotes: item.AdminNotes || ''
            }));
        } catch (error) {
            console.error('Error loading ideas from SharePoint:', error);
            this.loadSampleData();
        }
    }

    calculatePriority(item) {
        // Priority calculation based on multiple factors
        let score = 0;
        
        // Impact weight
        const impactWeight = {
            'Revenue growth': 3,
            'Cost reduction': 2,
            'Customer experience': 2,
            'Operational efficiency': 2,
            'Risk & compliance': 1
        };
        score += impactWeight[item.ExpectedImpact] || 1;
        
        // Effort weight (inverse - lower effort = higher priority)
        const effortWeight = {
            'Low': 3,
            'Medium': 2,
            'High': 1
        };
        score += effortWeight[item.EstimatedEffort] || 1;
        
        // Age factor (newer ideas get slight boost)
        const daysSinceSubmission = (Date.now() - new Date(item.Created).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSubmission <= 7) score += 1;
        
        // Votes factor
        score += Math.min((item.Votes || 0) * 0.1, 2);
        
        if (score >= 6) return 'High';
        if (score >= 4) return 'Medium';
        return 'Low';
    }

    loadSampleData() {
        this.ideas = [
            {
                id: '1',
                title: 'AI-Powered Code Review Assistant',
                category: 'Tech',
                dept: 'Engineering',
                problem: 'Manual code reviews are time-consuming and can miss subtle issues.',
                solution: 'Deploy machine learning models trained on best practices to provide instant analysis.',
                impact: 'Operational efficiency',
                effort: 'Medium',
                resources: 'ML engineer, cloud computing resources',
                owner: 'Alice Johnson',
                email: 'alice@company.com',
                tags: ['AI', 'automation', 'code-quality'],
                status: 'Submitted',
                priority: 'High',
                submitted: Date.now() - 86400000 * 2,
                updated: Date.now() - 86400000 * 1,
                votes: 15,
                attachmentUrls: [],
                comments: [],
                adminNotes: ''
            },
            {
                id: '2',
                title: 'Employee Wellness Dashboard',
                category: 'Process',
                dept: 'Human Resources',
                problem: 'Employee burnout affecting productivity and satisfaction.',
                solution: 'Comprehensive dashboard tracking wellness metrics with personalized recommendations.',
                impact: 'Customer experience',
                effort: 'High',
                resources: 'Full-stack developer, UX designer, health partnerships',
                owner: 'Michael Chen',
                email: 'michael@company.com',
                tags: ['wellness', 'dashboard', 'analytics'],
                status: 'In review',
                priority: 'Medium',
                submitted: Date.now() - 86400000 * 5,
                updated: Date.now() - 86400000 * 2,
                votes: 8,
                attachmentUrls: [],
                comments: [],
                adminNotes: 'Promising concept, needs budget approval'
            },
            {
                id: '3',
                title: 'Sustainable Office Energy Management',
                category: 'Sustainability',
                dept: 'Operations',
                problem: 'Energy consumption inefficient with unnecessary usage during off-hours.',
                solution: 'IoT sensors and smart controls to optimize energy usage throughout buildings.',
                impact: 'Cost reduction',
                effort: 'Low',
                resources: 'IoT hardware, electrical contractor, BMS integration',
                owner: 'Sarah Williams',
                email: 'sarah@company.com',
                tags: ['IoT', 'energy', 'sustainability'],
                status: 'Accepted',
                priority: 'High',
                submitted: Date.now() - 86400000 * 10,
                updated: Date.now() - 86400000 * 3,
                votes: 22,
                attachmentUrls: [],
                comments: [],
                adminNotes: 'Approved for pilot program'
            },
            {
                id: '4',
                title: 'Customer Journey Analytics Platform',
                category: 'Customer',
                dept: 'Marketing',
                problem: 'Customer data siloed across departments, difficult to understand complete journey.',
                solution: 'Real-time analytics platform tracking interactions across all touchpoints.',
                impact: 'Revenue growth',
                effort: 'Medium',
                resources: 'Data engineers, cloud infrastructure, CRM integration',
                owner: 'David Rodriguez',
                email: 'david@company.com',
                tags: ['analytics', 'customer', 'journey'],
                status: 'Rejected',
                priority: 'Low',
                submitted: Date.now() - 86400000 * 15,
                updated: Date.now() - 86400000 * 8,
                votes: 5,
                attachmentUrls: [],
                comments: [],
                adminNotes: 'Budget constraints, revisit next quarter'
            }
        ];
        
        // Generate additional sample ideas for demonstration
        for (let i = 5; i <= 25; i++) {
            this.ideas.push({
                id: i.toString(),
                title: `Innovation Idea ${i}`,
                category: ['Process', 'Product', 'Customer', 'Tech', 'Sustainability'][Math.floor(Math.random() * 5)],
                dept: ['Engineering', 'Marketing', 'HR', 'Operations', 'Finance'][Math.floor(Math.random() * 5)],
                problem: `Sample problem statement for idea ${i}`,
                solution: `Sample solution description for idea ${i}`,
                impact: ['Revenue growth', 'Cost reduction', 'Customer experience', 'Operational efficiency'][Math.floor(Math.random() * 4)],
                effort: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                resources: 'Sample resources required',
                owner: `User ${i}`,
                email: `user${i}@company.com`,
                tags: [`tag${i}`, 'innovation'],
                status: ['Submitted', 'In review', 'Accepted', 'Rejected'][Math.floor(Math.random() * 4)],
                priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
                submitted: Date.now() - Math.random() * 86400000 * 30,
                updated: Date.now() - Math.random() * 86400000 * 10,
                votes: Math.floor(Math.random() * 20),
                attachmentUrls: [],
                comments: [],
                adminNotes: ''
            });
        }
        
        this.generateMockUsers();
        this.updateDashboardKPIs();
    }

    generateMockUsers() {
        const departments = ['Engineering', 'Marketing', 'HR', 'Operations', 'Finance'];
        this.users = [];
        
        // Generate user statistics based on ideas
        const userStats = {};
        this.ideas.forEach(idea => {
            if (!userStats[idea.email]) {
                userStats[idea.email] = {
                    name: idea.owner,
                    email: idea.email,
                    dept: idea.dept,
                    submissions: 0,
                    accepted: 0,
                    totalVotes: 0
                };
            }
            userStats[idea.email].submissions++;
            if (idea.status === 'Accepted') userStats[idea.email].accepted++;
            userStats[idea.email].totalVotes += idea.votes;
        });
        
        this.users = Object.values(userStats);
    }

    // ===== VIEW RENDERING =====
    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'ideas':
                this.renderIdeasManagement();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            case 'users':
                this.renderUserManagement();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    // ===== DASHBOARD RENDERING =====
    renderDashboard() {
        this.updateDashboardKPIs();
        this.renderRecentActivity();
        this.updateQuickActions();
    }

    updateDashboardKPIs() {
        const pendingReview = this.ideas.filter(i => i.status === 'Submitted').length;
        const totalApproved = this.ideas.filter(i => i.status === 'Accepted').length;
        const totalSubmissions = this.ideas.length;
        const activeUsers = new Set(this.ideas.filter(i => 
            i.submitted > Date.now() - 30 * 86400000
        ).map(i => i.email)).size;

        this.animateCounter('pending-review', pendingReview);
        this.animateCounter('total-approved', totalApproved);
        this.animateCounter('total-submissions', totalSubmissions);
        this.animateCounter('active-users', activeUsers);
        
        // Update pending count in quick actions
        const pendingCountEl = document.getElementById('pending-count');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingReview} items`;
        }
    }

    renderRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        // Sort ideas by update time and take recent 5
        const recentIdeas = [...this.ideas]
            .sort((a, b) => b.updated - a.updated)
            .slice(0, 5);

        const activityHTML = recentIdeas.map(idea => {
            const timeAgo = this.getTimeAgo(idea.updated);
            const actionIcon = this.getActivityIcon(idea.status);
            const actionText = this.getActivityText(idea.status);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${actionIcon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${idea.title}</div>
                        <div class="activity-description">${actionText} by ${idea.owner}</div>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
        }).join('');

        activityContainer.innerHTML = activityHTML;
    }

    updateQuickActions() {
        const pendingCount = this.ideas.filter(i => i.status === 'Submitted').length;
        const pendingCountEl = document.getElementById('pending-count');
        if (pendingCountEl) {
            pendingCountEl.textContent = `${pendingCount} items`;
        }
    }

    // ===== IDEAS MANAGEMENT =====
    renderIdeasManagement() {
        this.filterAndRenderIdeas();
        this.renderPagination();
    }

    filterAndRenderIdeas() {
        let filteredIdeas = [...this.ideas];

        // Apply filters
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredIdeas = filteredIdeas.filter(idea =>
                idea.title.toLowerCase().includes(searchTerm) ||
                idea.problem.toLowerCase().includes(searchTerm) ||
                idea.owner.toLowerCase().includes(searchTerm) ||
                idea.dept.toLowerCase().includes(searchTerm)
            );
        }

        if (this.filters.status) {
            filteredIdeas = filteredIdeas.filter(idea => idea.status === this.filters.status);
        }

        if (this.filters.category) {
            filteredIdeas = filteredIdeas.filter(idea => idea.category === this.filters.category);
        }

        if (this.filters.priority) {
            filteredIdeas = filteredIdeas.filter(idea => idea.priority === this.filters.priority);
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedIdeas = filteredIdeas.slice(startIndex, endIndex);

        this.renderIdeasTable(paginatedIdeas);
        this.updatePaginationInfo(filteredIdeas.length, startIndex, endIndex);
    }

    renderIdeasTable(ideas) {
        const tbody = document.getElementById('admin-ideas-tbody');
        if (!tbody) return;

        if (ideas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>No ideas found matching your criteria</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ideas.map(idea => this.createIdeaTableRow(idea)).join('');
        
        // Add event listeners for checkboxes and action buttons
        this.setupTableEventListeners();
    }

    createIdeaTableRow(idea) {
        const submittedDate = new Date(idea.submitted).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const priorityClass = this.getPriorityClass(idea.priority);
        const initials = this.getInitials(idea.owner);
        
        return `
            <tr data-idea-id="${idea.id}" ${this.selectedIdeas.has(idea.id) ? 'class="selected"' : ''}>
                <td>
                    <input type="checkbox" class="table-checkbox idea-checkbox" data-idea-id="${idea.id}" ${this.selectedIdeas.has(idea.id) ? 'checked' : ''}>
                </td>
                <td class="idea-title-cell">
                    <div class="idea-title-text" onclick="adminApp.showIdeaDetails('${idea.id}')" style="cursor: pointer;">${idea.title}</div>
                    <div class="idea-excerpt">${idea.problem}</div>
                </td>
                <td>
                    <div class="submitter-info">
                        <div class="submitter-avatar">${initials}</div>
                        <div class="submitter-details">
                            <div class="submitter-name">${idea.owner}</div>
                            <div class="submitter-dept">${idea.dept}</div>
                        </div>
                    </div>
                </td>
                <td>${idea.category}</td>
                <td>
                    <span class="status-badge ${statusClass}">${idea.status}</span>
                </td>
                <td>
                    <span class="priority-badge priority-${idea.priority.toLowerCase()}">${idea.priority}</span>
                </td>
                <td>${submittedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn approve" onclick="adminApp.updateIdeaStatus('${idea.id}', 'Accepted')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn reject" onclick="adminApp.updateIdeaStatus('${idea.id}', 'Rejected')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="action-btn" onclick="adminApp.showIdeaDetails('${idea.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    setupTableEventListeners() {
        // Individual checkboxes
        document.querySelectorAll('.idea-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const ideaId = e.target.dataset.ideaId;
                if (e.target.checked) {
                    this.selectedIdeas.add(ideaId);
                } else {
                    this.selectedIdeas.delete(ideaId);
                }
                this.updateBulkActionsBar();
                this.updateSelectAllCheckbox();
            });
        });
    }

    // ===== BULK ACTIONS =====
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.idea-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const ideaId = checkbox.dataset.ideaId;
            if (checked) {
                this.selectedIdeas.add(ideaId);
            } else {
                this.selectedIdeas.delete(ideaId);
            }
        });
        this.updateBulkActionsBar();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all');
        const totalCheckboxes = document.querySelectorAll('.idea-checkbox').length;
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedIdeas.size === totalCheckboxes && totalCheckboxes > 0;
            selectAllCheckbox.indeterminate = this.selectedIdeas.size > 0 && this.selectedIdeas.size < totalCheckboxes;
        }
    }

    updateBulkActionsBar() {
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkActionsBar) {
            if (this.selectedIdeas.size > 0) {
                bulkActionsBar.style.display = 'flex';
                if (selectedCount) {
                    selectedCount.textContent = `${this.selectedIdeas.size} selected`;
                }
            } else {
                bulkActionsBar.style.display = 'none';
            }
        }
    }

    handleBulkAction(action) {
        if (this.selectedIdeas.size === 0) {
            this.showNotification('Please select ideas first', 'warning');
            return;
        }

        switch (action) {
            case 'approve':
                this.bulkUpdateStatus('Accepted');
                break;
            case 'reject':
                this.bulkUpdateStatus('Rejected');
                break;
            case 'priority':
                this.showBulkPriorityModal();
                break;
            case 'assign':
                this.showBulkAssignModal();
                break;
        }
    }

    async bulkUpdateStatus(newStatus) {
        // Check authorization for bulk operations
        if (!this.isAuthorized) {
            this.showNotification('Unauthorized: You do not have permission to perform bulk operations', 'error');
            return;
        }
        
        try {
            const selectedCount = this.selectedIdeas.size;
            const updatePromises = Array.from(this.selectedIdeas).map(ideaId => 
                this.updateIdeaStatus(ideaId, newStatus, false)
            );
            
            await Promise.all(updatePromises);
            
            // Log bulk action
            this.logAuditEvent('BULK_STATUS_UPDATE', {
                affectedIdeas: Array.from(this.selectedIdeas),
                newStatus: newStatus,
                count: selectedCount,
                adminUser: this.currentAdmin.email,
                timestamp: new Date().toISOString()
            });
            
            this.selectedIdeas.clear();
            this.updateBulkActionsBar();
            this.updateSelectAllCheckbox();
            this.renderIdeasManagement();
            this.showNotification(`${selectedCount} ideas updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Bulk update error:', error);
            this.showNotification('Error updating ideas', 'error');
        }
    }

    // ===== IDEA STATUS MANAGEMENT =====
    async updateIdeaStatus(ideaId, newStatus, showNotification = true) {
        // Check authorization before sensitive operations
        if (!this.isAuthorized) {
            this.showNotification('Unauthorized: You do not have permission to update ideas', 'error');
            return;
        }
        
        try {
            // Update in SharePoint
            await this.updateIdeaInSharePoint(ideaId, { Status: newStatus });
            
            // Update local data
            const idea = this.ideas.find(i => i.id === ideaId);
            if (idea) {
                idea.status = newStatus;
                idea.updated = Date.now();
                
                // Log the admin action
                this.logAuditEvent('IDEA_STATUS_UPDATED', {
                    ideaId: ideaId,
                    ideaTitle: idea.title,
                    oldStatus: idea.status,
                    newStatus: newStatus,
                    adminUser: this.currentAdmin.email,
                    timestamp: new Date().toISOString()
                });
            }
            
            if (showNotification) {
                this.showNotification(`Idea status updated to ${newStatus}`, 'success');
                this.renderCurrentView();
            }
        } catch (error) {
            console.error('Error updating idea status:', error);
            if (showNotification) {
                this.showNotification('Error updating idea status', 'error');
            }
        }
    }

    async updateIdeaInSharePoint(ideaId, updates) {
        try {
            const digest = await this.getRequestDigest();
            
            const response = await fetch(
                `${this.sharePointConfig.siteUrl}/_api/web/lists/getbytitle('${this.sharePointConfig.listName}')/items(${ideaId})`,
                {
                    method: 'MERGE',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': digest,
                        'X-HTTP-Method': 'MERGE',
                        'If-Match': '*'
                    },
                    body: JSON.stringify({
                        '__metadata': { 'type': `SP.Data.${this.sharePointConfig.listName}ListItem` },
                        ...updates
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`Update failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating idea in SharePoint:', error);
            throw error;
        }
    }

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

    // ===== MODAL SYSTEM =====
    setupModals() {
        const modals = document.querySelectorAll('.admin-modal');
        const closeButtons = document.querySelectorAll('.modal-close');

        // Close modal when clicking close button
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Close modal when clicking outside
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Modal action buttons
        const approveBtn = document.getElementById('approve-idea');
        const rejectBtn = document.getElementById('reject-idea');
        const requestChangesBtn = document.getElementById('request-changes');
        const assignReviewerBtn = document.getElementById('assign-reviewer');

        if (approveBtn) approveBtn.addEventListener('click', () => this.approveCurrentIdea());
        if (rejectBtn) rejectBtn.addEventListener('click', () => this.rejectCurrentIdea());
        if (requestChangesBtn) requestChangesBtn.addEventListener('click', () => this.requestChanges());
        if (assignReviewerBtn) assignReviewerBtn.addEventListener('click', () => this.assignReviewer());
    }

    showIdeaDetails(ideaId) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const modal = document.getElementById('idea-details-modal');
        const modalTitle = document.getElementById('modal-idea-title');
        const modalBody = document.getElementById('modal-idea-body');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = idea.title;
        modalBody.innerHTML = this.createIdeaDetailsContent(idea);
        
        modal.classList.add('active');
        modal.dataset.currentIdeaId = ideaId;
        document.body.style.overflow = 'hidden';
    }

    createIdeaDetailsContent(idea) {
        const submittedDate = new Date(idea.submitted).toLocaleDateString();
        const updatedDate = new Date(idea.updated).toLocaleDateString();
        const statusClass = this.getStatusClass(idea.status);
        const priorityClass = this.getPriorityClass(idea.priority);
        const tags = (idea.tags || []).map(tag => `<span class="idea-tag">#${tag}</span>`).join(' ');

        return `
            <div class="idea-details-admin">
                <div class="idea-meta-grid">
                    <div class="meta-item">
                        <label>Submitter</label>
                        <div class="submitter-info">
                            <div class="submitter-avatar">${this.getInitials(idea.owner)}</div>
                            <div>
                                <div class="submitter-name">${idea.owner}</div>
                                <div class="submitter-email">${idea.email}</div>
                            </div>
                        </div>
                    </div>
                    <div class="meta-item">
                        <label>Department</label>
                        <span>${idea.dept}</span>
                    </div>
                    <div class="meta-item">
                        <label>Category</label>
                        <span>${idea.category}</span>
                    </div>
                    <div class="meta-item">
                        <label>Status</label>
                        <span class="status-badge ${statusClass}">${idea.status}</span>
                    </div>
                    <div class="meta-item">
                        <label>Priority</label>
                        <span class="priority-badge priority-${idea.priority.toLowerCase()}">${idea.priority}</span>
                    </div>
                    <div class="meta-item">
                        <label>Votes</label>
                        <span>${idea.votes}</span>
                    </div>
                    <div class="meta-item">
                        <label>Submitted</label>
                        <span>${submittedDate}</span>
                    </div>
                    <div class="meta-item">
                        <label>Last Updated</label>
                        <span>${updatedDate}</span>
                    </div>
                </div>

                ${tags ? `
                    <div class="idea-tags">
                        <label>Tags</label>
                        <div>${tags}</div>
                    </div>
                ` : ''}

                <div class="idea-content-section">
                    <h4>Problem Statement</h4>
                    <p>${idea.problem}</p>
                </div>

                <div class="idea-content-section">
                    <h4>Proposed Solution</h4>
                    <p>${idea.solution}</p>
                </div>

                <div class="idea-metrics-grid">
                    <div class="metric-item">
                        <label>Expected Impact</label>
                        <span>${idea.impact}</span>
                    </div>
                    <div class="metric-item">
                        <label>Estimated Effort</label>
                        <span>${idea.effort}</span>
                    </div>
                </div>

                ${idea.resources ? `
                    <div class="idea-content-section">
                        <h4>Required Resources</h4>
                        <p>${idea.resources}</p>
                    </div>
                ` : ''}

                ${idea.attachmentUrls && idea.attachmentUrls.length > 0 ? `
                    <div class="idea-content-section">
                        <h4>Attachments</h4>
                        <div class="attachment-list">
                            ${idea.attachmentUrls.map(url => `
                                <a href="${url}" target="_blank" class="attachment-link">
                                    <i class="fas fa-file"></i>
                                    ${url.split('/').pop()}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${idea.adminNotes ? `
                    <div class="idea-content-section">
                        <h4>Admin Notes</h4>
                        <p>${idea.adminNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    hideModal() {
        const modals = document.querySelectorAll('.admin-modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // ===== QUICK ACTIONS =====
    handleQuickAction(action) {
        switch (action) {
            case 'review-pending':
                this.switchView('ideas');
                document.getElementById('status-filter').value = 'Submitted';
                this.filters.status = 'Submitted';
                this.filterAndRenderIdeas();
                break;
            case 'export-report':
                this.exportAnalyticsReport();
                break;
            case 'send-notifications':
                this.showNotificationModal();
                break;
            case 'manage-categories':
                this.showCategoryManagementModal();
                break;
        }
    }

    // ===== ANALYTICS =====
    renderAnalytics() {
        this.renderSubmissionTrends();
        this.renderCategoryDistribution();
        this.renderStatusDistribution();
        this.renderDepartmentParticipation();
    }

    renderSubmissionTrends() {
        // Mock chart rendering - in real implementation, use Chart.js or similar
        const chartContainer = document.getElementById('submissions-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>Submission trends chart would be rendered here</div>
                        <small>Integration with Chart.js recommended</small>
                    </div>
                </div>
            `;
        }
    }

    renderCategoryDistribution() {
        const chartContainer = document.getElementById('category-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>Category distribution chart</div>
                        <small>Pie chart showing idea categories</small>
                    </div>
                </div>
            `;
        }
    }

    renderStatusDistribution() {
        const chartContainer = document.getElementById('status-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-donut" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>Status distribution chart</div>
                        <small>Donut chart showing idea statuses</small>
                    </div>
                </div>
            `;
        }
    }

    renderDepartmentParticipation() {
        const chartContainer = document.getElementById('department-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <div>Department participation chart</div>
                        <small>Bar chart showing submissions by department</small>
                    </div>
                </div>
            `;
        }
    }

    // ===== USER MANAGEMENT =====
    renderUserManagement() {
        this.renderTopContributors();
        this.renderDepartmentActivity();
    }

    renderTopContributors() {
        const container = document.getElementById('top-contributors');
        if (!container) return;

        const topUsers = [...this.users]
            .sort((a, b) => b.submissions - a.submissions)
            .slice(0, 10);

        container.innerHTML = topUsers.map((user, index) => `
            <div class="contributor-item">
                <div class="contributor-rank">#${index + 1}</div>
                <div class="contributor-info">
                    <div class="contributor-name">${user.name}</div>
                    <div class="contributor-dept">${user.dept}</div>
                </div>
                <div class="contributor-stats">
                    <span>${user.submissions} ideas</span>
                    <span>${user.accepted} accepted</span>
                </div>
            </div>
        `).join('');
    }

    renderDepartmentActivity() {
        const container = document.getElementById('department-activity');
        if (!container) return;

        const deptStats = {};
        this.ideas.forEach(idea => {
            if (!deptStats[idea.dept]) {
                deptStats[idea.dept] = { total: 0, accepted: 0 };
            }
            deptStats[idea.dept].total++;
            if (idea.status === 'Accepted') {
                deptStats[idea.dept].accepted++;
            }
        });

        const sortedDepts = Object.entries(deptStats)
            .sort(([,a], [,b]) => b.total - a.total);

        container.innerHTML = sortedDepts.map(([dept, stats]) => {
            const acceptanceRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
            return `
                <div class="department-item">
                    <div class="department-name">${dept}</div>
                    <div class="department-stats">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">ideas</div>
                    </div>
                    <div class="department-rate">
                        <div class="rate-bar">
                            <div class="rate-fill" style="width: ${acceptanceRate}%"></div>
                        </div>
                        <span>${acceptanceRate}% accepted</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== SETTINGS =====
    renderSettings() {
        this.renderCategoryManagement();
    }

    renderCategoryManagement() {
        const container = document.getElementById('category-management');
        if (!container) return;

        const categories = ['Process', 'Product', 'Customer', 'Tech', 'Sustainability', 'Workplace'];
        
        container.innerHTML = `
            <div class="category-list">
                ${categories.map(category => `
                    <div class="category-item">
                        <span>${category}</span>
                        <button class="btn btn-ghost btn-sm">Edit</button>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-plus"></i>
                Add Category
            </button>
        `;
    }

    // ===== PAGINATION =====
    changePage(direction) {
        const maxPage = Math.ceil(this.getFilteredIdeas().length / this.itemsPerPage);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= maxPage) {
            this.currentPage = newPage;
            this.filterAndRenderIdeas();
            this.renderPagination();
        }
    }

    renderPagination() {
        const totalItems = this.getFilteredIdeas().length;
        const maxPage = Math.ceil(totalItems / this.itemsPerPage);
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNumbers = document.getElementById('page-numbers');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === maxPage;
        
        if (pageNumbers) {
            const pages = [];
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(maxPage, this.currentPage + 2);
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(`
                    <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                            onclick="adminApp.goToPage(${i})">
                        ${i}
                    </button>
                `);
            }
            
            pageNumbers.innerHTML = pages.join('');
        }
    }

    updatePaginationInfo(totalItems, startIndex, endIndex) {
        const pageStartEl = document.getElementById('page-start');
        const pageEndEl = document.getElementById('page-end');
        const totalItemsEl = document.getElementById('total-items');
        
        if (pageStartEl) pageStartEl.textContent = startIndex + 1;
        if (pageEndEl) pageEndEl.textContent = Math.min(endIndex, totalItems);
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
    }

    goToPage(page) {
        this.currentPage = page;
        this.filterAndRenderIdeas();
        this.renderPagination();
    }

    getFilteredIdeas() {
        let filteredIdeas = [...this.ideas];

        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredIdeas = filteredIdeas.filter(idea =>
                idea.title.toLowerCase().includes(searchTerm) ||
                idea.problem.toLowerCase().includes(searchTerm) ||
                idea.owner.toLowerCase().includes(searchTerm) ||
                idea.dept.toLowerCase().includes(searchTerm)
            );
        }

        if (this.filters.status) {
            filteredIdeas = filteredIdeas.filter(idea => idea.status === this.filters.status);
        }

        if (this.filters.category) {
            filteredIdeas = filteredIdeas.filter(idea => idea.category === this.filters.category);
        }

        if (this.filters.priority) {
            filteredIdeas = filteredIdeas.filter(idea => idea.priority === this.filters.priority);
        }

        return filteredIdeas;
    }

    // ===== EXPORT FUNCTIONALITY =====
    exportData() {
        const csvContent = this.generateCSV();
        this.downloadCSV(csvContent, 'innovation-ideas-export.csv');
        this.showNotification('Data exported successfully!', 'success');
    }

    generateCSV() {
        const headers = [
            'ID', 'Title', 'Category', 'Department', 'Submitter', 'Email',
            'Status', 'Priority', 'Submitted', 'Updated', 'Votes',
            'Problem', 'Solution', 'Impact', 'Effort', 'Resources'
        ];

        const rows = this.ideas.map(idea => [
            idea.id,
            `"${idea.title}"`,
            idea.category,
            idea.dept,
            idea.owner,
            idea.email,
            idea.status,
            idea.priority,
            new Date(idea.submitted).toLocaleDateString(),
            new Date(idea.updated).toLocaleDateString(),
            idea.votes,
            `"${idea.problem.replace(/"/g, '""')}"`,
            `"${idea.solution.replace(/"/g, '""')}"`,
            idea.impact,
            idea.effort,
            `"${(idea.resources || '').replace(/"/g, '""')}"`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // ===== REAL-TIME UPDATES =====
    startRealTimeUpdates() {
        // Simulate real-time updates (in production, use WebSockets or polling)
        setInterval(() => {
            // Check for new ideas periodically
            // this.loadIdeasFromSharePoint();
        }, 60000); // Check every minute
    }

    // ===== UTILITY METHODS =====
    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const start = parseInt(element.textContent) || 0;
        const duration = 1000;
        const increment = (target - start) / (duration / 16);
        let current = start;

        const updateCounter = () => {
            current += increment;
            if ((increment > 0 && current < target) || (increment < 0 && current > target)) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
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

    getPriorityClass(priority) {
        return `priority-${priority.toLowerCase()}`;
    }

    getInitials(name) {
        if (name === 'Anonymous') return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    getActivityIcon(status) {
        const iconMap = {
            'Submitted': 'fas fa-plus',
            'In review': 'fas fa-search',
            'Accepted': 'fas fa-check',
            'Rejected': 'fas fa-times'
        };
        return iconMap[status] || 'fas fa-lightbulb';
    }

    getActivityText(status) {
        const textMap = {
            'Submitted': 'New idea submitted',
            'In review': 'Idea under review',
            'Accepted': 'Idea accepted',
            'Rejected': 'Idea rejected'
        };
        return textMap[status] || 'Idea updated';
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('admin-notification');
        const icon = notification.querySelector('.notification-icon');
        const text = notification.querySelector('.notification-text');
        const close = notification.querySelector('.notification-close');

        if (!notification) return;

        // Reset classes
        notification.className = 'admin-notification';
        
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
        }, 5000);
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
let adminApp;

document.addEventListener('DOMContentLoaded', async () => {
    adminApp = new InnovationAdminPortal();
    
    // Handle URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'ideas', 'analytics', 'users', 'settings'].includes(hash)) {
        adminApp.switchView(hash);
    }
});

// Global app reference for onclick handlers
window.adminApp = adminApp;