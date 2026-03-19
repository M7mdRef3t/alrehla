import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildTransformationSummary } from '../../utils/transformation.js';

const SCENE_DURATION_MS = 2200;
const OUTRO_DURATION_MS = 1800;
const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const SOCIAL_COVER_SIZE = 1200;

const MOOD_AUDIO = {
  ambient_calm: { freqs: [220, 330], type: 'sine' },
  tense_drone: { freqs: [110, 147], type: 'sawtooth' },
  hopeful_strings: { freqs: [196, 294], type: 'triangle' },
  mysterious_wind: { freqs: [174, 261], type: 'triangle' },
  triumphant_rise: { freqs: [262, 392], type: 'sine' },
};

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function preloadImages(moments) {
  return Promise.all(
    moments.map((moment) => new Promise((resolve) => {
      if (!moment?.imageData) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `data:${moment.imageMimeType || 'image/png'};base64,${moment.imageData}`;
    })),
  );
}

function findLastAvailableImage(images) {
  for (let index = images.length - 1; index >= 0; index -= 1) {
    if (images[index]) return images[index];
  }
  return null;
}

function scheduleMoodBed(ctx, destination, mood, startAt, durationSec) {
  const config = MOOD_AUDIO[mood] || MOOD_AUDIO.ambient_calm;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.03, startAt + 0.25);
  gain.gain.setValueAtTime(0.03, startAt + Math.max(0.4, durationSec - 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);
  gain.connect(destination);

  config.freqs.forEach((freq) => {
    const oscillator = ctx.createOscillator();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(freq, startAt);
    oscillator.connect(gain);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationSec);
  });
}

function drawImageCover(ctx, image, {
  alpha = 1,
  scale = 1,
  frameWidth = WIDTH,
  frameHeight = HEIGHT,
} = {}) {
  if (!image) return;

  const imgRatio = image.width / image.height;
  const targetRatio = frameWidth / frameHeight;
  let drawW;
  let drawH;
  let drawX;
  let drawY;

  if (imgRatio > targetRatio) {
    drawH = frameHeight;
    drawW = frameHeight * imgRatio;
    drawX = (frameWidth - drawW) / 2;
    drawY = 0;
  } else {
    drawW = frameWidth;
    drawH = frameWidth / imgRatio;
    drawX = 0;
    drawY = (frameHeight - drawH) / 2;
  }

  ctx.save();
  ctx.translate(frameWidth / 2, frameHeight / 2);
  ctx.scale(scale, scale);
  ctx.translate(-frameWidth / 2, -frameHeight / 2);
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSceneFrame(ctx, moment, image, sceneIndex, sceneCount, progress, shareMeta) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#06070d');
  gradient.addColorStop(1, '#111826');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawImageCover(ctx, image, {
    alpha: 0.92,
    scale: 1.04 - (progress * 0.04),
  });

  const overlay = ctx.createLinearGradient(0, HEIGHT * 0.45, 0, HEIGHT);
  overlay.addColorStop(0, 'rgba(3, 4, 8, 0)');
  overlay.addColorStop(1, 'rgba(3, 4, 8, 0.92)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, HEIGHT * 0.3, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 20px Outfit, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MARAYA REEL', 80, 70);

  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  ctx.font = '500 18px Outfit, sans-serif';
  ctx.fillText(`${shareMeta.sceneWord} ${sceneIndex + 1}/${sceneCount}`, 80, 105);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 38px Cairo, Outfit, sans-serif';
  const lines = wrapText(ctx, moment?.narration || moment?.narration_ar || '', WIDTH - 160).slice(0, 4);
  let y = HEIGHT - 170;
  for (const line of lines) {
    ctx.fillText(line, 80, y);
    y += 48;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(80, HEIGHT - 64, WIDTH - 160, 6);
  ctx.fillStyle = '#5effb3';
  ctx.fillRect(80, HEIGHT - 64, (WIDTH - 160) * ((sceneIndex + progress) / Math.max(sceneCount, 1)), 6);
}

function drawOutroFrame(ctx, image, shareMeta, endingMessage, progress) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const base = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, '#04050a');
  base.addColorStop(1, '#101828');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawImageCover(ctx, image, {
    alpha: 0.16 + (progress * 0.16),
    scale: 1.08 - (progress * 0.03),
  });

  const halo = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.28, 40, WIDTH / 2, HEIGHT * 0.28, 420);
  halo.addColorStop(0, 'rgba(94, 255, 179, 0.22)');
  halo.addColorStop(0.5, 'rgba(120, 200, 255, 0.12)');
  halo.addColorStop(1, 'rgba(5, 8, 15, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const overlay = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  overlay.addColorStop(0, 'rgba(2, 4, 8, 0.28)');
  overlay.addColorStop(1, 'rgba(2, 4, 8, 0.92)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const fade = Math.min(1, progress * 1.3);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(223, 255, 234, 0.84)';
  ctx.font = '700 18px Outfit, sans-serif';
  ctx.fillText(shareMeta.reelBadge, WIDTH / 2, 112);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px Cairo, Outfit, sans-serif';
  const titleLines = wrapText(ctx, shareMeta.reelTitle, WIDTH - 220).slice(0, 2);
  let titleY = 230;
  for (const line of titleLines) {
    ctx.fillText(line, WIDTH / 2, titleY);
    titleY += 68;
  }

  ctx.fillStyle = 'rgba(223, 255, 234, 0.92)';
  ctx.font = '700 30px Outfit, sans-serif';
  ctx.fillText(shareMeta.transformationLine, WIDTH / 2, titleY + 10);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '500 24px Cairo, Outfit, sans-serif';
  const endingLines = wrapText(ctx, endingMessage || shareMeta.text, WIDTH - 280).slice(0, 3);
  let endingY = titleY + 96;
  for (const line of endingLines) {
    ctx.fillText(line, WIDTH / 2, endingY);
    endingY += 36;
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.56)';
  ctx.font = '500 20px Outfit, sans-serif';
  ctx.fillText(shareMeta.reelPrompt, WIDTH / 2, HEIGHT - 112);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
  ctx.font = '600 20px Outfit, sans-serif';
  ctx.fillText('MARAYA', WIDTH / 2, HEIGHT - 62);

  ctx.restore();
}

async function buildStoryPoster(moments, shareMeta, endingMessage) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const images = await preloadImages(moments);
  const posterHeroImage = findLastAvailableImage(images);

  drawOutroFrame(
    ctx,
    posterHeroImage,
    shareMeta,
    endingMessage,
    1,
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/png');
  });

  if (!blob?.size) {
    throw new Error('Poster export failed.');
  }

  return blob;
}

