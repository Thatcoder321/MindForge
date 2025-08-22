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
  