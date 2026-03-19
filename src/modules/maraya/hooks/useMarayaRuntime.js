import useStoryLogic from './useStoryLogic.js';

export default function useMarayaRuntime(canvasRef, options = {}) {
  return useStoryLogic(canvasRef, options);
}
