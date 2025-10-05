/**
 * Context-Aware Interactive Onboarding Tutorial System
 * Separate tutorials for Home and Submit pages
 * Uses localStorage for tracking (can be switched to SharePoint later)
 */

class OnboardingTutorial {
  constructor(context = 'submit') {
    this.context = context; // 'home' or 'submit'
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.scrollListener = null;
    
    // Define tutorial steps based on context
    this.steps = this.getStepsForContext(context);
    this.setupMotionPreference();
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

  getScrollBehavior() {
    return this.prefersReducedMotion ? 'auto' : 'smooth';
  }

  scrollToPosition(top) {
    try {
      window.scrollTo({
        top,
        behavior: this.getScrollBehavior()
      });
    } catch (error) {
      window.scrollTo(0, top);
    }
  }

  getStepsForContext(context) {
    if (context === 'home') {
      return this.getHomeSteps();
    } else if (context === 'submit') {
      return this.getSubmitSteps();
    }
    return [];
  }

  // Home page tutorial steps
  getHomeSteps() {
    return [
      {
        target: '.hero-section',
  title: '👋 Welcome to Think Space!',
        content: 'Let\'s take a quick tour of the home page. We\'ll show you how to explore ideas, track progress, and navigate the platform.',
        position: 'center',
        highlightArea: '.hero-section',
        action: () => {
          this.scrollToPosition(0);
        }
      },
      {
        target: '.kpi-grid',
  title: '💡 Think Space Dashboard',
  content: 'This is your ideas dashboard showing key metrics: total ideas submitted, ideas in progress, and successfully implemented outcomes.',
        position: 'bottom',
        highlightArea: '.kpi-grid',
        action: () => this.scrollToElement('.kpi-grid')
      },
      {
        target: '.search-section',
        title: '🔍 Search & Filter',
        content: 'Use the search bar to find specific ideas by title, description, or keywords. Filter by status or category to narrow down results.',
        position: 'bottom',
        highlightArea: '.search-section',
        action: () => this.scrollToElement('.search-section')
      },
      {
        target: '.ideas-grid',
        title: '📊 Ideas Gallery',
        content: 'Browse all submitted ideas here. Each card shows the idea status, title, description, and engagement metrics like votes and comments.',
        position: 'top',
        highlightArea: '.ideas-grid',
        action: () => this.scrollToElement('.ideas-grid')
      },
      {
        target: '[data-view="submit"]',
        title: '🎯 Submit Your Ideas',
  content: 'Ready to share your idea? Click the "Submit Idea" button in the navigation to go to the submission form. You\'ll get a tutorial there too!',
        position: 'bottom',
        highlightArea: '[data-view="submit"]',
        action: () => {
          this.scrollToPosition(0);
        }
      },
      {
        target: '[data-view="track"]',
        title: '📈 Track Your Ideas',
        content: 'Navigate to the "Track Ideas" section to monitor your submissions, see their status, and track engagement.',
        position: 'bottom',
        highlightArea: '[data-view="track"]',
        action: () => {
          this.scrollToPosition(0);
        }
      },
      {
        target: null,
        title: '🎉 You\'re All Set!',
        content: 'You\'re ready to explore! Browse ideas, submit innovations, and collaborate with your team. Happy innovating!',
        position: 'center',
        highlightArea: null,
        action: () => {
          this.scrollToPosition(0);
        }
      }
    ];
  }

  // Submit page tutorial steps
  getSubmitSteps() {
    return [
      {
        target: '.page-title',
        title: '👋 Welcome to Idea Submission!',
        content: 'This is your platform to share groundbreaking ideas and transform the future of our organization.',
        position: 'bottom',
        highlightArea: '.submit-header',
        action: () => this.scrollToElement('.submit-header')
      },
      {
        target: '.security-notice',
        title: '🔒 Security & Compliance',
        content: 'We take security seriously! Our system automatically detects and protects sensitive information like credit card numbers and personal data.',
        position: 'left',
        highlightArea: '.security-notice',
        action: () => this.scrollToElement('.security-notice')
      },
      {
        target: '#idea-form',
        title: '📝 Submit Your Ideas',
        content: 'Fill out this intuitive form to submit your innovative ideas. The progress bar on the right tracks your completion in real-time.',
        position: 'right',
        highlightArea: '.submit-form-container',
        action: () => this.scrollToElement('#idea-form')
      },
      {
        target: '.progress-panel',
        title: '📊 Track Your Progress',
        content: 'Watch your form completion in real-time! Complete all sections to unlock the submit button.',
        position: 'left',
        highlightArea: '.progress-panel',
        action: () => this.scrollToElement('.progress-panel')
      },
      {
        target: '#idea-title',
        title: '💡 Start With Your Idea Title',
        content: 'Give your idea a clear, concise title that captures its essence. This is the first thing reviewers will see!',
        position: 'bottom',
        highlightArea: '#idea-title',
        action: () => {
          this.scrollToElement('#idea-title');
          document.getElementById('idea-title')?.focus();
        }
      },
      {
        target: '.tips-panel',
        title: '💎 Tips for Success',
        content: 'Check out these helpful tips to craft a compelling submission that stands out!',
        position: 'left',
        highlightArea: '.tips-panel',
        action: () => this.scrollToElement('.tips-panel')
      },
      {
        target: 'nav',
        title: '🔍 Track Your Ideas',
        content: 'After submitting, click "Track Ideas" to monitor the status of your submissions and see their progress through our review process.',
        position: 'bottom',
        highlightArea: 'nav',
        action: () => this.scrollToElement('nav')
      },
      {
        target: null,
        title: '🚀 Ready to Innovate!',
        content: 'You\'re all set! Start sharing your innovative ideas and help us build a better future together. Click "Start Creating" to begin!',
        position: 'center',
        highlightArea: null,
        action: () => {
          this.scrollToPosition(0);
        }
      }
    ];
  }

  // Check if user has completed tutorial for this context
  hasCompletedTutorial() {
    const key = `innovationPortal_tutorial_${this.context}_completed`;
    return localStorage.getItem(key) === 'true';
  }

  // Mark tutorial as completed for this context
  markAsCompleted() {
    const key = `innovationPortal_tutorial_${this.context}_completed`;
    localStorage.setItem(key, 'true');
    localStorage.setItem(`${key}_date`, new Date().toISOString());
  }

  // Reset tutorial completion (for testing)
  resetTutorial() {
    const key = `innovationPortal_tutorial_${this.context}_completed`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_date`);
    console.log(`${this.context} tutorial reset. Refresh to see it again.`);
  }

  // Start tutorial if not completed
  start() {
    if (this.hasCompletedTutorial()) {
      console.log(`${this.context} tutorial already completed`);
      return false;
    }

    if (this.isActive) {
      console.log('Tutorial already active');
      return false;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    console.log(`Starting ${this.context} tutorial`);
    return true;
  }

  // Force start tutorial (ignore completion status)
  forceStart() {
    if (this.isActive) {
      this.complete(false);
      setTimeout(() => this.forceStart(), 500);
      return;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
    console.log(`Force starting ${this.context} tutorial`);
  }

  createOverlay() {
    // Create dark overlay with SVG mask for cutout
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.innerHTML = `
      <svg class="tutorial-overlay-mask">
        <defs>
          <mask id="tutorial-mask-${this.context}">
            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
            <rect id="tutorial-cutout-${this.context}" x="0" y="0" width="0" height="0" fill="black" rx="12"/>
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.85)" mask="url(#tutorial-mask-${this.context})"/>
      </svg>
    `;
    document.body.appendChild(this.overlay);
    document.body.classList.add('tutorial-active');

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tutorial-tooltip';
    document.body.appendChild(this.tooltip);

    // Fade in
    setTimeout(() => {
      this.overlay.classList.add('tutorial-overlay-visible');
      this.tooltip.classList.add('tutorial-tooltip-visible');
    }, 50);
  }

  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;

    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];

    // Execute step action (scroll, etc.)
    if (step.action) {
      step.action();
    }

    // Wait for scroll/action to complete before positioning
    setTimeout(() => {
      this.positionTooltip(step);
      this.highlightElement(step);
    }, 800);
  }

  positionTooltip(step) {
    const isFirstStep = this.currentStep === 0;
    const isLastStep = this.currentStep === this.steps.length - 1;

    // Update tooltip content
    this.tooltip.innerHTML = `
      <div class="tutorial-tooltip-header">
        <div class="tutorial-step-indicator">
          <span class="tutorial-step-current">${this.currentStep + 1}</span>
          <span class="tutorial-step-separator">/</span>
          <span class="tutorial-step-total">${this.steps.length}</span>
        </div>
        <button class="tutorial-close" onclick="window.tutorialManager.get('${this.context}').skip()" title="Skip tutorial">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="tutorial-tooltip-content">
        <h3 class="tutorial-title">${step.title}</h3>
        <p class="tutorial-content">${step.content}</p>
      </div>
      <div class="tutorial-tooltip-footer">
        <button class="tutorial-btn tutorial-btn-secondary" onclick="window.tutorialManager.get('${this.context}').previous()" ${isFirstStep ? 'style="visibility: hidden;"' : ''}>
          <i class="fas fa-arrow-left"></i> Previous
        </button>
        <div class="tutorial-progress-dots">
          ${this.steps.map((_, i) => `
            <span class="tutorial-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></span>
          `).join('')}
        </div>
        <button class="tutorial-btn tutorial-btn-primary" onclick="window.tutorialManager.get('${this.context}').${isLastStep ? 'complete()' : 'next()'}">
          ${isLastStep ? '<i class="fas fa-check"></i> Get Started' : 'Next <i class="fas fa-arrow-right"></i>'}
        </button>
      </div>
    `;

    // Position tooltip
    if (step.position === 'center' || !step.target) {
      // Center on screen
      this.tooltip.classList.add('tutorial-tooltip-center');
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
      this.tooltip.classList.remove('tutorial-tooltip-center');
      const target = document.querySelector(step.target);

      if (target) {
        const rect = target.getBoundingClientRect();

        // Get tooltip dimensions
        this.tooltip.style.opacity = '0';
        this.tooltip.style.display = 'block';
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        this.tooltip.style.opacity = '';

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20;

        let top, left, transform = '';

        // Calculate position based on desired placement
        switch (step.position) {
          case 'bottom':
            top = rect.bottom + window.scrollY + padding;
            left = rect.left + window.scrollX + (rect.width / 2);
            transform = 'translateX(-50%)';

            const leftBound = left - (tooltipWidth / 2);
            const rightBound = left + (tooltipWidth / 2);

            if (leftBound < padding) {
              left = padding + (tooltipWidth / 2);
            } else if (rightBound > viewportWidth - padding) {
              left = viewportWidth - padding - (tooltipWidth / 2);
            }
            break;

          case 'top':
            top = rect.top + window.scrollY - tooltipHeight - padding;
            left = rect.left + window.scrollX + (rect.width / 2);
            transform = 'translateX(-50%)';

            const leftBoundTop = left - (tooltipWidth / 2);
            const rightBoundTop = left + (tooltipWidth / 2);

            if (leftBoundTop < padding) {
              left = padding + (tooltipWidth / 2);
            } else if (rightBoundTop > viewportWidth - padding) {
              left = viewportWidth - padding - (tooltipWidth / 2);
            }
            break;

          case 'left':
            top = rect.top + window.scrollY + (rect.height / 2);
            left = rect.left + window.scrollX - tooltipWidth - padding;
            transform = 'translateY(-50%)';

            if (left < padding) {
              left = rect.right + window.scrollX + padding;
              step.position = 'right';
            }
            break;

          case 'right':
            top = rect.top + window.scrollY + (rect.height / 2);
            left = rect.right + window.scrollX + padding;
            transform = 'translateY(-50%)';

            if (left + tooltipWidth > viewportWidth - padding) {
              left = rect.left + window.scrollX - tooltipWidth - padding;
              step.position = 'left';
            }
            break;

          default:
            top = window.scrollY + (viewportHeight / 2);
            left = (viewportWidth / 2);
            transform = 'translate(-50%, -50%)';
        }

        // Final boundary check - center if still off-screen
        if (top < window.scrollY + padding || 
            top + tooltipHeight > window.scrollY + viewportHeight - padding ||
            left < padding || 
            left + tooltipWidth > viewportWidth - padding) {
          top = window.scrollY + (viewportHeight / 2);
          left = (viewportWidth / 2);
          transform = 'translate(-50%, -50%)';
          this.tooltip.classList.add('tutorial-tooltip-center');
        }

        this.tooltip.style.position = 'absolute';
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.transform = transform;
      }
    }
  }

  highlightElement(step) {
    // Remove existing spotlight
    const existingSpotlight = document.querySelector('.tutorial-spotlight');
    if (existingSpotlight) {
      existingSpotlight.remove();
    }

    if (!step.highlightArea) return;

    const target = document.querySelector(step.highlightArea);
    if (!target) return;

    // Create spotlight element
    const spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    document.body.appendChild(spotlight);

    // Get SVG cutout element
    const cutout = document.getElementById(`tutorial-cutout-${this.context}`);

    // Position spotlight and update SVG cutout
    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const padding = 8;

      const top = rect.top + window.scrollY - padding;
      const left = rect.left + window.scrollX - padding;
      const width = rect.width + (padding * 2);
      const height = rect.height + (padding * 2);
      const borderRadius = 12;

      // Update spotlight (absolute positioned)
      spotlight.style.top = `${top}px`;
      spotlight.style.left = `${left}px`;
      spotlight.style.width = `${width}px`;
      spotlight.style.height = `${height}px`;
      spotlight.style.borderRadius = `${borderRadius}px`;

      // Update SVG cutout (viewport positioned)
      if (cutout) {
        cutout.setAttribute('x', rect.left - padding);
        cutout.setAttribute('y', rect.top - padding);
        cutout.setAttribute('width', width);
        cutout.setAttribute('height', height);
        cutout.setAttribute('rx', borderRadius);
      }
    };

    // Initial position
    updatePosition();

    // Update on scroll
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    this.scrollListener = () => updatePosition();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;

    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.scrollY;
    const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

    this.scrollToPosition(middle);
  }

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  previous() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  skip() {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it anytime from the help menu.')) {
      this.complete(false);
    }
  }

  complete(markCompleted = true) {
    if (markCompleted) {
      this.markAsCompleted();
      console.log(`${this.context} tutorial completed!`);
    }

    this.isActive = false;

    // Clean up scroll listener
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }

    // Remove spotlight element
    const spotlight = document.querySelector('.tutorial-spotlight');
    if (spotlight) {
      spotlight.remove();
    }

    // Fade out and remove
    this.tooltip?.classList.remove('tutorial-tooltip-visible');
    this.overlay?.classList.add('tutorial-overlay-fade-out');

    setTimeout(() => {
      this.overlay?.remove();
      this.tooltip?.remove();
      document.body.classList.remove('tutorial-active');

      if (markCompleted) {
        this.showCompletionMessage();
      }
    }, 300);
  }

  showCompletionMessage() {
    const messages = {
      home: {
        icon: 'fa-home',
        title: 'Home Tour Complete!',
  description: 'You\'re ready to explore Think Space.'
      },
      submit: {
        icon: 'fa-lightbulb',
        title: 'Tutorial Complete!',
        description: 'You\'re ready to start innovating.'
      }
    };

    const msg = messages[this.context] || messages.submit;

    const message = document.createElement('div');
    message.className = 'tutorial-completion-message';
    message.innerHTML = `
      <div class="tutorial-completion-content">
        <i class="fas ${msg.icon}"></i>
        <h3>${msg.title}</h3>
        <p>${msg.description}</p>
      </div>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('tutorial-completion-visible');
    }, 100);

