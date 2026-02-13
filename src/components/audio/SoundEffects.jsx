// Electronic techno sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

export const playSound = {
  // Correct answer - positive beep
  correct: () => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  },

  // Incorrect answer - negative buzz
  incorrect: () => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(250, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  },

  // Click sound
  click: () => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  },

  // Achievement unlocked
  achievement: () => {
    try {
      const now = audioContext.currentTime;
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        gain.gain.setValueAtTime(0.2, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);
        
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.3);
      });
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  },

  // Combo milestone
  combo: () => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  },

  // Victory
  victory: () => {
    try {
      const now = audioContext.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      
      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, now + index * 0.15);
        gain.gain.setValueAtTime(0.2, now + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.4);
        
        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.4);
      });
    } catch (e) {
      console.log('Sound effect error:', e);
    }
  }
};