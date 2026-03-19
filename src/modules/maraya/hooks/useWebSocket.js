import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';

const DUO_ROOM_KEY = 'maraya_duo_room_id';

function getTimeOfDayLabel() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'late night';
}

function getUiCopy(outputMode = 'judge_en') {
  if (outputMode === 'judge_en') {
    return {
      readingSpace: 'Maraya is reading your space...',
      recoveryNotice: 'Maraya stabilized the scene locally so the journey can continue.',
    };
  }

  return {
    readingSpace: 'المرايا تقرأ مكانك بحسٍّ شاعري...',
    recoveryNotice: 'المرايا ثبّتت المشهد محليًا كي تواصل الرحلة.',
  };
}

function buildInterventionPlan(command, intensity) {
  const normalizedCommand = String(command || '').trim();
  const normalizedIntensity = Number.isFinite(Number(intensity)) ? Number(intensity) : 0.8;

  if (!normalizedCommand) {
    return { delayMs: 0, style: 'none', message: '' };
  }

  if (normalizedIntensity >= 0.9) {
    return { delayMs: 1100, style: 'micro_text', message: 'Take a breath before the mirror pivots.' };
  }

  if (normalizedIntensity >= 0.55) {
    return { delayMs: 550, style: 'micro_text', message: 'The mirror is bending toward a new rhythm.' };
  }

  return { delayMs: 0, style: 'none', message: '' };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await readJson(response);
  if (!response.ok || payload.success === false || payload.ok === false) {
    throw new Error(payload.error || payload.reason || `Request failed for ${url}`);
  }

  return payload;
}

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const payload = await readJson(response);
  if (!response.ok || payload.success === false || payload.ok === false) {
    throw new Error(payload.error || `Request failed for ${url}`);
  }
  return payload;
}

function safeLocalStorageRead(key) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
}

function safeLocalStorageWrite(key, value) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(key, value);
    return;
  }
  window.localStorage.removeItem(key);
}

