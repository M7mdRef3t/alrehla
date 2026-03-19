import React, { useCallback, useState } from 'react';

/**
 * SceneCardShare — generates a beautiful shareable image card
 * from the current scene using an offscreen canvas, then uses
 * the Web Share API (or fallback download).
 */

function drawCardToCanvas(canvas, { narration, emotionColor, sceneNumber, imageData, mimeType, isCatharsis }) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a14');
    bgGrad.addColorStop(1, '#030305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const drawOverlay = () => {
      // Vignette
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.8);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      // Emotion accent line
      ctx.fillStyle = emotionColor || '#ffd700';
      ctx.fillRect(80, H - 400, 4, 120);

      // Scene number or Catharsis Label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '600 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isCatharsis ? 'THE FINAL CATHARSIS' : `SCENE ${sceneNumber || ''}`, 100, H - 420);

      // Narration text with word wrap
      ctx.fillStyle = isCatharsis ? emotionColor : '#ffffff';
      ctx.font = isCatharsis ? '700 38px sans-serif' : '500 32px sans-serif';
      ctx.textAlign = isCatharsis ? 'center' : 'left';
      const maxWidth = W - 200;
      const lineHeight = isCatharsis ? 56 : 48;
      const textX = isCatharsis ? W / 2 : 100;
      const words = (narration || '').split(' ');
      let line = '';
      let y = H - 360;

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          ctx.fillText(line.trim(), textX, y);
          line = word + ' ';
          y += lineHeight;
          if (y > H - 100) break;
        } else {
          line = testLine;
        }
      }
      if (line.trim() && y <= H - 100) {
        ctx.fillText(line.trim(), textX, y);
      }

      // Maraya branding
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '700 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MARAYA', W / 2, H - 40);

      // Glow dot
      const glowGrad = ctx.createRadialGradient(W / 2, H - 44, 0, W / 2, H - 44, 60);
      glowGrad.addColorStop(0, (emotionColor || '#ffd700') + '30');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(W / 2, H - 44, 60, 0, Math.PI * 2);
      ctx.fill();

      resolve();
    };

    if (imageData) {
      const img = new Image();
      img.onload = () => {
        // Draw image covering top portion
        const imgRatio = img.width / img.height;
        const targetH = H * 0.65;
        let drawW, drawH, drawX, drawY;
        const targetRatio = W / targetH;
        if (imgRatio > targetRatio) {
          drawH = targetH;
          drawW = targetH * imgRatio;
          drawX = (W - drawW) / 2;
          drawY = 0;
        } else {
          drawW = W;
          drawH = W / imgRatio;
          drawX = 0;
          drawY = 0;
        }
        ctx.globalAlpha = 0.85;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.globalAlpha = 1;

        // Fade to black at bottom of image
        const fadeGrad = ctx.createLinearGradient(0, targetH - 200, 0, targetH);
        fadeGrad.addColorStop(0, 'rgba(3,3,5,0)');
        fadeGrad.addColorStop(1, '#030305');
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(0, targetH - 200, W, 200);

        drawOverlay();
      };
      img.onerror = drawOverlay;
      img.src = `data:${mimeType || 'image/png'};base64,${imageData}`;
    } else {
      drawOverlay();
    }
  });
}

export default function SceneCardShare({
  scene,
  sceneNumber,
  emotionColor,
  imageData,
  imageMimeType,
  uiLanguage = 'en',
  isCatharsis = false,
}) {
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const canvas = document.createElement('canvas');
      await drawCardToCanvas(canvas, {
        narration: scene?.narration_ar || '',
        emotionColor,
        sceneNumber,
        imageData,
        mimeType: imageMimeType,
        isCatharsis,
      });

      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const filename = isCatharsis ? 'maraya-catharsis.png' : `maraya-scene-${sceneNumber || 1}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Maraya Story',
          text: uiLanguage === 'en' ? 'A scene from my Maraya journey' : 'مشهد من رحلتي في مرايا',
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[share] Failed:', err);
      }
    } finally {
      setSharing(false);
    }
  }, [scene, sceneNumber, emotionColor, imageData, imageMimeType, uiLanguage, sharing]);

  if (!scene) return null;

  const label = isCatharsis
    ? (uiLanguage === 'en' ? 'Export Catharsis Map' : 'احفظ خريطة المشاعر')
    : (uiLanguage === 'en' ? 'Share Scene' : 'شارك المشهد');

  return (
    <button
      type="button"
      className="scene-card-share-btn"
      onClick={handleShare}
      disabled={sharing}
      aria-label={label}
    >
      <span className="scene-card-share-btn__icon">{sharing ? '...' : '\u{2b06}'}</span>
      <span className="scene-card-share-btn__label">{label}</span>
    </button>
  );
}
