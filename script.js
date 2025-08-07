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
      this.vx *= 0.98; // Air resistance
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
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      
      ctx.restore();
    }

    isDead() {
      return this.life <= 0;
    }
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
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 4 + 2;
        
        this.particles.push(new Particle(x, y, vx, vy, color, size));
      }

      // Add some random scattered particles
      for (let i = 0; i < Math.floor(20 * intensity); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 3 + 1;
        
        this.particles.push(new Particle(x, y, vx, vy, color, size));
      }
    }

    update() {
      this.particles.forEach(particle => particle.update());
      this.particles = this.particles.filter(particle => !particle.isDead());
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles.forEach(particle => particle.draw(this.ctx));
    }

    animate() {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.animate());
    }
  }

  // Main Application Logic
  document.addEventListener('DOMContentLoaded', () => {
    let state = { xp: 0, coins: 0, log: [] };
    const XP_TO_COIN_RATE = 10;

    // Initialize particle system
    const canvas = document.getElementById('particles-canvas');
    const particleSystem = new ParticleSystem(canvas);

    const xpDisplay = document.getElementById('xp-display');
    const coinsDisplay = document.getElementById('coins-display');
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    const xpButtons = document.querySelector('.xp-button-group');

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

    function renderLog() {
      const logList = document.getElementById('log-list');
      if (!logList) return;
      logList.innerHTML = '';
      state.log.slice().reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'log-entry';
        li.innerHTML = `<span class="description">${entry.description}</span><span class="xp-gain">+${entry.xp} XP</span>`;
        logList.appendChild(li);
      });
    }

    function addXP(amount) {
      const coinsEarned = Math.floor(amount / XP_TO_COIN_RATE);
      state.xp += amount;
      state.coins += coinsEarned;
      state.log.push({
        description: `Logged quick effort`,
        xp: amount,
        timestamp: new Date().toISOString()
      });
      updateDashboard();
      renderLog();
    }

    function handleNavClick(e) {
      const targetButton = e.target.closest('.nav-button');
      if (!targetButton) return;
      const targetPageId = targetButton.dataset.page;
      navButtons.forEach(button => button.classList.remove('active'));
      targetButton.classList.add('active');
      pages.forEach(page => page.classList.toggle('active', page.id === targetPageId));
    }

    function createParticleExplosion(event, buttonElement, xpAmount) {
      const rect = buttonElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate intensity based on XP amount
      const intensity = xpAmount / 25; // Normalize based on max XP button value
      
      particleSystem.createRipple(centerX, centerY, intensity);
    }

    // Event listeners
    document.querySelector('nav').addEventListener('click', handleNavClick);

    xpButtons.addEventListener('click', (e) => {
      const button = e.target.closest('.xp-button');
      if (button) {
        const xpToAdd = parseInt(button.dataset.xp, 10);
        createParticleExplosion(e, button, xpToAdd);
        addXP(xpToAdd);
      }
    });

    function init() {
      const logPage = document.getElementById('log');
      if (logPage && !logPage.querySelector('#log-list')) {
        const ul = document.createElement('ul');
        ul.id = 'log-list';
        logPage.appendChild(ul);
      }
      xpDisplay.innerText = state.xp;
      coinsDisplay.innerText = state.coins;
      renderLog();
    }

    init();
  });