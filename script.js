class Particle {
  constructor(x, y, vx, vy, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.initialSize = size;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.01;
    this.gravity = 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
    this.size = this.initialSize * this.life;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }

  isDead() { return this.life <= 0; }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createRipple(x, y, intensity = 1) {
    const colors = ['#4f46e5', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
    const particleCount = Math.floor(30 * intensity);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 8 + 4;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, colors[Math.floor(Math.random() * colors.length)], Math.random() * 4 + 2));
    }
    for (let i = 0; i < Math.floor(20 * intensity); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 2;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, colors[Math.floor(Math.random() * colors.length)], Math.random() * 3 + 1));
    }
  }

  update() {
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => !p.isDead());
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => p.draw(this.ctx));
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
  let state = {
      xp: 0,
      coins: 0,
      log: [],
      currentlyEditingLogId: null
  };
  const XP_TO_COIN_RATE = 10;

  // --- DOM Elements ---
  const canvas = document.getElementById('particles-canvas');
  const particleSystem = canvas ? new ParticleSystem(canvas) : null;

  const xpDisplay = document.getElementById('xp-display');
  const coinsDisplay = document.getElementById('coins-display');
  const navButtons = document.querySelectorAll('.nav-button');
  const pages = document.querySelectorAll('.page');
  const xpButtons = document.querySelector('.xp-button-group');
  
  // Modal Elements
  const modalBackdrop = document.getElementById('edit-modal-backdrop');
  const modalContent = document.querySelector('.modal-content');
  const editForm = document.getElementById('edit-log-form');
  const cancelEditButton = document.getElementById('cancel-edit-button');
  const editDescriptionInput = document.getElementById('edit-log-description');
  const editConfidenceInput = document.getElementById('edit-log-confidence');
  const aiLogForm = document.getElementById('ai-log-form');
  const aiLogButton = document.getElementById('ai-log-button');
  const aiResultsDiv = document.getElementById('ai-results');
  const aiSuggestedXp = document.getElementById('ai-suggested-xp');
  const aiJustification = document.getElementById('ai-justification');
  const acceptAiSuggestionButton = document.getElementById('accept-ai-suggestion');
  const rejectAiSuggestionButton = document.getElementById('reject-ai-suggestion');

  let tempAiSuggestion = null;

  aiLogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('ai-log-description').value;

    aiLogButton.disabled = true;
    aiLogButton.querySelector('.button-text').style.display = 'none';
    aiLogButton.querySelector('.spinner').style.display = 'inline-block';

    try {
      const response = await fetch('/api/generateXP', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({description}),
      });

      if(!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      tempAiSuggestion = data;

      aiSuggestedXp.innerText = data.xp;
      aiJustification.innerText = data.justification;
      aiResultsDiv.style.display = 'block';

    } catch(error) {
      console.error('Failed to fetch AI suggestion:', error);
      alert('Could not get an AI suggestion. Please try again.');
    } finally {
      aiLogButton.disabled = false;
      aiLogButton.querySelector('.button-text').style.display = 'inline-block';
      aiLogButton.querySelector('.spinner').style.display = 'none';
    }
  });

  acceptAiSuggestionButton.addEventListener('click', () => {
    if (!tempAiSuggestion) return;

    const logData = {
      description: document.getElementById('ai-log-description').value,
      xp: tempAiSuggestion.xp,
      confidence: 'medium',
      concepts: tempAiSuggestion.concepts
    };

    addXP(logData);

    aiResultsDiv.style.display = 'none';
    aiLogForm.reset();
    tempAiSuggestion = null;
  });

  rejectAiSuggestionButton.addEventListener('click', () => {
    aiResultsDiv.style.display = 'none';
    tempAiSuggestion = null;
  });

  // --- Data Persistence (using in-memory storage) ---
  function saveState() {
      // Using in-memory storage instead of localStorage for compatibility
      window.mindforgeState = JSON.stringify(state);
  }

  function loadState() {
      if (window.mindforgeState) {
          state = JSON.parse(window.mindforgeState);
          // Ensure log has default values if loading old data
          state.log = state.log.map(entry => ({
              description: 'Logged quick effort',
              confidence: 'medium',
              ...entry
          }));
      }
  }

  // --- UI Updates ---
  function animateValue(element, start, end, duration) {
      if (start === end) return;
      let startTimestamp = null;
      const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          element.innerText = Math.floor(progress * (end - start) + start);
          if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
  }

  function updateDashboard() {
      const currentXP = parseInt(xpDisplay.innerText, 10) || 0;
      const currentCoins = parseInt(coinsDisplay.innerText, 10) || 0;
      animateValue(xpDisplay, currentXP, state.xp, 500);
      animateValue(coinsDisplay, currentCoins, state.coins, 500);
  }

  // Renders log entries with an "Edit" button
  function renderLog() {
    const logListElement = document.getElementById('log-list');
    if (!logListElement) {
        console.warn('Log list element not found');
        return;
    }
    
    logListElement.innerHTML = ''; // Clear existing list
    
    if (state.log.length === 0) {
        logListElement.innerHTML = '<li class="log-entry no-entries">No activities logged yet.</li>';
        return;
    }
    
    state.log.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'log-entry';
        li.dataset.logId = entry.timestamp; // Use timestamp as a unique ID

        // Handle confidence display
        let confidenceText;
        if (entry.confidence === 'not_picked' || !entry.confidence) {
            confidenceText = 'Not picked';
        } else {
            confidenceText = entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1);
        }

        li.innerHTML = `
            <div class="log-details">
              <div class="description">${entry.description}</div>
              <div class="log-entry-details">Confidence: ${confidenceText}</div>
            </div>
            <div class="log-actions">
                <span class="xp-gain">+${entry.xp} XP</span>
                <button class="edit-log-button">Edit</button>
            </div>
        `;
        logListElement.appendChild(li);
    });
  }
  
  // --- Modal Logic ---
  function openEditModal(logId) {
      const entryToEdit = state.log.find(entry => entry.timestamp === logId);
      if (!entryToEdit) return;

      state.currentlyEditingLogId = logId;
      editDescriptionInput.value = entryToEdit.description;
      editConfidenceInput.value = entryToEdit.confidence;

      modalBackdrop.classList.add('visible');
      modalContent.classList.add('visible');
  }

  function closeEditModal() {
      state.currentlyEditingLogId = null;
      modalBackdrop.classList.remove('visible');
      modalContent.classList.remove('visible');
  }

  // --- Core Logic ---
  function addXP(data) {
    const isQuickAdd = typeof data === 'number';
    
    const xpAmount = isQuickAdd ? data : data.xp;
    const coinsEarned = Math.floor(xpAmount / XP_TO_COIN_RATE);
    state.xp += xpAmount;
    state.coins += coinsEarned;

    const logEntry = {
        description: isQuickAdd ? 'Logged quick effort' : data.description,
        xp: xpAmount,
        confidence: isQuickAdd ? 'not_picked' : data.confidence,
        concepts: isQuickAdd ? [] : data.concepts, // Store concepts!
        timestamp: new Date().toISOString() + Math.random()
    };
    state.log.push(logEntry);

    saveState();
    updateDashboard();
    renderLog();
  }

  // --- Navigation Handler ---
  function handleNavClick(e) {
      const targetButton = e.target.closest('.nav-button');
      if (!targetButton) return;

      const targetPageId = targetButton.dataset.page;
      
      // Update the visual style of the buttons
      navButtons.forEach(button => {
          button.classList.remove('active');
      });
      targetButton.classList.add('active');

      // Switch the visible page
      pages.forEach(page => {
          if (page.id === targetPageId) {
              page.classList.add('active');
          } else {
              page.classList.remove('active');
          }
      });
  }

  // --- Particle Explosion Helper ---
  function createParticleExplosion(buttonElement, xpAmount) {
      const rect = buttonElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const intensity = xpAmount / 25;
      particleSystem.createRipple(centerX, centerY, intensity);
  }

  // --- Event Listeners ---
  // Navigation handler
  const nav = document.querySelector('nav');
  if (nav) {
    nav.addEventListener('click', handleNavClick);
  }
  
  if (xpButtons) {
    xpButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.xp-button');
        if (button) {
            const xpToAdd = parseInt(button.dataset.xp, 10);
            if (particleSystem) {
              createParticleExplosion(button, xpToAdd);
            }
            addXP(xpToAdd);
        }
    });
  }

  // Listener for the "Edit" button on log entries (uses event delegation)
  // We'll add this listener to the document since log entries are added dynamically
  document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-log-button')) {
          const logEntryElement = e.target.closest('.log-entry');
          const logId = logEntryElement.dataset.logId;
          openEditModal(logId);
      }
  });

  // Listeners for the modal form
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const logId = state.currentlyEditingLogId;
        const entryToUpdate = state.log.find(entry => entry.timestamp === logId);

        if (entryToUpdate) {
            entryToUpdate.description = editDescriptionInput.value;
            entryToUpdate.confidence = editConfidenceInput.value;
        }

        saveState();
        renderLog();
        closeEditModal();
    });
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', closeEditModal);
  }
  
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            closeEditModal();
        }
    });
  }

  // --- Initialization ---
  function init() {
      // Create log list if it doesn't exist
      const logPage = document.getElementById('log');
      if (logPage && !logPage.querySelector('#log-list')) {
          const ul = document.createElement('ul');
          ul.id = 'log-list';
          logPage.appendChild(ul);
      }
      
      loadState();
      xpDisplay.innerText = state.xp;
      coinsDisplay.innerText = state.coins;
      renderLog();
  }
  
  init();
});