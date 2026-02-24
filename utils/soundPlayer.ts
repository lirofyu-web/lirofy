let audioContext: AudioContext | null = null;
let successSoundBuffer: AudioBuffer | null = null;

const createAudioContext = () => {
    if (audioContext && audioContext.state !== 'closed') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log(`[SoundPlayer] AudioContext created. Initial state: ${audioContext.state}`);
    } catch (e) {
        console.error("[SoundPlayer] Web Audio API is not supported in this browser.", e);
    }
};

const loadSuccessSound = async () => {
    if (!audioContext) createAudioContext();
    if (!audioContext || successSoundBuffer) return;

    try {
        const response = await fetch('/sounds/success.mp3');
        const arrayBuffer = await response.arrayBuffer();
        successSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("[SoundPlayer] Success sound loaded and decoded.");
    } catch (e) {
        console.error("[SoundPlayer] Error loading or decoding audio file:", e);
    }
};

export const unlockAudio = () => {
    if (!audioContext) createAudioContext();
    if (!audioContext) return;
    
    if (audioContext.state === 'suspended') {
        console.log("[SoundPlayer] AudioContext is suspended. Attempting to resume...");
        audioContext.resume().then(() => {
            console.log(`[SoundPlayer] AudioContext resumed. New state: ${audioContext?.state}`);
            // Load the sound after user interaction
            loadSuccessSound();
        }).catch(e => console.error("[SoundPlayer] Error resuming AudioContext:", e));
    } else {
        // If not suspended, we can probably load the sound right away.
        loadSuccessSound();
    }
};

// Pre-create the context
createAudioContext();

export const playSuccessSound = () => {
  console.log("[SoundPlayer] playSuccessSound called.");
  if (!audioContext || !successSoundBuffer) {
    console.warn("[SoundPlayer] Audio resources not ready. Context or Buffer is null.");
    // Attempt to load the sound again, in case it failed silently.
    if(audioContext && !successSoundBuffer) loadSuccessSound();
    return;
  }
  
  if (audioContext.state !== 'running') {
      console.warn(`[SoundPlayer] AudioContext not running. State: ${audioContext.state}. Cannot play sound.`);
      return;
  }

  try {
    const source = audioContext.createBufferSource();
    source.buffer = successSoundBuffer;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime); // Set volume

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    console.log("[SoundPlayer] Playing sound now.");
    source.start(0);
  } catch(e) {
      console.error("[SoundPlayer] Error during sound playback:", e);
  }
};
