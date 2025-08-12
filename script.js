
class Particle {
  constructor(x, y, vx, vy, color, size) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.size = size;
    this.initialSize = size; this.life = 1.0; this.decay = Math.random() * 0.02 + 0.01; this.gravity = 0.1;
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.vx *= 0.98; this.vy *= 0.98; this.life -= this.decay; this.size = this.initialSize * this.life; }
  draw(ctx) { if (this.life <= 0) return; ctx.save(); ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fill(); ctx.restore(); }
  isDead() { return this.life <= 0; }
}
class ParticleSystem {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.particles = []; this.resize(); window.addEventListener('resize', () => this.resize()); this.animate(); }
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  createRipple(x, y, intensity = 1) { const colors = ['#4f46e5', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981']; const particleCount = Math.floor(30 * intensity); for (let i = 0; i < particleCount; i++) { const angle = (Math.PI * 2 * i) / particleCount; const speed = Math.random() * 8 + 4; this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, colors[Math.floor(Math.random() * colors.length)], Math.random() * 4 + 2)); } for (let i = 0; i < Math.floor(20 * intensity); i++) { const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 12 + 2; this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, colors[Math.floor(Math.random() * colors.length)], Math.random() * 3 + 1)); } }
  update() { this.particles.forEach(p => p.update()); this.particles = this.particles.filter(p => !p.isDead()); }
  draw() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles.forEach(p => p.draw(this.ctx)); }
  animate() { this.update(); this.draw(); requestAnimationFrame(() => this.animate()); }
}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
  let state = {xp:0,coins:0,log:[],inventory: [],
    activeTheme: 'theme_dark', currentlyEditingLogId: null
  };
  
  const XP_TO_COIN_RATE = 10;

  const shopItems = [
    {
        id: 'theme_dark',
        name: 'Default Aurora',
        description: 'The standard, cool-tined dark theme. You already own this.',
        cost: 0,
        type: 'theme'

        
        
    },
    {
        id: 'theme_light',
        name: 'Light Mode',
        description: 'A clean, bright theme for daytime productivity. A classic look.',
        cost: 100,
        type: 'theme'
    },
    {
        id: 'theme_cyberpunk',
        name: 'Cyberpunk Neon',
        description: 'High-contrast pink, cyan, and purple on a deep black background.',
        cost: 250,
        type: 'theme'
    }
    ];



  // --- DOM Elements ---
  const canvas = document.getElementById('particles-canvas');
  const particleSystem = new ParticleSystem(canvas);
  const xpDisplay = document.getElementById('xp-display');
  const coinsDisplay = document.getElementById('coins-display');
  const navButtons = document.querySelectorAll('.nav-button');
  const pages = document.querySelectorAll('.page');
  const xpButtons = document.querySelector('.xp-button-group');
  const logList = document.getElementById('log-list');
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
  const imageUploadInput = document.getElementById('image-upload');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const analyzeImageButton = document.getElementById('analyze-image-button');
  const getAiInsightsButton = document.getElementById('get-ai-insights-button');
  const aiInsightsResultDiv = document.getElementById('ai-insights-result');
  const markdownConverter = new showdown.Converter();
  let uploadedImageBase64 = null;
  let tempAiSuggestion = null;

  // --- Helper Functions ---
  function saveState() { localStorage.setItem('mindforgeState', JSON.stringify(state)); }
  function loadState() {
    const savedState = localStorage.getItem('mindforgeState');
    if (savedState) {
      state = JSON.parse(savedState);
      // Ensure state object has all necessary keys to prevent errors with old data
      state.xp = state.xp || 0;
      state.coins = state.coins || 0;
      state.log = state.log || [];
      state.inventory = state.inventory || []; // Add inventory if it's missing
      state.currentlyEditingLogId = state.currentlyEditingLogId || null;

      // Map over old log entries to ensure they have the confidence property
      state.log = state.log.map(entry => ({ 
        description: 'Logged quick effort', 
        confidence: 'medium', 
        ...entry 
      }));
    }

   
    if (!state.inventory.includes('theme_dark')) {
      state.inventory.push('theme_dark');
    }
  }
  function resizeImage(file, maxSize = 1024) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = function(event) { const img = new Image(); img.onload = function() { let width = img.width; let height = img.height; if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.9)); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }
  function addXP(data) { const isQuickAdd = typeof data === 'number'; const xpAmount = isQuickAdd ? data : data.xp; const coinsEarned = Math.floor(xpAmount / XP_TO_COIN_RATE); state.xp += xpAmount; state.coins += coinsEarned; const logEntry = { description: isQuickAdd ? 'Logged quick effort' : data.description, xp: xpAmount, confidence: isQuickAdd ? 'not_picked' : data.confidence, concepts: isQuickAdd ? [] : (data.concepts || []), timestamp: new Date().toISOString() + Math.random() }; state.log.push(logEntry); saveState(); const previousXP = state.xp - xpAmount;
  
  const previousCoins = state.coins - coinsEarned;
  animateValue(xpDisplay, previousXP, state.xp, 800);
  animateValue(coinsDisplay, previousCoins, state.coins, 800); renderLog(); }
  
  function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);

    if(!item) {
        console.error('Attempted to buy an item that does not exist: ', itemId);
        return;
    }
    if(state.inventory.includes(itemId)) {
        console.warn('Attempted to buy an item that is already owned: ', itemId);
        return;
    }

    if(state.coins < item.cost) {
        alert("You don't have enough coins for this item!");
        return;
    }

    const previousCoins = state.coins;
    state.coins -= item.cost;
    animateValue(coinsDisplay, previousCoins, state.coins, 800);

    const shopCoinDisplayAmount = document.getElementById('shop-coin-display-amount');
    if (shopCoinDisplayAmount) {
      shopCoinDisplayAmount.innerText = state.coins;
    }


    state.inventory.push(item.id);
    
    saveState();

    renderShop();

    renderThemeSelector();
  }
  
  function renderLog() {
    const logList = document.getElementById('log-list'); 
    if (!logList) return;

    logList.innerHTML = '';
    state.log.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'log-entry';
        li.dataset.logId = entry.timestamp;
        const confidenceText = entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1);
        li.innerHTML = `
            <div class="log-details">
                <div class="description">${entry.description}</div>
                <div class="log-entry-details">Confidence: ${confidenceText}</div>
            </div>
            <div class="log-actions">
                <span class="xp-gain">+${entry.xp} XP</span>
                <button class="edit-log-button">Edit</button>
            </div>`;
        logList.appendChild(li);
    });
}
  function animateValue(element, start, end, duration) { if (start === end) {element.innerText=end; return}; let startTimestamp = null; const step = (timestamp) => { if (!startTimestamp) startTimestamp = timestamp; const progress = Math.min((timestamp - startTimestamp) / duration, 1); element.innerText = Math.floor(progress * (end - start) + start); if (progress < 1) window.requestAnimationFrame(step); }; window.requestAnimationFrame(step); }
  function openEditModal(logId) { const entryToEdit = state.log.find(entry => entry.timestamp === logId); if (!entryToEdit) return; state.currentlyEditingLogId = logId; editDescriptionInput.value = entryToEdit.description; editConfidenceInput.value = entryToEdit.confidence; modalBackdrop.classList.add('visible'); modalContent.classList.add('visible'); }
  function closeEditModal() { state.currentlyEditingLogId = null; modalBackdrop.classList.remove('visible'); modalContent.classList.remove('visible'); }
  function handleNavClick(e) {
    const targetButton = e.target.closest('.nav-button');
    if (!targetButton) return;

    const targetPageId = targetButton.dataset.page;

    navButtons.forEach(button => button.classList.remove('active'));
    targetButton.classList.add('active');

    pages.forEach(page => {
      page.classList.toggle('active', page.id === targetPageId);
    });

    // Conditional rendering based on the active page
    if (targetPageId === 'stats') {
      updateStatsPage();
    } else if (targetPageId === 'shop') {
      renderShop();
    } else if (targetPageId === 'dashboard') {
        renderThemeSelector();
    }
  }

  
  function createParticleExplosion(buttonElement, xpAmount) { const rect = buttonElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const intensity = xpAmount / 25; particleSystem.createRipple(centerX, centerY, intensity); }

  let xpChart = null;
  let confidenceChart = null;
  function renderShop() {
    const shopList = document.getElementById('shop-item-list');
    if (!shopList) return;

const shopCoinDisplayAmount =
document.getElementById('shop-coin-display-amount');
if(shopCoinDisplayAmount) {
    shopCoinDisplayAmount.innerText = state.coins;
}


    shopList.innerHTML = ''; // Clear existing items

    shopItems.forEach(item => {
        const isOwned = state.inventory.includes(item.id);
        const canAfford = state.coins >= item.cost;
        
        const itemCard = document.createElement('div');
        itemCard.className = 'shop-item-card';

        
        let buttonHtml;
        if (isOwned) {
            buttonHtml = `<button class="shop-buy-button" disabled>Owned</button>`;
        } else if (!canAfford) {
            // Specifically check if the user cannot afford it
            buttonHtml = `<button class="shop-buy-button" disabled>Insufficient Coins</button>`;
        } else {
            // The only remaining case: not owned AND can afford it
            buttonHtml = `<button class="shop-buy-button" data-item-id="${item.id}">Buy</button>`;
        }
       

        itemCard.innerHTML = `
          <div class="item-details">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
          </div>
          <div class="item-actions">
            <div class="item-cost">
              <span class="coin-icon"></span> ${item.cost} Coins
            </div>
            ${buttonHtml}
          </div>`;
          
        shopList.appendChild(itemCard);
    });
}
function updateStatsPage() {
    console.log("Updating stats page...");

    // --- 1. Process the Log Data ---
    const conceptData = {};
    const confidenceData = { high: 0, medium: 0, low: 0, not_picked: 0 };

    
    const conceptMap = {
        // Geometry Proofs - catch all variations
        "geometry proofs": "Geometry Proofs",
        "congruence proofs": "Geometry Proofs", 
        "proofs": "Geometry Proofs", 
        "aaa theorem": "Geometry Proofs",
        "saa theorem": "Geometry Proofs", 
        "sas theorem": "Geometry Proofs",
        "sss theorem": "Geometry Proofs",
        "aas theorem": "Geometry Proofs",
        "asa theorem": "Geometry Proofs",
        "triangle congruence": "Geometry Proofs",
        "triangle similarity": "Geometry Proofs",
        "triangle similarity proofs": "Geometry Proofs",
        "congruent triangles": "Geometry Proofs",
        "similar triangles": "Geometry Proofs",
        "congruent angles": "Geometry Proofs",
        "congruence theorems": "Geometry Proofs",
        "parallel lines": "Geometry Proofs",
        "angle relationships": "Geometry Proofs",
        "corresponding angles": "Geometry Proofs",
        "alternate interior angles": "Geometry Proofs",
        
        // Algebraic Manipulation - catch specific techniques
        "algebraic manipulation": "Algebraic Manipulation",
        "quadratic formula": "Algebraic Manipulation",
        "completing the square": "Algebraic Manipulation",
        "factoring": "Algebraic Manipulation",
        "factoring polynomials": "Algebraic Manipulation",
        "solving equations": "Algebraic Manipulation",
        "linear equations": "Algebraic Manipulation",
        "quadratic equations": "Algebraic Manipulation",
        "systems of equations": "Algebraic Manipulation",
        "inequalities": "Algebraic Manipulation",
        "algebraic expressions": "Algebraic Manipulation",
        
        // Trigonometric Ratios - catch specific functions
        "trigonometric ratios": "Trigonometric Ratios",
        "sine function": "Trigonometric Ratios",
        "cosine function": "Trigonometric Ratios", 
        "tangent function": "Trigonometric Ratios",
        "sin": "Trigonometric Ratios",
        "cos": "Trigonometric Ratios",
        "tan": "Trigonometric Ratios",
        "unit circle": "Trigonometric Ratios",
        "trig identities": "Trigonometric Ratios",
        "inverse trig functions": "Trigonometric Ratios",
        
        // Functions & Relations
        "functions & relations": "Functions & Relations",
        "function notation": "Functions & Relations",
        "domain and range": "Functions & Relations",
        "function transformations": "Functions & Relations",
        "graphing functions": "Functions & Relations",
        "logarithmic functions": "Functions & Relations",
        "exponential functions": "Functions & Relations",
        
        // Calculus Techniques
        "calculus techniques": "Calculus Techniques",
        "derivatives": "Calculus Techniques",
        "integrals": "Calculus Techniques",
        "limits": "Calculus Techniques",
        "chain rule": "Calculus Techniques",
        "product rule": "Calculus Techniques",
        "quotient rule": "Calculus Techniques",
        "optimization": "Calculus Techniques",
        "related rates": "Calculus Techniques",
        
        // Mathematical Reasoning
        "mathematical reasoning": "Mathematical Reasoning",
        "logic": "Mathematical Reasoning",
        "problem solving": "Mathematical Reasoning",
        "proof writing": "Mathematical Reasoning",
        
        // Statistics & Data
        "statistics & data": "Statistics & Data",
        "mean": "Statistics & Data",
        "median": "Statistics & Data",
        "mode": "Statistics & Data",
        "probability": "Statistics & Data",
        "data analysis": "Statistics & Data",
        
        // Number Theory
        "number theory": "Number Theory",
        "prime numbers": "Number Theory",
        "sequences": "Number Theory",
        "series": "Number Theory",
    };
    
    function normalizeConcept(concept) {
        if (!concept || typeof concept !== 'string') return "Other";
        
        const key = concept.toLowerCase().trim();
        const normalized = conceptMap[key];
        
        // If we have a direct mapping, use it
        if (normalized) {
            return normalized;
        }
        
        // If no direct mapping found, check if it's already a standardized category
        const standardizedCategories = [
            "Geometry Proofs",
            "Algebraic Manipulation", 
            "Trigonometric Ratios",
            "Statistics & Data",
            "Calculus Techniques",
            "Mathematical Reasoning",
            "Functions & Relations",
            "Number Theory",
            "Other"
        ];
        
        // Check if the concept (with proper capitalization) is already standardized
        for (const category of standardizedCategories) {
            if (category.toLowerCase() === key) {
                return category;
            }
        }
        
        // If nothing matches, return "Other"
        return "Other";
    }
    
    state.log.forEach(entry => {
        // Aggregate confidence
        if (entry.confidence && confidenceData.hasOwnProperty(entry.confidence)) {
            confidenceData[entry.confidence]++;
        }

        // Aggregate XP for each concept, normalized
        if (entry.concepts && Array.isArray(entry.concepts) && entry.concepts.length > 0) {
            entry.concepts.forEach(concept => {
                const normalized = normalizeConcept(concept);
                if (!conceptData[normalized]) {
                    conceptData[normalized] = 0;
                }
                conceptData[normalized] += entry.xp || 0;
            });
        }
    });

    // --- 2. Update Key Metrics ---
    document.getElementById('total-sessions').innerText = state.log.length;
    const avgXp = state.log.length > 0 ? (state.xp / state.log.length).toFixed(0) : 0;
    document.getElementById('avg-xp').innerText = avgXp;
    
    const topConcept = Object.keys(conceptData).length > 0 
        ? Object.entries(conceptData).sort((a, b) => b[1] - a[1])[0][0]
        : 'None';
    document.getElementById('top-concept').innerText = topConcept;

    // --- 3. Render the Charts ---
    if (xpChart) xpChart.destroy();
    if (confidenceChart) confidenceChart.destroy();

    // Bar Chart: XP by Concept
    const xpCtx = document.getElementById('xp-by-concept-chart').getContext('2d');
    xpChart = new Chart(xpCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(conceptData),
            datasets: [{
                label: 'XP Earned',
                data: Object.values(conceptData),
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    const confidenceCtx = document.getElementById('confidence-chart').getContext('2d');
    confidenceChart = new Chart(confidenceCtx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low', 'Not Picked'],
            datasets: [{
                data: [
                    confidenceData.high, 
                    confidenceData.medium, 
                    confidenceData.low, 
                    confidenceData.not_picked
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)', // Green for High
                    'rgba(245, 158, 11, 0.7)',  // Amber for Medium
                    'rgba(239, 68, 68, 0.7)',   // Red for Low
                    'rgba(107, 114, 128, 0.7)' // Gray for Not Picked
                ],
                borderColor: '#1f2937',
                borderWidth: 2,
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}
getAiInsightsButton.addEventListener('click', async () => {
    if (state.log.length < 3) {
      alert('You need to log at least 3 study sessions to get a useful analysis.');
      return;
    }

    const buttonText = getAiInsightsButton.querySelector('.button-text');
    const spinner = getAiInsightsButton.querySelector('.spinner');

    // Show loading state
    getAiInsightsButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'inline-block';
    aiInsightsResultDiv.style.display = 'none'; // Hide previous results

    try {
      const response = await fetch('/api/generateInsights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: state.log }),
      });

      if (!response.ok) {
        throw new Error('The AI advisor is busy, please try again in a moment.');
      }

      const data = await response.json();
      
      if (data.insights) {
        // Convert the markdown response to HTML and display it
        const htmlInsights = markdownConverter.makeHtml(data.insights);
        aiInsightsResultDiv.innerHTML = htmlInsights;
        aiInsightsResultDiv.style.display = 'block';
      }

    } catch (error) {
      console.error('Failed to get AI insights:', error);
      aiInsightsResultDiv.innerHTML = `<p style="color: #ef4444;">${error.message}</p>`;
      aiInsightsResultDiv.style.display = 'block';
    } finally {
      // Hide loading state
      getAiInsightsButton.disabled = false;
      buttonText.style.display = 'inline-block';
      spinner.style.display = 'none';
    }
  });
  // --- Event Listeners ---
  document.querySelector('nav').addEventListener('click', handleNavClick);
  xpButtons.addEventListener('click', (e) => { const button = e.target.closest('.xp-button'); if (button) { const xpToAdd = parseInt(button.dataset.xp, 10); createParticleExplosion(button, xpToAdd); addXP(xpToAdd); } });
  logList.addEventListener('click', (e) => { if (e.target.classList.contains('edit-log-button')) { openEditModal(e.target.closest('.log-entry').dataset.logId); } });
  editForm.addEventListener('submit', (e) => { e.preventDefault(); const entryToUpdate = state.log.find(entry => entry.timestamp === state.currentlyEditingLogId); if (entryToUpdate) { entryToUpdate.description = editDescriptionInput.value; entryToUpdate.confidence = editConfidenceInput.value; } saveState(); renderLog(); closeEditModal(); });
  cancelEditButton.addEventListener('click', closeEditModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) { closeEditModal(); } });


const shopListContainer = document.getElementById('shop-item-list');
if(shopListContainer) {
    shopListContainer.addEventListener('click',(e)=> {
        const buyButton = e.target.closest('.shop-buy-button');


        if(buyButton && !buyButton.disabled) {
            const itemId = buyButton.dataset.itemId;
            if(itemId) {
                buyItem(itemId);
            }
        }
    });
}




  aiLogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('ai-log-description').value;
      aiLogButton.disabled = true;
      aiLogButton.querySelector('.button-text').style.display = 'none';
      aiLogButton.querySelector('.spinner').style.display = 'inline-block';
      try {
          const response = await fetch('/api/generateXP', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
          if (!response.ok) { throw new Error('Network response was not ok'); }
          const data = await response.json();
          tempAiSuggestion = data;
          console.log('AI response:', data); 

const xpValue = data.xp ?? data.data?.xp;
const justificationValue = data.justification ?? data.data?.justification;

aiSuggestedXp.innerText = xpValue;
aiJustification.innerText = justificationValue;
          aiResultsDiv.style.display = 'block';
      } catch (error) { console.error('Failed to fetch AI suggestion:', error); alert('Could not get an AI suggestion. Please try again.');
      } finally {
          aiLogButton.disabled = false;
          aiLogButton.querySelector('.button-text').style.display = 'inline-block';
          aiLogButton.querySelector('.spinner').style.display = 'none';
      }
  });

const themeSelectorContainer =
document.getElementById('theme-selector-area');
if (themeSelectorContainer) {
    themeSelectorContainer.addEventListener('click', (e) => {
    const themeButton = e.target.closest('.theme-button');
    if(themeButton) {
        const themeId = themeButton.dataset.themeId;
        applyTheme(themeId);

        renderThemeSelector();
    }
});
}

  acceptAiSuggestionButton.addEventListener('click', () => {
    console.log('Accept button clicked');
    console.log('tempAiSuggestion:', tempAiSuggestion);
    
    if (!tempAiSuggestion) {
        console.log('tempAiSuggestion is null/undefined - returning early');
        return;
    }
    if (!tempAiSuggestion) return;
    
    // Determine the description based on the source type we stored
    const description = tempAiSuggestion.sourceType === 'image'
        ? `Analyzed work from uploaded image.` 
        : document.getElementById('ai-log-description').value;

    const logData = {
        description: description,
        xp: tempAiSuggestion.xp ?? tempAiSuggestion.data?.xp,
        confidence: 'medium',
        concepts: tempAiSuggestion.concepts ?? tempAiSuggestion.data?.concepts ?? []
    };

    addXP(logData);
    
    // Call the reject/cancel function to clean up the UI
    rejectAiSuggestion();
});

function applyTheme(themeId) {
    document.body.className = themeId || 'theme_dark';
    state.activeTheme = themeId;
    saveState();
}

function renderThemeSelector() {
    const selectorList = document.getElementById('theme-selector-list');
    if(!selectorList) return;
    selectorList.innerHTML = '';

    const ownedThemes = shopItems.filter (item =>
        item.type === 'theme' &&
        state.inventory.includes(item.id)

    );

    ownedThemes.forEach(theme => {
        const button = document.createElement('button');
        button.className = 'theme-button';
        button.innerText = theme.name;
        button.dataset.themeId = theme.id;

        if(state.activeTheme === theme.id) {
            button.classList.add('active');
        }
        selectorList.appendChild(button);
    });
}


function rejectAiSuggestion() {
  aiResultsDiv.style.display = 'none';
  aiLogForm.reset();
  
  // Also reset the image uploader UI
  imagePreviewContainer.style.display = 'none';
  imageUploadInput.value = '';

  document.getElementById('image-context-text').value = ''; 
  uploadedImageBase64 = null;
  
  tempAiSuggestion = null;
  console.log('AI suggestion UI has been cleared.');
}

rejectAiSuggestionButton.addEventListener('click', rejectAiSuggestion);

  imageUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
          try {
              const resizedBase64 = await resizeImage(file);
              uploadedImageBase64 = resizedBase64;
              imagePreview.src = uploadedImageBase64;
              imagePreviewContainer.style.display = 'block';
          } catch (error) { console.error('Image resizing failed:', error); alert('There was an error processing your image. Please try a different one.'); }
      }
  });
  
  analyzeImageButton.addEventListener('click', async () => {
    if (!uploadedImageBase64) {
        alert('Please select an image first.');
        return;
    }


    const contextText = document.getElementById('image-context-text').value;

    analyzeImageButton.disabled = true;
    analyzeImageButton.innerHTML = `<span class="spinner"></span>`;

    try {
        const response = await fetch('/api/analyzeImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ image: uploadedImageBase64, text: contextText }),
        });

        if (!response.ok) { throw new Error(`Server error: ${response.statusText}`); }

        const data = await response.json();
        tempAiSuggestion = { ...data, sourceType: 'image' };

        aiSuggestedXp.innerText = data.xp;
        aiJustification.innerText = data.justification;
        
        imagePreviewContainer.style.display = 'none';
        aiResultsDiv.style.display = 'block';

        const appContainer = document.querySelector('.app-container');
        appContainer.scrollTo({ top: aiResultsDiv.offsetTop - 20, behavior: 'smooth' });

    } catch (error) {
        console.error('An error occurred during image analysis:', error);
        alert('An error occurred. Please check the console for details.');
    } finally {
        analyzeImageButton.disabled = false;
        analyzeImageButton.innerHTML = `Analyze Image`;
    }
});

  // --- Initialization ---
  function init() {
      const logPage = document.getElementById('log');
      if (logPage && !logPage.querySelector('#log-list')) {
          const ul = document.createElement('ul');
          ul.id = 'log-list';
          logPage.appendChild(ul);
      }
      loadState();
      xpDisplay.innerText = state.xp;
      coinsDisplay.innerText = state.coins;
      applyTheme(state.activeTheme);
      renderThemeSelector();
      renderLog();
  }
  
  init();
});