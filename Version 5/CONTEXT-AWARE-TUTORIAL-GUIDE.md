# Context-Aware Tutorial System - Quick Start Guide

## 🎯 Overview
The Innovation Portal now features **separate tutorials** for different sections:
- **Home Tutorial**: Runs once when users first visit the home page (`#home` or `/`)
- **Submit Tutorial**: Runs once when users first visit the submission page (`#submit`)

Each tutorial tracks completion independently using localStorage.

---

## 📋 Quick Commands

### Test Tutorials in Console

```javascript
// Start home tutorial (force)
tutorialManager.get("home").forceStart()

// Start submit tutorial (force)
tutorialManager.get("submit").forceStart()

// Reset home tutorial only
tutorialManager.get("home").resetTutorial()

// Reset submit tutorial only
tutorialManager.get("submit").resetTutorial()

// Reset ALL tutorials
tutorialManager.resetAll()
```

---

## 🔧 How It Works

### Automatic Triggers

1. **Landing on Home (`/` or `#home`)**
   - Home tutorial starts automatically (first visit only)
   - Shows: Dashboard, Search, Ideas Gallery, Navigation

2. **Landing on Submit (`#submit`)**
   - Submit tutorial starts automatically (first visit only)
   - Shows: Security, Form, Progress Tracker, Tips

3. **Returning Users**
   - Tutorials only run once per section
   - Can be manually restarted from help menu

### Navigation Detection

The system detects view changes via:
- URL hash changes (`#home`, `#submit`)
- Navigation button clicks
- Direct URL access

---

## 📦 LocalStorage Keys

```javascript
// Home tutorial
innovationPortal_tutorial_home_completed: "true"
innovationPortal_tutorial_home_completed_date: "2025-10-01T..."

// Submit tutorial
innovationPortal_tutorial_submit_completed: "true"
innovationPortal_tutorial_submit_completed_date: "2025-10-01T..."
```

---

## 🎨 Tutorial Steps

### Home Tutorial (7 Steps)
1. Welcome to Innovation Portal
2. Innovation Dashboard (KPIs)
3. Search & Filter
4. Ideas Gallery
5. Submit Your Ideas (navigation hint)
6. Track Your Ideas (navigation hint)
7. You're All Set!

### Submit Tutorial (8 Steps)
1. Welcome to Idea Submission
2. Security & Compliance
3. Submit Your Ideas (form)
4. Track Your Progress (progress bar)
5. Start With Your Idea Title
6. Tips for Success
7. Track Your Ideas (navigation)
8. Ready to Innovate!

---

## 🧪 Testing Workflow

### Test Home Tutorial
```powershell
# 1. Reset home tutorial
tutorialManager.get("home").resetTutorial()

# 2. Navigate to home
# Click "Home" in navigation OR visit yoursite.com/#home

# 3. Tutorial should auto-start after 1 second
```

### Test Submit Tutorial
```powershell
# 1. Reset submit tutorial
tutorialManager.get("submit").resetTutorial()

# 2. Navigate to submit
# Click "Submit Idea" in navigation OR visit yoursite.com/#submit

# 3. Tutorial should auto-start after 1 second
```

### Test Both Together
```powershell
# 1. Reset all tutorials
tutorialManager.resetAll()

# 2. Hard refresh browser
Ctrl + F5

# 3. Visit home - home tutorial runs
# 4. Click "Submit Idea" - submit tutorial runs
```

---

## 🐛 Troubleshooting

### Tutorial Not Starting?

**Check completion status:**
```javascript
// Check home tutorial
tutorialManager.get("home").hasCompletedTutorial()

// Check submit tutorial
tutorialManager.get("submit").hasCompletedTutorial()
```

**Force restart:**
```javascript
// Force home tutorial
tutorialManager.get("home").forceStart()

// Force submit tutorial
tutorialManager.get("submit").forceStart()
```

### Tutorial Already Active?

```javascript
// Complete current tutorial first
tutorialManager.get("home").complete(false)

// Then start again
tutorialManager.get("home").forceStart()
```

### Clear All Tutorial Data

```javascript
// Method 1: Use manager
tutorialManager.resetAll()

// Method 2: Clear localStorage manually
localStorage.removeItem('innovationPortal_tutorial_home_completed')
localStorage.removeItem('innovationPortal_tutorial_home_completed_date')
localStorage.removeItem('innovationPortal_tutorial_submit_completed')
localStorage.removeItem('innovationPortal_tutorial_submit_completed_date')
```

