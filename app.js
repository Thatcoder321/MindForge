
  // --- Main Application Logic ---
  document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateActiveTimers, 1000);
  let state = {xp:0,coins:0,log:[],inventory: [],
    activeTheme: 'dark', activePowerups: [], currentlyEditingLogId: null,

    activeQuests: [],
    questProgress: {},
    questsLastUpdated: null,

    activeBounties: [],
    chatMessagesRemaining: 5,
    availableBounties: [],
    bounties: [],
    bountyRefreshCooldown: null
  };
  
  const XP_TO_COIN_RATE = 10;

  const shopItems = [
    
      {
          id: 'potion_double_xp',
          name: 'Elixir of Focus (2x XP)',
          description: 'Doubles all XP earned from logging for the next 30 minutes.',
          cost: 50,
          type: 'powerup',
          duration: 30
      },
      {
        id: 'tutor_messages_10',
        type: 'consumable', 
        name: 'AI Tutor: 10 Messages',
        description: 'Refill your chat messages to ask the AI for more help.',
        cost: 5
    }

        
     
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
    const bountyMasterList = [

        { id: 'bounty_log_3', name: 'Bounty: Quick Sprint', description: 'Challenge: Log 3 separate sessions.', cost: 5, timeLimit: 30, goal: { type: 'log_session', target: 3 }, successReward: { xp: 50, coins: 10 }, failureReward: { xp: 10, coins: 2 } },
        { id: 'bounty_log_5', name: 'Bounty: Focused Effort', description: 'Challenge: Log 5 separate sessions.', cost: 10, timeLimit: 60, goal: { type: 'log_session', target: 5 }, successReward: { xp: 120, coins: 25 }, failureReward: { xp: 25, coins: 5 } },
        { id: 'bounty_log_image_1', name: 'Bounty: Visual Proof', description: 'Challenge: Log a session with an image upload.', cost: 8, timeLimit: 20, goal: { type: 'log_image', target: 1 }, successReward: { xp: 75, coins: 15 }, failureReward: { xp: 15, coins: 3 } },
    

        { id: 'bounty_xp_100', name: 'Bounty: XP Dash', description: 'Challenge: Earn 100 XP.', cost: 10, timeLimit: 45, goal: { type: 'earn_xp', target: 100 }, successReward: { xp: 100, coins: 20 }, failureReward: { xp: 20, coins: 4 } },
        { id: 'bounty_xp_250', name: 'Bounty: XP Marathon', description: 'Challenge: Earn 250 XP.', cost: 25, timeLimit: 90, goal: { type: 'earn_xp', target: 250 }, successReward: { xp: 250, coins: 50 }, failureReward: { xp: 50, coins: 10 } },
        { id: 'bounty_xp_75_fast', name: 'Bounty: High-Speed XP', description: 'Challenge: Earn 75 XP in under 15 minutes.', cost: 15, timeLimit: 15, goal: { type: 'earn_xp', target: 75 }, successReward: { xp: 150, coins: 30 }, failureReward: { xp: 30, coins: 6 } },
    
       
        { id: 'bounty_log_geometry', name: 'Bounty: Angle Ace', description: 'Challenge: Log a session with "Geometry" concepts.', cost: 10, timeLimit: 30, goal: { type: 'log_concept', target: 'Geometry Proofs' }, successReward: { xp: 80, coins: 18 }, failureReward: { xp: 15, coins: 3 } },
        { id: 'bounty_log_algebra', name: 'Bounty: Equation Expert', description: 'Challenge: Log a session with "Algebra" concepts.', cost: 10, timeLimit: 30, goal: { type: 'log_concept', target: 'Algebraic Manipulation' }, successReward: { xp: 80, coins: 18 }, failureReward: { xp: 15, coins: 3 } },
    

        { id: 'bounty_log_10', name: 'Bounty: The Gauntlet', description: 'Challenge: Log 10 separate sessions. Not for the faint of heart!', cost: 30, timeLimit: 180, goal: { type: 'log_session', target: 10 }, successReward: { xp: 500, coins: 100 }, failureReward: { xp: 100, coins: 20 } },
        { id: 'bounty_xp_500', name: 'Bounty: Legendary Learner', description: 'Challenge: Earn a massive 500 XP.', cost: 50, timeLimit: 240, goal: { type: 'earn_xp', target: 500 }, successReward: { xp: 600, coins: 150 }, failureReward: { xp: 120, coins: 30 } },
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
  const chatBubble = document.getElementById('chat-bubble');
const chatWindow = document.getElementById('chat-window');
const closeChatButton = document.getElementById('close-chat-button');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessageList = document.getElementById('chat-message-list');
const messageCountEl = document.getElementById('message-count');
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
function openChat() {
    if (chatWindow) chatWindow.classList.remove('hidden');
    if (messageCountEl) messageCountEl.innerText = state.chatMessagesRemaining;
}

function closeChat() {
    if (chatWindow) chatWindow.classList.add('hidden');
}

function addMessageToUI(sender, message) {
    if (!chatMessageList) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`; // Use innerHTML to render line breaks if AI sends them
    chatMessageList.appendChild(messageDiv);
    // Auto-scroll to the bottom
    chatMessageList.scrollTop = chatMessageList.scrollHeight;
}

async function handleSendMessage(event) {
    event.preventDefault();
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    
    if (state.chatMessagesRemaining <= 0) {
        addMessageToUI('ai', "You're out of messages! Visit the Shop to buy more.");
        chatInput.value = '';
        return;
    }

   
    addMessageToUI('user', userMessage);
    chatInput.value = '';

 
    state.chatMessagesRemaining--;
    if (messageCountEl) messageCountEl.innerText = state.chatMessagesRemaining;
    saveState();


    addMessageToUI('ai', "<em>Typing...</em>");

 
    

try {

    const response = await fetch('/api/getTutorResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMessage })
    });

    if (!response.ok) {
        throw new Error("The AI tutor is currently unavailable.");
    }

    const data = await response.json();
    const aiResponse = data.aiResponse;

    if (chatMessageList.lastChild && chatMessageList.lastChild.innerText === "Typing...") {
      chatMessageList.removeChild(chatMessageList.lastChild);
    }
    

    addMessageToUI('ai', aiResponse);

} catch (error) {
    console.error("Error fetching AI tutor response:", error);
    
    if (chatMessageList.lastChild && chatMessageList.lastChild.innerText === "Typing...") {
      chatMessageList.removeChild(chatMessageList.lastChild);
    }
    
    addMessageToUI('ai', `Sorry, I'm having trouble connecting right now. Error: ${error.message}`);
}}
const conceptMap = {
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
    "functions & relations": "Functions & Relations", 
    "function notation": "Functions & Relations", 
    "domain and range": "Functions & Relations", 
    "function transformations": "Functions & Relations", 
    "graphing functions": "Functions & Relations", 
    "logarithmic functions": "Functions & Relations", 
    "exponential functions": "Functions & Relations",
    "calculus techniques": "Calculus Techniques", 
    "derivatives": "Calculus Techniques", 
    "integrals": "Calculus Techniques", 
    "limits": "Calculus Techniques", 
    "chain rule": "Calculus Techniques", 
    "product rule": "Calculus Techniques", 
    "quotient rule": "Calculus Techniques", 
    "optimization": "Calculus Techniques", 
    "related rates": "Calculus Techniques",
    "mathematical reasoning": "Mathematical Reasoning", 
    "logic": "Mathematical Reasoning", 
    "problem solving": "Mathematical Reasoning", 
    "proof writing": "Mathematical Reasoning",
    "statistics & data": "Statistics & Data", 
    "mean": "Statistics & Data", 
    "median": "Statistics & Data", 
    "mode": "Statistics & Data", 
    "probability": "Statistics & Data", 
    "data analysis": "Statistics & Data",
    "number theory": "Number Theory", 
    "prime numbers": "Number Theory", 
    "sequences": "Number Theory", 
    "series": "Number Theory",
};

function normalizeConcept(concept) {
    if (!concept || typeof concept !== 'string') return "Other";
    const key = concept.toLowerCase().trim();
    const normalized = conceptMap[key];
    if (normalized) { 
        return normalized; 
    }
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
    for (const category of standardizedCategories) {
        if (category.toLowerCase() === key) { 
            return category; 
        }
    }
    return "Other";
}
function refreshBounties() {
    console.log("Refreshing bounties...");
    const shuffled = bountyMasterList.sort(() => 0.5 - Math.random());
    

    const activeBountyIds = new Set(state.activeBounties.map(b => b.id));
    const newBounties = [];
    for (const bounty of shuffled) {
        if (!activeBountyIds.has(bounty.id) && newBounties.length < 2) {
            newBounties.push(bounty);
        }
    }

    state.availableBounties = newBounties;

    state.bountyRefreshCooldown = new Date().getTime() + (60 * 60 * 1000); 
    
    saveState();
    renderShop();
}

function payToRefreshBounties() {
    if (state.coins < 10) {
        showNotification("You need 10 🪙 to refresh bounties early.");
        return;
    }
    
    state.coins -= 10;
    coinsDisplay.innerText = state.coins.toLocaleString();
    if (coinsDisplay) {
        coinsDisplay.innerText = state.coins.toLocaleString();
    }
    showNotification("-10 🪙 for an early bounty refresh!");
    
    refreshBounties(); 
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
function updateProgress(typeOfAction, details = {}) {
    let needsUiUpdate = false;


    state.activeQuests.forEach(quest => { /* ... */ });

    
    state.activeBounties.forEach(bounty => {
        
        const bountyInfo = bountyMasterList.find(b => b.id === bounty.id);
        if (!bountyInfo || bounty.completed) return; 

        let progressMade = 0;

  
        if (bounty.goal.type === 'log_concept' && typeOfAction === 'log_session' && details.concepts) {
            const normalizedConcepts = details.concepts.map(c => normalizeConcept(c));
            if (normalizedConcepts.includes(bounty.goal.target)) {
                progressMade = 1;
            }
        } else if (bounty.goal.type === typeOfAction) {
            progressMade = (typeOfAction === 'earn_xp') ? details : 1;
        }

        if (progressMade > 0) {
            bounty.progress += progressMade;
            needsUiUpdate = true;
            console.log(`Bounty progress for ${bountyInfo.name}: ${bounty.progress}/${bountyInfo.goal.target}`);

           
            const targetValue = (bounty.goal.type === 'log_concept') ? 1 : bounty.goal.target;

            if (bounty.progress >= targetValue) {
                console.log("BOUNTY COMPLETED!");
                state.xp += bountyInfo.successReward.xp; 
                state.coins += bountyInfo.successReward.coins; 
                showNotification(`Bounty Complete! +${bountyInfo.successReward.xp} XP & ${bountyInfo.successReward.coins} 🪙`);
                
                bounty.completed = true; 
                
                xpDisplay.innerText = state.xp.toLocaleString();
                coinsDisplay.innerText = state.coins.toLocaleString();
            }
        }
    });

  
    const completedBounties = state.activeBounties.filter(b => b.completed).length > 0;
    if (completedBounties) {
        state.activeBounties = state.activeBounties.filter(b => !b.completed);
    }
    
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

    if (xpDisplay && coinsDisplay) {
        animateValue(xpDisplay, previousXP, state.xp, 800);
        animateValue(coinsDisplay, previousCoins, state.coins, 800);
    } else {
       
    }
    animateValue(xpDisplay, previousXP, state.xp, 800);
    animateValue(coinsDisplay, previousCoins, state.coins, 800);
    

    updateProgress('earn_xp', xpAmount);
    updateProgress('log_session', logEntry); 
    renderLog();
}
  
  // In app.js

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

   
    if (item.type === 'consumable') {
        if (state.coins < item.cost) {
            showNotification("You don't have enough coins!");
            return;
        }
        state.coins -= item.cost;

        if (item.id === 'tutor_messages_10') {
            state.chatMessagesRemaining += 10;
            showNotification("+10 Tutor Messages purchased!");
           
            if (messageCountEl) messageCountEl.innerText = state.chatMessagesRemaining;
        }
    } else if (item.type === 'powerup') {
        if (state.inventory.includes(itemId)) {
            showNotification("You already own this power-up!");
            return;
        }
        if (state.coins < item.cost) {
            showNotification("You don't have enough coins!");
            return;
        }
        state.coins -= item.cost;
        state.inventory.push(item.id);
        renderPowerups();
    }


    saveState();
    renderShop();
    if (coinsDisplay) coinsDisplay.innerText = state.coins.toLocaleString();
}
  function buyBounty(bountyId) {
    const bounty = bountyMasterList.find(i => i.id === bountyId);
    if (!bounty) {
        console.error("Attempted to buy a non-existent bounty:", bountyId);
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

    state.availableBounties = state.availableBounties.filter(b => b.id !== bountyId);

    showNotification(`Bounty Accepted: ${bounty.name}`);
    saveState();
    renderShop();
    updateActiveTimers();
    coinsDisplay.innerText = state.coins.toLocaleString();
    if (coinsDisplay) {
        coinsDisplay.innerText = state.coins.toLocaleString();
    }
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
    const entryToEdit = state.log.find(entry => entry.id === logId);
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
  function clearAiSuggestion() {
   
    aiResultsDiv.classList.add('hidden');
    

    aiLogForm.reset();
    

    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }
    
    imageUploadInput.value = '';
    uploadedImageBase64 = null;
    

    const imageContextText = document.getElementById('image-context-text');
    if (imageContextText) {
        imageContextText.value = '';
    }
    
  
    const imagePreviewBox = document.getElementById('image-preview-box');
    const imageAnalysisForm = document.getElementById('image-analysis-form');
    if (imagePreviewBox) imagePreviewBox.classList.add('hidden');
    if (imageAnalysisForm) imageAnalysisForm.classList.add('hidden');
    
    tempAiSuggestion = null;
    
    console.log('AI suggestion UI has been completely cleared and reset.');
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
          
          renderPowerups();
      } else if (targetPageId === 'log') { 
        renderLog();
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


    const bountyTitle = document.createElement('h3');
    bountyTitle.className = 'shop-category-title';
    bountyTitle.innerText = 'Bounties';
    shopList.appendChild(bountyTitle);

    if (state.availableBounties.length > 0) {
        state.availableBounties.forEach(bounty => {
            const isActive = state.activeBounties.some(ab => ab.id === bounty.id);
            const canAfford = state.coins >= bounty.cost;

            const itemCard = document.createElement('div');
            itemCard.className = 'card flex justify-between items-center';

            let buttonHtml;
            if (isActive) {
                buttonHtml = `<button class="btn btn-secondary" disabled>Active</button>`;
            } else if (!canAfford) {
                buttonHtml = `<button class="btn btn-secondary" disabled>Cost: ${bounty.cost} 🪙</button>`;
            } else {
                buttonHtml = `<button class="btn btn-primary" data-bounty-id="${bounty.id}">Accept (${bounty.cost} 🪙)</button>`;
            }

            itemCard.innerHTML = `
                <div>
                    <h3 class="font-semibold">${bounty.name}</h3>
                    <p class="text-sm text-muted">${bounty.description}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold mb-sm">Reward: ${bounty.successReward.coins} 🪙</p>
                    ${buttonHtml}
                </div>`;
            shopList.appendChild(itemCard);
        });
    } else {

        const cooldownCard = document.createElement('div');
        cooldownCard.className = 'card text-center';
        cooldownCard.id = 'bounty-cooldown-card';
        
        const now = new Date().getTime();
        const timeLeft = state.bountyRefreshCooldown ? state.bountyRefreshCooldown - now : 0;

        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            cooldownCard.innerHTML = `
                <div class="card-body space-y-md">
                    <p class="text-muted">New bounties will be available in:</p>
                    <p class="text-3xl font-bold" id="bounty-cooldown-timer">${minutes}:${seconds.toString().padStart(2, '0')}</p>
                    <button id="pay-to-refresh-btn" class="btn btn-secondary">Pay 10 🪙 to Refresh Now</button>
                </div>`;
        } else {
             cooldownCard.innerHTML = `
                <div class="card-body space-y-md">
                     <p class="text-muted">All bounties completed!</p>
                     <button id="free-refresh-btn" class="btn btn-primary">Get New Bounties</button>
                </div>`;
        }
        shopList.appendChild(cooldownCard);
    }


    const powerupTitle = document.createElement('h3');
    powerupTitle.className = 'shop-category-title';
    powerupTitle.innerText = 'Power-ups';
    shopList.appendChild(powerupTitle);

    shopItems.forEach(item => {
        if(item.type !== 'powerup') return;
        const isOwned = state.inventory.includes(item.id);
        const canAfford = state.coins >= item.cost;
        const itemCard = document.createElement('div');
        itemCard.className = 'card flex justify-between items-center';

        let buttonHtml;
        if(isOwned) {
            buttonHtml = `<button class="btn btn-secondary" disabled>Owned</button>`;
        } else if (!canAfford) {
            buttonHtml = `<button class="btn btn-secondary" disabled>Insufficient Coins</button>`;
        } else {
            buttonHtml = `<button class="btn btn-primary" data-item-id="${item.id}">Buy</button>`;
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
}function updateStatsPage() {
    console.log("=== DEBUGGING STATS PAGE ===");
    console.log("Current state.log:", state.log);
    console.log("Number of log entries:", state.log.length);
  
    const totalSessionsEl = document.getElementById('total-sessions');
    const avgXpEl = document.getElementById('avg-xp');
    const topConceptEl = document.getElementById('top-concept');
    const xpCtx = document.getElementById('xp-by-concept-chart')?.getContext('2d');
    const confidenceCtx = document.getElementById('confidence-chart')?.getContext('2d');
  
    console.log("DOM elements found:", {
      totalSessionsEl: !!totalSessionsEl,
      avgXpEl: !!avgXpEl,
      topConceptEl: !!topConceptEl,
      xpCtx: !!xpCtx,
      confidenceCtx: !!confidenceCtx
    });
  
    if (!totalSessionsEl || !xpCtx || !confidenceCtx) {
        console.error("Missing required DOM elements!");
        return;
    }
  
    const conceptData = {};
    const confidenceData = { high: 0, medium: 0, low: 0, not_picked: 0 };
  
    state.log.forEach(entry => {
        console.log("Processing log entry:", entry);
        
        if (entry.confidence && confidenceData.hasOwnProperty(entry.confidence)) {
            confidenceData[entry.confidence]++;
        }
        
        if (entry.concepts && Array.isArray(entry.concepts) && entry.concepts.length > 0) {
            entry.concepts.forEach(concept => {
                console.log("Processing concept:", concept);
                const normalized = normalizeConcept(concept);
                console.log("Normalized to:", normalized);
                if (!conceptData[normalized]) {
                    conceptData[normalized] = 0;
                }
                conceptData[normalized] += entry.xp || 0;
            });
        }
    });
  
    console.log("Final conceptData:", conceptData);
    console.log("Final confidenceData:", confidenceData);
  
    totalSessionsEl.innerText = state.log.length;
    const avgXp = state.log.length > 0 ? (state.xp / state.log.length).toFixed(0) : 0;
    avgXpEl.innerText = avgXp;
    const topConcept = Object.keys(conceptData).length > 0 ? Object.entries(conceptData).sort((a, b) => b[1] - a[1])[0][0] : 'None';
    topConceptEl.innerText = topConcept;
  
    console.log("Set values:", {
      totalSessions: state.log.length,
      avgXp: avgXp,
      topConcept: topConcept
    });
  
  

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
if (chatBubble) {
    chatBubble.addEventListener('click', openChat);
}
if (closeChatButton) {
    closeChatButton.addEventListener('click', closeChat);
}
if (chatForm) {
    chatForm.addEventListener('submit', handleSendMessage);
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
editForm.addEventListener('submit', (e) => { 
    e.preventDefault(); 
    const entryToUpdate = state.log.find(entry => entry.id === state.currentlyEditingLogId);
    if (entryToUpdate) { 
        entryToUpdate.description = editDescriptionInput.value; 
        entryToUpdate.confidence = editConfidenceInput.value; 
    } 
    saveState(); 
    renderLog(); 
    closeEditModal(); 
});

cancelEditButton.addEventListener('click', closeEditModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) { closeEditModal(); } });

const powerupContainer = document.getElementById('powerup-area');
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
                if (xpDisplay && coinsDisplay) {
                    xpDisplay.innerText = state.xp.toLocaleString();
                    coinsDisplay.innerText = state.coins.toLocaleString();
                }
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
        

        const isPayToRefresh = buyButton.id === 'pay-to-refresh-btn';
        const isFreeRefresh = buyButton.id === 'free-refresh-btn';

        if (bountyId) {
            buyBounty(bountyId);
        } else if (itemId) {
            buyItem(itemId);
        } else if (isPayToRefresh) { 
            payToRefreshBounties();
        } else if (isFreeRefresh) { 
            refreshBounties();
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
          tempAiSuggestion = { ...data, originalDescription: description, sourceType: 'text' }; 

  
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
    if (!tempAiSuggestion) {
        console.error("Accept button clicked, but tempAiSuggestion state is missing.");
        return;
    }

    const description = tempAiSuggestion.sourceType === 'image'
        ? `Analyzed work from uploaded image.`
        : tempAiSuggestion.originalDescription;

    const logData = {
        description: description,
        xp: tempAiSuggestion.xp,
        confidence: 'medium',
        concepts: tempAiSuggestion.concepts || []
    };
    
    if (typeof logData.xp === 'undefined' || !logData.description) {
        alert("Error: Suggestion data is incomplete. Cannot log.");
        return;
    }

    try {

        addXP(logData);
        

        clearAiSuggestion();
        
     
        showNotification(`Successfully logged: ${description}`);
        
        console.log('AI suggestion accepted and UI cleared.');
    } catch (error) {
        console.error('Error processing AI suggestion:', error);
      
        clearAiSuggestion();
        showNotification(`Logged with warning: ${description}`);
    }
});
const themeToggleButton = document.getElementById('theme-toggle-button');


const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
        themeToggleButton.innerHTML = moonIcon;
    } else {
        document.documentElement.classList.remove('light-theme');
        themeToggleButton.innerHTML = sunIcon;
    }
    state.activeTheme = theme; 
    saveState();
}

if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        const newTheme = state.activeTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}


