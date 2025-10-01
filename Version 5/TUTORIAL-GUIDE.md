# 🎓 Tutorial System Guide

**Complete documentation for the context-aware onboarding tutorial system**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Commands](#quick-commands)
3. [How It Works](#how-it-works)
4. [Tutorial Content](#tutorial-content)
5. [Testing Guide](#testing-guide)
6. [Customization](#customization)
7. [SharePoint Migration](#sharepoint-migration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Innovation Portal features **intelligent, context-aware tutorials** that automatically adapt based on where users land:

- **Home Tutorial** (`#home` or `/`) - 7 steps: dashboard, search, ideas gallery, navigation
- **Submit Tutorial** (`#submit`) - 8 steps: form, security, progress tracking, tips

### Key Features

✅ **Context-aware** - Different tutorials for different pages  
✅ **First-time only** - Runs once per section, tracked independently  
✅ **Smart positioning** - Viewport boundary detection with fallback  
✅ **SVG mask cutouts** - Transparent "holes" in dark overlay  
✅ **Auto-scroll** - Centers elements perfectly in viewport  
✅ **Dynamic updates** - Scroll listener keeps cutouts aligned  
✅ **Mobile responsive** - Works on all screen sizes  
✅ **Glassmorphism design** - Modern frosted glass aesthetic  

---

## Quick Commands

### Console Commands

```javascript
// Reset all tutorials
tutorialManager.resetAll()

// Force start home tutorial
tutorialManager.get("home").forceStart()

// Force start submit tutorial
tutorialManager.get("submit").forceStart()

// Check if home tutorial completed
tutorialManager.get("home").hasCompletedTutorial()

// Check if submit tutorial completed
tutorialManager.get("submit").hasCompletedTutorial()

// Reset home tutorial only
tutorialManager.get("home").resetTutorial()

// Reset submit tutorial only
tutorialManager.get("submit").resetTutorial()
```

### Quick Test Flow

```javascript
// 1. Reset everything
tutorialManager.resetAll()

// 2. Refresh browser
location.reload()

// 3. Home tutorial starts automatically
// 4. Click "Submit Idea" button
// 5. Submit tutorial starts automatically
```

---

## How It Works

### Automatic Triggers

| User Action | Tutorial Triggered |
|-------------|-------------------|
| Visits `/` or `#home` | **Home Tutorial** (7 steps) |
| Visits `#submit` | **Submit Tutorial** (8 steps) |
| Returns to visited section | No tutorial (already completed) |

### Technical Architecture

```javascript
// Tutorial Manager (Singleton)
window.tutorialManager = new TutorialManager()
  ├── tutorials: Map<string, OnboardingTutorial>
  ├── get(context): OnboardingTutorial
  ├── startForView(view): void
  └── resetAll(): void

// Onboarding Tutorial (Per Context)
new OnboardingTutorial(context)
  ├── context: 'home' | 'submit'
  ├── steps: Step[]
  ├── currentStep: number
  ├── hasCompletedTutorial()
  ├── start() / forceStart()
  ├── next() / previous()
  └── skip() / complete()
```

### Storage Strategy

```javascript
// Home tutorial tracking
localStorage['innovationPortal_tutorial_home_completed'] = 'true'
localStorage['innovationPortal_tutorial_home_completed_date'] = '2025-10-01T...'

// Submit tutorial tracking
localStorage['innovationPortal_tutorial_submit_completed'] = 'true'
localStorage['innovationPortal_tutorial_submit_completed_date'] = '2025-10-01T...'
```

### Integration with App

```javascript
// In app.js switchView() method
if (viewName === 'home') {
    // ... render home view ...
    setTimeout(() => {
        window.tutorialManager.startForView('home');
    }, 1000);
}

if (viewName === 'submit') {
    // ... render submit view ...
    setTimeout(() => {
        window.tutorialManager.startForView('submit');
    }, 1000);
}
```

---

## Tutorial Content

### Home Tutorial (7 Steps)

| Step | Target | Title | Description |
|------|--------|-------|-------------|
| 1 | `.hero-section` | 👋 Welcome to the Innovation Portal! | Tour introduction |
| 2 | `.kpi-grid` | 💡 Innovation Dashboard | Explains KPI metrics |
| 3 | `.search-section` | 🔍 Search & Filter | Search and filter features |
| 4 | `.ideas-grid` | 📊 Ideas Gallery | Browse submitted ideas |
| 5 | `[data-view="submit"]` | 🎯 Submit Your Ideas | Points to submit button |
| 6 | `[data-view="track"]` | 📈 Track Your Ideas | Points to track button |
| 7 | `.hero-section` | 🎉 You're All Set! | Completion message |

### Submit Tutorial (8 Steps)

| Step | Target | Title | Description |
|------|--------|-------|-------------|
| 1 | `.page-title` | 👋 Welcome to Idea Submission! | Submission intro |
| 2 | `.security-notice` | 🔒 Security & Compliance | PCI DSS protection |
| 3 | `#idea-form` | 📝 Submit Your Ideas | Form overview |
| 4 | `.progress-panel` | 📊 Track Your Progress | Progress bar |
| 5 | `#idea-title` | 💡 Start With Your Idea Title | Title field focus |
| 6 | `.tips-panel` | 💎 Tips for Success | Submission tips |
| 7 | `nav` | 🔍 Track Your Ideas | Navigation hint |
| 8 | `null` | 🚀 Ready to Innovate! | Completion |

---

## Testing Guide

### Full Test Workflow

```javascript
// Step 1: Reset all tutorials
tutorialManager.resetAll()
// Expected: "🔄 All tutorials reset. Navigate to home or submit to see them again."

// Step 2: Hard refresh browser
// Press: Ctrl + F5 (or Ctrl + Shift + R)

// Step 3: Test Home Tutorial
// ✅ Should start after 1 second
// ✅ Should show 7 steps
// ✅ Should highlight dashboard, search, ideas grid
// ✅ Should auto-scroll smoothly
// ✅ Should save completion to localStorage

// Step 4: Test Submit Tutorial
// Click "Submit Idea" button
// ✅ Should start after 1 second
// ✅ Should show 8 steps
// ✅ Should highlight security, form, progress
// ✅ Should auto-scroll smoothly
// ✅ Should save completion to localStorage

// Step 5: Verify No Re-run
// Navigate back to home → Tutorial should NOT start
// Navigate to submit → Tutorial should NOT start
```

### Individual Tutorial Tests

```javascript
// Force start home tutorial
tutorialManager.get("home").forceStart()

// Force start submit tutorial
tutorialManager.get("submit").forceStart()

// Check completion status
tutorialManager.get("home").hasCompletedTutorial() // true/false
tutorialManager.get("submit").hasCompletedTutorial() // true/false
```

### Verification Checklist

**Console Logs:**
- [ ] "🎓 Context-Aware Tutorial System Loaded"
- [ ] "💡 Commands:" help section appears
- [ ] "🎓 Starting home tutorial" when home loads
- [ ] "🎓 Starting submit tutorial" when submit loads
- [ ] "🎉 home tutorial completed!" after finishing
- [ ] No JavaScript errors

**Visual Checks:**
- [ ] Step counter badge shows (1/7, 2/7, etc.)
- [ ] Glassmorphism tooltip with gradient border
- [ ] SVG cutout creates transparent "hole" in overlay
- [ ] Spotlight glowing border around highlighted elements
- [ ] Auto-scroll centers elements in viewport
- [ ] Progress dots at bottom update correctly
- [ ] Buttons work (Previous, Next, Skip, Close)
- [ ] Completion message appears

**Mobile Responsive:**
- [ ] Tooltips center on small screens (< 768px)
- [ ] Buttons are touch-friendly (44px+)
- [ ] SVG cutouts work on touch devices
- [ ] Auto-scroll works smoothly

---

## Customization

### Adding a New Tutorial Context

**1. Define Steps:**
```javascript
// In onboarding-tutorial.js
getTrackSteps() {
    return [
        {
            target: '.tracking-header',
            title: '📈 Track Your Ideas',
            content: 'Monitor all your submissions here.',
            position: 'bottom',
            highlightArea: '.tracking-header',
            action: () => this.scrollToElement('.tracking-header')
        },
        // ... more steps
    ];
}
```

**2. Add to Context Map:**
```javascript
getStepsForContext(context) {
    if (context === 'home') return this.getHomeSteps();
    if (context === 'submit') return this.getSubmitSteps();
    if (context === 'track') return this.getTrackSteps(); // NEW
    return [];
}
```

**3. Trigger in app.js:**
```javascript
if (viewName === 'track') {
    setTimeout(() => {
        window.tutorialManager.startForView('track');
    }, 1000);
}
```

### Customizing Step Content

Each step object has these properties:

```javascript
{
    target: '.css-selector',        // Element to attach tooltip to
    title: '👋 Step Title',         // Tooltip heading
    content: 'Step description',    // Tooltip body text
    position: 'bottom',             // 'top', 'bottom', 'left', 'right', 'center'
    highlightArea: '.css-selector', // Element to highlight with spotlight
    action: () => {}                // Function to run (usually scroll)
}
```

### Styling Customization

**CSS Variables in `onboarding-tutorial.css`:**
```css
/* Tooltip appearance */
.tutorial-tooltip {
    width: 400px;                    /* Tooltip width */
    background: linear-gradient(...); /* Glassmorphism gradient */
    border-radius: 20px;             /* Corner radius */
}

/* Spotlight glow */
.tutorial-spotlight {
    border: 3px solid rgba(102, 126, 234, 0.9); /* Glow color */
    box-shadow: 0 0 20px rgba(...);              /* Glow intensity */
}

/* Step indicator badge */
.tutorial-step-indicator {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Gradient */
}
```

---

## SharePoint Migration

When ready to migrate from localStorage to SharePoint List:

### Step 1: Create SharePoint List

**List Name:** `UserTutorialStatus`

**Columns:**
- `Title` (Single line of text) - User email
- `HomeCompleted` (Yes/No)
- `HomeCompletedDate` (Date and Time)
- `SubmitCompleted` (Yes/No)
- `SubmitCompletedDate` (Date and Time)

### Step 2: Update Tutorial Code

```javascript
// In OnboardingTutorial class

// Update hasCompletedTutorial()
async hasCompletedTutorial() {
    const userEmail = _spPageContextInfo.userEmail;
    
    try {
        const items = await sp.web.lists.getByTitle('UserTutorialStatus')
            .items
            .filter(`Title eq '${userEmail}'`)
            .select('HomeCompleted', 'SubmitCompleted')
            .get();
        
        if (items.length > 0) {
            return this.context === 'home' ? 
                items[0].HomeCompleted : 
                items[0].SubmitCompleted;
        }
        return false;
    } catch (error) {
        console.error('Error checking tutorial status:', error);
        return false;
    }
}

// Update markAsCompleted()
async markAsCompleted() {
    const userEmail = _spPageContextInfo.userEmail;
    const field = this.context === 'home' ? 'HomeCompleted' : 'SubmitCompleted';
    const dateField = this.context === 'home' ? 'HomeCompletedDate' : 'SubmitCompletedDate';
    
    try {
        // Check if user exists
        const items = await sp.web.lists.getByTitle('UserTutorialStatus')
            .items
            .filter(`Title eq '${userEmail}'`)
            .get();
        
        if (items.length > 0) {
            // Update existing
            await sp.web.lists.getByTitle('UserTutorialStatus')
                .items.getById(items[0].Id)
                .update({
                    [field]: true,
                    [dateField]: new Date().toISOString()
                });
        } else {
            // Create new
            await sp.web.lists.getByTitle('UserTutorialStatus')
                .items.add({
                    Title: userEmail,
                    [field]: true,
                    [dateField]: new Date().toISOString()
                });
        }
        
        console.log(`🎉 ${this.context} tutorial completion saved to SharePoint`);
    } catch (error) {
        console.error('Error saving tutorial completion:', error);
    }
}

// Update start() to handle async
async start() {
    const completed = await this.hasCompletedTutorial();
    if (completed) {
        console.log(`✅ ${this.context} tutorial already completed`);
        return false;
    }
    // ... rest of start logic
}
```

### Step 3: Update App Integration

```javascript
// In app.js
if (viewName === 'home') {
    setTimeout(async () => {
        await window.tutorialManager.startForView('home');
    }, 1000);
}
```

---

## Troubleshooting

### Tutorial Not Starting

**Check completion status:**
```javascript
tutorialManager.get("home").hasCompletedTutorial()
tutorialManager.get("submit").hasCompletedTutorial()
```

**Force restart:**
```javascript
tutorialManager.get("home").resetTutorial()
tutorialManager.get("home").forceStart()
```

### Tooltip Off-Screen

**Cause:** Viewport boundary calculation fails  
**Solution:** System auto-centers as fallback

**Debug:**
```javascript
// Check if target element exists
document.querySelector('.kpi-grid')

// Force center positioning
tutorialManager.get("home").forceStart()
```

### SVG Cutout Not Visible

**Check if SVG mask exists:**
```javascript
document.querySelector('.tutorial-overlay-mask')
document.getElementById('tutorial-cutout-home')
document.getElementById('tutorial-cutout-submit')
```

**Verify positioning:**
- Scroll listener should update cutout dynamically
- Check browser console for errors

### Auto-Scroll Not Working

**Verify target elements exist:**
```javascript
document.querySelector('.kpi-grid')  // Home tutorial
document.querySelector('#idea-form') // Submit tutorial
```

**Check scroll behavior:**
```javascript
// Manually test scroll
window.scrollTo({ top: 500, behavior: 'smooth' })
```

### Tutorial Already Active Error

**Complete current tutorial first:**
```javascript
tutorialManager.get("home").complete(false)
tutorialManager.get("home").forceStart()
```

---

## Files Reference

### Core Files
- `onboarding-tutorial.js` - Tutorial system (context-aware)
- `onboarding-tutorial.css` - Styling (glassmorphism)
- `app.js` - Integration with portal
- `index.html` - Script references

### Backup Files
- `onboarding-tutorial-old.js` - Original single-context version (backup)

---

## Summary

Your context-aware tutorial system is complete with:

✅ **Separate tutorials** for Home (7 steps) and Submit (8 steps)  
✅ **Independent tracking** via localStorage  
✅ **Smart positioning** with viewport boundary checks  
✅ **SVG mask cutouts** for transparent overlay centers  
✅ **Auto-scroll** that centers elements perfectly  
✅ **Scroll listener** that keeps cutouts aligned  
✅ **Mobile responsive** design  
✅ **Glassmorphism aesthetic** matching portal theme  
✅ **Console commands** for easy testing  
✅ **SharePoint migration path** when ready  

**Quick Test:** `tutorialManager.resetAll(); location.reload();`

🎉 **Enjoy your enhanced onboarding experience!**
