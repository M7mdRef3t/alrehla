import { useRef, useCallback, useEffect } from 'react';
import { AudioMoodManager } from '../utils/AudioMoodManager.js';

/**
 * Audio mood crossfade system.
 * Manages ambient background audio that changes based on story mood.
 */

export default function useAudioMood() {
  const managerRef = useRef(new AudioMoodManager());

  // Unlock audio context on first user interaction
  const unlock = useCallback(() => {
    managerRef.current.unlock();
  }, []);

  // Pre-load an audio file
  const loadMood = useCallback(async (moodId, url) => {
    await managerRef.current.loadMood(moodId, url);
  }, []);

  // Crossfade to a new mood (auto-load if not ready)
  const setMood = useCallback(async (moodId) => {
    await managerRef.current.setMood(moodId);
  }, []);

  // Stop all audio
  const stop = useCallback(() => {
    managerRef.current.stop();
  }, []);

  // Adjust volume
  const setVolume = useCallback((multiplier, duration) => {
    managerRef.current.setVolume(multiplier, duration);
  }, []);

  // Play Duo Sync sound
  const playDuoSyncSound = useCallback(() => {
    managerRef.current.playDuoSyncSound();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager.dispose();
    };
  }, []);

  return { unlock, loadMood, setMood, stop, setVolume, playDuoSyncSound };
}