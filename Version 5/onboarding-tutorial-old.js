/**
 * Interactive Onboarding Tutorial System
 * First-time user walkthrough with modern, futuristic design
 * Uses localStorage (can be switched to SharePoint later)
 */

class OnboardingTutorial {
  constructor() {
    this.storageKey = 'innovationPortal_tutorialCompleted';
    this.currentStep = 0;
    this.isActive = false;
    
    // Define tutorial steps
    this.steps = [
      {
        target: '.page-title',
        title: '👋 Welcome to the Innovation Portal!',
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
        action: () => {
          this.switchToView('submit');
          this.scrollToElement('#idea-form');
        }
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
        action: () => {}
      }
    ];
    
    this.overlay = null;
    this.tooltip = null;
  }
  
  // Check if user has completed tutorial
  hasCompletedTutorial() {
    const completed = localStorage.getItem(this.storageKey);
    return completed === 'true';
  }
  
  // Mark tutorial as completed
  markAsCompleted() {
    localStorage.setItem(this.storageKey, 'true');
    console.log('✅ Tutorial marked as completed');
  }
  
  // Reset tutorial (for testing or re-showing)
  resetTutorial() {
    localStorage.removeItem(this.storageKey);
    console.log('🔄 Tutorial reset - will show on next page load');
  }
  
  // Start the tutorial
  start() {
    if (this.hasCompletedTutorial()) {
      console.log('ℹ️ Tutorial already completed');
      return;
    }
    
    console.log('🎓 Starting interactive tutorial...');
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
  }
  
  // Force start (even if completed)
  forceStart() {
    console.log('🎓 Starting tutorial (forced)...');
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep(0);
  }
  