function drawSocialPosterFrame(ctx, image, shareMeta, endingMessage, progress = 1) {
  const size = SOCIAL_COVER_SIZE;
  const socialBadge = shareMeta.socialBadge || shareMeta.badge || 'SOCIAL COVER';
  const socialTitle = shareMeta.socialTitle || shareMeta.title || 'Carry the shift into the feed.';
  const socialPrompt = shareMeta.socialPrompt || shareMeta.prompt || 'Sized for the share preview, not just the story rail.';
  ctx.clearRect(0, 0, size, size);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#05070d');
  base.addColorStop(1, '#101826');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  drawImageCover(ctx, image, {
    alpha: 0.26 + (progress * 0.16),
    scale: 1.06 - (progress * 0.03),
    frameWidth: size,
    frameHeight: size,
  });

  const halo = ctx.createRadialGradient(size * 0.5, size * 0.2, 80, size * 0.5, size * 0.2, size * 0.6);
  halo.addColorStop(0, 'rgba(94, 255, 179, 0.22)');
  halo.addColorStop(0.5, 'rgba(120, 200, 255, 0.14)');
  halo.addColorStop(1, 'rgba(6, 8, 12, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const overlay = ctx.createLinearGradient(0, 0, 0, size);
  overlay.addColorStop(0, 'rgba(6, 8, 12, 0.14)');
  overlay.addColorStop(0.5, 'rgba(6, 8, 12, 0.42)');
  overlay.addColorStop(1, 'rgba(6, 8, 12, 0.94)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(223, 255, 234, 0.82)';
  ctx.font = '700 24px Outfit, sans-serif';
  ctx.fillText(socialBadge, size / 2, 106);

  ctx.fillStyle = 'rgba(223, 255, 234, 0.92)';
  ctx.font = '700 36px Outfit, sans-serif';
  ctx.fillText(shareMeta.transformationLine, size / 2, 206);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 82px Cairo, Outfit, sans-serif';
  const titleLines = wrapText(ctx, socialTitle, size - 180).slice(0, 2);
  let titleY = 360;
  for (const line of titleLines) {
    ctx.fillText(line, size / 2, titleY);
    titleY += 92;
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = '500 30px Cairo, Outfit, sans-serif';
  const endingLines = wrapText(ctx, endingMessage || shareMeta.text, size - 220).slice(0, 4);
  let endingY = titleY + 48;
  for (const line of endingLines) {
    ctx.fillText(line, size / 2, endingY);
    endingY += 44;
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.fillText(socialPrompt, size / 2, size - 118);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.font = '700 24px Outfit, sans-serif';
  ctx.fillText('MARAYA', size / 2, size - 62);

  ctx.restore();
}

async function buildStorySocialCover(moments, shareMeta, endingMessage) {
  const canvas = document.createElement('canvas');
  canvas.width = SOCIAL_COVER_SIZE;
  canvas.height = SOCIAL_COVER_SIZE;
  const ctx = canvas.getContext('2d');
  const images = await preloadImages(moments);
  const socialHeroImage = findLastAvailableImage(images);

  drawSocialPosterFrame(ctx, socialHeroImage, shareMeta, endingMessage, 1);

  const blob = await new Promise((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/png');
  });

  if (!blob?.size) {
    throw new Error('Social cover export failed.');
  }

  return blob;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is not available in this environment.');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand?.('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Clipboard is not available in this browser.');
  }
}

async function buildStoryReel(moments, shareMeta, endingMessage) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  const captureStream = canvas.captureStream?.(FPS);
  if (!captureStream || typeof MediaRecorder === 'undefined') {
    throw new Error('Story reel export is not supported here.');
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const destination = audioContext.createMediaStreamDestination();
  const totalDurationSec = ((moments.length * SCENE_DURATION_MS) + OUTRO_DURATION_MS) / 1000;
  let cursorSec = audioContext.currentTime;
  for (const moment of moments) {
    scheduleMoodBed(audioContext, destination, moment.audioMood, cursorSec, SCENE_DURATION_MS / 1000);
    cursorSec += SCENE_DURATION_MS / 1000;
  }
  scheduleMoodBed(
    audioContext,
    destination,
    moments[moments.length - 1]?.audioMood || 'ambient_calm',
    cursorSec,
    OUTRO_DURATION_MS / 1000,
  );

  const mediaStream = new MediaStream([
    ...captureStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((candidate) => MediaRecorder.isTypeSupported(candidate)) || 'video/webm';

  const recorder = new MediaRecorder(mediaStream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data?.size) {
      chunks.push(event.data);
    }
  };

  const stopPromise = new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const images = await preloadImages(moments);
  recorder.start();
  await audioContext.resume();

  for (let index = 0; index < moments.length; index += 1) {
    const sceneStart = performance.now();
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      const step = () => {
        const elapsed = performance.now() - sceneStart;
        const progress = Math.min(1, elapsed / SCENE_DURATION_MS);
        drawSceneFrame(ctx, moments[index], images[index], index, moments.length, progress, shareMeta);
        if (progress >= 1) {
          resolve();
          return;
        }
        requestAnimationFrame(step);
      };
      step();
    });
  }

  const outroStart = performance.now();
  await new Promise((resolve) => {
    const step = () => {
      const elapsed = performance.now() - outroStart;
      const progress = Math.min(1, elapsed / OUTRO_DURATION_MS);
      drawOutroFrame(
        ctx,
        findLastAvailableImage(images),
        shareMeta,
        endingMessage,
        progress,
      );
      if (progress >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    step();
  });

  recorder.stop();
  const blob = await stopPromise;
  mediaStream.getTracks().forEach((track) => track.stop());
  await audioContext.close();
  if (!blob.size) {
    throw new Error('The exported reel was empty.');
  }
  return { blob, totalDurationSec };
}

function toFilenameEmotion(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['anxiety', 'confusion', 'nostalgia', 'hope', 'loneliness', 'wonder'].includes(normalized)
    ? normalized
    : 'feeling';
}

function slugifyFilenamePart(value, fallback = 'journey') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');
  return slug || fallback;
}

export function buildJourneyFileStem({ emotionJourney, endingMessage }) {
  const firstEmotion = toFilenameEmotion(emotionJourney?.[0]);
  const lastEmotion = toFilenameEmotion(emotionJourney?.[emotionJourney.length - 1]);
  const summary = slugifyFilenamePart(endingMessage, 'mirror-memory');
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('') + `-${
    String(now.getUTCHours()).padStart(2, '0')
  }${
    String(now.getUTCMinutes()).padStart(2, '0')
  }`;
  return `maraya-${firstEmotion}-to-${lastEmotion}-${summary}-${stamp}`;
}

function buildShareCaption({ summary, endingMessage, uiLanguage }) {
  const closingLine = uiLanguage === 'en'
    ? 'Made in Maraya.'
    : 'أثر طقسي من مرايا.';
  const lines = [
    summary.proofLine,
    summary.transformationLine,
    summary.mythicLine,
    String(endingMessage || '').trim(),
    closingLine,
  ];

  return [...new Set(lines.filter(Boolean))].slice(0, 5).join('\n');
}

export function buildShareMeta({
  endingMessage,
  emotionJourney,
  uiLanguage,
  spaceReading = '',
  spaceMyth = '',
  storyMoments = [],
}) {
  const summary = buildTransformationSummary({
    emotionJourney,
    endingMessage,
    spaceReading,
    spaceMyth,
    storyMoments,
    uiLanguage,
  });
  const fromEmotion = summary.fromLabel;
  const toEmotion = summary.toLabel;
  const transformationLine = summary.transformationLine;
  const caption = buildShareCaption({
    summary,
    endingMessage,
    uiLanguage,
  });

  if (uiLanguage === 'en') {
    return {
      title: `${transformationLine} | Maraya`,
      text: caption,
      sharedMessage: 'Story reel and poster shared.',
      savedMessage: 'Story reel and poster downloaded. Share them anywhere.',
      unsupportedMessage: 'This browser cannot share both files directly, so the reel and poster were downloaded instead.',
      partialShareMessage: 'Story reel shared. Poster downloaded for your thumbnail or post cover.',
      label: 'Share proof as a reel',
      exportingLabel: 'Preparing your reel and poster...',
      helper: 'Creates a short reel plus a proof-forward poster and opens the share sheet when supported.',
      posterLabel: 'Share poster cover',
      posterExportingLabel: 'Preparing your poster cover...',
      posterHelper: 'Keeps a clean proof poster ready for stories, posts, and judge recaps.',
      posterSharedMessage: 'Poster cover shared.',
      posterSavedMessage: 'Poster cover downloaded.',
      posterUnsupportedMessage: 'This browser cannot share the poster directly, so it was downloaded instead.',
      socialLabel: 'Share square social cover',
      socialExportingLabel: 'Preparing your square social cover...',
      socialHelper: 'Creates a square proof card for X, LinkedIn, and feed previews.',
      socialSharedMessage: 'Square social cover shared.',
      socialSavedMessage: 'Square social cover downloaded.',
      socialUnsupportedMessage: 'This browser cannot share the square social cover directly, so it was downloaded instead.',
      unsupportedBrowserMessage: 'This browser cannot record the reel export.',
      fallbackError: 'Export failed.',
      eyebrow: 'Share The Shift',
      headline: summary.proofLine,
      prompt: 'Carry this proof of transformation beyond the ritual.',
      transformationLine,
      caption,
      captionLabel: 'Share Caption',
      captionHelper: 'Copy a proof-first caption that is ready to paste into your post, story, or pitch deck.',
      captionActionLabel: 'Copy caption',
      captionCopiedMessage: 'Share caption copied.',
      captionUnsupportedMessage: 'Copy is not available in this browser.',
      reelBadge: 'MARAYA TRANSFORMATION',
      reelTitle: summary.proofLine,
      reelPrompt: 'Share the shift while it is still warm.',
      posterBadge: 'POSTER COVER',
      posterPrompt: 'Keep a poster-sized proof of the transformation.',
      socialBadge: 'SOCIAL COVER',
      socialTitle: summary.proofLine,
      socialPrompt: 'Sized for the share preview, not just the story rail.',
      sceneWord: 'Scene',
    };
  }

  return {
    title: 'ريل مرايا',
    text: endingMessage
      ? `حوّلت مرايا ${fromEmotion} إلى ${toEmotion}. ${endingMessage}`
      : `حوّلت مرايا ${fromEmotion} إلى ${toEmotion}.`,
    sharedMessage: 'تمت مشاركة الـ Story Reel مع الملصق.',
    savedMessage: 'تم تنزيل الـ Story Reel والملصق. شاركهما أينما تريد.',
    unsupportedMessage: 'هذا المتصفح لا يدعم مشاركة الـ Reel والملصق مباشرة، لذا تم تنزيلهما بدلاً من ذلك.',
    partialShareMessage: 'تمت مشاركة الـ Story Reel، وتنزيل الملصق للمعاينة أو الغلاف.',
    label: 'Share this feeling as a reel',
    exportingLabel: 'نجهز الـ reel والملصق...',
    helper: 'ينشئ reel قصيراً مع ملصق غلاف ويفتح نافذة المشاركة إذا كان المتصفح يدعم ذلك.',
    posterLabel: 'شارك غلاف الملصق',
    posterExportingLabel: 'نجهز غلاف الملصق...',
    posterHelper: 'يُبقي لديك غلافاً عمودياً نظيفاً مناسباً للقصص والمنشورات وملخصات العرض.',
    posterSharedMessage: 'تمت مشاركة غلاف الملصق.',
    posterSavedMessage: 'تم تنزيل غلاف الملصق.',
    posterUnsupportedMessage: 'هذا المتصفح لا يدعم مشاركة الملصق مباشرة، لذا تم تنزيله بدلاً من ذلك.',
    unsupportedBrowserMessage: 'هذا المتصفح لا يدعم تسجيل الـ Reel.',
    fallbackError: 'فشل التصدير.',
    eyebrow: 'شارك التحوّل',
    headline: 'هذه اللحظة تستحق أن تخرج من التطبيق.',
    prompt: 'حوّل هذا الشعور إلى reel قبل أن يبرد أثره.',
    transformationLine,
    reelBadge: 'تحول مرايا',
    reelTitle: 'هذا الشعور غيّر شكله.',
    reelPrompt: 'شاركه ما دام الأثر دافئاً.',
    posterBadge: 'غلاف الملصق',
    posterPrompt: 'احتفظ بصورة عمودية جاهزة لذكرى هذا التحوّل.',
    ...{ title: `ريل مرايا | ${transformationLine}` },
    ...{
      text: caption,
      caption,
      captionLabel: 'نص المشاركة',
      captionHelper: 'انسخ نصًا جاهزًا للنشر يقدّم التحول أولًا في المنشور أو الستوري أو العرض.',
      captionActionLabel: 'انسخ النص',
      captionCopiedMessage: 'تم نسخ نص المشاركة.',
      captionUnsupportedMessage: 'النسخ غير متاح في هذا المتصفح.',
    },
    sceneWord: 'المشهد',
  };
}

export default function StoryReelExport({
  moments = [],
  uiLanguage = 'en',
  endingMessage = '',
  emotionJourney = [],
  spaceReading = '',
  spaceMyth = '',
}) {
  const [exportingKind, setExportingKind] = useState(null);
  const [message, setMessage] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(true);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState('');
  const [socialPreviewUrl, setSocialPreviewUrl] = useState('');
  const buttonRef = useRef(null);
  const isSupported = useMemo(
    () => typeof window !== 'undefined'
      && typeof MediaRecorder !== 'undefined'
      && typeof HTMLCanvasElement !== 'undefined'
      && typeof HTMLCanvasElement.prototype.captureStream === 'function',
    [],
  );
  const rawShareMeta = useMemo(
    () => buildShareMeta({
      endingMessage,
      emotionJourney,
      uiLanguage,
      spaceReading,
      spaceMyth,
      storyMoments: moments,
    }),
    [emotionJourney, endingMessage, moments, spaceMyth, spaceReading, uiLanguage],
  );
  const shareMeta = useMemo(() => {
    if (uiLanguage === 'en') return rawShareMeta;

    return {
      ...rawShareMeta,
      title: 'ريل مرايا',
      text: endingMessage
        ? `حوّلت مرايا ${rawShareMeta.transformationLine.replace(/^من\s+/u, '').replace(/\s+إلى\s+/u, ' إلى ')}. ${endingMessage}`
        : `دليل تحوّل من مرايا: ${rawShareMeta.transformationLine}.`,
      sharedMessage: 'تمت مشاركة الريل وملصق التحوّل.',
      savedMessage: 'تم تنزيل الريل وملصق التحوّل. شاركهما أينما تريد.',
      unsupportedMessage: 'هذا المتصفح لا يدعم مشاركة الريل والملصق مباشرة، لذلك تم تنزيلهما بدلًا من ذلك.',
      partialShareMessage: 'تمت مشاركة الريل، وتم تنزيل الملصق ليبقى كغلاف أو معاينة.',
      label: 'شارك أثر التحوّل كريل',
      exportingLabel: 'نجهز الريل وملصق التحوّل...',
      helper: 'ينشئ ريلًا قصيرًا مع غلاف يثبت التحوّل ويفتح نافذة المشاركة إذا كان المتصفح يدعم ذلك.',
      posterLabel: 'شارك ملصق التحوّل',
      posterExportingLabel: 'نجهز ملصق التحوّل...',
      posterHelper: 'يمنحك غلافًا نظيفًا وجاهزًا للقصص والمنشورات وملخصات العرض.',
      posterSharedMessage: 'تمت مشاركة ملصق التحوّل.',
      posterSavedMessage: 'تم تنزيل ملصق التحوّل.',
      posterUnsupportedMessage: 'هذا المتصفح لا يدعم مشاركة الملصق مباشرة، لذلك تم تنزيله بدلًا من ذلك.',
      socialLabel: 'شارك غلافًا مربعًا للشبكات',
      socialExportingLabel: 'نجهز الغلاف المربع...',
      socialHelper: 'ينشئ بطاقة مربعة مناسبة لخلاصات X وLinkedIn والمعاينات.',
      socialSharedMessage: 'تمت مشاركة الغلاف المربع.',
      socialSavedMessage: 'تم تنزيل الغلاف المربع.',
      socialUnsupportedMessage: 'هذا المتصفح لا يدعم مشاركة الغلاف المربع مباشرة، لذلك تم تنزيله بدلًا من ذلك.',
      unsupportedBrowserMessage: 'هذا المتصفح لا يدعم تسجيل الريل.',
      fallbackError: 'فشل التصدير.',
      eyebrow: 'شارك التحوّل',
      headline: rawShareMeta.headline === 'هذه اللحظة تستحق أن تخرج من التطبيق.'
        ? 'ما دخل الطقس كشعور خرج منه كتحوّل.'
        : rawShareMeta.headline,
      prompt: 'احمل هذا الدليل على التحوّل إلى خارج الطقس.',
      reelBadge: 'تحوّل مرايا',
      reelTitle: 'هذا الشعور صار مرئيًا.',
      reelPrompt: 'شاركه ما دام الأثر دافئًا.',
      posterBadge: 'ملصق التحوّل',
      posterPrompt: 'احتفظ بملصق يثبت هذا التحوّل بحجم جاهز للمشاركة.',
      socialBadge: 'غلاف اجتماعي',
      socialTitle: 'خذ دليل التحوّل إلى الخلاصة.',
      socialPrompt: 'مقاس مخصص للمعاينة الاجتماعية لا لمشهد واحد فقط.',
      ...{ title: `ريل مرايا | ${rawShareMeta.transformationLine}` },
      ...{
        text: rawShareMeta.caption || rawShareMeta.text,
        caption: rawShareMeta.caption || [
          rawShareMeta.headline,
          rawShareMeta.transformationLine,
          endingMessage,
          'أثر طقسي من مرايا.',
        ].filter(Boolean).join('\n'),
        captionLabel: 'نص المشاركة',
        captionHelper: 'انسخ نصًا جاهزًا للنشر يقدّم التحوّل أولًا في المنشور أو الستوري أو العرض.',
        captionActionLabel: 'انسخ النص',
        captionCopiedMessage: 'تم نسخ نص المشاركة.',
        captionUnsupportedMessage: 'النسخ غير متاح في هذا المتصفح.',
        reelTitle: rawShareMeta.headline === 'هذه اللحظة تستحق أن تخرج من التطبيق.'
          ? 'ما دخل الطقس كشعور خرج منه كتحوّل.'
          : rawShareMeta.headline,
        socialTitle: rawShareMeta.headline === 'هذه اللحظة تستحق أن تخرج من التطبيق.'
          ? 'ما دخل الطقس كشعور خرج منه كتحوّل.'
          : rawShareMeta.headline,
      },
      sceneWord: 'المشهد',
    };
  }, [endingMessage, rawShareMeta, uiLanguage]);
  const socialMeta = useMemo(() => ({
    label: shareMeta.socialLabel || 'Share square social cover',
    exportingLabel: shareMeta.socialExportingLabel || 'Preparing your square social cover...',
    helper: shareMeta.socialHelper || 'Creates a square social card for X, LinkedIn, and feed previews.',
    sharedMessage: shareMeta.socialSharedMessage || 'Square social cover shared.',
    savedMessage: shareMeta.socialSavedMessage || 'Square social cover downloaded.',
    unsupportedMessage: shareMeta.socialUnsupportedMessage || 'This browser cannot share the square social cover directly, so it was downloaded instead.',
    badge: shareMeta.socialBadge || 'SOCIAL COVER',
    title: shareMeta.socialTitle || 'Carry the shift into the feed.',
    prompt: shareMeta.socialPrompt || 'Sized for the share preview, not just the story rail.',
  }), [shareMeta]);
  const journeyFileStem = useMemo(
    () => buildJourneyFileStem({ emotionJourney, endingMessage }),
    [emotionJourney, endingMessage],
  );
  const isExporting = exportingKind !== null;
  const lastVisualMoment = useMemo(() => {
    for (let index = moments.length - 1; index >= 0; index -= 1) {
      if (moments[index]?.imageData) return moments[index];
    }
    return null;
  }, [moments]);
  const posterFallbackSrc = useMemo(() => {
    if (!lastVisualMoment?.imageData) return '';
    return `data:${lastVisualMoment.imageMimeType || 'image/png'};base64,${lastVisualMoment.imageData}`;
  }, [lastVisualMoment?.imageData, lastVisualMoment?.imageMimeType]);
  const posterPreviewSrc = posterPreviewUrl || posterFallbackSrc;
  const socialPreviewSrc = socialPreviewUrl || posterPreviewSrc;

  useEffect(() => {
    if (!moments.length) return undefined;
    setIsHighlighted(true);
    buttonRef.current?.focus?.({ preventScroll: true });
    const timer = window.setTimeout(() => {
      setIsHighlighted(false);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [endingMessage, moments.length]);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!moments.length) {
      setPosterPreviewUrl('');
      return undefined;
    }

    buildStoryPoster(moments, shareMeta, endingMessage)
      .then((blob) => {
        if (!active || !blob?.size) return;
        objectUrl = URL.createObjectURL(blob);
        setPosterPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setPosterPreviewUrl('');
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [endingMessage, moments, shareMeta]);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!moments.length) {
      setSocialPreviewUrl('');
      return undefined;
    }

    buildStorySocialCover(moments, { ...shareMeta, ...socialMeta }, endingMessage)
      .then((blob) => {
        if (!active || !blob?.size) return;
        objectUrl = URL.createObjectURL(blob);
        setSocialPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setSocialPreviewUrl('');
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [endingMessage, moments, shareMeta, socialMeta]);

  const handleShare = useCallback(async () => {
    if (!moments.length || isExporting) return;
    setExportingKind('reel');
    setMessage('');

    try {
      const { blob } = await buildStoryReel(moments, shareMeta, endingMessage);
      const posterBlob = await buildStoryPoster(moments, shareMeta, endingMessage);
      const reelFilename = `${journeyFileStem}-reel.webm`;
      const posterFilename = `${journeyFileStem}-poster.png`;
      const reelFile = new File([blob], reelFilename, { type: blob.type || 'video/webm' });
      const posterFile = new File([posterBlob], posterFilename, { type: 'image/png' });
      const shareFiles = [reelFile, posterFile];

      const canShareBoth = typeof navigator !== 'undefined'
        && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: shareFiles });

      const canShareReelOnly = typeof navigator !== 'undefined'
        && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [reelFile] });

      if (canShareBoth) {
        await navigator.share({
          title: shareMeta.title,
          text: shareMeta.text,
          files: shareFiles,
        });
        setMessage(shareMeta.sharedMessage);
      } else if (canShareReelOnly) {
        await navigator.share({
          title: shareMeta.title,
          text: shareMeta.text,
          files: [reelFile],
        });
        downloadBlob(posterBlob, posterFilename);
        setMessage(shareMeta.partialShareMessage);
      } else {
        downloadBlob(blob, reelFilename);
        downloadBlob(posterBlob, posterFilename);
        setMessage(
          typeof navigator !== 'undefined' && typeof navigator.share === 'function'
            ? shareMeta.unsupportedMessage
            : shareMeta.savedMessage,
        );
      }
    } catch (error) {
      setMessage(error.message || shareMeta.fallbackError);
    } finally {
      setExportingKind(null);
    }
  }, [endingMessage, isExporting, journeyFileStem, moments, shareMeta]);

  const handleSocialShare = useCallback(async () => {
    if (!moments.length || isExporting) return;
    setExportingKind('social');
    setMessage('');

    try {
      const socialBlob = await buildStorySocialCover(moments, { ...shareMeta, ...socialMeta }, endingMessage);
      const socialFilename = `${journeyFileStem}-social-cover.png`;
      const socialFile = new File([socialBlob], socialFilename, { type: 'image/png' });

      const canShareSocial = typeof navigator !== 'undefined'
        && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [socialFile] });

      if (canShareSocial) {
        await navigator.share({
          title: shareMeta.title,
          text: shareMeta.text,
          files: [socialFile],
        });
        setMessage(socialMeta.sharedMessage);
      } else {
        downloadBlob(socialBlob, socialFilename);
        setMessage(
          typeof navigator !== 'undefined' && typeof navigator.share === 'function'
            ? socialMeta.unsupportedMessage
            : socialMeta.savedMessage,
        );
      }
    } catch (error) {
      setMessage(error.message || shareMeta.fallbackError);
    } finally {
      setExportingKind(null);
    }
  }, [endingMessage, isExporting, journeyFileStem, moments, shareMeta, socialMeta]);

  const handlePosterShare = useCallback(async () => {
    if (!moments.length || isExporting) return;
    setExportingKind('poster');
    setMessage('');

    try {
      const posterBlob = await buildStoryPoster(moments, shareMeta, endingMessage);
      const posterFilename = `${journeyFileStem}-poster.png`;
      const posterFile = new File([posterBlob], posterFilename, { type: 'image/png' });

      const canSharePoster = typeof navigator !== 'undefined'
        && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [posterFile] });

      if (canSharePoster) {
        await navigator.share({
          title: shareMeta.title,
          text: shareMeta.text,
          files: [posterFile],
        });
        setMessage(shareMeta.posterSharedMessage);
      } else {
        downloadBlob(posterBlob, posterFilename);
        setMessage(
          typeof navigator !== 'undefined' && typeof navigator.share === 'function'
            ? shareMeta.posterUnsupportedMessage
            : shareMeta.posterSavedMessage,
        );
      }
    } catch (error) {
      setMessage(error.message || shareMeta.fallbackError);
    } finally {
      setExportingKind(null);
    }
  }, [endingMessage, isExporting, journeyFileStem, moments, shareMeta]);

  const handleCopyCaption = useCallback(async () => {
    const nextCaption = String(shareMeta.caption || shareMeta.text || '').trim();
    if (!nextCaption || isExporting) return;

    try {
      await copyTextToClipboard(nextCaption);
      setMessage(shareMeta.captionCopiedMessage || 'Share caption copied.');
    } catch (error) {
      setMessage(error.message || shareMeta.captionUnsupportedMessage || 'Copy is not available in this browser.');
    }
  }, [isExporting, shareMeta]);

  if (!moments.length) return null;

  const reelLabel = exportingKind === 'reel' ? shareMeta.exportingLabel : shareMeta.label;
  const posterLabel = exportingKind === 'poster' ? shareMeta.posterExportingLabel : shareMeta.posterLabel;
  const socialLabel = exportingKind === 'social' ? socialMeta.exportingLabel : socialMeta.label;
  const captionActionLabel = shareMeta.captionActionLabel || (uiLanguage === 'en' ? 'Copy caption' : 'انسخ النص');

  return (
    <div className="story-reel-export">
      <div className="story-reel-export__intro">
        <p className="story-reel-export__eyebrow">{shareMeta.eyebrow}</p>
        <h3 className="story-reel-export__headline">{shareMeta.headline}</h3>
        <p className="story-reel-export__transformation">{shareMeta.transformationLine}</p>
        <p className="story-reel-export__prompt">{shareMeta.prompt}</p>
      </div>

      <div className="story-reel-export__rail">
        <div className="story-reel-export__preview-grid">
          <article
            className="story-reel-export__poster"
            style={posterPreviewSrc ? { '--story-poster-image': `url("${posterPreviewSrc}")` } : undefined}
            aria-label={shareMeta.posterPrompt}
          >
            <div className="story-reel-export__poster-overlay" />
            <div className="story-reel-export__poster-content">
              <p className="story-reel-export__poster-badge">{shareMeta.posterBadge}</p>
              <p className="story-reel-export__poster-shift">{shareMeta.transformationLine}</p>
              <p className="story-reel-export__poster-title">{shareMeta.reelTitle}</p>
              <p className="story-reel-export__poster-caption">{shareMeta.posterPrompt}</p>
            </div>
          </article>

          <article
            className="story-reel-export__poster story-reel-export__poster--social"
            style={socialPreviewSrc ? { '--story-poster-image': `url("${socialPreviewSrc}")` } : undefined}
            aria-label={socialMeta.prompt}
          >
            <div className="story-reel-export__poster-overlay" />
            <div className="story-reel-export__poster-content">
              <p className="story-reel-export__poster-badge">{socialMeta.badge}</p>
              <p className="story-reel-export__poster-shift">{shareMeta.transformationLine}</p>
              <p className="story-reel-export__poster-title">{socialMeta.title}</p>
              <p className="story-reel-export__poster-caption">{socialMeta.prompt}</p>
            </div>
          </article>
        </div>

        <div className="story-reel-export__actions">
          <button
            ref={buttonRef}
            type="button"
            className={`story-reel-export__button story-reel-export__button--primary ${isHighlighted ? 'story-reel-export__button--pulse' : ''}`}
            onClick={handleShare}
            disabled={!isSupported || isExporting}
          >
            {reelLabel}
          </button>
          <button
            type="button"
            className="story-reel-export__button story-reel-export__button--secondary"
            onClick={handlePosterShare}
            disabled={isExporting}
          >
            {posterLabel}
          </button>
          <button
            type="button"
            className="story-reel-export__button story-reel-export__button--secondary"
            onClick={handleSocialShare}
            disabled={isExporting}
          >
            {socialLabel}
          </button>
          <p className="story-reel-export__helper">{shareMeta.helper}</p>
          <p className="story-reel-export__helper story-reel-export__helper--secondary">
            {shareMeta.posterHelper}
          </p>
          <p className="story-reel-export__helper story-reel-export__helper--secondary">
            {socialMeta.helper}
          </p>
          <div className="story-reel-export__caption-card">
            <div className="story-reel-export__caption-head">
              <p className="story-reel-export__caption-label">{shareMeta.captionLabel}</p>
              <button
                type="button"
                className="story-reel-export__button story-reel-export__button--tertiary"
                onClick={handleCopyCaption}
                disabled={isExporting}
              >
                {captionActionLabel}
              </button>
            </div>
            <p className="story-reel-export__caption-text">{shareMeta.caption}</p>
          </div>
          <p className="story-reel-export__helper story-reel-export__helper--secondary">
            {shareMeta.captionHelper}
          </p>
        </div>
      </div>

      {message && <p className="story-reel-export__message">{message}</p>}
      {!isSupported && (
        <p className="story-reel-export__message">
          {shareMeta.unsupportedBrowserMessage}
        </p>
      )}
    </div>
  );
}
