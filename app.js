
  // --- Main Application Logic ---
  document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateActiveTimers, 1000);
  let state = {xp:0,coins:0,log:[],inventory: [],
    activeTheme: 'theme_dark', activePowerups: [], currentlyEditingLogId: null,

    activeQuests: [],
    questProgress: {},
    questsLastUpdated: null,

    activeBounties: [],
  };
  
  const XP_TO_COIN_RATE = 10;

  const shopItems = [
    {
        id: 'bounty_rapid_review',
        type: 'bounty',
        name: 'Bounty: Rapid Review',
        description: 'Challenge: Log 3 Seperate sessions. High risk, high reward!',
        cost: 15,
        timeLimit: 60,

        goal: { type: 'log_session', target: 3 },
        successReward: { xp: 100, coins: 30 }, 
        failureReward: { xp: 20, coins: 5 }  
    },
    {
        id: 'bounty_xp_sprint',
        type: 'bounty',
        name: 'Bounty: XP Sprint',
        description: 'Challenge: Earn 150 XP. Could you do it?',
        cost: 20,
        timeLimit: 90,
        goal: { type: 'earn_xp', target: 150 },
        successReward: { xp: 150, coins: 45 }, 
        failureReward: { xp: 30, coins: 10 }   
    },
      {
          id: 'potion_double_xp',
          name: 'Elixir of Focus (2x XP)',
          description: 'Doubles all XP earned from logging for the next 30 minutes.',
          cost: 50,
          type: 'powerup',
          duration: 30
      },

        
     
    ];
    
    const onboardingSteps = [
      {
        title: "Welcome to MindForge!",
        content: "This is your dashboard, the central hub for your progress. Let's take a quick tour.",
        targetElement: '#dashboard h1' 
      },
      {
        title: "Log Your Effort Here",
        content: "Click on the 'Log' tab to open the activity logger. This is where you'll input your study sessions.",
        targetElement: '[data-page="log"]' 
      },
      {
        title: "Track Your Progress",
        content: "The 'Stats' page contains charts and AI-powered insights to help you understand your learning patterns.",
        targetElement: '[data-page="stats"]' 
      },
      {
        title: "You're All Set!",
        content: "Ready to start your journey? Log your first session now.",
        targetElement: '#dashboard' 
      }

    ];


    const questMasterList = [
        {
            id: 'log_one_session',
            description: 'Log any study session',
            type: 'log_session',
            target: 1,
            reward: {xp:20,coins:2}
        },
        {
            id: 'earn_50_xp',
            description: 'Earn 50 XP in total',
            type: 'earn_xp',
            target: 50,
            reward: {xp:30, coins: 3}
        },
        {
            id: 'log_with_image',
            description: 'Log your work by uploading an image',
            type: 'log_image',
            target: 1,
            reward: {xp:25, coins: 2}
        },
        {
            id: 'log_three_sessions',
            description: 'Log three seperate study sessions',
            type: 'log_session',
            target: 3,
            reward: {xp:50, coins: 5}
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
        const loadedState = JSON.parse(savedState); 
        state = { ...state, ...loadedState };

        state.activeBounties = state.activeBounties || [];
        
        state.xp = state.xp || 0;
        state.coins = state.coins || 0;
        state.log = state.log || [];
        state.inventory = state.inventory || [];
        state.activeTheme = state.activeTheme || 'theme_dark';
        state.activePowerups = state.activePowerups || [];
        state.currentlyEditingLogId = state.currentlyEditingLogId || null;

        
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
  let currentOnboardingStep = 0;
const popover = document.getElementById('onboarding-popover');
const overlay = document.getElementById('onboarding-overlay');
const onboardingButton = document.getElementById('onboarding-button');

function positionPopover(targetSelector) {
  const targetElement = document.querySelector(targetSelector);
  if (!targetElement) {
  
      popover.style.top = '50%';
      popover.style.left = '50%';
      popover.style.transform = 'translate(-50%, -50%)';
      return;
  }

  const rect = targetElement.getBoundingClientRect();

  popover.style.top = `${rect.bottom + 15}px`;
  popover.style.left = `${rect.left}px`;
  

  popover.className = 'onboarding-popover visible arrow-top';
}

function showOnboardingStep(stepIndex) {
  const step = onboardingSteps[stepIndex];
  
  positionPopover(step.targetElement);
  
  document.getElementById('onboarding-content').innerText = step.content;

  if (stepIndex === onboardingSteps.length - 1) {
      onboardingButton.innerText = "Finish";
  } else {
      onboardingButton.innerText = "Next";
  }
}

function startOnboarding() {
  overlay.classList.remove('hidden');
  popover.classList.add('visible');
  
  showOnboardingStep(0);

  onboardingButton.addEventListener('click', function handleOnboardingClick() {
      currentOnboardingStep++;
      if (currentOnboardingStep < onboardingSteps.length) {
          showOnboardingStep(currentOnboardingStep);
      } else {
          overlay.classList.add('hidden');
          popover.classList.remove('visible');
          localStorage.setItem('mindforge_onboarded', 'true');
          onboardingButton.removeEventListener('click', handleOnboardingClick);
      }
  });
}

function refreshDailyQuests() {

    const today = new Date().toISOString().split('T')[0]; 

   
    if (state.questsLastUpdated === today) {
        return; 
    }

    console.log("Date has changed. Generating new daily quests for", today);


    const shuffled = questMasterList.sort(() => 0.5 - Math.random());
    state.activeQuests = shuffled.slice(0, 2).map(q => ({ ...q, claimed: false }));

    state.questProgress = {};
    state.activeQuests.forEach(q => {
        state.questProgress[q.id] = 0;
    });

    state.questsLastUpdated = today;
    saveState();
}
function updateProgress(typeOfAction, amount) {
    let needsUiUpdate = false;


    state.activeQuests.forEach(quest => {
        if (quest.type === typeOfAction && !quest.claimed) {
            state.questProgress[quest.id] += amount;
            needsUiUpdate = true;
        }
    });

    state.activeBounties.forEach(bounty => {
        if (bounty.goal.type === typeOfAction) {
            bounty.progress += amount;
            console.log(`Bounty progress for ${bounty.id}: ${bounty.progress}/${bounty.goal.target}`);


            if (bounty.progress >= bounty.goal.target) {
                const bountyInfo = shopItems.find(i => i.id === bounty.id);

                state.xp += bountyInfo.successReward.xp; 
                state.coins += bountyInfo.successReward.coins; 
                
                showNotification(`Bounty Complete! +${bountyInfo.successReward.xp} XP & ${bountyInfo.successReward.coins} 🪙`);
                
          
                state.activeBounties = state.activeBounties.filter(b => b.id !== bounty.id);
                
      
                xpDisplay.innerText = state.xp.toLocaleString();
                coinsDisplay.innerText = state.coins.toLocaleString();
            }
            needsUiUpdate = true;
        }
    });

    if (needsUiUpdate) {
        saveState();
        renderQuests(); 
        updateActiveTimers(); 
    }
}
function renderQuests() {
    const questList = document.getElementById('quest-list');
    if (!questList) return;

    questList.innerHTML = '';
    if (state.activeQuests.length === 0) {
        questList.innerHTML = '<p class="text-muted text-sm">New quests will appear tomorrow!</p>';
        return;
    }

    state.activeQuests.forEach(quest => {
        const progress = state.questProgress[quest.id] || 0;
        const isComplete = progress >= quest.target;
        const progressPercent = Math.min((progress / quest.target) * 100, 100);

        const questCard = document.createElement('div');
        questCard.className = 'quest-card';

        let buttonHtml;
        if (quest.claimed) {
            buttonHtml = `<button class="btn btn-secondary quest-claim-button" disabled>Claimed</button>`;
        } else if (isComplete) {
            buttonHtml = `<button class="btn btn-primary quest-claim-button" data-quest-id="${quest.id}">Claim</button>`;
        } else {
            buttonHtml = `<button class="btn btn-secondary quest-claim-button" disabled>${progress} / ${quest.target}</button>`;
        }

        questCard.innerHTML = `
            <div class="quest-details">
                <p class="quest-description">${quest.description}</p>
                <p class="quest-reward">+${quest.reward.xp} XP & ${quest.reward.coins} 🪙</p>
                <div class="quest-progress-bar">
                    <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            ${buttonHtml}
        `;
        questList.appendChild(questCard);
    });
}

function addXP(data) {
    const isQuickAdd = typeof data === 'number';
    let xpAmount = isQuickAdd ? data : data.xp;
    let description = isQuickAdd ? 'Logged quick effort' : data.description;


    const now = new Date().getTime();
    state.activePowerups = state.activePowerups.filter(p => p.expiresAt > now);

    const doubleXpPotion = state.activePowerups.find(p => p.id === 'potion_double_xp');
    if (doubleXpPotion) {
        xpAmount *= 2;

        description += " (x2 Bonus!)"; 
        console.log("Double XP active! Awarding", xpAmount, "XP.");
    }


    const coinsEarned = Math.floor(xpAmount / XP_TO_COIN_RATE);
    state.xp += xpAmount;
    state.coins += coinsEarned;
    

    const logEntry = {
        id: new Date().toISOString() + Math.random(),
        description: description,
        xp: xpAmount,
        confidence: isQuickAdd ? 'not_picked' : data.confidence,
        concepts: isQuickAdd ? [] : (data.concepts || []),
        timestamp: new Date().toISOString()
    };
    
    state.log.push(logEntry);
    saveState();
    
    const previousXP = state.xp - xpAmount;
    const previousCoins = state.coins - coinsEarned;
    animateValue(xpDisplay, previousXP, state.xp, 800);
    animateValue(coinsDisplay, previousCoins, state.coins, 800);
    updateProgress('log_session', 1);
    updateProgress('earn_xp', xpAmount);
    renderLog();
}

  
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
    
    renderPowerups();
  }

function buyBounty(bountyId) {
    const bounty = shopItems.find(i => i.id === bountyId);
    if(!bounty || bounty.type !== 'bounty') {
        console.error("Attempted to buy a non-bounty item as a bounty:", bountyId);
        return;
    }
    if (state.coins < bounty.cost) {
        showNotification("You don't have enough coins for this bounty!");
        return;
    }
    if (state.activeBounties.some(b => b.id === bountyId)) {
        showNotification("You already have this bounty active!");
        return;
    }


    state.coins -= bounty.cost;


    const expirationTime = new Date().getTime() + bounty.timeLimit * 60 * 1000;
    state.activeBounties.push({
        id: bountyId,
        expiresAt: expirationTime,
        progress: 0, 
        goal: bounty.goal 
    });

    showNotification(`Bounty Accepted: ${bounty.name}`);
    
 
    saveState();
    renderShop();
    updateActiveTimers();
    coinsDisplay.innerText = state.coins.toLocaleString();
}
function renderLog() {
    const logList = document.getElementById('log-list');
    if (!logList) {
        console.error('log-list element not found!');
        return;
    }

    logList.innerHTML = ''; 
    
    if (state.log.length === 0) {
        logList.innerHTML = '<p class="empty-state-text">No activities logged yet. Start by logging your first session!</p>';
        return;
    }
    
    state.log.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'log-entry';
        li.dataset.logId = entry.id;

        const confidenceText = entry.confidence ? 
            (entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1)) : 
            'Not Set';

        li.innerHTML = `
            <div class="log-details">
                <p class="description">${entry.description}</p>
                <p class="log-meta">Confidence: ${confidenceText}</p>
                <p class="log-timestamp">${new Date(entry.timestamp).toLocaleString()}</p>
            </div>
            <div class="log-actions">
                <span class="xp-gain">+${entry.xp} XP</span>
                <button class="edit-log-button">Edit</button>
            </div>
        `;
        logList.appendChild(li);
    });
}

  function showNotification(message) {
   
    let container = document.getElementById('notification-container');
    if (!container) {
        console.log("Notification container not found, creating it.");
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = 'notification-banner';
    notification.innerText = message;

    container.appendChild(notification);
   
    setTimeout(() => {
      notification.remove();
    }, 4000); 
  }
  function animateValue(element, start, end, duration) { if (start === end) {element.innerText=end; return}; let startTimestamp = null; const step = (timestamp) => { if (!startTimestamp) startTimestamp = timestamp; const progress = Math.min((timestamp - startTimestamp) / duration, 1); element.innerText = Math.floor(progress * (end - start) + start); if (progress < 1) window.requestAnimationFrame(step); }; window.requestAnimationFrame(step); }
  function openEditModal(logId) {
      const entryToEdit = state.log.find(entry => entry.timestamp === logId);
      if (!entryToEdit) return;
  
      state.currentlyEditingLogId = logId;
      editDescriptionInput.value = entryToEdit.description;
      editConfidenceInput.value = entryToEdit.confidence;
  
   
      modalBackdrop.classList.remove('hidden');
  }
  function closeEditModal() { 
      state.currentlyEditingLogId = null; 
      modalBackdrop.classList.add('hidden'); 
  }

  function handleNavClick(e) {
     // closeEditModal();
      const targetButton = e.target.closest('.nav-button');
      if (!targetButton) return;
  
      const targetPageId = targetButton.dataset.page;
  
    
      navButtons.forEach(button => button.classList.remove('active'));

      targetButton.classList.add('active');
  
     
      pages.forEach(page => page.classList.remove('active'));

      document.getElementById(targetPageId).classList.add('active');
  
      if (targetPageId === 'stats') {
          updateStatsPage();
      } else if (targetPageId === 'shop') {
          renderShop();
      } else if (targetPageId === 'dashboard') {
          renderThemeSelector();
          renderPowerups();
      }
  }

  
  function createParticleExplosion(buttonElement, xpAmount) { const rect = buttonElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const intensity = xpAmount / 25; particleSystem.createRipple(centerX, centerY, intensity); }

  let xpChart = null;
  let confidenceChart = null;
  function renderShop() {
    const shopList = document.getElementById('shop-item-list');
    const shopCoinDisplay = document.getElementById('shop-coin-display-amount');
    if (!shopList) return;
    if (shopCoinDisplay) shopCoinDisplay.innerText = state.coins.toLocaleString();

    shopList.innerHTML = ''; 

    const categories = ['Bounty', 'Power-up'];

    categories.forEach(category => {

        const itemsInCategory = shopItems.filter(item => item.type.toLowerCase() === category.toLowerCase());
        
       
        if (itemsInCategory.length > 0) {
          
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'shop-category-title';
            categoryTitle.innerText = `${category}s`; 
            shopList.appendChild(categoryTitle);

            
            itemsInCategory.forEach(item => {
                const isOwned = state.inventory.includes(item.id);
                
                const isActiveBounty = item.type === 'bounty' && state.activeBounties.some(b => b.id === item.id);
                const canAfford = state.coins >= item.cost;
                
                const itemCard = document.createElement('div');
                itemCard.className = 'card flex justify-between items-center';

                let buttonHtml;
                if (isOwned || isActiveBounty) {
                    buttonHtml = `<button class="btn btn-secondary" disabled>${isActiveBounty ? 'Active' : 'Owned'}</button>`;
                } else if (!canAfford) {
                    buttonHtml = `<button class="btn btn-secondary" disabled>Insufficient Coins</button>`;
                } else {
                  
                    const dataType = item.type === 'bounty' ? 'data-bounty-id' : 'data-item-id';
                    buttonHtml = `<button class="btn btn-primary" ${dataType}="${item.id}">Buy</button>`;
                }

                itemCard.innerHTML = `
                    <div>
                        <h3 class="font-semibold">${item.name}</h3>
                        <p class="text-sm text-muted">${item.description}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold mb-sm">${item.cost} 🪙</p>
                        ${buttonHtml}
                    </div>`;
                shopList.appendChild(itemCard);
            });
        }
    });
}
function updateStatsPage() {
  console.log("Updating stats page with live data and concept normalization...");

  const totalSessionsEl = document.getElementById('total-sessions');
  const avgXpEl = document.getElementById('avg-xp');
  const topConceptEl = document.getElementById('top-concept');
  const xpCtx = document.getElementById('xp-by-concept-chart')?.getContext('2d');
  const confidenceCtx = document.getElementById('confidence-chart')?.getContext('2d');

  if (!totalSessionsEl || !xpCtx || !confidenceCtx) {
      return;
  }

  const conceptData = {};
  const confidenceData = { high: 0, medium: 0, low: 0, not_picked: 0 }; // Keep not_picked for now

  const conceptMap = {
      "geometry proofs": "Geometry Proofs", "congruence proofs": "Geometry Proofs", "proofs": "Geometry Proofs", "aaa theorem": "Geometry Proofs", "saa theorem": "Geometry Proofs", "sas theorem": "Geometry Proofs", "sss theorem": "Geometry Proofs", "aas theorem": "Geometry Proofs", "asa theorem": "Geometry Proofs", "triangle congruence": "Geometry Proofs", "triangle similarity": "Geometry Proofs", "triangle similarity proofs": "Geometry Proofs", "congruent triangles": "Geometry Proofs", "similar triangles": "Geometry Proofs", "congruent angles": "Geometry Proofs", "congruence theorems": "Geometry Proofs", "parallel lines": "Geometry Proofs", "angle relationships": "Geometry Proofs", "corresponding angles": "Geometry Proofs", "alternate interior angles": "Geometry Proofs",
      "algebraic manipulation": "Algebraic Manipulation", "quadratic formula": "Algebraic Manipulation", "completing the square": "Algebraic Manipulation", "factoring": "Algebraic Manipulation", "factoring polynomials": "Algebraic Manipulation", "solving equations": "Algebraic Manipulation", "linear equations": "Algebraic Manipulation", "quadratic equations": "Algebraic Manipulation", "systems of equations": "Algebraic Manipulation", "inequalities": "Algebraic Manipulation", "algebraic expressions": "Algebraic Manipulation",
      "trigonometric ratios": "Trigonometric Ratios", "sine function": "Trigonometric Ratios", "cosine function": "Trigonometric Ratios", "tangent function": "Trigonometric Ratios", "sin": "Trigonometric Ratios", "cos": "Trigonometric Ratios", "tan": "Trigonometric Ratios", "unit circle": "Trigonometric Ratios", "trig identities": "Trigonometric Ratios", "inverse trig functions": "Trigonometric Ratios",
      "functions & relations": "Functions & Relations", "function notation": "Functions & Relations", "domain and range": "Functions & Relations", "function transformations": "Functions & Relations", "graphing functions": "Functions & Relations", "logarithmic functions": "Functions & Relations", "exponential functions": "Functions & Relations",
      "calculus techniques": "Calculus Techniques", "derivatives": "Calculus Techniques", "integrals": "Calculus Techniques", "limits": "Calculus Techniques", "chain rule": "Calculus Techniques", "product rule": "Calculus Techniques", "quotient rule": "Calculus Techniques", "optimization": "Calculus Techniques", "related rates": "Calculus Techniques",
      "mathematical reasoning": "Mathematical Reasoning", "logic": "Mathematical Reasoning", "problem solving": "Mathematical Reasoning", "proof writing": "Mathematical Reasoning",
      "statistics & data": "Statistics & Data", "mean": "Statistics & Data", "median": "Statistics & Data", "mode": "Statistics & Data", "probability": "Statistics & Data", "data analysis": "Statistics & Data",
      "number theory": "Number Theory", "prime numbers": "Number Theory", "sequences": "Number Theory", "series": "Number Theory",
  };

  function normalizeConcept(concept) {
      if (!concept || typeof concept !== 'string') return "Other";
      const key = concept.toLowerCase().trim();
      const normalized = conceptMap[key];
      if (normalized) { return normalized; }
      const standardizedCategories = ["Geometry Proofs", "Algebraic Manipulation", "Trigonometric Ratios", "Statistics & Data", "Calculus Techniques", "Mathematical Reasoning", "Functions & Relations", "Number Theory", "Other"];
      for (const category of standardizedCategories) {
          if (category.toLowerCase() === key) { return category; }
      }
      return "Other";
  }

  state.log.forEach(entry => {
      if (entry.confidence && confidenceData.hasOwnProperty(entry.confidence)) {
          confidenceData[entry.confidence]++;
      }
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

  totalSessionsEl.innerText = state.log.length;
  const avgXp = state.log.length > 0 ? (state.xp / state.log.length).toFixed(0) : 0;
  avgXpEl.innerText = avgXp;
  const topConcept = Object.keys(conceptData).length > 0 ? Object.entries(conceptData).sort((a, b) => b[1] - a[1])[0][0] : 'None';
  topConceptEl.innerText = topConcept;

  // Get CSS custom property values for consistent theming
  const rootStyles = getComputedStyle(document.documentElement);
  const foregroundColor = rootStyles.getPropertyValue('--foreground').trim();
  const mutedForegroundColor = rootStyles.getPropertyValue('--muted-foreground').trim();
  const borderColor = rootStyles.getPropertyValue('--border').trim();
  const primaryColor = rootStyles.getPropertyValue('--primary').trim();
  const cardColor = rootStyles.getPropertyValue('--card').trim();

  if (xpChart) xpChart.destroy();
  if (confidenceChart) confidenceChart.destroy();

  xpChart = new Chart(xpCtx, {
      type: 'bar',
      data: {
          labels: Object.keys(conceptData),
          datasets: [{
              label: 'XP Earned',
              data: Object.values(conceptData),
              backgroundColor: `hsl(${primaryColor})`, 
              borderRadius: 4,
          }]
      },
      options: {
          scales: {
              y: { 
                  beginAtZero: true,
                  ticks: { 
                      color: `hsl(${mutedForegroundColor})`,
                      font: { size: 12 }
                  }, 
                  grid: { color: `hsl(${borderColor})` } 
              },
              x: {
                  ticks: { 
                      color: `hsl(${mutedForegroundColor})`,
                      font: { size: 12 }
                  },
                  grid: { display: false } 
              }
          },
          plugins: { 
              legend: { 
                  display: false 
              }
          }
      }
  });

  confidenceChart = new Chart(confidenceCtx, {
      type: 'doughnut',
      data: {
          labels: ['High', 'Medium', 'Low'],
          datasets: [{
              data: [confidenceData.high, confidenceData.medium, confidenceData.low],
              backgroundColor: [
                  'hsl(142, 71%, 45%)', // Green for high
                  'hsl(48, 95%, 53%)',  // Yellow for medium
                  'hsl(0, 84%, 60%)'    // Red for low
              ],
              borderColor: `hsl(${cardColor})`, 
              borderWidth: 5,
          }]
      },
      options: {
          plugins: {
              legend: {
                  position: 'top',
                  labels: { 
                      color: `hsl(${mutedForegroundColor})`,
                      font: { size: 14 }
                  }
              }
          }
      }
  });
}

getAiInsightsButton.addEventListener('click', async (e) => {
 
  
  if (state.log.length < 3) {
      alert('You need to log at least 3 study sessions to get a useful analysis.');
      return;
  }

  const buttonText = getAiInsightsButton.querySelector('.button-text');
  const spinner = getAiInsightsButton.querySelector('.spinner');

  // --- Start Loading Animation ---
  getAiInsightsButton.disabled = true;
  getAiInsightsButton.classList.add('loading');
  buttonText.style.opacity = '0';
  spinner.classList.remove('hidden');
  spinner.style.opacity = '1';

  try {
      const response = await fetch('/api/generateInsights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log: state.log }),
      });

      if (!response.ok) { throw new Error('The AI advisor is busy, please try again.'); }

      const data = await response.json();
      if (data.insights) {
          const htmlInsights = markdownConverter.makeHtml(data.insights);
          aiInsightsResultDiv.innerHTML = htmlInsights;
          aiInsightsResultDiv.classList.remove('hidden'); 
      }
  } catch (error) {
      console.error('Failed to get AI insights:', error);
      aiInsightsResultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
      aiInsightsResultDiv.classList.remove('hidden');
  } finally {

      getAiInsightsButton.disabled = false;
      getAiInsightsButton.classList.remove('loading');
      buttonText.style.opacity = '1';
      spinner.style.opacity = '0';
      setTimeout(() => spinner.classList.add('hidden'), 200);
  }
});
  // --- Event Listeners ---
  document.querySelectorAll('.nav-button').forEach(button => {
      button.addEventListener('click', handleNavClick);
  });
  const dashboardPage = document.getElementById('dashboard');
if (dashboardPage) {
  dashboardPage.addEventListener('click', (e) => {
      const xpButton = e.target.closest('.btn[data-xp]'); // Find any button that has a 'data-xp' attribute
      if (xpButton) {
          const xpToAdd = parseInt(xpButton.dataset.xp, 10);
          createParticleExplosion(xpButton, xpToAdd);
          addXP(xpToAdd);
      }
  });
}


logList.addEventListener('click', (e) => {
 
  const editButton = e.target.closest('.edit-log-button');
  
  if (editButton) {
      
      const logEntryElement = editButton.closest('.log-entry');
      if (logEntryElement) {
          openEditModal(logEntryElement.dataset.logId);
      }
  }
});
  editForm.addEventListener('submit', (e) => { e.preventDefault(); const entryToUpdate = state.log.find(entry => entry.timestamp === state.currentlyEditingLogId); if (entryToUpdate) { entryToUpdate.description = editDescriptionInput.value; entryToUpdate.confidence = editConfidenceInput.value; } saveState(); renderLog(); closeEditModal(); });
  cancelEditButton.addEventListener('click', closeEditModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) { closeEditModal(); } });

