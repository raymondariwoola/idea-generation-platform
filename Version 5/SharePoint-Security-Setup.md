# SharePoint Security Setup Guide
## Innovation Portal Admin Access Control

This guide explains how to properly secure the Innovation Portal Admin Dashboard using SharePoint permissions and groups.

## 🔐 Security Overview

The admin dashboard implements multiple layers of security:

1. **SharePoint Group Membership** - Primary authorization method
2. **Fallback Admin Emails** - Emergency access for system administrators
3. **Site Permission Validation** - Additional security layer
4. **Audit Logging** - Track all admin access attempts

## 📋 Setup Instructions

### Step 1: Create SharePoint Admin Group

1. **Navigate to Site Settings**
   - Go to your SharePoint site
   - Click Settings (⚙️) → Site Settings
   - Under "Users and Permissions", click "Site permissions"

2. **Create Admin Group**
   - Click "Create Group"
   - Group Name: `Innovation Portal Administrators`
   - Group Description: `Users with administrative access to the Innovation Portal`
   - Group Settings:
     - ✅ Who can view the membership of the group: Group Members
     - ✅ Who can edit the membership of the group: Group Owner
     - ❌ Allow requests to join/leave this group: No

3. **Set Group Permissions**
   - Permission Level: **Full Control** or **Design** (minimum required)
   - Click "Create"

### Step 2: Add Admin Users to Group

1. **Add Users**
   - Navigate to the group: Site Settings → Site permissions → "Innovation Portal Administrators"
   - Click "New" → "Add Users"
   - Enter user emails or names
   - Permission Level: Inherited from group
   - Click "Share"

### Step 3: Configure Fallback Admins

Edit the `admin.js` file and update the fallback admin emails:

```javascript
fallbackAdminEmails: [
    'your-primary-admin@company.com',
    'backup-admin@company.com',
    'system-admin@company.com'
]
```

### Step 4: Deploy Admin Files Securely

#### Option A: Separate Admin Site (Recommended)
1. Create a separate SharePoint site/subsite for admin functions
2. Deploy `admin.html`, `admin.js`, and `admin-styles.css` to this site
3. Restrict site access to admin group only
4. Update the `siteUrl` in admin.js configuration

#### Option B: Document Library with Permissions
1. Create a new document library called "AdminPortal"
2. Upload admin files to this library
3. Break permission inheritance on the library
4. Grant access only to "Innovation Portal Administrators" group

#### Option C: SharePoint App Catalog (Enterprise)
1. Package as SharePoint Framework (SPFx) solution
2. Deploy through App Catalog
3. Configure permissions at app level

## 🛡️ Security Features

### Authentication Checks

The system performs these checks in order:

1. **User Authentication** - Verifies user is logged into SharePoint
2. **Group Membership** - Checks if user is in admin group
3. **Fallback Email Check** - Validates against emergency admin list
4. **Site Permissions** - Verifies high-level SharePoint permissions

### Permission Levels Required

Minimum SharePoint permissions needed:

- **Manage Web** (Bit 63) - Can manage website settings
- **Full Control** (Bit 65) - Complete control over site

### Audit Logging

All admin activities are logged including:

- ✅ Successful admin logins
- ❌ Unauthorized access attempts
- 📝 Idea status changes
- 📦 Bulk operations
- 👥 User management actions

## 📁 SharePoint Lists Required

### Core Lists
- `InnovationIdeas` - Main ideas storage
- `IdeaAttachments` - Document library for files

### Optional Security Lists
- `AdminAuditLog` - Tracks admin activities (auto-created)

### AdminAuditLog Schema
```
Title (Single line of text) - Event type
EventData (Multiple lines of text) - JSON event details
Created (Date/Time) - Auto-populated
Author (Person) - Auto-populated
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Create "Innovation Portal Administrators" SharePoint group
- [ ] Add authorized admin users to the group
- [ ] Update fallback admin emails in configuration
- [ ] Test SharePoint REST API permissions

### Deployment
- [ ] Upload admin files to secure location
- [ ] Configure SharePoint site URL in admin.js
- [ ] Test authentication with admin user
- [ ] Test authentication with non-admin user
- [ ] Verify unauthorized access is blocked

### Post-Deployment
- [ ] Test all admin functions
- [ ] Verify audit logging works
- [ ] Test emergency fallback access
- [ ] Document admin procedures
- [ ] Train authorized administrators

## 🔧 Troubleshooting

### Common Issues

#### "Access Denied" for Valid Admin
**Symptoms:** Admin user sees unauthorized screen
**Solutions:**
1. Verify user is in "Innovation Portal Administrators" group
2. Check SharePoint group name spelling in configuration
3. Ensure user has appropriate site permissions
4. Clear browser cache and retry

#### Authentication Errors
**Symptoms:** Authentication error screen appears
**Solutions:**
1. Verify SharePoint REST API is accessible
2. Check CORS settings if cross-site access
3. Ensure user is logged into SharePoint
4. Check browser console for specific errors

#### Audit Log Not Working
**Symptoms:** Admin actions aren't logged
**Solutions:**
1. Create `AdminAuditLog` list manually if needed
2. Verify admin has write permissions to audit list
3. Check browser console for SharePoint write errors

### Configuration Validation

Test your configuration with these PowerShell commands:

```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite"

# Check if admin group exists
Get-PnPGroup -Identity "Innovation Portal Administrators"

# List group members
Get-PnPGroupMember -Identity "Innovation Portal Administrators"

# Check current user permissions
Get-PnPUserProfileProperty -Account "user@company.com"
```

## 🔒 Security Best Practices

### Access Control
- ✅ Use SharePoint groups instead of individual permissions
- ✅ Implement principle of least privilege
- ✅ Regular audit of group membership
- ✅ Remove access for departed employees
- ✅ Use strong authentication (MFA recommended)

### Monitoring
- ✅ Regular review of audit logs
- ✅ Monitor unauthorized access attempts
- ✅ Set up alerts for security events
- ✅ Regular permission reviews

### Development
- ✅ Never hardcode admin credentials
- ✅ Use secure HTTPS connections only
- ✅ Validate all user inputs
- ✅ Log security-relevant events

## 📞 Support

For additional security questions or issues:

1. **SharePoint Administration** - Contact your SharePoint administrator
2. **Technical Issues** - Check browser developer console for errors
3. **Permission Problems** - Verify with site collection administrator
4. **Custom Requirements** - Consider SharePoint Framework (SPFx) development

## 🔄 Regular Maintenance

### Monthly Tasks
- [ ] Review admin group membership
- [ ] Check audit logs for anomalies
- [ ] Verify all admin functions work
- [ ] Update fallback admin emails if needed

### Quarterly Tasks
- [ ] Full security review
- [ ] Permission audit
- [ ] Test disaster recovery procedures
- [ ] Update documentation

---

**⚠️ Important:** Always test security configurations in a development environment before deploying to production.