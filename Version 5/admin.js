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

        this.setupMotionPreference();

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
        
        // Initialize SharePoint Client from sp-helpers.js
        this.spClient = typeof SPClient !== 'undefined' ? new SPClient({
            siteUrl: this.sharePointConfig.siteUrl,
            verboseLogging: false
        }) : null;
        
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
            // this.showAuthenticationError(error); //currently disabled for testing
        }
    }

    // ===== AUTHENTICATION & AUTHORIZATION =====
    async checkAdminAuthentication() {
        try {
            // Local development bypass: allow admin when running on localhost or file protocol
            const isLocalEnv = typeof window !== 'undefined' && (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:'
            );
            if (isLocalEnv) {
                this.currentAdmin = {
                    name: 'Admin User',
                    email: 'admin@company.com',
                    role: 'Local Admin',
                    id: 'local-dev',
                    isAuthenticated: true,
                    permissions: []
                };
                this.isAuthorized = true;
                this.authCheckComplete = true;
                return;
            }

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
            // If in local environment, proceed to allow UI testing
            const isLocalEnv = typeof window !== 'undefined' && (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:'
            );
            if (isLocalEnv) {
                console.warn('Proceeding with local dev authorization due to auth failure.');
                this.isAuthorized = true;
                return;
            }
            throw error;
        }
    }
    
    async getCurrentUser() {
        if (!this.spClient) {
            console.warn('⚠️ SPClient not available, using mock user for local testing');
            return {
                Id: 1,
                Title: 'Admin User',
                Email: 'admin@company.com',
                LoginName: 'i:0#.f|membership|admin@company.com',
                IsSiteAdmin: true
            };
        }
        
        try {
            // Use sp-helpers.js
            const user = await this.spClient.getCurrentUser('Id,Title,Email,LoginName,IsSiteAdmin');
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }
    
    async checkAdminGroupMembership(userId) {
        if (!this.spClient) {
            console.warn('⚠️ SPClient not available, skipping group check for local testing');
            return true; // Allow access for local testing
        }
        
        try {
            // Use sp-helpers.js
            const isMember = await this.spClient.isUserInGroup(this.sharePointConfig.adminGroupName, userId);
            return isMember;
        } catch (error) {
            console.error('Error checking admin group membership:', error);
            return false;
        }
    }
    
    async checkSiteAdminPermissions() {
        if (!this.spClient) {
            console.warn('⚠️ SPClient not available, skipping permissions check for local testing');
            return true; // Allow access for local testing
        }
        
        try {
            // Use sp-helpers.js
            const permissions = await this.spClient.getEffectiveBasePermissions();
            
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
                    <p>You don't have permission to access the Think Space Admin Dashboard.</p>
                    <div class="unauthorized-details">
                        <p><strong>User:</strong> ${this.currentAdmin.email}</p>
                        <p><strong>Required:</strong> Think Space Administrator permissions</p>
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
                this.selectAllIdeas(e.target.checked);
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
        // Preferred order: JSON (local testing) -> SharePoint -> Built-in sample
        let loadedFrom = null;
        try {
            await this.loadSampleDataFromJSON();
            loadedFrom = 'json';
        } catch (jsonError) {
            console.log('📝 JSON not available or blocked by browser, trying SharePoint...');
            try {
                await this.loadIdeasFromSharePoint();
                loadedFrom = 'sharepoint';
            } catch (spError) {
                console.warn('⚠️ Could not load from SharePoint, using built-in sample data:', spError);
                this.loadSampleData();
                loadedFrom = 'inline-sample';
            }
        }

        // Ensure we have some users for the Users view and KPIs
        this.generateMockUsersIfMissing();

        // Update KPIs and re-render current view to reflect loaded data
        try { this.updateDashboardKPIs(); } catch {}
        this.renderCurrentView();
        console.log(`✅ Data source initialized: ${loadedFrom}`);
    }

    async loadSampleDataFromJSON() {
        // When opening admin.html via file://, browsers block fetch for local files.
        const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

        // Try a few likely URL variants in order
        const basePath = window.location.pathname.replace(/[^/]+$/, '');
        const candidates = [
            'sample-data.json',
            './sample-data.json',
            `${basePath}sample-data.json`,
            '/sample-data.json'
        ];

        let lastError;
        for (const url of candidates) {
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const data = await res.json();
                const ideas = Array.isArray(data.ideas) ? data.ideas : [];
                const users = Array.isArray(data.users) ? data.users : [];
                if (ideas.length === 0) throw new Error('Empty ideas array in JSON');
                this.ideas = ideas;
                this.users = users;
                this.dataSource = `json:${url}`;
                console.log(`✅ Loaded ${ideas.length} ideas and ${users.length} users from ${url}`);
                return;
            } catch (e) {
                lastError = e;
                // Try next candidate
            }
        }

        // All attempts failed
        if (isFileProtocol) {
            console.warn('📁 Running from file:// — fetch for JSON is blocked or failed. Falling back to inline sample data.');
            this.loadSampleData();
            this.dataSource = 'inline-sample(file-protocol)';
            return;
        }
        console.error('Error loading sample data from JSON:', lastError);
        throw lastError; // Re-throw to trigger SharePoint fallback
    }

    // Generate mock users only if none exist
    generateMockUsersIfMissing() {
        if (!Array.isArray(this.users) || this.users.length === 0) {
            try { this.generateMockUsers(); } catch {}
        }
    }

    async loadIdeasFromSharePoint() {
        if (!this.spClient) {
            throw new Error('SharePoint client not initialized. SPClient from sp-helpers.js is required.');
        }
        
        try {
            console.log('📡 Loading ideas from SharePoint...');
            
            // Use sp-helpers.js to get list items
            const data = await this.spClient.getListItems(this.sharePointConfig.listName, {
                orderby: 'Created desc',
                top: 1000,
                select: 'Id,Title,Category,Department,Problem,Solution,ExpectedImpact,EstimatedEffort,RequiredResources,SubmitterName,SubmitterEmail,IsAnonymous,Tags,Status,Created,Modified,Votes,AttachmentUrls,AdminNotes'
            });
            
            const items = data.results || [];
            this.ideas = items.map(item => ({
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
                adminNotes: item.AdminNotes || '',
                estimatedROI: item.EstimatedROI || '',
                implementationDate: item.ImplementationDate || null,
                statusHistory: item.StatusHistory ? JSON.parse(item.StatusHistory) : []
            }));
            
            console.log(`✅ Loaded ${this.ideas.length} ideas from SharePoint`);
        } catch (error) {
            console.error('❌ Error loading ideas from SharePoint:', error);
            throw error; // Re-throw to trigger fallback
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
                comments: [
                    { id: 'c1', author: 'Tech Lead', message: 'Great concept! Would love to see a proof of concept.', timestamp: Date.now() - 86400000 },
                    { id: 'c2', author: 'CTO', message: 'Aligns with our AI strategy. Lets schedule a review.', timestamp: Date.now() - 86400000 * 0.5 }
                ],
                adminNotes: 'High priority - strategic alignment with company AI initiatives',
                estimatedROI: '$250,000 annually',
                implementationDate: null,
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 2, by: 'Alice Johnson' }
                ]
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
                attachmentUrls: ['wellness-mockup.pdf'],
                comments: [
                    { id: 'c3', author: 'HR Director', message: 'This could really help with retention issues.', timestamp: Date.now() - 86400000 * 3 }
                ],
                adminNotes: 'Promising concept, needs budget approval and privacy compliance review',
                estimatedROI: '$180,000 annually',
                implementationDate: null,
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 5, by: 'Michael Chen' },
                    { status: 'In review', timestamp: Date.now() - 86400000 * 2, by: 'Admin' }
                ]
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
                attachmentUrls: ['energy-analysis.xlsx', 'iot-proposal.pdf'],
                comments: [
                    { id: 'c4', author: 'CFO', message: 'Excellent ROI projections. Approved for implementation.', timestamp: Date.now() - 86400000 * 4 },
                    { id: 'c5', author: 'Facilities Manager', message: 'Ready to coordinate with electrical contractors.', timestamp: Date.now() - 86400000 * 3 }
                ],
                adminNotes: 'Approved for pilot program - Q2 implementation planned',
                estimatedROI: '$75,000 annually',
                implementationDate: new Date(Date.now() + 86400000 * 45).toISOString(),
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 10, by: 'Sarah Williams' },
                    { status: 'In review', timestamp: Date.now() - 86400000 * 7, by: 'Admin' },
                    { status: 'Accepted', timestamp: Date.now() - 86400000 * 3, by: 'Executive Committee' }
                ]
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
                attachmentUrls: ['customer-journey-map.png'],
                comments: [
                    { id: 'c6', author: 'Finance Director', message: 'Budget constraints this quarter. Good idea though.', timestamp: Date.now() - 86400000 * 8 }
                ],
                adminNotes: 'Budget constraints, revisit next quarter - solid technical approach',
                estimatedROI: '$320,000 annually',
                implementationDate: null,
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 15, by: 'David Rodriguez' },
                    { status: 'In review', timestamp: Date.now() - 86400000 * 12, by: 'Admin' },
                    { status: 'Rejected', timestamp: Date.now() - 86400000 * 8, by: 'Finance Committee' }
                ]
            },
            {
                id: '5',
                title: 'Automated Inventory Optimization',
                category: 'Process',
                dept: 'Operations',
                problem: 'Manual inventory management leads to overstocking and stockouts.',
                solution: 'Machine learning algorithm to predict demand and optimize inventory levels.',
                impact: 'Cost reduction',
                effort: 'Medium',
                resources: 'Data scientist, inventory management system integration',
                owner: 'Jennifer Walsh',
                email: 'jennifer@company.com',
                tags: ['machine-learning', 'inventory', 'optimization'],
                status: 'Accepted',
                priority: 'High',
                submitted: Date.now() - 86400000 * 8,
                updated: Date.now() - 86400000 * 1,
                votes: 18,
                attachmentUrls: ['inventory-analysis.xlsx'],
                comments: [
                    { id: 'c7', author: 'Operations Director', message: 'This addresses our biggest pain point!', timestamp: Date.now() - 86400000 * 6 }
                ],
                adminNotes: 'High impact project - fast-tracked for Q1 implementation',
                estimatedROI: '$450,000 annually',
                implementationDate: new Date(Date.now() + 86400000 * 30).toISOString(),
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 8, by: 'Jennifer Walsh' },
                    { status: 'In review', timestamp: Date.now() - 86400000 * 4, by: 'Admin' },
                    { status: 'Accepted', timestamp: Date.now() - 86400000 * 1, by: 'Executive Committee' }
                ]
            },
            {
                id: '6',
                title: 'Customer Feedback Sentiment Analysis',
                category: 'Customer',
                dept: 'Customer Service',
                problem: 'Difficult to quickly identify and prioritize negative customer feedback.',
                solution: 'AI-powered sentiment analysis to automatically categorize and route feedback.',
                impact: 'Customer experience',
                effort: 'Low',
                resources: 'NLP engineer, API integrations',
                owner: 'Robert Kim',
                email: 'robert@company.com',
                tags: ['AI', 'sentiment', 'customer-service'],
                status: 'In review',
                priority: 'Medium',
                submitted: Date.now() - 86400000 * 6,
                updated: Date.now() - 86400000 * 3,
                votes: 12,
                attachmentUrls: [],
                comments: [],
                adminNotes: 'Technical feasibility confirmed - awaiting budget allocation',
                estimatedROI: '$125,000 annually',
                implementationDate: null,
                statusHistory: [
                    { status: 'Submitted', timestamp: Date.now() - 86400000 * 6, by: 'Robert Kim' },
                    { status: 'In review', timestamp: Date.now() - 86400000 * 3, by: 'Admin' }
                ]
            }
        ];
        
        // Generate additional realistic sample ideas
        const realIdeas = [
            {
                title: 'Remote Work Productivity Tracker',
                category: 'Process',
                dept: 'Human Resources',
                problem: 'Difficulty measuring and improving remote team productivity.',
                solution: 'Non-invasive productivity analytics with team collaboration insights.',
                impact: 'Operational efficiency',
                effort: 'Medium',
                resources: 'Full-stack developer, data analyst',
                owner: 'Lisa Park',
                tags: ['remote-work', 'productivity', 'analytics']
            },
            {
                title: 'Smart Meeting Room Booking',
                category: 'Tech',
                dept: 'IT',
                problem: 'Meeting rooms often booked but unused, causing scheduling conflicts.',
                solution: 'IoT sensors to detect room occupancy and automatically release unused bookings.',
                impact: 'Operational efficiency',
                effort: 'Low',
                resources: 'IoT sensors, booking system integration',
                owner: 'Mark Thompson',
                tags: ['IoT', 'scheduling', 'efficiency']
            },
            {
                title: 'Predictive Equipment Maintenance',
                category: 'Tech',
                dept: 'Manufacturing',
                problem: 'Unexpected equipment failures causing production delays.',
                solution: 'Sensor data analysis to predict maintenance needs before failures occur.',
                impact: 'Cost reduction',
                effort: 'High',
                resources: 'IoT engineer, data scientist, maintenance team',
                owner: 'Carol Martinez',
                tags: ['predictive', 'maintenance', 'IoT']
            },
            {
                title: 'Employee Skills Marketplace',
                category: 'Process',
                dept: 'Human Resources',
                problem: 'Internal talent and skills not effectively utilized across projects.',
                solution: 'Internal platform to match employee skills with project needs.',
                impact: 'Operational efficiency',
                effort: 'Medium',
                resources: 'Frontend developer, HR integration',
                owner: 'James Wilson',
                tags: ['skills', 'marketplace', 'talent']
            },
            {
                title: 'Sustainable Packaging Initiative',
                category: 'Sustainability',
                dept: 'Supply Chain',
                problem: 'Current packaging generates excessive waste and environmental impact.',
                solution: 'Biodegradable packaging materials with cost-neutral implementation.',
                impact: 'Customer experience',
                effort: 'Medium',
                resources: 'Packaging engineer, supplier relationships',
                owner: 'Emma Davis',
                tags: ['sustainability', 'packaging', 'environment']
            }
        ];

        // Add realistic ideas with proper data structure
        realIdeas.forEach((ideaTemplate, index) => {
            const id = (7 + index).toString();
            const daysAgo = Math.floor(Math.random() * 20) + 1;
            const status = ['Submitted', 'In review', 'Accepted', 'Rejected'][Math.floor(Math.random() * 4)];
            const submittedTime = Date.now() - 86400000 * daysAgo;
            const updatedTime = Date.now() - 86400000 * Math.floor(daysAgo / 2);
            
            this.ideas.push({
                id,
                ...ideaTemplate,
                email: ideaTemplate.owner.toLowerCase().replace(' ', '.') + '@company.com',
                status,
                priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
                submitted: submittedTime,
                updated: updatedTime,
                votes: Math.floor(Math.random() * 25),
                attachmentUrls: Math.random() > 0.7 ? ['document.pdf'] : [],
                comments: Math.random() > 0.6 ? [
                    { 
                        id: `c${id}`, 
                        author: 'Reviewer', 
                        message: 'Interesting approach. Would like to see more details.', 
                        timestamp: updatedTime 
                    }
                ] : [],
                adminNotes: status === 'Accepted' ? 'Approved for implementation' : 
                           status === 'Rejected' ? 'Needs further research' : 
                           'Under evaluation',
                estimatedROI: `$${Math.floor(Math.random() * 500 + 50)},000 annually`,
                implementationDate: status === 'Accepted' ? 
                    new Date(Date.now() + 86400000 * (30 + Math.random() * 60)).toISOString() : null,
                statusHistory: [
                    { status: 'Submitted', timestamp: submittedTime, by: ideaTemplate.owner },
                    ...(status !== 'Submitted' ? [{ status, timestamp: updatedTime, by: 'Admin' }] : [])
                ]
            });
        });

        // Generate more random ideas to reach 35 total
        for (let i = 12; i <= 35; i++) {
            const categories = ['Process', 'Product', 'Customer', 'Tech', 'Sustainability'];
            const departments = ['Engineering', 'Marketing', 'HR', 'Operations', 'Finance', 'IT', 'Sales'];
            const impacts = ['Revenue growth', 'Cost reduction', 'Customer experience', 'Operational efficiency'];
            const efforts = ['Low', 'Medium', 'High'];
            const statuses = ['Submitted', 'In review', 'Accepted', 'Rejected'];
            const priorities = ['High', 'Medium', 'Low'];
            
            const daysAgo = Math.floor(Math.random() * 45) + 1;
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const submittedTime = Date.now() - 86400000 * daysAgo;
            const updatedTime = Date.now() - 86400000 * Math.floor(daysAgo / 2);
            
            this.ideas.push({
                id: i.toString(),
                title: `Innovation Initiative ${i}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                dept: departments[Math.floor(Math.random() * departments.length)],
                problem: `Strategic challenge requiring innovative solution for business unit ${i}.`,
                solution: `Comprehensive approach leveraging modern technology and process optimization.`,
                impact: impacts[Math.floor(Math.random() * impacts.length)],
                effort: efforts[Math.floor(Math.random() * efforts.length)],
                resources: 'Cross-functional team with domain expertise',
                owner: `Team Lead ${i}`,
                email: `lead${i}@company.com`,
                tags: [`initiative-${i}`, 'innovation', 'strategy'],
                status,
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                submitted: submittedTime,
                updated: updatedTime,
                votes: Math.floor(Math.random() * 30),
                attachmentUrls: Math.random() > 0.8 ? ['proposal.pdf'] : [],
                comments: Math.random() > 0.7 ? [
                    { 
                        id: `c${i}`, 
                        author: 'Evaluator', 
                        message: 'Solid proposal with clear business value.', 
                        timestamp: updatedTime 
                    }
                ] : [],
                adminNotes: '',
                estimatedROI: `$${Math.floor(Math.random() * 400 + 25)},000 annually`,
                implementationDate: status === 'Accepted' ? 
                    new Date(Date.now() + 86400000 * (15 + Math.random() * 90)).toISOString() : null,
                statusHistory: [
                    { status: 'Submitted', timestamp: submittedTime, by: `Team Lead ${i}` },
                    ...(status !== 'Submitted' ? [{ status, timestamp: updatedTime, by: 'Admin' }] : [])
                ]
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

        // Initialize bulk operations if not already done
        this.initializeBulkOperations();

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
                    <div class="idea-excerpt">${idea.problem.length > 100 ? idea.problem.substring(0, 100) + '...' : idea.problem}</div>
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
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.selectAllIdeas(e.target.checked);
            });
        }

        // Individual checkboxes
        document.querySelectorAll('.idea-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const ideaId = e.target.dataset.ideaId;
                this.toggleIdeaSelection(ideaId, e.target);
            });
        });
    }


        
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
        if (!this.spClient) {
            console.log('⚠️ SharePoint not available - updates stored locally only');
            // Update local data
            const idea = this.ideas.find(i => i.id === ideaId);
            if (idea) {
                Object.assign(idea, updates);
            }
            return;
        }
        
        try {
            // Use sp-helpers.js
            await this.spClient.updateListItem(
                this.sharePointConfig.listName,
                ideaId,
                updates,
                '*', // etag
                `SP.Data.${this.sharePointConfig.listName}ListItem`
            );
            
            console.log(`✅ Updated idea ${ideaId} in SharePoint`);
        } catch (error) {
            console.error('Error updating idea in SharePoint:', error);
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

    // ===== BULK OPERATIONS =====
    initializeBulkOperations() {
        // Add bulk selection functionality to ideas table
        this.selectedIdeas = new Set();
        this.renderBulkActionBar();
    }

    renderBulkActionBar() {
        const ideasManagement = document.getElementById('ideas-management');
        if (!ideasManagement) return;

        // Check if bulk action bar already exists
        let bulkActionBar = document.getElementById('bulk-action-bar');
        if (!bulkActionBar) {
            bulkActionBar = document.createElement('div');
            bulkActionBar.id = 'bulk-action-bar';
            bulkActionBar.className = 'bulk-action-bar';
            bulkActionBar.style.display = 'none';
            
            bulkActionBar.innerHTML = `
                <div class="bulk-actions-content">
                    <div class="bulk-selection-info">
                        <span id="bulk-count">0</span> ideas selected
                    </div>
                    <div class="bulk-actions-buttons">
                        <button class="bulk-btn bulk-approve" onclick="adminApp.bulkUpdateStatus('Accepted')">
                            <i class="fas fa-check"></i> Approve Selected
                        </button>
                        <button class="bulk-btn bulk-reject" onclick="adminApp.bulkUpdateStatus('Rejected')">
                            <i class="fas fa-times"></i> Reject Selected
                        </button>
                        <button class="bulk-btn bulk-review" onclick="adminApp.bulkUpdateStatus('In review')">
                            <i class="fas fa-eye"></i> Move to Review
                        </button>
                        <button class="bulk-btn bulk-export" onclick="adminApp.exportSelectedIdeas()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="bulk-btn bulk-clear" onclick="adminApp.clearBulkSelection()">
                            <i class="fas fa-times-circle"></i> Clear
                        </button>
                    </div>
                </div>
            `;
            
            // Insert before the ideas table
            const tableContainer = ideasManagement.querySelector('.table-container');
            if (tableContainer) {
                ideasManagement.insertBefore(bulkActionBar, tableContainer);
            }
        }
    }

    toggleIdeaSelection(ideaId, checkbox) {
        if (checkbox.checked) {
            this.selectedIdeas.add(ideaId);
        } else {
            this.selectedIdeas.delete(ideaId);
        }
        
        this.updateBulkActionBar();
    }

    selectAllIdeas(checked) {
        const checkboxes = document.querySelectorAll('.idea-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const ideaId = checkbox.getAttribute('data-idea-id');
            if (checked) {
                this.selectedIdeas.add(ideaId);
            } else {
                this.selectedIdeas.delete(ideaId);
            }
        });
        
        this.updateBulkActionBar();
    }

    updateBulkActionBar() {
        const bulkActionBar = document.getElementById('bulk-actions-bar');
        const bulkCount = document.getElementById('selected-count');
        
        if (bulkActionBar && bulkCount) {
            const selectedCount = this.selectedIdeas.size;
            bulkCount.textContent = `${selectedCount} selected`;
            
            if (selectedCount > 0) {
                bulkActionBar.style.display = 'flex';
            } else {
                bulkActionBar.style.display = 'none';
            }
        }
        
        // Update select all checkbox state
        this.updateSelectAllCheckbox();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all');
        const totalCheckboxes = document.querySelectorAll('.idea-checkbox').length;
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedIdeas.size === totalCheckboxes && totalCheckboxes > 0;
            selectAllCheckbox.indeterminate = this.selectedIdeas.size > 0 && this.selectedIdeas.size < totalCheckboxes;
        }
    }

    async bulkUpdateStatus(newStatus) {
        if (this.selectedIdeas.size === 0) {
            this.showNotification('No ideas selected', 'warning');
            return;
        }

        const confirmMessage = `Are you sure you want to ${newStatus.toLowerCase()} ${this.selectedIdeas.size} selected ideas?`;
        if (!confirm(confirmMessage)) return;

        const selectedArray = Array.from(this.selectedIdeas);
        let successCount = 0;
        let errorCount = 0;

        // Show progress notification
        this.showNotification(`Updating ${selectedArray.length} ideas...`, 'info');

        for (const ideaId of selectedArray) {
            try {
                await this.updateIdeaStatus(ideaId, newStatus, false);
                successCount++;
            } catch (error) {
                console.error(`Error updating idea ${ideaId}:`, error);
                errorCount++;
            }
        }

        // Clear selection and refresh view
        this.clearBulkSelection();
        this.renderCurrentView();

        // Show results notification
        if (errorCount === 0) {
            this.showNotification(`Successfully updated ${successCount} ideas to ${newStatus}`, 'success');
        } else {
            this.showNotification(`Updated ${successCount} ideas, ${errorCount} failed`, 'warning');
        }
    }

    clearBulkSelection() {
        this.selectedIdeas.clear();
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.idea-checkbox, .select-all-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateBulkActionBar();
    }

    exportSelectedIdeas() {
        if (this.selectedIdeas.size === 0) {
            this.showNotification('No ideas selected for export', 'warning');
            return;
        }

        const selectedIdeasData = this.ideas.filter(idea => this.selectedIdeas.has(idea.id));
        this.exportIdeasToCSV(selectedIdeasData, `selected_ideas_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportAllIdeas() {
        this.exportIdeasToCSV(this.ideas, `all_ideas_${new Date().toISOString().split('T')[0]}.csv`);
    }

    exportIdeasToCSV(ideas, filename) {
        // Define CSV headers
        const headers = [
            'ID', 'Title', 'Category', 'Department', 'Owner', 'Email', 'Status', 'Priority',
            'Impact', 'Effort', 'Votes', 'Submitted Date', 'Updated Date', 'Estimated ROI',
            'Problem', 'Solution', 'Resources', 'Tags', 'Admin Notes'
        ];

        // Convert ideas to CSV rows
        const csvRows = [
            headers.join(','), // Header row
            ...ideas.map(idea => [
                idea.id,
                `"${idea.title.replace(/"/g, '""')}"`,
                idea.category,
                idea.dept,
                `"${idea.owner.replace(/"/g, '""')}"`,
                idea.email,
                idea.status,
                idea.priority,
                idea.impact,
                idea.effort,
                idea.votes,
                new Date(idea.submitted).toLocaleDateString(),
                new Date(idea.updated).toLocaleDateString(),
                idea.estimatedROI || 'N/A',
                `"${idea.problem.replace(/"/g, '""')}"`,
                `"${idea.solution.replace(/"/g, '""')}"`,
                `"${idea.resources.replace(/"/g, '""')}"`,
                `"${idea.tags.join(', ')}"`,
                `"${(idea.adminNotes || '').replace(/"/g, '""')}"`
            ].join(','))
        ];

        // Create and download CSV file
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

        this.showNotification(`Exported ${ideas.length} ideas to ${filename}`, 'success');
    }

    showBulkActionsPanel() {
        // Toggle the bulk actions bar visibility
        const bulkActionBar = document.getElementById('bulk-actions-bar');
        if (bulkActionBar) {
            const isVisible = bulkActionBar.style.display !== 'none';
            bulkActionBar.style.display = isVisible ? 'none' : 'flex';
            
            if (!isVisible && this.selectedIdeas.size === 0) {
                this.showNotification('Select ideas first to use bulk actions', 'info');
            }
        }
    }

    // ===== ADVANCED FILTERING =====
    initializeAdvancedFiltering() {
        this.currentFilters = {
            dateRange: { start: null, end: null },
            categories: [],
            departments: [],
            statuses: [],
            priorities: []
        };
    }

    renderAdvancedFilters() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'advanced-filters';
        filterContainer.innerHTML = `
            <div class="filter-section">
                <label>Date Range:</label>
                <div class="date-range-inputs">
                    <input type="date" id="filter-date-start" onchange="adminApp.updateDateFilter()">
                    <span>to</span>
                    <input type="date" id="filter-date-end" onchange="adminApp.updateDateFilter()">
                </div>
            </div>
            
            <div class="filter-section">
                <label>Categories:</label>
                <div class="filter-checkboxes" id="category-filters">
                    ${this.getUniqueCategories().map(cat => `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${cat}" onchange="adminApp.updateCategoryFilter()">
                            ${cat}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="filter-section">
                <label>Departments:</label>
                <div class="filter-checkboxes" id="department-filters">
                    ${this.getUniqueDepartments().map(dept => `
                        <label class="filter-checkbox">
                            <input type="checkbox" value="${dept}" onchange="adminApp.updateDepartmentFilter()">
                            ${dept}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="filter-actions">
                <button class="filter-btn clear" onclick="adminApp.clearAllFilters()">
                    <i class="fas fa-times"></i> Clear All
                </button>
                <button class="filter-btn apply" onclick="adminApp.applyFilters()">
                    <i class="fas fa-filter"></i> Apply Filters
                </button>
            </div>
        `;
        
        return filterContainer;
    }

    getUniqueCategories() {
        return [...new Set(this.ideas.map(idea => idea.category))].sort();
    }

    getUniqueDepartments() {
        return [...new Set(this.ideas.map(idea => idea.dept))].sort();
    }

    updateDateFilter() {
        const startDate = document.getElementById('filter-date-start').value;
        const endDate = document.getElementById('filter-date-end').value;
        
        this.currentFilters.dateRange.start = startDate ? new Date(startDate).getTime() : null;
        this.currentFilters.dateRange.end = endDate ? new Date(endDate).getTime() + 86400000 : null; // End of day
    }

    updateCategoryFilter() {
        const checkboxes = document.querySelectorAll('#category-filters input[type="checkbox"]:checked');
        this.currentFilters.categories = Array.from(checkboxes).map(cb => cb.value);
    }

    updateDepartmentFilter() {
        const checkboxes = document.querySelectorAll('#department-filters input[type="checkbox"]:checked');
        this.currentFilters.departments = Array.from(checkboxes).map(cb => cb.value);
    }

    applyFilters() {
        this.filterAndRenderIdeas();
    }

    clearAllFilters() {
        // Reset filter state
        this.currentFilters = {
            dateRange: { start: null, end: null },
            categories: [],
            departments: [],
            statuses: [],
            priorities: []
        };
        
        // Clear UI
        document.getElementById('filter-date-start').value = '';
        document.getElementById('filter-date-end').value = '';
        
        const checkboxes = document.querySelectorAll('.advanced-filters input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        // Re-render
        this.filterAndRenderIdeas();
    }

    applyAdvancedFilters(ideas) {
        let filteredIdeas = [...ideas];
        
        // Date range filter
        if (this.currentFilters.dateRange.start || this.currentFilters.dateRange.end) {
            filteredIdeas = filteredIdeas.filter(idea => {
                if (this.currentFilters.dateRange.start && idea.submitted < this.currentFilters.dateRange.start) {
                    return false;
                }
                if (this.currentFilters.dateRange.end && idea.submitted > this.currentFilters.dateRange.end) {
                    return false;
                }
                return true;
            });
        }
        
        // Category filter
        if (this.currentFilters.categories.length > 0) {
            filteredIdeas = filteredIdeas.filter(idea => 
                this.currentFilters.categories.includes(idea.category));
        }
        
        // Department filter
        if (this.currentFilters.departments.length > 0) {
            filteredIdeas = filteredIdeas.filter(idea => 
                this.currentFilters.departments.includes(idea.dept));
        }
        
        return filteredIdeas;
    }

    // ===== ANALYTICS =====
    renderAnalytics() {
        this.renderSubmissionTrends();
        this.renderCategoryDistribution();
        this.renderStatusDistribution();
        this.renderDepartmentParticipation();
        this.renderROIAnalysis();
        this.renderTimelineMetrics();
    }

    renderSubmissionTrends() {
        const chartContainer = document.getElementById('submissions-chart');
        if (!chartContainer) return;

        // Clear previous chart
        chartContainer.innerHTML = '<canvas id="submissionsCanvas"></canvas>';
        const canvas = document.getElementById('submissionsCanvas');
        const ctx = canvas.getContext('2d');

        // Generate last 30 days of data
        const labels = [];
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Count submissions for this day
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
            const dayEnd = dayStart + 86400000;
            const count = this.ideas.filter(idea => 
                idea.submitted >= dayStart && idea.submitted < dayEnd
            ).length;
            data.push(count);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Submissions',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    renderCategoryDistribution() {
        const chartContainer = document.getElementById('category-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '<canvas id="categoryCanvas"></canvas>';
        const canvas = document.getElementById('categoryCanvas');
        const ctx = canvas.getContext('2d');

        // Count ideas by category
        const categoryCount = {};
        this.ideas.forEach(idea => {
            categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1;
        });

        const labels = Object.keys(categoryCount);
        const data = Object.values(categoryCount);
        const colors = [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b'
        ];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    renderStatusDistribution() {
        const chartContainer = document.getElementById('status-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '<canvas id="statusCanvas"></canvas>';
        const canvas = document.getElementById('statusCanvas');
        const ctx = canvas.getContext('2d');

        // Count ideas by status
        const statusCount = {};
        this.ideas.forEach(idea => {
            statusCount[idea.status] = (statusCount[idea.status] || 0) + 1;
        });

        const labels = Object.keys(statusCount);
        const data = Object.values(statusCount);
        const colors = {
            'Submitted': '#fbbf24',
            'In review': '#3b82f6',
            'Accepted': '#10b981',
            'Rejected': '#ef4444'
        };

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ideas',
                    data: data,
                    backgroundColor: labels.map(label => colors[label] || '#6b7280'),
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    renderDepartmentParticipation() {
        const chartContainer = document.getElementById('department-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '<canvas id="departmentCanvas"></canvas>';
        const canvas = document.getElementById('departmentCanvas');
        const ctx = canvas.getContext('2d');

        // Count ideas by department
        const deptCount = {};
        this.ideas.forEach(idea => {
            deptCount[idea.dept] = (deptCount[idea.dept] || 0) + 1;
        });

        const labels = Object.keys(deptCount);
        const data = Object.values(deptCount);

        new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Submissions',
                    data: data,
                    backgroundColor: '#667eea',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    renderROIAnalysis() {
        const chartContainer = document.getElementById('roi-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '<canvas id="roiCanvas"></canvas>';
        const canvas = document.getElementById('roiCanvas');
        const ctx = canvas.getContext('2d');

        // Get ROI data for accepted ideas
        const acceptedIdeas = this.ideas.filter(idea => idea.status === 'Accepted' && idea.estimatedROI);
        const labels = acceptedIdeas.map(idea => idea.title.length > 20 ? 
            idea.title.substring(0, 20) + '...' : idea.title);
        const data = acceptedIdeas.map(idea => 
            parseInt(idea.estimatedROI.replace(/[^0-9]/g, '')));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Estimated Annual ROI ($K)',
                    data: data,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value + 'K';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    renderTimelineMetrics() {
        const chartContainer = document.getElementById('timeline-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = '<canvas id="timelineCanvas"></canvas>';
        const canvas = document.getElementById('timelineCanvas');
        const ctx = canvas.getContext('2d');

        // Calculate average time from submission to status change
        const statusTimes = {
            'Submitted to Review': [],
            'Review to Decision': []
        };

        this.ideas.forEach(idea => {
            if (idea.statusHistory && idea.statusHistory.length > 1) {
                for (let i = 1; i < idea.statusHistory.length; i++) {
                    const prev = idea.statusHistory[i-1];
                    const curr = idea.statusHistory[i];
                    const days = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60 * 24);
                    
                    if (prev.status === 'Submitted' && curr.status === 'In review') {
                        statusTimes['Submitted to Review'].push(days);
                    } else if (prev.status === 'In review' && 
                              (curr.status === 'Accepted' || curr.status === 'Rejected')) {
                        statusTimes['Review to Decision'].push(days);
                    }
                }
            }
        });

        const avgSubmittedToReview = statusTimes['Submitted to Review'].length > 0 ?
            statusTimes['Submitted to Review'].reduce((a, b) => a + b, 0) / statusTimes['Submitted to Review'].length : 0;
        const avgReviewToDecision = statusTimes['Review to Decision'].length > 0 ?
            statusTimes['Review to Decision'].reduce((a, b) => a + b, 0) / statusTimes['Review to Decision'].length : 0;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Submitted to Review', 'Review to Decision'],
                datasets: [{
                    label: 'Average Days',
                    data: [avgSubmittedToReview, avgReviewToDecision],
                    backgroundColor: ['#fbbf24', '#3b82f6'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return Math.round(value) + ' days';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
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

        if (this.prefersReducedMotion) {
            element.textContent = target;
            return;
        }

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
    window.adminApp = adminApp;

    // Handle URL hash for deep linking
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'ideas', 'analytics', 'users', 'settings'].includes(hash)) {
        adminApp.switchView(hash);
    }
});

