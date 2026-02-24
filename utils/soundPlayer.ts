let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;

const createAudioContext = () => {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
    }
};

// This function should be called from a user gesture, like a click or tap.
export const unlockAudio = () => {
    if (!audioContext) createAudioContext();
    if (isAudioUnlocked || !audioContext) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            isAudioUnlocked = true;
            console.log("AudioContext resumed successfully.");
        }).catch(e => console.error("Error resuming AudioContext:", e));
    } else {
        isAudioUnlocked = true;
    }
};

// Create context as soon as the module loads.
createAudioContext();

export const playSuccessSound = () => {
  if (!audioContext) {
    console.warn("AudioContext not available, cannot play sound.");
    return;
  }

  // If audio is not unlocked, we can't play. Try to resume it.
  if (!isAudioUnlocked || audioContext.state !== 'running') {
      audioContext.resume();
  }
  
  if (audioContext.state !== 'running') {
      console.warn(`AudioContext is in a '${audioContext.state}' state. Sound may not play.`);
      return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.05);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};
