import { useCallback, useReducer } from 'react';

const initialState = {
  phase: 'picker',
  emotion: null,
  spaceImage: null,
  currentScene: 0,
  totalScenes: 5,
  scenes: [],
  isGenerating: false,
  error: null,
};

function storyReducer(state, action) {
  switch (action.type) {
    case 'SELECT_EMOTION':
      return { ...state, emotion: action.payload, phase: 'loading' };
    case 'SET_SPACE_IMAGE':
      return { ...state, spaceImage: action.payload };
    case 'START_GENERATION':
      return { ...state, isGenerating: true, error: null, phase: 'loading' };
    case 'SCENE_READY':
      return {
        ...state,
        isGenerating: false,
        phase: 'scene',
        scenes: [...state.scenes, action.payload],
        currentScene: state.scenes.length,
      };
    case 'MAKE_CHOICE':
      return {
        ...state,
        phase: state.currentScene >= state.totalScenes - 1 ? 'loading-end' : 'loading',
        isGenerating: true,
      };
    case 'STORY_ENDED':
      return { ...state, phase: 'ending', isGenerating: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isGenerating: false };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function useStoryEngine() {
  const [state, dispatch] = useReducer(storyReducer, initialState);

  const selectEmotion = useCallback((emotionId) => {
    dispatch({ type: 'SELECT_EMOTION', payload: emotionId });
  }, []);

  const setSpaceImage = useCallback((file) => {
    dispatch({ type: 'SET_SPACE_IMAGE', payload: file });
  }, []);

  const makeChoice = useCallback((choiceIndex) => {
    dispatch({ type: 'MAKE_CHOICE', payload: choiceIndex });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { state, selectEmotion, setSpaceImage, makeChoice, reset, dispatch };
}

export default useStoryEngine;
