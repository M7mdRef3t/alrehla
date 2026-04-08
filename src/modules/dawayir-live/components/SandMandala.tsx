'use client';

import { logger } from "@/services/logger";

import { useEffect, useRef, useState, type RefObject } from "react";
import html2canvas from "html2canvas";

type SandMandalaProps = {
  targetRef: RefObject<HTMLElement | null>;
  isActive: boolean;
  onComplete?: () => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  drag: number;
  color: string;
};

export default function SandMandala({ targetRef, isActive, onComplete }: SandMandalaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isActive) return undefined;

    let animationFrame = 0;
    let disposed = false;
    let targetElement: HTMLElement | null = null;

    const restoreTarget = () => {
      if (!targetElement) return;
      targetElement.style.opacity = "";
      targetElement.style.pointerEvents = "";
    };

    const run = async () => {
      targetElement = targetRef.current;
      if (!targetElement) {
        onComplete?.();
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });

      try {
        const capture = await html2canvas(targetElement, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
        });

        if (disposed) return;

        const sourceContext = capture.getContext("2d", { willReadFrequently: true });
        const renderCanvas = canvasRef.current;
        const renderContext = renderCanvas?.getContext("2d");
        if (!sourceContext || !renderCanvas || !renderContext) {
          onComplete?.();
          return;
        }

        renderCanvas.width = capture.width;
        renderCanvas.height = capture.height;

        const imageData = sourceContext.getImageData(0, 0, capture.width, capture.height);
        const particles: Particle[] = [];
        const resolution = 5;

        for (let y = 0; y < capture.height; y += resolution) {
          for (let x = 0; x < capture.width; x += resolution) {
            const index = (y * capture.width + x) * 4;
            const alpha = imageData.data[index + 3];
            if (alpha < 28) continue;

            const red = imageData.data[index];
            const green = imageData.data[index + 1];
            const blue = imageData.data[index + 2];

            particles.push({
              x,
              y,
              vx: Math.random() * 1.4 - 0.4,
              vy: Math.random() * -1.6 - 0.2,
              life: 1,
              decay: Math.random() * 0.02 + 0.008,
              size: Math.random() * 2 + 1.2,
              drag: 0.965,
              color: `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`,
            });
          }
        }

        targetElement.style.opacity = "0";
        targetElement.style.pointerEvents = "none";

        const animate = () => {
          if (disposed) return;

          renderContext.clearRect(0, 0, capture.width, capture.height);
          let aliveCount = 0;

          for (const particle of particles) {
            if (particle.life <= 0) continue;

            particle.vx = particle.vx * particle.drag + 0.26;
            particle.vy = particle.vy * particle.drag - 0.02;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;

            renderContext.globalAlpha = Math.max(0, particle.life);
            renderContext.fillStyle = particle.color;
            renderContext.beginPath();
            renderContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            renderContext.fill();
            aliveCount += 1;
          }

          if (aliveCount > 0) {
            animationFrame = window.requestAnimationFrame(animate);
          } else {
            restoreTarget();
            onComplete?.();
          }
        };

        animate();
      } catch (error) {
        logger.error("SandMandala failed", error);
        restoreTarget();
        onComplete?.();
      }
    };

    void run();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      restoreTarget();
    };
  }, [isActive, onComplete, targetRef]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="sand-mandala-layer"
      style={{ width: dimensions.width || undefined, height: dimensions.height || undefined }}
    />
  );
}