---

## 🚀 Integration with Your App

### View Switching Logic (app.js)

```javascript
switchView(viewName) {
    // ... view switching code ...
    
    if (viewName === 'home') {
        // Start home tutorial
        setTimeout(() => {
            window.tutorialManager.startForView('home');
        }, 1000);
    } else if (viewName === 'submit') {
        // Start submit tutorial
        setTimeout(() => {
            window.tutorialManager.startForView('submit');
        }, 1000);
    }
}
```

### Initial Page Load (app.js)

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    app = new InnovationPortal();
    
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'submit', 'track'].includes(hash)) {
        app.switchView(hash); // Tutorial triggers automatically
    } else {
        // Default to home - start home tutorial
        window.tutorialManager.startForView('home');
    }
});
```

---

## 📱 Mobile Responsive

- Tooltips auto-center on mobile (< 768px)
- Touch-friendly buttons (44px minimum)
- Swipe gestures supported
- Scroll listener works on touch devices

---

## 🔮 Future: SharePoint Integration

When ready to migrate to SharePoint Lists:

### Create SharePoint List
**List Name:** `UserTutorialStatus`

**Columns:**
- `Title` (Single line of text) - User email
- `HomeCompleted` (Yes/No)
- `HomeCompletedDate` (Date and Time)
- `SubmitCompleted` (Yes/No)
- `SubmitCompletedDate` (Date and Time)

### Update Tutorial Code
```javascript
// In OnboardingTutorial class
async hasCompletedTutorial() {
    const userEmail = _spPageContextInfo.userEmail;
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
}

async markAsCompleted() {
    const userEmail = _spPageContextInfo.userEmail;
    const field = this.context === 'home' ? 'HomeCompleted' : 'SubmitCompleted';
    const dateField = this.context === 'home' ? 'HomeCompletedDate' : 'SubmitCompletedDate';
    
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
}
```

---

## 📊 Analytics Tracking (Optional)

Track tutorial completion for analytics:

```javascript
showCompletionMessage() {
    // ... existing code ...
    
    // Track completion event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'tutorial_complete', {
            'tutorial_name': this.context,
            'tutorial_steps': this.steps.length,
            'user_email': _spPageContextInfo?.userEmail || 'unknown'
        });
    }
}
```

---

## 🎓 Best Practices

1. **Keep tutorials short** - 5-8 steps maximum
2. **Test on mobile** - Verify touch interactions
3. **Update content regularly** - Keep tips relevant
4. **Monitor completion rates** - Use analytics
5. **Provide skip option** - Don't force users
6. **Add help menu** - Allow manual restart
7. **Test scroll behavior** - Ensure smooth animations

---

## 📝 Customization

### Add New Tutorial Context

1. **Add steps to `getStepsForContext()`:**
```javascript
getStepsForContext(context) {
    if (context === 'home') return this.getHomeSteps();
    if (context === 'submit') return this.getSubmitSteps();
    if (context === 'track') return this.getTrackSteps(); // NEW
    return [];
}
```

2. **Define steps:**
```javascript
getTrackSteps() {
    return [
        {
            target: '.tracking-header',
            title: 'Track Your Ideas',
            content: 'Monitor all your submissions here.',
            position: 'bottom',
            highlightArea: '.tracking-header',
            action: () => this.scrollToElement('.tracking-header')
        },
        // ... more steps
    ];
}
```

3. **Trigger in app.js:**
```javascript
if (viewName === 'track') {
    setTimeout(() => {
        window.tutorialManager.startForView('track');
    }, 1000);
}
```

---

## 🆘 Support

**Console Logs:**
```javascript
// Check if system loaded
console.log('Tutorial Manager:', window.tutorialManager)

// Check active tutorial
tutorialManager.get("home").isActive
tutorialManager.get("submit").isActive

// Check current step
tutorialManager.get("home").currentStep
tutorialManager.get("submit").currentStep
```

**Common Issues:**
- ✅ Tutorial not starting → Check completion status
- ✅ Tutorial starting twice → Check delay timing
- ✅ Elements not highlighting → Verify selectors exist
- ✅ Tooltip off-screen → Auto-centers as fallback
- ✅ Scroll not working → Check element visibility

---

**Need Help?** Check browser console for tutorial system logs and error messages.
