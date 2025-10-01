# 🚀 Context-Aware Tutorials - Quick Reference

## What Changed?

**Before:** One tutorial for the entire site
**Now:** Separate tutorials for Home and Submit pages

## How It Works

| User Action | Tutorial Triggered |
|-------------|-------------------|
| Visits `/` or `#home` | **Home Tutorial** (7 steps) |
| Visits `#submit` | **Submit Tutorial** (8 steps) |
| Returns to visited section | No tutorial (already completed) |

## Quick Commands

```javascript
// Reset all tutorials
tutorialManager.resetAll()

// Force home tutorial
tutorialManager.get("home").forceStart()

// Force submit tutorial
tutorialManager.get("submit").forceStart()

// Check if home tutorial completed
tutorialManager.get("home").hasCompletedTutorial()

// Check if submit tutorial completed
tutorialManager.get("submit").hasCompletedTutorial()

// Reset home only
tutorialManager.get("home").resetTutorial()

// Reset submit only
tutorialManager.get("submit").resetTutorial()
```

## Test Flow

```javascript
// 1. Reset
tutorialManager.resetAll()

// 2. Refresh (Ctrl + F5)

// 3. Home tutorial starts automatically

// 4. Click "Submit Idea"

// 5. Submit tutorial starts automatically

// Done! Both tutorials completed independently
```

## Storage Keys

```javascript
// Home
innovationPortal_tutorial_home_completed: "true"
innovationPortal_tutorial_home_completed_date: "2025-10-01..."

// Submit
innovationPortal_tutorial_submit_completed: "true"
innovationPortal_tutorial_submit_completed_date: "2025-10-01..."
```

## Files Changed

- ✅ `onboarding-tutorial.js` - Now context-aware with TutorialManager
- ✅ `app.js` - Triggers tutorials on view change
- ✅ `CONTEXT-AWARE-TUTORIAL-GUIDE.md` - New comprehensive guide
- ✅ `TUTORIAL-IMPLEMENTATION-SUMMARY.md` - Implementation details

## Backwards Compatibility

Old files kept as backup:
- `onboarding-tutorial-old.js` - Original version

Old documentation (now deprecated):
- `ONBOARDING-TUTORIAL-GUIDE.md` - Single-context guide
- `ONBOARDING-QUICK-START.md` - Original quick start

## Success Checklist

- [ ] Home tutorial runs on first home visit
- [ ] Submit tutorial runs on first submit visit
- [ ] Each tutorial only runs once
- [ ] Tutorials track completion independently
- [ ] Can be manually restarted
- [ ] Mobile responsive
- [ ] No console errors

## Need Help?

**📚 Full Documentation:** `CONTEXT-AWARE-TUTORIAL-GUIDE.md`
**📊 Implementation Details:** `TUTORIAL-IMPLEMENTATION-SUMMARY.md`
**💻 Console Logs:** Check browser console for tutorial system status

---

**That's it!** Your context-aware tutorial system is ready to go! 🎉
