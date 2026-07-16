import './style.css';
import { initThree, updateScroll, setThemeColor } from './threeScene';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize 3D Scene
  initThree('bg-canvas');

  // Web Audio API Synthesizer (Zero asset download required)
  let audioCtx = null;
  let soundEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play a retro-futuristic click sound
  function playClickSound() {
    if (!soundEnabled || !audioCtx) return;
    initAudio();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }

  // Play a soft high-frequency hover blip
  function playHoverSound() {
    if (!soundEnabled || !audioCtx) return;
    initAudio();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

    gainNode.gain.setValueAtTime(0.035, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  }

  // Play a futuristic data startup sweep
  function playStartupSound() {
    if (!audioCtx) return;
    initAudio();

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.35);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.35);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.35);
    osc2.stop(audioCtx.currentTime + 0.35);
  }

  // Sound Button Hook
  const soundToggle = document.getElementById('sound-toggle');
  const soundText = document.getElementById('sound-text');

  if (soundToggle && soundText) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        initAudio();
        soundToggle.classList.add('active');
        soundText.textContent = "SOUND: ON";
        playStartupSound();
      } else {
        soundToggle.classList.remove('active');
        soundText.textContent = "SOUND: OFF";
      }
    });
  }

  // Bind audio hover effects to interactive elements
  const hoverSoundClasses = [
    '.nav-item-sound',
    '.tag-item-sound',
    '.btn-item-sound',
    '.stat-item-sound',
    '.card-item-sound',
    '.item-item-sound',
    '.link-item-sound'
  ];

  hoverSoundClasses.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.addEventListener('mouseenter', playHoverSound);
      element.addEventListener('click', playClickSound);
    });
  });

  // Mobile navigation drawer toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinksContainer = document.getElementById('nav-links');
  const navLinks = document.querySelectorAll('#nav-links a');

  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinksContainer.classList.toggle('open');
      playClickSound();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinksContainer.classList.remove('open');
      });
    });
  }

  // Scroll Progress Listener
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = window.scrollY / totalHeight;
      updateScroll(progress);
    }
  });

  // Certification Group Dynamic Filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const certGroups = document.querySelectorAll('.cert-group');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');

      // Update button visual states
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Hide or show groups
      certGroups.forEach(group => {
        const groupCat = group.getAttribute('data-cat');
        if (category === 'all' || groupCat === category) {
          group.classList.remove('hidden');
        } else {
          group.classList.add('hidden');
        }
      });

      // Update background theme colors
      setThemeColor(category);
    });
  });

  // Hover transitions for hero cards to preview 3D colors
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const sectionType = card.getAttribute('data-section');
      if (sectionType === 'role') setThemeColor('microsoft');
      else if (sectionType === 'expertise') setThemeColor('ai-data');
      else if (sectionType === 'integration') setThemeColor('salesforce');
      else if (sectionType === 'certs-stat') setThemeColor('other');
      else if (sectionType === 'education') setThemeColor('oracle');
    });

    card.addEventListener('mouseleave', () => {
      const activeFilterBtn = document.querySelector('.filter-btn.active');
      const currentCategory = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
      setThemeColor(currentCategory);
    });
  });

  // Auto-wrap content elements with scroll-reveal classes for Apple-like entrance transitions
  const revealSelectors = [
    '.section-label',
    '.section-title',
    '.section-sub',
    '.skill-card',
    '.sf-feature',
    '.exp-item',
    '.cert-filters',
    '.cert-group',
    '.edu-card',
    '#contact > *'
  ];

  revealSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('scroll-reveal');
    });
  });

  // IntersectionObserver to trigger entry/exit fades
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      } else {
        // Fade out when scrolling away (Apple style)
        entry.target.classList.remove('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
  });

  // Apple-style Staggered Hero Elements Entrance on Load
  const heroElements = document.querySelectorAll('#hero .hero-tag, #hero h1, #hero .hero-desc, #hero .hero-highlights, #hero .hero-btns, #hero .stat-card');
  heroElements.forEach((el, index) => {
    el.classList.add('hero-reveal');
    setTimeout(() => {
      el.classList.add('active');
    }, index * 90);
  });
});
