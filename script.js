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
    let state = { xp: 0, coins: 0, log: [], currentlyEditingLogId: null };
    const XP_TO_COIN_RATE = 10;
  
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
  
    let uploadedImageBase64 = null;
    let tempAiSuggestion = null;
  
    // --- Helper Functions ---
    function saveState() { 
      // Use in-memory storage instead of localStorage for artifacts
      console.log('State saved to memory:', state);
    }
    
    function loadState() { 
      // Initialize default state since we can't use localStorage in artifacts
      console.log('Loaded default state');
    }
    
    function resizeImage(file, maxSize = 1024) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = function(event) { const img = new Image(); img.onload = function() { let width = img.width; let height = img.height; if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.9)); }; img.onerror = reject; img.src = event.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }
    
    function addXP(data) { const isQuickAdd = typeof data === 'number'; const xpAmount = isQuickAdd ? data : data.xp; const coinsEarned = Math.floor(xpAmount / XP_TO_COIN_RATE); state.xp += xpAmount; state.coins += coinsEarned; const logEntry = { description: isQuickAdd ? 'Logged quick effort' : data.description, xp: xpAmount, confidence: isQuickAdd ? 'not_picked' : data.confidence, concepts: isQuickAdd ? [] : (data.concepts || []), timestamp: new Date().toISOString() + Math.random() }; state.log.push(logEntry); saveState(); updateDashboard(); renderLog(); }
    
    function renderLog() { if (!logList) return; logList.innerHTML = ''; state.log.slice().reverse().forEach(entry => { const li = document.createElement('li'); li.className = 'log-entry'; li.dataset.logId = entry.timestamp; const confidenceText = entry.confidence.charAt(0).toUpperCase() + entry.confidence.slice(1); li.innerHTML = `<div class="log-details"><div class="description">${entry.description}</div><div class="log-entry-details">Confidence: ${confidenceText}</div></div><div class="log-actions"><span class="xp-gain">+${entry.xp} XP</span><button class="edit-log-button">Edit</button></div>`; logList.appendChild(li); }); }
    
    function updateDashboard() { const currentXP = parseInt(xpDisplay.innerText, 10) || 0; const currentCoins = parseInt(coinsDisplay.innerText, 10) || 0; animateValue(xpDisplay, currentXP, state.xp, 500); animateValue(coinsDisplay, currentCoins, state.coins, 500); }
    
    function animateValue(element, start, end, duration) { if (start === end) {element.innerText=end; return}; let startTimestamp = null; const step = (timestamp) => { if (!startTimestamp) startTimestamp = timestamp; const progress = Math.min((timestamp - startTimestamp) / duration, 1); element.innerText = Math.floor(progress * (end - start) + start); if (progress < 1) window.requestAnimationFrame(step); }; window.requestAnimationFrame(step); }
    
    function openEditModal(logId) { const entryToEdit = state.log.find(entry => entry.timestamp === logId); if (!entryToEdit) return; state.currentlyEditingLogId = logId; editDescriptionInput.value = entryToEdit.description; editConfidenceInput.value = entryToEdit.confidence; modalBackdrop.classList.add('visible'); modalContent.classList.add('visible'); }
    
    function closeEditModal() { state.currentlyEditingLogId = null; modalBackdrop.classList.remove('visible'); modalContent.classList.remove('visible'); }
    
    function handleNavClick(e) { const targetButton = e.target.closest('.nav-button'); if (!targetButton) return; const targetPageId = targetButton.dataset.page; navButtons.forEach(button => button.classList.remove('active')); targetButton.classList.add('active'); pages.forEach(page => { page.classList.toggle('active', page.id === targetPageId); }); }
    
    function createParticleExplosion(buttonElement, xpAmount) { const rect = buttonElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const intensity = xpAmount / 25; particleSystem.createRipple(centerX, centerY, intensity); }
  
    // Mock AI response for demo purposes
    function getMockAiResponse(description, isImage = false) {
      // Simple mock logic based on keywords
      let xp = 25;
      let concepts = ['mathematics'];
      
      if (description.toLowerCase().includes('problem') || description.toLowerCase().includes('exercise')) {
        xp = Math.min(45, 15 + Math.random() * 30);
        concepts = ['problem solving'];
      }
      if (description.toLowerCase().includes('understand') || description.toLowerCase().includes('clicked')) {
        xp += 15;
        concepts.push('conceptual understanding');
      }
      if (description.toLowerCase().includes('difficult') || description.toLowerCase().includes('hard')) {
        xp += 10;
      }
      if (isImage) {
        xp = Math.max(xp, 35); // Images typically show more work
      }
      
      return {
        xp: Math.round(xp),
        justification: `Great work! Your effort shows genuine learning progress.`,
        concepts: concepts.slice(0, 3)
      };
    }
  
    // --- Event Listeners ---
    document.querySelector('nav').addEventListener('click', handleNavClick);
    xpButtons.addEventListener('click', (e) => { const button = e.target.closest('.xp-button'); if (button) { const xpToAdd = parseInt(button.dataset.xp, 10); createParticleExplosion(button, xpToAdd); addXP(xpToAdd); } });
    logList.addEventListener('click', (e) => { if (e.target.classList.contains('edit-log-button')) { openEditModal(e.target.closest('.log-entry').dataset.logId); } });
    editForm.addEventListener('submit', (e) => { e.preventDefault(); const entryToUpdate = state.log.find(entry => entry.timestamp === state.currentlyEditingLogId); if (entryToUpdate) { entryToUpdate.description = editDescriptionInput.value; entryToUpdate.confidence = editConfidenceInput.value; } saveState(); renderLog(); closeEditModal(); });
    cancelEditButton.addEventListener('click', closeEditModal);
    modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) { closeEditModal(); } });
  
    aiLogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('ai-log-description').value;
      aiLogButton.disabled = true;
      aiLogButton.querySelector('.button-text').style.display = 'none';
      aiLogButton.querySelector('.spinner').style.display = 'inline-block';
      
      try {
        // Using mock response for demo - replace with actual API call
        const data = getMockAiResponse(description);
        tempAiSuggestion = data;
        aiSuggestedXp.innerText = data.xp;
        aiJustification.innerText = data.justification;
        aiResultsDiv.style.display = 'block';
      } catch (error) { 
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
      
      // Determine the description based on the source type we stored
      const description = tempAiSuggestion.sourceType === 'image'
          ? `Analyzed work from uploaded image.` 
          : document.getElementById('ai-log-description').value;
  
      const logData = {
          description: description,
          xp: tempAiSuggestion.xp,
          confidence: 'medium',
          concepts: tempAiSuggestion.concepts
      };
  
      addXP(logData);
      
      // Call the reject/cancel function to clean up the UI
      rejectAiSuggestion();
    });
  
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
        } catch (error) { 
          console.error('Image resizing failed:', error); 
          alert('There was an error processing your image. Please try a different one.'); 
        }
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
        // Using mock response for demo - replace with actual API call
        const data = getMockAiResponse(contextText || 'Image analysis', true);
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
      renderLog();
    }
    
    init();
  });