const powerupContainer =
document.getElementById('powerup-area');
if(powerupContainer) {
    powerupContainer.addEventListener('click', (e) => {
        const powerupButton = e.target.closest('.powerup-button');
        if (powerupButton) {
            const itemId = powerupButton.dataset.itemId;
            usePowerup(itemId);
        }
    });
}
const questContainer = document.getElementById('quest-area');
if (questContainer) {
    questContainer.addEventListener('click', (e) => {
        const claimButton = e.target.closest('.quest-claim-button');
        if (claimButton && !claimButton.disabled) {
            const questId = claimButton.dataset.questId;
            const quest = state.activeQuests.find(q => q.id === questId);
            if (quest && !quest.claimed) {
                quest.claimed = true; 
                state.xp += quest.reward.xp;
                state.coins += quest.reward.coins;
                showNotification(`Reward claimed: +${quest.reward.xp} XP & ${quest.reward.coins} Coins!`);
                
                createParticleExplosion(claimButton, quest.reward.xp);
                
                saveState();
                renderQuests(); 
                xpDisplay.innerText = state.xp.toLocaleString();
                coinsDisplay.innerText = state.coins.toLocaleString();
            }
        }
    });
}


const shopListContainer = document.getElementById('shop-item-list');
if (shopListContainer) {
    shopListContainer.addEventListener('click', (e) => {
        const buyButton = e.target.closest('.btn'); 
        if (!buyButton || buyButton.disabled) return;

        const bountyId = buyButton.dataset.bountyId;
        const itemId = buyButton.dataset.itemId;

        if (bountyId) {

            buyBounty(bountyId);
        } else if (itemId) {

            buyItem(itemId);
        }
    });
}


  aiLogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const description = document.getElementById('ai-log-description').value;
      const buttonText = aiLogButton.querySelector('.button-text');
      const spinner = aiLogButton.querySelector('.spinner');
  
      // --- Start Loading Animation ---
      aiLogButton.disabled = true;
      aiLogButton.classList.add('loading'); // Add the pulsing animation class
      buttonText.style.opacity = '0'; // Fade out the text
      spinner.classList.remove('hidden');
      spinner.style.opacity = '1'; // Fade in the spinner
  
      try {
          const response = await fetch('/api/generateXP', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description })
          });
  
          if (!response.ok) { throw new Error('Network response was not ok'); }
  
          const data = await response.json();
          tempAiSuggestion = data;
  
          aiSuggestedXp.innerText = data.xp;
          aiJustification.innerText = data.justification;
          aiResultsDiv.classList.remove('hidden');
  
      } catch (error) {
          console.error('Failed to fetch AI suggestion:', error);
          alert('Could not get an AI suggestion. Please try again.');
      } finally {
          // --- End Loading Animation ---
          aiLogButton.disabled = false;
          aiLogButton.classList.remove('loading'); 
          buttonText.style.opacity = '1'; 
          spinner.style.opacity = '0'; 
          setTimeout(() => spinner.classList.add('hidden'), 200); 
      }
  });

  const themeSelectorContainer = document.getElementById('theme-selector-area');
  if (themeSelectorContainer) {
      themeSelectorContainer.addEventListener('click', (e) => {
          const themeButton = e.target.closest('.btn');
          if (themeButton && themeButton.dataset.theme) {
              const theme = themeButton.dataset.theme;
              applyTheme(theme);
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

function applyTheme(theme) { 
  if (theme === 'dark') {
      document.documentElement.classList.add('dark');
  } else {
      document.documentElement.classList.remove('dark');
  }
  state.activeTheme = theme;
  saveState();
}
function renderThemeSelector() {
    const selectorList = document.getElementById('theme-selector-list');
    if (!selectorList) return;
  
    selectorList.innerHTML = ''; 
  
    const defaultButton = document.createElement('button');
    defaultButton.className = 'btn btn-secondary active'; 
    defaultButton.innerText = 'Default';
    defaultButton.disabled = true;
    selectorList.appendChild(defaultButton);
  }


  const ownedThemes = state.inventory
      .map(itemId => shopItems.find(item => item.id === itemId && item.type === 'theme'))
      .filter(item => item);


  ownedThemes.forEach(theme => {
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.innerText = theme.name;
      button.dataset.themeId = theme.id;

      if (state.activeTheme === theme.id) {
          button.classList.add('active');
      }
      selectorList.appendChild(button);
  });


function updateActiveTimers() {
    const container = document.getElementById('active-powerup-timers');
    if (!container) return;

    const now = new Date().getTime();


    let bountyFailed = false;
    state.activeBounties.forEach(bounty => {
        if (now > bounty.expiresAt) {
            bountyFailed = true;
            const bountyInfo = shopItems.find(i => i.id === bounty.id);
            state.xp += bountyInfo.failureReward.xp;
            state.coins += bountyInfo.failureReward.coins; 
            showNotification(`Bounty Failed: +${bountyInfo.failureReward.xp} XP & ${bountyInfo.failureReward.coins} 🪙`);
            xpDisplay.innerText = state.xp.toLocaleString();
            coinsDisplay.innerText = state.coins.toLocaleString();
        }
    });
    
    if (bountyFailed) {
        state.activeBounties = state.activeBounties.filter(b => b.expiresAt > now);
        saveState();
    }

    let activeTimers = [];


    state.activePowerups.forEach(p => activeTimers.push({ ...p, type: 'powerup' }));
    

    state.activeBounties.forEach(b => {
        const bountyInfo = shopItems.find(i => i.id === b.id);
        activeTimers.push({ 
            ...b, 
            type: 'bounty',
            displayName: bountyInfo?.name || 'Unknown Bounty',
            progress: b.progress,
            target: b.goal.target
        });
    });

    container.innerHTML = ''; 

    activeTimers.forEach(timerItem => {
        const timeLeft = timerItem.expiresAt - now;

        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const timerEl = document.createElement('div');
            timerEl.className = 'timer-capsule';

            let displayContent;
            if (timerItem.type === 'bounty') {
                displayContent = `
                    <div class="bounty-timer-content">
                        <span>${timerItem.displayName}</span>
                        <span class="bounty-progress">${timerItem.progress}/${timerItem.target}</span>
                        <span class="timer-display">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                    </div>
                `;
            } else {
                const itemName = shopItems.find(i => i.id === timerItem.id)?.name || 'Unknown Item';
                displayContent = `
                    <span>${itemName}</span>
                    <span>${minutes}:${seconds.toString().padStart(2, '0')}</span>
                `;
            }

            timerEl.innerHTML = displayContent;
            
            if (timeLeft < 10000) {
                timerEl.classList.add('expiring');
            }
            
            container.appendChild(timerEl);
        }
    });
}
function renderPowerups() {
    const powerupList = document.getElementById('powerup-list');

    if(!powerupList) return;
    powerupList.innerHTML = '';

    const ownedPowerups = state.inventory
    .map(itemId => shopItems.find(item => item.id ===
        itemId && item.type === 'powerup'))
        .filter(item => item);
    
        if(ownedPowerups.length === 0) {
            powerupList.innerHTML = '<p class="empty-state-text">No power-ups in inventory. Visit the shop!</p>';
        return;
    }
        ownedPowerups.forEach(powerup => {
        const button = document.createElement('button');
        button.className = 'powerup-button';
        button.dataset.itemId = powerup.id;
        button.innerHTML = `Use <span>${powerup.name}</span>`;
        powerupList.appendChild(button);
    });
}
function usePowerup(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;

  
  state.inventory = state.inventory.filter(id => id !== itemId);

  
  const expirationTime = new Date().getTime() + item.duration * 60 * 1000;
  state.activePowerups.push({
      id: item.id,
      expiresAt: expirationTime
  });

  showNotification(`Activated: ${item.name}`);

  saveState();
  renderPowerups();
}
function rejectAiSuggestion() {
  aiResultsDiv.style.display = 'none';
  aiLogForm.reset();
  

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
          
              document.getElementById('image-preview-box').classList.remove('hidden');
              document.getElementById('image-analysis-form').classList.remove('hidden');
          
          } catch (error) {
              console.error('Image processing failed:', error);
              alert('There was an error processing your image. Please try a different one.');
          }
      }
  });analyzeImageButton.addEventListener('click', async () => {
      if (!uploadedImageBase64) {
          alert('Please select an image first.');
          return;
      }
  
      const contextText = document.getElementById('image-context-text').value;
  
      console.log("--- Starting Image Analysis ---");
      console.log("Sending request to /api/analyzeImage...");
  
      analyzeImageButton.disabled = true;
      analyzeImageButton.innerText = "Analyzing...";
  
      try {
          const response = await fetch('/api/analyzeImage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: uploadedImageBase64, text: contextText }),
          });
  
          console.log("Received response from server.");
          console.log("Status Code:", response.status, response.statusText);
  
          const rawText = await response.text();
          console.log("RAW RESPONSE TEXT FROM SERVER:", rawText);
         
          try {
              const data = JSON.parse(rawText);
              console.log("SUCCESSFULLY PARSED JSON:", data);
              
              if (data && typeof data.xp !== 'undefined') {
                  tempAiSuggestion = { ...data, sourceType: 'image' };
                  aiSuggestedXp.innerText = data.xp;
                  aiJustification.innerText = data.justification;
                  
                
                  const imagePreviewBox = document.getElementById('image-preview-box');
                  const imageAnalysisForm = document.getElementById('image-analysis-form');
                  
                  if (imagePreviewBox) {
                      imagePreviewBox.classList.add('hidden');
                  }
                  if (imageAnalysisForm) {
                      imageAnalysisForm.classList.add('hidden');
                  }
                  
                
                  if (aiResultsDiv) {
                      aiResultsDiv.classList.remove('hidden');
                  }
                  updateQuestProgress('log_image', 1);
              } else {
                  throw new Error("Parsed JSON, but it was missing the 'xp' key.");
              }
  
          } catch (jsonError) {
              console.error("FAILED TO PARSE RESPONSE AS JSON:", jsonError);
              alert("The server sent back a response that wasn't valid JSON. Check the console to see the raw text.");
          }
  
      } catch (networkError) {
          console.error('A network error occurred during image analysis:', networkError);
          alert(`A network error occurred: ${networkError.message}`);
      } finally {
          analyzeImageButton.disabled = false;
          analyzeImageButton.innerText = "Analyze Image";
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
      refreshDailyQuests();
      xpDisplay.innerText = state.xp;
      coinsDisplay.innerText = state.coins;
      applyTheme(state.activeTheme || 'dark');
      renderThemeSelector();
      renderPowerups();
      renderQuests();
      renderLog();
      updateProgress();
      setInterval(updatePowerupTimers, 1000);

      if (!localStorage.getItem('mindforge_onboarded')) {
          startOnboarding();

  }
}
  
  init();
});