export default function useWebSocket({ query } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const handlersRef = useRef({});
  const channelRef = useRef(null);
  const connectionRef = useRef(false);
  const runtimeRef = useRef({
    userId: String(query?.userId || ''),
    sessionId: String(query?.sessionId || ''),
    roomId: '',
    role: 'solo',
    outputMode: 'judge_en',
    currentEmotion: 'hope',
    currentSceneVersion: 0,
    conversationHistory: [],
    emotionHistory: [],
    journeyScenes: [],
    whisperText: '',
    spaceReading: '',
    mythicReading: '',
    mirrorMemory: null,
    currentScene: null,
    currentSceneImage: null,
    pendingVote: null,
    endingMessage: '',
    secretEndingKey: null,
    advanceKey: '',
  });

  useEffect(() => {
    runtimeRef.current.userId = String(query?.userId || '');
    runtimeRef.current.sessionId = String(query?.sessionId || '');
  }, [query]);

  const emit = useCallback((type, message = {}) => {
    const payload = { type, ...message };
    const handler = handlersRef.current[type];
    if (handler) handler(payload);
    const wildcard = handlersRef.current['*'];
    if (wildcard) wildcard(payload);
  }, []);

  const clearChannel = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
    }
    channelRef.current = null;
  }, []);

  const broadcastRoomEvent = useCallback(async (type, payload = {}) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'room_event',
        payload: {
          type,
          payload,
          senderSessionId: runtimeRef.current.sessionId,
          sentAt: Date.now(),
        },
      });
    } catch (broadcastError) {
      console.error('[maraya] Failed to broadcast room event:', broadcastError);
    }
  }, []);

  const hydrateRoomState = useCallback((roomState, currentSceneVersion) => {
    const runtime = runtimeRef.current;
    if (!roomState || typeof roomState !== 'object') return;

    runtime.conversationHistory = Array.isArray(roomState.conversationHistory) ? roomState.conversationHistory : runtime.conversationHistory;
    runtime.emotionHistory = Array.isArray(roomState.emotionHistory) ? roomState.emotionHistory : runtime.emotionHistory;
    runtime.journeyScenes = Array.isArray(roomState.journeyScenes) ? roomState.journeyScenes : runtime.journeyScenes;
    runtime.whisperText = typeof roomState.whisperText === 'string' ? roomState.whisperText : runtime.whisperText;
    runtime.spaceReading = typeof roomState.spaceReading === 'string' ? roomState.spaceReading : runtime.spaceReading;
    runtime.mythicReading = typeof roomState.mythicReading === 'string' ? roomState.mythicReading : runtime.mythicReading;
    runtime.mirrorMemory = roomState.mirrorMemory ?? runtime.mirrorMemory;
    runtime.currentScene = roomState.currentScene ?? runtime.currentScene;
    runtime.currentSceneImage = roomState.currentSceneImage ?? runtime.currentSceneImage;
    runtime.endingMessage = typeof roomState.endingMessage === 'string' ? roomState.endingMessage : runtime.endingMessage;
    runtime.secretEndingKey = roomState.secretEndingKey || runtime.secretEndingKey;
    runtime.currentSceneVersion = Math.max(runtime.currentSceneVersion, Number(currentSceneVersion || 0));

    if (runtime.mirrorMemory) {
      emit('memory_snapshot', { snapshot: runtime.mirrorMemory });
    }

    if (roomState.whisperInterpretation) {
      emit('whisper_interpreted', {
        v: runtime.currentSceneVersion,
        ...roomState.whisperInterpretation,
      });
    }

    if (runtime.currentScene) {
      emit('scene', {
        v: runtime.currentSceneVersion,
        scene: runtime.currentScene,
      });
    }

    if (runtime.currentSceneImage?.image) {
      emit('scene_image', {
        v: runtime.currentSceneVersion,
        scene_id: runtime.currentSceneImage.sceneId,
        image: runtime.currentSceneImage.image,
        mimeType: runtime.currentSceneImage.mimeType || 'image/png',
      });
    }

    if (runtime.endingMessage) {
      emit('story_complete', {
        v: runtime.currentSceneVersion,
        message: runtime.endingMessage,
      });
    }
  }, [emit]);

  const refreshMemorySnapshot = useCallback(async () => {
    const runtime = runtimeRef.current;
    if (!runtime.userId) return;

    try {
      const payload = await getJson(`/api/maraya/memory?userId=${encodeURIComponent(runtime.userId)}`);
      runtime.mirrorMemory = payload.snapshot || null;
      emit('memory_snapshot', { snapshot: runtime.mirrorMemory });
    } catch (memoryError) {
      console.error('[maraya] Failed to refresh mirror memory:', memoryError);
    }
  }, [emit]);

  const refreshRoomState = useCallback(async (roomId = runtimeRef.current.roomId) => {
    const runtime = runtimeRef.current;
    if (!roomId) return;

    const payload = await postJson('/api/maraya/duo/restore', {
      roomId,
      sessionId: runtime.sessionId,
      anonId: runtime.userId,
    });

    if (!payload.room) {
      runtime.roomId = '';
      runtime.role = 'solo';
      runtime.pendingVote = null;
      safeLocalStorageWrite(DUO_ROOM_KEY, '');
      emit('duo_state', { room: null });
      clearChannel();
      return;
    }

    runtime.roomId = payload.room.roomId || roomId;
    runtime.role = payload.room.role || 'solo';
    runtime.pendingVote = payload.room.votes
      ? {
          sceneId: payload.roomState?.currentScene?.scene_id || '',
          votes: payload.room.votes,
          mismatch: payload.room.mismatch,
          requiredVotes: payload.room.requiredVotes,
          readyCount: payload.room.readyCount,
        }
      : null;
    safeLocalStorageWrite(DUO_ROOM_KEY, runtime.roomId);
    emit('duo_state', { room: payload.room });
    hydrateRoomState(payload.roomState, payload.currentSceneVersion || 0);
  }, [clearChannel, emit, hydrateRoomState]);

  const persistRoomState = useCallback(async () => {
    const runtime = runtimeRef.current;
    if (runtime.role !== 'host' || !runtime.roomId) return;

    const currentSceneChoices = Array.isArray(runtime.currentScene?.choices)
      ? runtime.currentScene.choices.map((choice) => ({
          text_ar: choice.text_ar,
          emotion_shift: choice.emotion_shift,
        }))
      : [];

    const pendingVote = runtime.currentScene && !runtime.currentScene.is_final
      ? {
          sceneId: runtime.currentScene.scene_id,
          choices: currentSceneChoices,
          votes: runtime.pendingVote?.votes || [],
          requiredVotes: runtime.pendingVote?.requiredVotes || 2,
          mismatch: Boolean(runtime.pendingVote?.mismatch),
        }
      : null;

    await postJson('/api/maraya/duo/restore', {
      roomId: runtime.roomId,
      sessionId: runtime.sessionId,
      sceneVersion: runtime.currentSceneVersion,
      currentEmotion: runtime.currentEmotion,
      outputMode: runtime.outputMode,
      storyStarted: Boolean(runtime.currentScene && !runtime.endingMessage),
      pendingVote,
      roomState: {
        conversationHistory: runtime.conversationHistory,
        emotionHistory: runtime.emotionHistory,
        journeyScenes: runtime.journeyScenes,
        currentScene: runtime.currentScene,
        currentSceneImage: runtime.currentSceneImage,
        mirrorMemory: runtime.mirrorMemory,
        whisperText: runtime.whisperText,
        whisperInterpretation: null,
        spaceReading: runtime.spaceReading,
        mythicReading: runtime.mythicReading,
        storyMoments: [],
        transcript: [],
        endingMessage: runtime.endingMessage,
        secretEndingKey: runtime.secretEndingKey,
      },
    });
  }, []);

  const ensureRoomChannel = useCallback(async (roomId) => {
    if (!supabase || !roomId) return;
    const topic = `maraya:room:${roomId}`;

    if (channelRef.current?.topic === topic) return;

    clearChannel();

    const channel = supabase.channel(topic, {
      config: {
        broadcast: { self: false, ack: true },
        presence: { key: runtimeRef.current.sessionId },
      },
    });

    channel
      .on('broadcast', { event: 'room_event' }, async (message) => {
        const incoming = message?.payload || {};
        if (incoming.senderSessionId === runtimeRef.current.sessionId) return;

        switch (incoming.type) {
          case 'refresh_room':
            await refreshRoomState();
            break;
          case 'duo_vote_update': {
            const voteState = incoming.payload || {};
            runtimeRef.current.pendingVote = voteState;
            emit('duo_vote_update', {
              ...voteState,
              selfVoteIndex:
                Array.isArray(voteState.votes)
                  ? voteState.votes.find((vote) => vote.sessionId === runtimeRef.current.sessionId)?.choiceIndex ?? null
                  : null,
            });
            await maybeAdvanceDuoStory(voteState);
            break;
          }
          default:
            emit(incoming.type, incoming.payload || {});
            break;
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              sessionId: runtimeRef.current.sessionId,
              userId: runtimeRef.current.userId,
            });
          } catch {
            // Ignore presence tracking failures.
          }
        }
      });

    channelRef.current = channel;
  }, [clearChannel, emit, refreshRoomState]);

  const emitVoteUpdate = useCallback(async (voteState, shouldBroadcast = false) => {
    const normalized = {
      sceneId: voteState?.sceneId || '',
      votes: Array.isArray(voteState?.votes) ? voteState.votes : [],
      mismatch: Boolean(voteState?.mismatch),
      readyCount: Number(voteState?.readyCount || 0),
      requiredVotes: Number(voteState?.requiredVotes || 2),
      selfVoteIndex:
        Array.isArray(voteState?.votes)
          ? voteState.votes.find((vote) => vote.sessionId === runtimeRef.current.sessionId)?.choiceIndex ?? null
          : null,
    };

    runtimeRef.current.pendingVote = normalized;
    emit('duo_vote_update', normalized);
    if (shouldBroadcast) {
      await broadcastRoomEvent('duo_vote_update', normalized);
    }
  }, [broadcastRoomEvent, emit]);

  const generateSceneImage = useCallback(async (scene, shouldBroadcast = false) => {
    if (!scene?.image_prompt) return;

    try {
      const payload = await postJson('/api/maraya/image/generate', {
        imagePrompt: scene.image_prompt,
        sceneId: scene.scene_id,
      });

      if (!payload.image?.base64) return;

      runtimeRef.current.currentSceneImage = {
        sceneId: scene.scene_id,
        image: payload.image.base64,
        mimeType: payload.image.mimeType || 'image/png',
      };

      emit('scene_image', {
        v: runtimeRef.current.currentSceneVersion,
        scene_id: scene.scene_id,
        image: payload.image.base64,
        mimeType: payload.image.mimeType || 'image/png',
      });

      if (runtimeRef.current.role === 'host') {
        await persistRoomState();
      }

      if (shouldBroadcast) {
        await broadcastRoomEvent('scene_image', {
          v: runtimeRef.current.currentSceneVersion,
          scene_id: scene.scene_id,
          image: payload.image.base64,
          mimeType: payload.image.mimeType || 'image/png',
        });
      }
    } catch (imageError) {
      console.error('[maraya] Image generation failed:', imageError);
    }
  }, [broadcastRoomEvent, emit, persistRoomState]);

  const maybeAdvanceDuoStory = useCallback(async (voteState) => {
    const runtime = runtimeRef.current;
    if (runtime.role !== 'host' || !runtime.currentScene) return;
    if (!voteState || voteState.mismatch || voteState.readyCount < voteState.requiredVotes) return;

    const selectedVote = Array.isArray(voteState.votes) ? voteState.votes[0] : null;
    if (!selectedVote || selectedVote.sceneId !== runtime.currentScene.scene_id) return;

    const advanceKey = `${selectedVote.sceneId}:${selectedVote.choiceIndex}:${voteState.readyCount}`;
    if (runtime.advanceKey === advanceKey) return;
    runtime.advanceKey = advanceKey;

    await postJson('/api/maraya/duo/restore', {
      roomId: runtime.roomId,
      sessionId: runtime.sessionId,
      sceneVersion: runtime.currentSceneVersion,
      currentEmotion: runtime.currentEmotion,
      outputMode: runtime.outputMode,
      storyStarted: true,
      pendingVote: null,
      roomState: {
        conversationHistory: runtime.conversationHistory,
        emotionHistory: runtime.emotionHistory,
        journeyScenes: runtime.journeyScenes,
        currentScene: runtime.currentScene,
        currentSceneImage: runtime.currentSceneImage,
        mirrorMemory: runtime.mirrorMemory,
        whisperText: runtime.whisperText,
        spaceReading: runtime.spaceReading,
        mythicReading: runtime.mythicReading,
        endingMessage: runtime.endingMessage,
        secretEndingKey: runtime.secretEndingKey,
      },
    });

    const payload = await postJson('/api/maraya/story/next', {
      emotion: runtime.currentEmotion,
      outputMode: runtime.outputMode,
      choiceText: selectedVote.choiceText,
      choiceIndex: selectedVote.choiceIndex,
      emotionShift: selectedVote.emotionShift,
      sceneCount: runtime.journeyScenes.length,
      conversationHistory: runtime.conversationHistory,
      timeOfDay: getTimeOfDayLabel(),
      userId: runtime.userId,
      emotionHistory: runtime.emotionHistory,
      journeyScenes: runtime.journeyScenes,
      whisperText: runtime.whisperText,
      spaceReading: runtime.spaceReading,
      mythicReading: runtime.mythicReading,
      duoAlignment: true,
    });

    runtime.currentSceneVersion += 1;
    runtime.currentEmotion = payload.emotion || runtime.currentEmotion;
    runtime.conversationHistory = payload.conversationHistory || runtime.conversationHistory;
    runtime.emotionHistory = Array.isArray(payload.emotionHistory) ? payload.emotionHistory : runtime.emotionHistory;
    runtime.journeyScenes = [...runtime.journeyScenes, ...(Array.isArray(payload.scenes) ? payload.scenes : [])];
    runtime.pendingVote = null;

    if (payload.secretEndingKey) {
      runtime.secretEndingKey = payload.secretEndingKey;
      emit('secret_ending_unlocked', { key: payload.secretEndingKey });
      await broadcastRoomEvent('secret_ending_unlocked', { key: payload.secretEndingKey });
    }

    const scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
    for (const scene of scenes) {
      runtime.currentScene = scene;
      runtime.currentSceneImage = null;
      emit('scene', { v: runtime.currentSceneVersion, scene });
      await broadcastRoomEvent('scene', { v: runtime.currentSceneVersion, scene });
      await persistRoomState();
      await generateSceneImage(scene, true);
    }

    if (payload.isFinal) {
      runtime.endingMessage = payload.endingMessage || '';
      emit('story_complete', {
        v: runtime.currentSceneVersion,
        message: runtime.endingMessage,
      });
      await broadcastRoomEvent('story_complete', {
        v: runtime.currentSceneVersion,
        message: runtime.endingMessage,
      });
      await refreshMemorySnapshot();
      await persistRoomState();
    }
  }, [broadcastRoomEvent, emit, generateSceneImage, persistRoomState, refreshMemorySnapshot]);

  const runStoryStart = useCallback(async (data) => {
    const runtime = runtimeRef.current;
    runtime.currentSceneVersion += 1;
    runtime.outputMode = String(data.output_mode || runtime.outputMode || 'judge_en');
    runtime.whisperText = String(data.whisper_text || '').trim();
    runtime.endingMessage = '';
    runtime.secretEndingKey = null;
    runtime.currentScene = null;
    runtime.currentSceneImage = null;
    runtime.advanceKey = '';
    runtime.pendingVote = null;

    let emotion = String(data.emotion || runtime.currentEmotion || 'hope');

    if (data.image) {
      const copy = getUiCopy(runtime.outputMode);
      emit('status', { v: runtime.currentSceneVersion, text: copy.readingSpace });

      try {
        const analysis = await postJson('/api/maraya/space/analyze', {
          imageBase64: data.image,
          mimeType: data.mimeType || 'image/jpeg',
          outputMode: runtime.outputMode,
        });

        emotion = analysis.detected_emotion || emotion;
        runtime.spaceReading = analysis.space_reading || '';
        runtime.mythicReading = analysis.mythic_reading || runtime.spaceReading;
        emit('space_reading', {
          v: runtime.currentSceneVersion,
          emotion,
          reading: runtime.spaceReading,
          mythicReading: runtime.mythicReading,
        });

        if (runtime.role === 'host') {
          await broadcastRoomEvent('space_reading', {
            v: runtime.currentSceneVersion,
            emotion,
            reading: runtime.spaceReading,
            mythicReading: runtime.mythicReading,
          });
        }
      } catch (analysisError) {
        console.error('[maraya] Space analysis failed:', analysisError);
        emit('notice', { level: 'warning', message: copy.recoveryNotice });
      }
    } else {
      runtime.spaceReading = '';
      runtime.mythicReading = '';
    }

    const payload = await postJson('/api/maraya/story/start', {
      emotion,
      outputMode: runtime.outputMode,
      whisperText: runtime.whisperText,
      userId: runtime.userId,
      sessionId: runtime.sessionId,
      timeOfDay: getTimeOfDayLabel(),
      customContext: data.custom_context || '',
      spaceReading: runtime.spaceReading,
      mythicReading: runtime.mythicReading,
    });

    runtime.currentEmotion = payload.emotion || emotion;
    runtime.conversationHistory = payload.conversationHistory || [];
    runtime.emotionHistory = [runtime.currentEmotion];
    runtime.journeyScenes = Array.isArray(payload.scenes) ? payload.scenes : [];
    runtime.mirrorMemory = payload.memorySnapshot || runtime.mirrorMemory;

    if (payload.memorySnapshot) {
      emit('memory_snapshot', { snapshot: payload.memorySnapshot });
      if (runtime.role === 'host') {
        await broadcastRoomEvent('memory_snapshot', { snapshot: payload.memorySnapshot });
      }
    }

    if (payload.whisperInterpretation) {
      const whisperPayload = {
        v: runtime.currentSceneVersion,
        transcript: runtime.whisperText,
        emotion: payload.whisperInterpretation.inferredEmotion || runtime.currentEmotion,
        confidence: payload.whisperInterpretation.confidence || 0,
      };
      emit('whisper_interpreted', whisperPayload);
      if (runtime.role === 'host') {
        await broadcastRoomEvent('whisper_interpreted', whisperPayload);
      }
    }

    const scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
    for (const scene of scenes) {
      runtime.currentScene = scene;
      emit('scene', { v: runtime.currentSceneVersion, scene });
      if (runtime.role === 'host') {
        await broadcastRoomEvent('scene', { v: runtime.currentSceneVersion, scene });
        await persistRoomState();
      }
      await generateSceneImage(scene, runtime.role === 'host');
    }

    if (scenes.some((scene) => scene?.is_final)) {
      runtime.endingMessage = payload.endingMessage || runtime.endingMessage || '';
      if (runtime.endingMessage) {
        emit('story_complete', {
          v: runtime.currentSceneVersion,
          message: runtime.endingMessage,
        });
        if (runtime.role === 'host') {
          await broadcastRoomEvent('story_complete', {
            v: runtime.currentSceneVersion,
            message: runtime.endingMessage,
          });
        }
      }
      await refreshMemorySnapshot();
      if (runtime.role === 'host') {
        await persistRoomState();
      }
    }
  }, [broadcastRoomEvent, emit, generateSceneImage, persistRoomState, refreshMemorySnapshot]);

  const runStoryNext = useCallback(async (data) => {
    const runtime = runtimeRef.current;
    runtime.currentSceneVersion += 1;
    runtime.outputMode = String(data.output_mode || runtime.outputMode || 'judge_en');
    runtime.advanceKey = '';

    if (data.redirectCommand) {
      const redirectPayload = {
        v: runtime.currentSceneVersion,
        sceneId: runtime.currentScene?.scene_id || '',
        fromIndex: 0,
      };
      emit('redirect_ack', redirectPayload);
      emit('audio_cancel', redirectPayload);
      emit('timeline_reset', redirectPayload);

      if (runtime.role === 'host') {
        await broadcastRoomEvent('redirect_ack', redirectPayload);
        await broadcastRoomEvent('audio_cancel', redirectPayload);
        await broadcastRoomEvent('timeline_reset', redirectPayload);
      }
    }

    const payload = await postJson('/api/maraya/story/next', {
      emotion: runtime.currentEmotion,
      outputMode: runtime.outputMode,
      choiceText: data.choice_text || '',
      choiceIndex: Number(data.choiceIndex || 0),
      emotionShift: data.emotion_shift || runtime.currentEmotion,
      sceneCount: runtime.journeyScenes.length,
      conversationHistory: runtime.conversationHistory,
      timeOfDay: getTimeOfDayLabel(),
      userId: runtime.userId,
      emotionHistory: runtime.emotionHistory,
      journeyScenes: runtime.journeyScenes,
      whisperText: runtime.whisperText,
      spaceReading: runtime.spaceReading,
      mythicReading: runtime.mythicReading,
      redirectCommand: data.redirectCommand || null,
      duoAlignment: Boolean(data.duoAlignment),
    });

    runtime.currentEmotion = payload.emotion || runtime.currentEmotion;
    runtime.conversationHistory = payload.conversationHistory || runtime.conversationHistory;
    runtime.emotionHistory = Array.isArray(payload.emotionHistory) ? payload.emotionHistory : runtime.emotionHistory;
    runtime.journeyScenes = [...runtime.journeyScenes, ...(Array.isArray(payload.scenes) ? payload.scenes : [])];
    runtime.pendingVote = null;

    if (payload.secretEndingKey) {
      runtime.secretEndingKey = payload.secretEndingKey;
      emit('secret_ending_unlocked', { key: payload.secretEndingKey });
      if (runtime.role === 'host') {
        await broadcastRoomEvent('secret_ending_unlocked', { key: payload.secretEndingKey });
      }
    }

    const scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
    for (const scene of scenes) {
      runtime.currentScene = scene;
      runtime.currentSceneImage = null;
      emit('scene', { v: runtime.currentSceneVersion, scene });
      if (runtime.role === 'host') {
        await broadcastRoomEvent('scene', { v: runtime.currentSceneVersion, scene });
        await persistRoomState();
      }
      await generateSceneImage(scene, runtime.role === 'host');
    }

    if (payload.isFinal) {
      runtime.endingMessage = payload.endingMessage || '';
      emit('story_complete', {
        v: runtime.currentSceneVersion,
        message: runtime.endingMessage,
      });

      if (runtime.role === 'host') {
        await broadcastRoomEvent('story_complete', {
          v: runtime.currentSceneVersion,
          message: runtime.endingMessage,
        });
      }

      await refreshMemorySnapshot();
      if (runtime.role === 'host') {
        await persistRoomState();
      }
    }
  }, [broadcastRoomEvent, emit, generateSceneImage, persistRoomState, refreshMemorySnapshot]);

  const connect = useCallback(() => {
    if (connectionRef.current) return;

    connectionRef.current = true;
    setIsConnected(true);
    setError(null);

    void (async () => {
      try {
        await refreshMemorySnapshot();
        const savedRoomId = safeLocalStorageRead(DUO_ROOM_KEY);
        if (savedRoomId) {
          await refreshRoomState(savedRoomId);
          await ensureRoomChannel(savedRoomId);
        }
      } catch (connectError) {
        console.error('[maraya] connect failed:', connectError);
        setError((connectError && connectError.message) || 'Failed to connect to Maraya runtime');
      }
    })();
  }, [ensureRoomChannel, refreshMemorySnapshot, refreshRoomState]);

  const disconnect = useCallback(() => {
    connectionRef.current = false;
    clearChannel();
    setIsConnected(false);
  }, [clearChannel]);

  const sendMessage = useCallback((type, data = {}) => {
    void (async () => {
      try {
        switch (type) {
          case 'start_story':
            await runStoryStart(data);
            break;
          case 'choose':
            await runStoryNext(data);
            break;
          case 'redirect_intent': {
            const plan = buildInterventionPlan(data.command, data.intensity);
            emit('intervention_plan', {
              v: runtimeRef.current.currentSceneVersion,
              plan,
            });
            if (runtimeRef.current.role === 'host') {
              await broadcastRoomEvent('intervention_plan', {
                v: runtimeRef.current.currentSceneVersion,
                plan,
              });
            }
            break;
          }
          case 'redirect_execute':
            await runStoryNext({
              ...data,
              redirectCommand: {
                command: data.command,
                intensity: data.intensity,
              },
            });
            break;
          case 'duo_host': {
            const payload = await postJson('/api/maraya/duo/host', {
              anonId: runtimeRef.current.userId,
              sessionId: runtimeRef.current.sessionId,
              displayName: data.name || safeLocalStorageRead('maraya_display_name') || 'Mirror Guest',
            });
            runtimeRef.current.roomId = payload.room.roomId;
            runtimeRef.current.role = payload.room.role;
            safeLocalStorageWrite(DUO_ROOM_KEY, payload.room.roomId);
            emit('duo_state', { room: payload.room });
            await ensureRoomChannel(payload.room.roomId);
            break;
          }
          case 'duo_join': {
            const payload = await postJson('/api/maraya/duo/join', {
              roomId: data.roomId,
              anonId: runtimeRef.current.userId,
              sessionId: runtimeRef.current.sessionId,
              displayName: data.name || safeLocalStorageRead('maraya_display_name') || 'Mirror Guest',
            });
            runtimeRef.current.roomId = payload.room.roomId;
            runtimeRef.current.role = payload.room.role;
            safeLocalStorageWrite(DUO_ROOM_KEY, payload.room.roomId);
            emit('duo_state', { room: payload.room });
            await ensureRoomChannel(payload.room.roomId);
            await broadcastRoomEvent('refresh_room', {});
            hydrateRoomState(payload.roomState, payload.currentSceneVersion || 0);
            break;
          }
          case 'duo_leave': {
            const roomId = runtimeRef.current.roomId;
            if (!roomId) break;
            const payload = await postJson('/api/maraya/duo/leave', {
              roomId,
              sessionId: runtimeRef.current.sessionId,
            });

            if (payload.closed) {
              await broadcastRoomEvent('duo_closed', {
                v: runtimeRef.current.currentSceneVersion,
                message: payload.message,
              });
              runtimeRef.current.roomId = '';
              runtimeRef.current.role = 'solo';
              runtimeRef.current.pendingVote = null;
              safeLocalStorageWrite(DUO_ROOM_KEY, '');
              clearChannel();
              emit('duo_closed', {
                v: runtimeRef.current.currentSceneVersion,
                message: payload.message,
              });
              emit('duo_state', { room: null });
              break;
            }

            await broadcastRoomEvent('refresh_room', {});
            runtimeRef.current.roomId = '';
            runtimeRef.current.role = 'solo';
            runtimeRef.current.pendingVote = null;
            safeLocalStorageWrite(DUO_ROOM_KEY, '');
            clearChannel();
            emit('duo_state', { room: null });
            emit('notice', { level: 'warning', message: payload.message || '' });
            break;
          }
          case 'duo_vote': {
            const roomId = runtimeRef.current.roomId;
            if (!roomId) break;
            const payload = await postJson('/api/maraya/duo/vote', {
              roomId,
              sessionId: runtimeRef.current.sessionId,
              sceneId: data.sceneId,
              choiceIndex: data.choiceIndex,
              choiceText: data.choice_text,
              emotionShift: data.emotion_shift,
              outputMode: data.output_mode || runtimeRef.current.outputMode,
            });
            await emitVoteUpdate(payload.voteState, true);
            await maybeAdvanceDuoStory(payload.voteState);
            break;
          }
          case 'duo_reset': {
            const roomId = runtimeRef.current.roomId;
            if (!roomId) break;
            const payload = await postJson('/api/maraya/duo/reset', {
              roomId,
              sessionId: runtimeRef.current.sessionId,
            });
            runtimeRef.current.currentScene = null;
            runtimeRef.current.currentSceneImage = null;
            runtimeRef.current.pendingVote = null;
            emit('duo_story_reset', {
              v: runtimeRef.current.currentSceneVersion + 1,
              message: 'The duo journey was reset.',
            });
            emit('duo_state', { room: payload.room });
            await broadcastRoomEvent('duo_story_reset', {
              v: runtimeRef.current.currentSceneVersion + 1,
              message: 'The duo journey was reset.',
            });
            await broadcastRoomEvent('refresh_room', {});
            break;
          }
          default:
            break;
        }
      } catch (sendError) {
        console.error('[maraya] transport error:', sendError);
        const message = (sendError && sendError.message) || 'Maraya request failed';
        setError(message);
        emit('error', {
          v: runtimeRef.current.currentSceneVersion,
          message,
        });
      }
    })();
  }, [
    broadcastRoomEvent,
    clearChannel,
    emit,
    emitVoteUpdate,
    ensureRoomChannel,
    hydrateRoomState,
    maybeAdvanceDuoStory,
    runStoryNext,
    runStoryStart,
  ]);

  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler;
  }, []);

  const off = useCallback((type) => {
    delete handlersRef.current[type];
  }, []);

  useEffect(() => () => {
    disconnect();
  }, [disconnect]);

  return { isConnected, error, connect, disconnect, sendMessage, on, off };
}
