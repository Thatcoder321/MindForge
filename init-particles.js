document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
      
        if (typeof particleSystem !== 'undefined') {
            particleSystem = new ParticleSystem(canvas);
        } else {
            new ParticleSystem(canvas);
        }
    }
});