function updateActiveTimers() {
    const container = document.getElementById('active-powerup-timers');
    if (!container) return;

    const now = new Date().getTime();
    let bountyFailed = false;


    state.activeBounties.forEach(bounty => {
        if (now > bounty.expiresAt) {
            bountyFailed = true;
           
            const bountyInfo = bountyMasterList.find(i => i.id === bounty.id); 
            if (bountyInfo) {
                state.xp += bountyInfo.failureReward.xp;
                state.coins += bountyInfo.failureReward.coins;
                showNotification(`Bounty Failed: +${bountyInfo.failureReward.xp} XP & ${bountyInfo.failureReward.coins} 🪙`);
                if (xpDisplay && coinsDisplay) {
                    xpDisplay.innerText = state.xp.toLocaleString();
                    coinsDisplay.innerText = state.coins.toLocaleString();
                }

                xpDisplay.innerText = state.xp.toLocaleString();
                coinsDisplay.innerText = state.coins.toLocaleString();
            }
        }
    });

    if (bountyFailed) {
        state.activeBounties = state.activeBounties.filter(b => b.expiresAt > now);
        saveState();
    }
    

    const activeTimers = [
        ...state.activePowerups,
        ...state.activeBounties
    ].filter(timer => timer.expiresAt > now);

  
    const displayedTimerIds = new Set([...container.children].map(el => el.dataset.timerId));
    const activeTimerIds = new Set(activeTimers.map(t => t.id));


    displayedTimerIds.forEach(id => {
        if (!activeTimerIds.has(id)) {
            const elToRemove = container.querySelector(`[data-timer-id="${id}"]`);
            if (elToRemove) elToRemove.remove();
        }
    });

   
    activeTimers.forEach(timerItem => {
        const timeLeft = timerItem.expiresAt - now;
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        let timerEl = container.querySelector(`[data-timer-id="${timerItem.id}"]`);
        
       
        const itemInfo = bountyMasterList.find(i => i.id === timerItem.id) || shopItems.find(i => i.id === timerItem.id);
        if (!itemInfo) return; 

        if (!timerEl) { 
            timerEl = document.createElement('div');
            timerEl.className = 'timer-capsule';
            timerEl.dataset.timerId = timerItem.id;
            
            let displayContent;
           
            if (itemInfo.goal) { 
                displayContent = `
                    <div class="bounty-timer-content">
                        <span>${itemInfo.name}</span>
                        <span class="bounty-progress" data-role="progress">${timerItem.progress}/${itemInfo.goal.target}</span>
                        <span class="timer-display" data-role="time">${timeString}</span>
                    </div>`;
            } else { 
                displayContent = `
                    <span>${itemInfo.name}</span>
                    <span data-role="time">${timeString}</span>`;
            }
            timerEl.innerHTML = displayContent;
            container.appendChild(timerEl);
        } else { 
            const timeDisplay = timerEl.querySelector('[data-role="time"]');
            if (timeDisplay) timeDisplay.innerText = timeString;

       
            if (timerItem.progress !== undefined && itemInfo.goal) {
                 const progressDisplay = timerEl.querySelector('[data-role="progress"]');
                 if(progressDisplay) progressDisplay.innerText = `${timerItem.progress}/${itemInfo.goal.target}`;
            }
        }

        if (timeLeft < 10000) {
            timerEl.classList.add('expiring');
        } else {
            timerEl.classList.remove('expiring');
        }
    });


    const cooldownTimerEl = document.getElementById('bounty-cooldown-timer');
    if (cooldownTimerEl) {
        const now = new Date().getTime();
        const timeLeft = state.bountyRefreshCooldown ? state.bountyRefreshCooldown - now : 0;
        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            cooldownTimerEl.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            renderShop();
        }
    }
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
    clearAiSuggestion();
    console.log('AI suggestion rejected and UI cleared.');
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
                  const imageDataForQuest = { concepts: data.concepts || [] };
                  updateProgress('log_image', 1, { concepts: data.concepts || [] });
                  if (imagePreviewBox) {
                      imagePreviewBox.classList.add('hidden');
                  }
                  if (imageAnalysisForm) {
                      imageAnalysisForm.classList.add('hidden');
                  }
                  
                
                  if (aiResultsDiv) {
                      aiResultsDiv.classList.remove('hidden');
                  }
                 

                  updateProgress('log_image', 1, { concepts: data.concepts || [] });
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
      if (!state.availableBounties || state.availableBounties.length === 0) {
        if (!state.activeBounties || state.activeBounties.length === 0) {
            refreshBounties();
        }
    }
      refreshDailyQuests();
      xpDisplay.innerText = state.xp;
      coinsDisplay.innerText = state.coins;
      applyTheme(state.activeTheme || 'dark');

      renderPowerups();
      renderQuests();
      renderLog();
      updateProgress();
      setInterval(updateActiveTimers, 1000);

      if (!localStorage.getItem('mindforge_onboarded')) {
          startOnboarding();

  }
}
  
  init();
});