    setTimeout(() => {
      message.classList.remove('tutorial-completion-visible');
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  // Static method to reset all tutorials (for testing)
  static resetAllTutorials() {
    localStorage.removeItem('innovationPortal_tutorial_home_completed');
    localStorage.removeItem('innovationPortal_tutorial_home_completed_date');
    localStorage.removeItem('innovationPortal_tutorial_submit_completed');
    localStorage.removeItem('innovationPortal_tutorial_submit_completed_date');
    console.log('All tutorials reset. Navigate to home or submit to see them again.');
  }
}

/**
 * Tutorial Manager
 * Manages multiple tutorial instances for different contexts
 */
class TutorialManager {
  constructor() {
    this.tutorials = new Map();
  }

  // Get or create tutorial for a context
  get(context) {
    if (!this.tutorials.has(context)) {
      this.tutorials.set(context, new OnboardingTutorial(context));
    }
    return this.tutorials.get(context);
  }

  // Start tutorial for current view
  startForView(view) {
    // Map views to tutorial contexts
    const contextMap = {
      'home': 'home',
      'submit': 'submit',
      '': 'home' // Root defaults to home
    };

    const context = contextMap[view] || null;
    if (context) {
      const tutorial = this.get(context);
      tutorial.start();
    }
  }

  // Reset all tutorials
  resetAll() {
    OnboardingTutorial.resetAllTutorials();
    this.tutorials.clear();
  }
}

// Initialize global tutorial manager
window.tutorialManager = new TutorialManager();

// Console helpers
console.log('Context-Aware Tutorial System Loaded');
console.log('Commands:');
console.log('   - tutorialManager.get("home").forceStart() - Start home tutorial');
console.log('   - tutorialManager.get("submit").forceStart() - Start submit tutorial');
console.log('   - tutorialManager.resetAll() - Reset all tutorials');
console.log('   - tutorialManager.get("home").resetTutorial() - Reset home tutorial');
console.log('   - tutorialManager.get("submit").resetTutorial() - Reset submit tutorial');
