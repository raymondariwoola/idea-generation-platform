// script.js - Loading animation particles and dynamic effects

// Create floating particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random positioning
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200; // Random horizontal drift
    const duration = 8 + Math.random() * 12; // 8-20 seconds
    const delay = Math.random() * 5; // 0-5 seconds delay
    const size = 2 + Math.random() * 2; // 2-4px
    
    particle.style.left = `${startX}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty('--drift', `${drift}px`);
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    
    particlesContainer.appendChild(particle);
  }
}

// Add pulsing effect to brain nodes with random timing
function animateBrainNodes() {
  const nodes = document.querySelectorAll('.brain-svg .node');
  nodes.forEach((node, index) => {
    const delay = Math.random() * 2;
    node.style.animationDelay = `${delay}s`;
  });
}

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  animateBrainNodes();
  
  // Add subtle mouse movement parallax effect
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    const brainContainer = document.querySelector('.brain-container');
    const orbitContainer = document.querySelector('.orbit-container');
    
    if (brainContainer) {
      brainContainer.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
    }
    
    if (orbitContainer) {
      orbitContainer.style.transform = `translate(${mouseX * -10}px, ${mouseY * -10}px)`;
    }
  });
});

// Optional: Auto-redirect after loading (uncomment if needed)
// setTimeout(() => {
//   window.location.href = 'your-next-page.html';
// }, 5000); // Redirect after 5 seconds
