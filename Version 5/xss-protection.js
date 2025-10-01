/**
 * XSS Protection Library
 * Sanitizes user input to prevent Cross-Site Scripting attacks
 * Works with forms, textareas, and dynamic content
 */

(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    global.XSSProtection = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  
  class XSSProtection {
    constructor(options = {}) {
      this.enabled = options.enabled !== false;
      this.autoAttach = options.autoAttach !== false;
      this.strictMode = options.strictMode || false; // More aggressive sanitization
      this.allowedTags = options.allowedTags || ['b', 'i', 'em', 'strong', 'br'];
      this.allowedAttributes = options.allowedAttributes || [];
      
      this.attachedElements = new WeakSet();
      this.violations = [];
      
      // Dangerous patterns to detect
      this.dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers like onclick=
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<link/gi,
        /<meta/gi,
        /<style/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
        /<svg.*on\w+/gi,
      ];
      
      if (this.autoAttach && typeof document !== 'undefined') {
        this.attachToPage();
      }
    }
    
    // Main sanitization method
    sanitize(input, options = {}) {
      if (!input || typeof input !== 'string') return input;
      
      let sanitized = input;
      const strict = options.strict !== undefined ? options.strict : this.strictMode;
      
      if (strict) {
        // Strict mode: Remove all HTML
        sanitized = this.stripAllHTML(sanitized);
      } else {
        // Standard mode: Allow safe tags, remove dangerous content
        sanitized = this.sanitizeHTML(sanitized);
      }
      
      // Additional sanitization
      sanitized = this.decodeHTMLEntities(sanitized);
      sanitized = this.sanitizeSpecialChars(sanitized);
      sanitized = this.removeNullBytes(sanitized);
      
      // Detect violations
      if (input !== sanitized) {
        this.logViolation(input, sanitized);
      }
      
      return sanitized;
    }
    
    // Strip all HTML tags
    stripAllHTML(text) {
      return text.replace(/<[^>]*>/g, '');
    }
    
    // Sanitize HTML while preserving allowed tags
    sanitizeHTML(html) {
      // Create a temporary element
      const temp = document.createElement('div');
      temp.textContent = html; // This escapes HTML by default
      let result = temp.innerHTML;
      
      // If we have allowed tags, carefully restore them
      if (this.allowedTags.length > 0) {
        const tagPattern = new RegExp(`&lt;(/?)(${this.allowedTags.join('|')})(&gt;|\\s[^>]*&gt;)`, 'gi');
        result = result.replace(tagPattern, '<$1$2$3');
        result = result.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
      }
      
      // Remove event handlers and dangerous attributes
      result = this.removeEventHandlers(result);
      result = this.removeDangerousAttributes(result);
      
      return result;
    }
    
    // Remove event handlers (onclick, onload, etc.)
    removeEventHandlers(text) {
      return text.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
                 .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    }
    
    // Remove dangerous attributes
    removeDangerousAttributes(text) {
      const dangerous = ['src', 'href', 'data', 'action', 'formaction', 'style'];
      let result = text;
      
      dangerous.forEach(attr => {
        if (!this.allowedAttributes.includes(attr)) {
          const pattern = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
          result = result.replace(pattern, '');
        }
      });
      
      return result;
    }
    
    // Decode HTML entities to detect hidden attacks
    decodeHTMLEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }
    
    // Sanitize special characters
    sanitizeSpecialChars(text) {
      return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
                 .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width characters
    }
    
    // Remove null bytes
    removeNullBytes(text) {
      return text.replace(/\0/g, '');
    }
    
    // Check if text contains XSS
    containsXSS(text) {
      if (!text || typeof text !== 'string') return false;
      
      return this.dangerousPatterns.some(pattern => pattern.test(text));
    }
    
    // Validate and sanitize form data
    sanitizeFormData(formData) {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitize(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(v => typeof v === 'string' ? this.sanitize(v) : v);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    // Escape HTML for display
    escapeHTML(text) {
      if (!text || typeof text !== 'string') return text;
      
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
      };
      
      return text.replace(/[&<>"'/]/g, char => map[char]);
    }
    
    // Unescape HTML entities
    unescapeHTML(text) {
      if (!text || typeof text !== 'string') return text;
      
      const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/',
      };
      
      return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, entity => map[entity]);
    }
    
    // Attach to page
    attachToPage() {
      if (typeof document === 'undefined') return;
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._attachToElements());
      } else {
        this._attachToElements();
      }
    }
    
    _attachToElements() {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="url"], textarea');
      
      inputs.forEach(element => {
        if (!this.attachedElements.has(element)) {
          this.attachToElement(element);
        }
      });
      
    //   console.log(`[XSS Protection] Monitoring ${inputs.length} input fields`);
    }
    
    // Attach to specific element
    attachToElement(element) {
      if (this.attachedElements.has(element)) return;
      
      element.addEventListener('blur', (e) => this.handleBlur(e, element));
      element.addEventListener('paste', (e) => this.handlePaste(e, element));
      
      this.attachedElements.add(element);
      element.setAttribute('data-xss-protected', 'true');
    }
    
    // Handle blur event
    handleBlur(event, element) {
      if (this.containsXSS(element.value)) {
        const sanitized = this.sanitize(element.value);
        element.value = sanitized;
        
        this.showWarning(element);
      }
    }
    
    // Handle paste event
    handlePaste(event, element) {
      const pastedText = (event.clipboardData || window.clipboardData).getData('text');
      
      if (this.containsXSS(pastedText)) {
        event.preventDefault();
        
        const sanitized = this.sanitize(pastedText);
        
        // Insert sanitized text
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const currentValue = element.value;
        
        element.value = currentValue.substring(0, start) + sanitized + currentValue.substring(end);
        
        const newPos = start + sanitized.length;
        element.setSelectionRange(newPos, newPos);
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        this.showWarning(element);
      }
    }
    
    // Show warning
    showWarning(element) {
      const existing = element.parentElement?.querySelector('.xss-warning');
      if (existing) existing.remove();
      
      const warning = document.createElement('div');
      warning.className = 'xss-warning';
      warning.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>Potentially unsafe content was removed for security</span>
      `;
      
      if (element.parentElement) {
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(warning);
        
        setTimeout(() => {
          warning.style.opacity = '0';
          setTimeout(() => warning.remove(), 300);
        }, 3000);
      }
    }
    
    // Log violation
    logViolation(original, sanitized) {
      this.violations.push({
        timestamp: new Date().toISOString(),
        original: original.substring(0, 100), // First 100 chars
        sanitized: sanitized.substring(0, 100),
        detected: this.dangerousPatterns.filter(p => p.test(original)).length
      });
    }
    
    // Get violations
    getViolations() {
      return [...this.violations];
    }
    
    // Clear violations
    clearViolations() {
      this.violations = [];
    }
  }
  
  return XSSProtection;
});

// Auto-initialize if loaded as script tag
if (typeof window !== 'undefined' && typeof window.XSSProtection !== 'undefined') {
  try {
    // Create global instance
    window.xssProtection = new window.XSSProtection({
      enabled: true,
      autoAttach: true,
      strictMode: false
    });
    console.log('✅ XSS Protection initialized and monitoring all inputs');
  } catch (error) {
    console.error('❌ Failed to initialize XSS Protection:', error);
  }
}
