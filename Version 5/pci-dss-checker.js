/**
 * PCI DSS Compliance Checker
 * Automatically detects and redacts sensitive information in real-time
 * Patterns: Credit cards, account numbers, Emirates ID, passport numbers, etc.
 */

(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    global.PCIDSSChecker = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  
  class PCIDSSChecker {
    constructor(options = {}) {
      this.enabled = options.enabled !== false;
      this.autoAttach = options.autoAttach !== false;
      this.redactionText = options.redactionText || 'XXXXXXXX (Not PCI DSS Compliant)';
      this.showWarning = options.showWarning !== false;
      this.warningDuration = options.warningDuration || 3000;
      
      // Pattern definitions
      this.patterns = {
        // Credit card patterns (Visa, MasterCard, Amex, Discover)
        // Matches: 4532123456789010, 4532-1234-5678-9010, 4532 1234 5678 9010
        creditCard: {
          regex: /\d(?:[\s\-]?\d){12,18}/g,
          test: (match) => this.isValidCreditCard(match),
          description: 'Credit Card Number'
        },
        
        // Account numbers (8-11 digits) - only match if NOT a valid credit card
        accountNumber: {
          regex: /\d(?:[\s\-]?\d){7,10}/g,
          test: (match) => {
            const cleaned = match.replace(/[\s\-]/g, '');
            // Must be 8-17 digits, not a credit card, and not all repeating
            return cleaned.length >= 8 && cleaned.length <= 17 && 
                   !this.isValidCreditCard(match) && 
                   this.isLikelyAccountNumber(match);
          },
          description: 'Account Number'
        },
        
        // Emirates ID (784-YYYY-NNNNNNN-N)
        emiratesId: {
          regex: /\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1}\b/g,
          test: () => true,
          description: 'Emirates ID'
        },
        
        // Passport numbers (various formats)
        // passport: {
        //   regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
        //   test: (match) => this.isLikelyPassport(match),
        //   description: 'Passport Number'
        // },
        
        // SSN/National ID (XXX-XX-XXXX or 9 digits)
        // ssn: {
        //   regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
        //   test: () => true,
        //   description: 'SSN/National ID'
        // },
        
        // CVV/CVC codes (3-4 digits preceded by CVV/CVC keywords)
        // cvv: {
        //   regex: /\b(cvv|cvc|cid|security\s?code)[\s:]*\d{3,4}\b/gi,
        //   test: () => true,
        //   description: 'CVV/CVC Code'
        // },
        
        // IBAN (International Bank Account Number)
        iban: {
          regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
          test: (match) => match.length >= 15 && match.length <= 34,
          description: 'IBAN'
        },
        
        // PIN patterns (4-6 digits with PIN keyword)
        // pin: {
        //   regex: /\b(pin|password|passcode)[\s:]*\d{4,6}\b/gi,
        //   test: () => true,
        //   description: 'PIN Code'
        // }
      };
      
      this.attachedElements = new WeakMap();
      this.violations = [];
      
      if (this.autoAttach && typeof document !== 'undefined') {
        this.attachToPage();
      }
    }
    
    // Credit card validation using Luhn algorithm
    isValidCreditCard(number) {
      const cleaned = number.replace(/[\s\-]/g, '');
      if (!/^\d{13,19}$/.test(cleaned)) return false;
      
      let sum = 0;
      let isEven = false;
      
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      return sum % 10 === 0;
    }
    
    // Check if number looks like an account number
    isLikelyAccountNumber(number) {
      const cleaned = number.replace(/[\s\-]/g, '');
      // Account numbers are typically 8-11 digits and not credit cards
      if (cleaned.length < 8 || cleaned.length > 11) return false;
      if (this.isValidCreditCard(number)) return false; // Already caught by CC check
      
      // Check if it has repeating patterns that might be test data
      const repeating = /^(\d)\1+$/.test(cleaned);
      return !repeating;
    }
    
    // Check if string looks like a passport number
    isLikelyPassport(value) {
      const cleaned = value.toUpperCase().replace(/[\s\-]/g, '');
      // Passport: 1-2 letters followed by 6-9 digits
      return /^[A-Z]{1,2}\d{6,9}$/.test(cleaned);
    }
    
    // Main detection method
    detectSensitiveData(text) {
      if (!text || typeof text !== 'string') return [];
      
      const detections = [];
      
      // Define priority order: credit cards FIRST, then others
      const priorityOrder = ['creditCard', 'emiratesId', 'iban', 'accountNumber'];
      
      // Process patterns in priority order
      for (const type of priorityOrder) {
        if (!this.patterns[type]) continue;
        
        const pattern = this.patterns[type];
        const matches = text.matchAll(pattern.regex);
        
        for (const match of matches) {
          const value = match[0];
          
          // Check if this range already detected by higher priority pattern
          const overlaps = detections.some(d => {
            const dEnd = d.index + d.length;
            const mEnd = match.index + value.length;
            return (match.index >= d.index && match.index < dEnd) ||
                   (mEnd > d.index && mEnd <= dEnd) ||
                   (match.index <= d.index && mEnd >= dEnd);
          });
          
          if (!overlaps && pattern.test(value)) {
            detections.push({
              type,
              value,
              description: pattern.description,
              index: match.index,
              length: value.length
            });
          }
        }
      }
      
      return detections;
    }
    
    // Sanitize text by replacing sensitive data
    sanitize(text) {
      if (!text || typeof text !== 'string') return text;
      
      let sanitized = text;
      const detections = this.detectSensitiveData(text);
      
      // Sort by index in reverse to maintain correct positions
      detections.sort((a, b) => b.index - a.index);
      
      for (const detection of detections) {
        const before = sanitized.substring(0, detection.index);
        const after = sanitized.substring(detection.index + detection.length);
        sanitized = before + this.redactionText + after;
        
        // Log violation
        this.violations.push({
          timestamp: new Date().toISOString(),
          type: detection.type,
          description: detection.description,
          redacted: true
        });
      }
      
      return sanitized;
    }
    
    // Attach to all input fields on the page
    attachToPage() {
      if (typeof document === 'undefined') return;
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._attachToElements());
      } else {
        this._attachToElements();
      }
    }
    
    _attachToElements() {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
      
      inputs.forEach(element => {
        if (!this.attachedElements.has(element)) {
          this.attachToElement(element);
        }
      });
      
    //   console.log(`[PCI DSS Checker] Monitoring ${inputs.length} input fields`);
    }
    
    // Attach to specific element
    attachToElement(element) {
      if (this.attachedElements.has(element)) return;
      
      const handler = (e) => this.handleInput(e, element);
      const blurHandler = (e) => this.handleBlur(e, element);
      const pasteHandler = (e) => this.handlePaste(e, element);
      
      element.addEventListener('input', handler);
      element.addEventListener('blur', blurHandler);
      element.addEventListener('change', blurHandler); // Also check on change
      element.addEventListener('paste', pasteHandler);
      element.addEventListener('change', (e) => this.handleBlur(e, element));
      
      this.attachedElements.set(element, { handler, blurHandler });
      
      // Add visual indicator
      element.setAttribute('data-pci-protected', 'true');
    }
    
    // Handle input events
    handleInput(event, element) {
      const detections = this.detectSensitiveData(element.value);
      
      if (detections.length > 0) {
        // Store cursor position
        const cursorPos = element.selectionStart;
        
        // Sanitize
        const sanitized = this.sanitize(element.value);
        element.value = sanitized;
        
        // Show warning
        if (this.showWarning) {
          this.showWarningMessage(element, detections);
        }
        
        // Try to restore cursor (will be at end of redacted text)
        const newPos = Math.min(cursorPos, sanitized.length);
        element.setSelectionRange(newPos, newPos);
      }
    }
    
    // Handle blur events (final check)
    handleBlur(event, element) {
      const detections = this.detectSensitiveData(element.value);
      
      if (detections.length > 0) {
        element.value = this.sanitize(element.value);
        
        if (this.showWarning) {
          this.showWarningMessage(element, detections);
        }
      }
    }
    
    // Handle paste events
    handlePaste(event, element) {
      event.preventDefault();
      
      const pastedText = (event.clipboardData || window.clipboardData).getData('text');
      const sanitized = this.sanitize(pastedText);
      
      // Insert sanitized text at cursor position
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const currentValue = element.value;
      
      element.value = currentValue.substring(0, start) + sanitized + currentValue.substring(end);
      
      // Set cursor position after inserted text
      const newPos = start + sanitized.length;
      element.setSelectionRange(newPos, newPos);
      
      // Trigger input event for validation
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      if (pastedText !== sanitized) {
        const detections = this.detectSensitiveData(pastedText);
        this.showWarningMessage(element, detections);
      }
    }
    
    // Show warning message
    showWarningMessage(element, detections) {
      // Remove existing warning
      const existing = element.parentElement?.querySelector('.pci-warning');
      if (existing) existing.remove();
      
      // Create warning element
      const warning = document.createElement('div');
      warning.className = 'pci-warning';
      warning.innerHTML = `
        <i class="fas fa-shield-alt"></i>
        <span>Sensitive data detected and redacted</span>
      `;
      
    //   console.log(`${detections.map(d => d.description).join(', ')} detected and redacted`);
      // Insert warning
      if (element.parentElement) {
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(warning);
        
        // Always auto-remove after duration with fade-out animation
        setTimeout(() => {
          if (warning.parentElement) {
            warning.style.opacity = '0';
            warning.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => warning.remove(), 300);
          }
        }, this.warningDuration);
      }
    }
    
    // Get violation log
    getViolations() {
      return [...this.violations];
    }
    
    // Clear violation log
    clearViolations() {
      this.violations = [];
    }
    
    // Detach from all elements
    detachAll() {
      // This would require keeping track of all elements, 
      // which WeakMap doesn't allow iteration
    //   console.log('[PCI DSS Checker] Manual detach not fully supported with WeakMap');
    }
  }
  
  return PCIDSSChecker;
});

// Auto-initialize if loaded as script tag
if (typeof window !== 'undefined' && typeof window.PCIDSSChecker !== 'undefined') {
  try {
    // Create global instance
    window.pciChecker = new window.PCIDSSChecker({
      enabled: true,
      autoAttach: true,
      showWarning: true
    });
    console.log('✅ PCI DSS Checker initialized and monitoring all inputs');
  } catch (error) {
    console.error('❌ Failed to initialize PCI DSS Checker:', error);
  }
}