  // Create overlay elements
  createOverlay() {
    // Main overlay with SVG mask for proper cutout
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.innerHTML = `
      <svg class="tutorial-overlay-mask">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
            <rect id="spotlight-cutout" x="0" y="0" width="0" height="0" rx="12" fill="black"/>
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(10, 10, 30, 0.92)" mask="url(#tutorial-mask)"/>
      </svg>
      <div class="tutorial-spotlight"></div>
    `;
    
    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tutorial-tooltip';
    
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.tooltip);
    document.body.classList.add('tutorial-active');
  }
  
  // Show specific step
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;
    
    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];
    
    // Execute step action (scroll, switch view, etc.)
    if (step.action) {
      step.action();
    }
    
    // Delay to allow scrolling/animations to complete
    setTimeout(() => {
      this.positionTooltip(step);
      this.highlightElement(step);
    }, 800);
  }
  
  // Position and show tooltip
  positionTooltip(step) {
    const isLastStep = this.currentStep === this.steps.length - 1;
    const isFirstStep = this.currentStep === 0;
    
    // Build tooltip HTML
    this.tooltip.innerHTML = `
      <div class="tutorial-tooltip-header">
        <div class="tutorial-step-indicator">
          <span class="tutorial-step-current">${this.currentStep + 1}</span>
          <span class="tutorial-step-separator">/</span>
          <span class="tutorial-step-total">${this.steps.length}</span>
        </div>
        <button class="tutorial-close" onclick="window.tutorial.skip()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="tutorial-tooltip-content">
        <h3 class="tutorial-title">${step.title}</h3>
        <p class="tutorial-content">${step.content}</p>
      </div>
      <div class="tutorial-tooltip-footer">
        <button class="tutorial-btn tutorial-btn-secondary" onclick="window.tutorial.previous()" ${isFirstStep ? 'style="visibility: hidden;"' : ''}>
          <i class="fas fa-arrow-left"></i> Previous
        </button>
        <div class="tutorial-progress-dots">
          ${this.steps.map((_, i) => `
            <span class="tutorial-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></span>
          `).join('')}
        </div>
        <button class="tutorial-btn tutorial-btn-primary" onclick="window.tutorial.${isLastStep ? 'complete()' : 'next()'}">
          ${isLastStep ? '<i class="fas fa-check"></i> Start Creating' : 'Next <i class="fas fa-arrow-right"></i>'}
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
        
        // Get tooltip dimensions (it needs to be visible briefly to measure)
        this.tooltip.style.opacity = '0';
        this.tooltip.style.display = 'block';
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        this.tooltip.style.opacity = '';
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20;
        
        let top, left, transform = '';
        
        // Calculate initial position based on desired placement
        switch (step.position) {
          case 'bottom':
            top = rect.bottom + window.scrollY + padding;
            left = rect.left + window.scrollX + (rect.width / 2);
            transform = 'translateX(-50%)';
            
            // Keep within horizontal bounds
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
            
            // Keep within horizontal bounds
            const topLeftBound = left - (tooltipWidth / 2);
            const topRightBound = left + (tooltipWidth / 2);
            if (topLeftBound < padding) {
              left = padding + (tooltipWidth / 2);
            } else if (topRightBound > viewportWidth - padding) {
              left = viewportWidth - padding - (tooltipWidth / 2);
            }
            break;
            
          case 'left':
            top = rect.top + window.scrollY + (rect.height / 2);
            left = rect.left + window.scrollX - tooltipWidth - padding;
            transform = 'translateY(-50%)';
            
            // If goes off left edge, position to right instead
            if (left < padding) {
              left = rect.right + window.scrollX + padding;
              transform = 'translateY(-50%)';
            }
            break;
            
          case 'right':
            top = rect.top + window.scrollY + (rect.height / 2);
            left = rect.right + window.scrollX + padding;
            transform = 'translateY(-50%)';
            
            // If goes off right edge, position to left instead
            if (left + tooltipWidth > viewportWidth - padding) {
              left = rect.left + window.scrollX - tooltipWidth - padding;
              transform = 'translateY(-50%)';
              
              // If still off screen, center it
              if (left < padding) {
                this.tooltip.style.position = 'fixed';
                this.tooltip.style.top = '50%';
                this.tooltip.style.left = '50%';
                this.tooltip.style.transform = 'translate(-50%, -50%)';
                this.tooltip.classList.add('tutorial-tooltip-visible');
                return;
              }
            }
            break;
        }
        
        // Apply position
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.transform = transform;
      }
    }
    
    // Animate in
    this.tooltip.classList.add('tutorial-tooltip-visible');
  }
  
  // Highlight target element
  highlightElement(step) {
    const spotlight = this.overlay.querySelector('.tutorial-spotlight');
    const cutout = this.overlay.querySelector('#spotlight-cutout');
    
    if (!step.highlightArea) {
      spotlight.style.display = 'none';
      if (cutout) {
        cutout.setAttribute('width', '0');
        cutout.setAttribute('height', '0');
      }
      return;
    }
    
    spotlight.style.display = 'block';
    const target = document.querySelector(step.highlightArea);
    
    if (target) {
      const updatePosition = () => {
        const rect = target.getBoundingClientRect();
        const padding = 15;
        
        const top = rect.top + window.scrollY - padding;
        const left = rect.left + window.scrollX - padding;
        const width = rect.width + (padding * 2);
        const height = rect.height + (padding * 2);
        const borderRadius = parseInt(window.getComputedStyle(target).borderRadius) || 12;
        
        // Position the visual spotlight border (absolute positioning)
        spotlight.style.top = `${top}px`;
        spotlight.style.left = `${left}px`;
        spotlight.style.width = `${width}px`;
        spotlight.style.height = `${height}px`;
        spotlight.style.borderRadius = `${borderRadius}px`;
        
        // Update SVG cutout mask (uses viewport/fixed coordinates)
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
      
      // Update position on scroll to keep cutout aligned
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
      this.scrollListener = () => updatePosition();
      window.addEventListener('scroll', this.scrollListener, { passive: true });
      
      // Ensure the highlighted element is interactive and visible
      target.style.position = 'relative';
      target.style.zIndex = '100001';
      target.style.pointerEvents = 'auto';
    }
  }
  
  // Navigation methods
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
    if (confirm('Are you sure you want to skip this tutorial? You can restart it anytime from the help menu.')) {
      this.complete(false);
    }
  }
  
  complete(markCompleted = true) {
    if (markCompleted) {
      this.markAsCompleted();
      console.log('🎉 Tutorial completed!');
    }
    
    this.isActive = false;
    
    // Clean up scroll listener
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
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
  
  // Helper methods
  scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      // Calculate position to center element in viewport
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.scrollY;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      
      window.scrollTo({
        top: Math.max(0, middle),
        behavior: 'smooth'
      });
    }
  }
  
  switchToView(viewName) {
    // Trigger navigation to specific view
    const navButton = document.querySelector(`[data-view="${viewName}"]`);
    if (navButton) {
      navButton.click();
    }
  }
  
  showCompletionMessage() {
    // Use existing notification system if available
    if (typeof window.showNotification === 'function') {
      window.showNotification('🎉 Tutorial completed! You\'re ready to start innovating!', 'success');
    }
  }
  
  // Add "Show Tutorial" button to help menu
  addTutorialButton() {
    // This can be called to add a help button somewhere in the UI
    const button = document.createElement('button');
    button.className = 'tutorial-help-btn';
    button.innerHTML = '<i class="fas fa-question-circle"></i> Show Tutorial';
    button.onclick = () => this.forceStart();
    
    // You can append this to a help menu or similar location
    return button;
  }
}

// Initialize global tutorial instance
window.tutorial = new OnboardingTutorial();

// Auto-start tutorial when DOM is ready (only for first-time users)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.tutorial.start(), 1000); // Delay 1 second for smooth start
  });
} else {
  setTimeout(() => window.tutorial.start(), 1000);
}

// Add reset function to console for testing
console.log('🎓 Tutorial System Loaded');
console.log('💡 Commands:');
console.log('   - window.tutorial.forceStart() - Start tutorial');
console.log('   - window.tutorial.resetTutorial() - Reset completion status');
console.log('   - window.tutorial.skip() - Skip tutorial');
