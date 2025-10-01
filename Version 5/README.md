# Innovation Portal V5 - SharePoint Integration

## Overview
A modern, futuristic frontend for capturing and managing innovative ideas across organizations. This version integrates with SharePoint REST API for data storage and document management.

## Features
- **3-in-1 Interface**: Homepage/Landing, Submit Ideas, Track Submissions
- **SharePoint Integration**: Ideas and attachments stored in SharePoint
- **Advanced File Handling**: Restricted file types and sizes with visual indicators
- **Real-time Search**: Global search across ideas with category filtering
- **Progress Tracking**: Visual progress indicators and status management
- **Responsive Design**: Modern glassmorphism UI that works on all devices

## SharePoint Setup Requirements

### 1. SharePoint Lists
Create the following SharePoint list with these columns:

**List Name**: `InnovationIdeas`

| Column Name | Type | Description |
|-------------|------|-------------|
| Title | Single line of text | Idea title |
| Category | Choice | Process, Product, Customer, Tech, Sustainability, Workplace |
| Department | Single line of text | Submitter's department |
| Problem | Multiple lines of text | Problem statement |
| Solution | Multiple lines of text | Proposed solution |
| ExpectedImpact | Choice | Cost reduction, Revenue growth, Customer experience, Risk & compliance, Operational efficiency |
| EstimatedEffort | Choice | Low (≤ 2 weeks), Medium (≤ 2 months), High (> 2 months) |
| RequiredResources | Multiple lines of text | Required resources description |
| SubmitterName | Single line of text | Submitter's name |
| SubmitterEmail | Single line of text | Submitter's email |
| Tags | Single line of text | Semicolon-separated tags |
| Status | Choice | Submitted, In review, Accepted, Rejected |
| AttachmentUrls | Multiple lines of text | Semicolon-separated file URLs |
| IsAnonymous | Yes/No | Whether submission is anonymous |
| Votes | Number | Vote count |

### 2. Document Library
Create a document library for file attachments:

**Library Name**: `IdeaAttachments`
- Enable versioning
- Set appropriate permissions
- Configure file size limits (recommended: 10MB max)

### 3. File Upload Restrictions
The application enforces these restrictions:

**Allowed File Types:**
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`

**File Limits:**
- Maximum file size: 10MB per file
- Maximum files per submission: 5 files
- Total storage: Based on SharePoint limits

## Configuration

### Update SharePoint Settings
In `app.js`, update the `sharePointConfig` object:

```javascript
this.sharePointConfig = {
    siteUrl: 'https://yourtenant.sharepoint.com/sites/yoursite', // Update this
    listName: 'InnovationIdeas',
    libraryName: 'IdeaAttachments',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'],
    // ... other settings
};
```

### Current User Configuration
Update the `currentUser` object with actual user details:

```javascript
this.currentUser = {
    name: _spPageContextInfo.userDisplayName,
    department: 'Engineering', // Get from user profile
    email: _spPageContextInfo.userEmail,
    id: _spPageContextInfo.userId
};
```

## Deployment

### Option 1: SharePoint Pages
1. Upload files to SharePoint Document Library
2. Create a SharePoint page
3. Add Script Editor Web Part
4. Reference the uploaded files

### Option 2: SharePoint Framework (SPFx)
1. Convert to SPFx web part
2. Package and deploy to App Catalog
3. Add to SharePoint pages

### Option 3: Custom SharePoint Solution
1. Deploy as custom master page or application page
2. Register as SharePoint App

## Security Considerations

### Permissions
- **Read**: All employees can view ideas
- **Contribute**: All employees can submit ideas
- **Manage**: Innovation team can advance status

### Data Privacy
- Anonymous submissions supported
- Email addresses stored securely
- Files accessible only to authorized users

### CORS and Authentication
The application uses SharePoint's built-in authentication and CORS policies.

## Browser Support
- Modern browsers (Chrome, Firefox, Edge, Safari)
- IE11+ (with polyfills)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Theming
Update CSS variables in `styles.css`:
```css
:root {
    --brand-primary: #6ae3ff; /* Your primary color */
    --brand-secondary: #9b8cff; /* Your secondary color */
    /* ... other theme variables */
}
```

### Categories and Impact Types
Update the choice columns in SharePoint and corresponding JavaScript arrays.

### File Type Restrictions
Modify `allowedFileTypes` and `allowedMimeTypes` in the configuration.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure SharePoint allows cross-origin requests
2. **Permission Denied**: Check user permissions on lists and libraries
3. **File Upload Fails**: Verify file size and type restrictions
4. **List Not Found**: Ensure SharePoint lists are created correctly

### Debug Mode
Enable console logging by setting:
```javascript
console.log('🚀 Innovation Portal V5 initialized with SharePoint integration');
```

## Support
For issues or feature requests, contact the development team or check SharePoint logs for detailed error information.