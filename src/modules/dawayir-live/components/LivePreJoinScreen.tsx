"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mic, MicOff, Video, VideoOff, Waves, CheckCircle2, History, Users, GraduationCap, RefreshCw } from "lucide-react";
import type { LiveLanguage } from "../types";
import { runtimeEnv } from "../../../config/runtimeEnv";
import { DEFAULT_WHATSAPP_CONTACT, normalizeWhatsAppPhone } from "../../../components/AppSidebar.utils";

type DeviceState = "idle" | "requesting" | "ready" | "blocked" | "unsupported" | "error";

interface LivePreJoinScreenProps {
  language: LiveLanguage;
  model: string;
  voice: string;
  nodeLabel?: string | null;
  isJoining: boolean;
  onJoinSession: () => void;
  onBackToSetup: () => void;
  onOpenHistory: () => void;
  onOpenCouple: () => void;
  onOpenTeacher: () => void;
}

export default function LivePreJoinScreen({
  language,
  model,
  voice,
  nodeLabel,
  isJoining,
  onJoinSession,
  onBackToSetup,
  onOpenHistory,
  onOpenCouple,
  onOpenTeacher,
}: LivePreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState>("idle");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "prompt" | "denied">("unknown");
  const [soundTestState, setSoundTestState] = useState<"idle" | "playing" | "done">("idle");
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      ar: {
        kicker: "تجهيز قبل الانضمام",
        title: "افحص الكاميرا والصوت قبل دخول الجلسة",
        body: "تأكد من أن صورتك وصوتك جاهزان حتى تبدأ الجلسة بانسيابية وبدون ارتباك.",
        cameraLabel: "الكاميرا",
        micLabel: "الصوت",
        joinNow: "انضم إلى الجلسة",
        back: "العودة للإعداد",
        history: "السجل",
        couple: "جلسة ثنائية",
        teacher: "لوحة المدرب",
        refresh: "إعادة الفحص",
        liveReady: "جاهز للانضمام",
        soundTest: "اختبار الصوت",
        blocked: "لم نحصل على إذن الكاميرا أو الميكروفون بعد.",
        unsupported: "المتصفح الحالي لا يدعم المعاينة المباشرة.",
        permissionGranted: "ممنوح",
        permissionPrompt: "في الانتظار",
        permissionDenied: "مرفوض",
      },
      en: {
        kicker: "Pre-join check",
        title: "Check camera and audio before joining",
        body: "Make sure your video and mic are ready so you can enter the session smoothly.",
        cameraLabel: "Camera",
        micLabel: "Audio",
        joinNow: "Join Session",
        back: "Back to setup",
        history: "History",
        couple: "Couple room",
        teacher: "Coach panel",
        refresh: "Re-check",
        liveReady: "Ready to join",
        soundTest: "Test sound",
        blocked: "We still need camera or microphone permission.",
        unsupported: "Your browser does not support live preview.",
        permissionGranted: "Granted",
        permissionPrompt: "Prompt",
        permissionDenied: "Denied",
      },
    }),
    [],
  );

  const t = copy[language];

  useEffect(() => {
    let cancelled = false;

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      analyserRef.current = null;
    };

    const startPreview = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setDeviceState("unsupported");
        return;
      }

      setDeviceState("requesting");
      setPermissionNote(null);

      try {
        const cameraPermission = await navigator.permissions?.query?.({ name: "camera" as PermissionName }).catch(() => null);
        const microphonePermission = await navigator.permissions?.query?.({ name: "microphone" as PermissionName }).catch(() => null);
        const cameraPermissionState = cameraPermission?.state;
        const micPermissionState = microphonePermission?.state;
        if (cameraPermissionState === "granted" || micPermissionState === "granted") {
          setPermissionState("granted");
        } else if (cameraPermissionState === "denied" || micPermissionState === "denied") {
          setPermissionState("denied");
        } else if (cameraPermissionState === "prompt" || micPermissionState === "prompt") {
          setPermissionState("prompt");
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          const cameras = devices.filter((device) => device.kind === "videoinput");
          const mics = devices.filter((device) => device.kind === "audioinput");
          setVideoDevices(cameras);
          setAudioDevices(mics);
          setSelectedVideoDeviceId((current) => current || cameras[0]?.deviceId || "");
          setSelectedAudioDeviceId((current) => current || mics[0]?.deviceId || "");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
          audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraReady(stream.getVideoTracks().length > 0);
        setMicReady(stream.getAudioTracks().length > 0);
        setCameraOn(true);
        setMicOn(true);
        setDeviceState("ready");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtor && stream.getAudioTracks().length > 0) {
          const audioContext = new AudioCtor();
          audioContextRef.current = audioContext;
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
            setMicLevel(Math.min(100, Math.round((avg / 140) * 100)));
            rafRef.current = window.requestAnimationFrame(tick);
          };

          tick();
        }
      } catch (error) {
        if (cancelled) return;
        const err = error as { name?: string; message?: string };
        setDeviceState(err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ? "blocked" : "error");
        setPermissionNote(err.message || null);
      }
    };

    void startPreview();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [selectedAudioDeviceId, selectedVideoDeviceId]);

  const toggleTrack = (kind: "video" | "audio") => {
    const stream = streamRef.current;
    if (!stream) return;
    const track = kind === "video" ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
    if (!track) return;
    const enabled = !track.enabled;
    track.enabled = enabled;
    if (kind === "video") {
      setCameraOn(enabled);
    } else {
      setMicOn(enabled);
      if (enabled && audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume();
      }
    }
  };

  const recheckDevices = async () => {
    setDeviceState("idle");
    setMicLevel(0);
    setPermissionNote(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    await Promise.resolve();
    window.location.reload();
  };

  const refreshDeviceLists = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const mics = devices.filter((device) => device.kind === "audioinput");
    setVideoDevices(cameras);
    setAudioDevices(mics);
  };

  const handleVideoDeviceChange = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    await refreshDeviceLists();
    setDeviceState("idle");
  };

  const handleAudioDeviceChange = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    await refreshDeviceLists();
    setDeviceState("idle");
  };

  const handleSoundTest = async () => {
    if (typeof window === "undefined") return;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = 0.0001;
    oscillator.start();
    setSoundTestState("playing");
    setMicLevel(72);
    gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
    oscillator.stop(context.currentTime + 1);
    window.setTimeout(() => {
      setSoundTestState("done");
      context.close().catch(() => undefined);
      window.setTimeout(() => setSoundTestState("idle"), 1200);
    }, 1000);
  };

  const openTechnicalHelp = () => {
    const rawPhone = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
    const phone = normalizeWhatsAppPhone(rawPhone);
    if (!phone || typeof window === "undefined") return;
    const message = language === "ar"
      ? "مرحبًا، أحتاج مساعدة تقنية قبل الانضمام إلى جلسة Dawayir Live."
      : "Hi, I need technical help before joining my Dawayir Live session.";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const joinDisabled = isJoining || deviceState === "requesting" || deviceState === "unsupported" || deviceState === "blocked";
  const guidanceText =
    deviceState === "blocked"
      ? language === "ar"
        ? "اسمح للكاميرا والميكروفون من إعدادات المتصفح ثم أعد الفحص."
        : "Allow camera and microphone in browser settings, then re-check."
      : deviceState === "unsupported"
        ? language === "ar"
          ? "جرّب متصفحًا أحدث يدعم المعاينة المباشرة."
          : "Try a newer browser that supports live preview."
        : permissionState === "denied"
          ? language === "ar"
            ? "بعض الصلاحيات مرفوضة؛ يمكنك تعديلها من شريط العنوان أو الإعدادات."
            : "Some permissions are denied; update them from the address bar or browser settings."
          : permissionState === "prompt"
            ? language === "ar"
              ? "المتصفح ينتظر موافقتك على الوصول للكاميرا والصوت."
              : "Your browser is waiting for permission to access camera and audio."
            : language === "ar"
              ? "عندما يصبح المؤشر أخضر، يمكنك الانضمام مباشرة."
              : "Once indicators turn green, you can join immediately.";
  const joinHint =
    deviceState === "ready" && permissionState !== "denied"
      ? language === "ar"
        ? "الكاميرا والصوت جاهزان."
        : "Camera and mic look good."
      : language === "ar"
        ? "أكمل الفحص ثم انضم للجلسة."
        : "Finish the check, then join the session.";

  return (
    <section className="prejoin-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="prejoin-card">
        <div className="prejoin-copy">
          <div className="prejoin-steps" aria-label={language === "ar" ? "مراحل الانضمام" : "Join steps"}>
            <span className="prejoin-step done">
              <CheckCircle2 className="h-4 w-4" />
              {language === "ar" ? "الإعداد" : "Setup"}
            </span>
            <span className="prejoin-step active">
              <Camera className="h-4 w-4" />
              {language === "ar" ? "الفحص" : "Check"}
            </span>
            <span className="prejoin-step">
              <Video className="h-4 w-4" />
              {language === "ar" ? "الانضمام" : "Join"}
            </span>
          </div>

          <span className="prejoin-kicker">{t.kicker}</span>
          <h2>{t.title}</h2>
          <p>{t.body}</p>

          <div className="prejoin-meta-grid">
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "المحرك" : "Runtime"}</span>
              <strong>{model}</strong>
            </div>
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "الصوت" : "Voice"}</span>
              <strong>{voice}</strong>
            </div>
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "الوضع" : "Mode"}</span>
              <strong>{language === "ar" ? "فحص قبل الدخول" : "Pre-join check"}</strong>
            </div>
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "السياق" : "Context"}</span>
              <strong>{nodeLabel || (language === "ar" ? "غير محدد" : "Unspecified")}</strong>
            </div>
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "صلاحية الكاميرا" : "Camera permission"}</span>
              <strong>
                {permissionState === "granted"
                  ? t.permissionGranted
                  : permissionState === "denied"
                    ? t.permissionDenied
                    : t.permissionPrompt}
              </strong>
            </div>
            <div className="prejoin-meta-chip">
              <span>{language === "ar" ? "صلاحية الصوت" : "Mic permission"}</span>
              <strong>
                {permissionState === "granted"
                  ? t.permissionGranted
                  : permissionState === "denied"
                    ? t.permissionDenied
                    : t.permissionPrompt}
              </strong>
            </div>
          </div>

          <div className="prejoin-secondary-links">
            <button type="button" className="prejoin-pill-link" onClick={onOpenHistory}>
              <History className="h-4 w-4" /> {t.history}
            </button>
            <button type="button" className="prejoin-pill-link" onClick={onOpenCouple}>
              <Users className="h-4 w-4" /> {t.couple}
            </button>
            <button type="button" className="prejoin-pill-link" onClick={onOpenTeacher}>
              <GraduationCap className="h-4 w-4" /> {t.teacher}
            </button>
          </div>

          <button type="button" className="prejoin-support-link" onClick={openTechnicalHelp}>
            <span className="prejoin-support-icon">?</span>
            <span>
              {language === "ar"
                ? "هل تحتاج مساعدة تقنية قبل الدخول؟"
                : "Need technical help before joining?"}
            </span>
          </button>
        </div>

        <div className="prejoin-stage">
          <div className="prejoin-video-shell">
            <video ref={videoRef} className="prejoin-video" autoPlay muted playsInline />
            {deviceState !== "ready" && (
              <div className="prejoin-video-fallback">
                <Camera className="h-6 w-6" />
                <strong>
                  {deviceState === "unsupported"
                    ? t.unsupported
                    : deviceState === "blocked"
                      ? t.blocked
                      : deviceState === "error"
                        ? permissionNote || (language === "ar" ? "تعذر الوصول للكاميرا مؤقتاً." : "Could not access camera right now.")
                        : language === "ar"
                          ? "نجهّز المعاينة الآن..."
                          : "Preparing preview..."}
                </strong>
                <span>
                  {language === "ar"
                    ? "اسمح للكاميرا والميكروفون حتى تظهر المعاينة الحية هنا."
                    : "Allow camera and microphone to see a live preview here."}
                </span>
              </div>
            )}

            <div className="prejoin-live-badge">
              <CheckCircle2 className="h-4 w-4" />
              {t.liveReady}
            </div>
          </div>

          <div className="prejoin-controls">
            <div className="prejoin-device-pickers">
              <label className="prejoin-select">
                <span>{language === "ar" ? "الكاميرا" : "Camera device"}</span>
                <select value={selectedVideoDeviceId} onChange={(event) => void handleVideoDeviceChange(event.target.value)}>
                  {videoDevices.length === 0 && <option value="">{language === "ar" ? "الجهاز الافتراضي" : "Default camera"}</option>}
                  {videoDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${language === "ar" ? "كاميرا" : "Camera"} ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="prejoin-select">
                <span>{language === "ar" ? "الميكروفون" : "Microphone device"}</span>
                <select value={selectedAudioDeviceId} onChange={(event) => void handleAudioDeviceChange(event.target.value)}>
                  {audioDevices.length === 0 && <option value="">{language === "ar" ? "الجهاز الافتراضي" : "Default mic"}</option>}
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${language === "ar" ? "ميكروفون" : "Mic"} ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button type="button" className={`prejoin-toggle ${cameraOn ? "active" : ""}`} onClick={() => toggleTrack("video")}>
              {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              <span>{t.cameraLabel}</span>
              <small>{cameraReady ? (cameraOn ? (language === "ar" ? "مفعّلة" : "On") : language === "ar" ? "موقفة" : "Off") : language === "ar" ? "في الانتظار" : "Waiting"}</small>
            </button>

            <button type="button" className={`prejoin-toggle ${micOn ? "active" : ""}`} onClick={() => toggleTrack("audio")}>
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{t.micLabel}</span>
              <small>{micReady ? `${micLevel}%` : language === "ar" ? "في الانتظار" : "Waiting"}</small>
            </button>

            <div className="prejoin-waveform" aria-hidden="true">
              <span className="prejoin-waveform-label">{language === "ar" ? "نبض الصوت" : "Audio pulse"}</span>
              <div className="prejoin-waveform-bars">
                {[18, 36, 54, 72, 54, 36, 18].map((barHeight, index) => (
                  <span
                    key={`${barHeight}-${index}`}
                    className="prejoin-waveform-bar"
                    style={{
                      height: `${Math.max(18, Math.min(100, barHeight + micLevel / 2))}%`,
                      opacity: micOn ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="prejoin-status-line">
              <Waves className="h-4 w-4" />
              <span>
                {deviceState === "ready"
                  ? language === "ar"
                    ? "المعاينة جاهزة. يمكنك الانضمام الآن."
                    : "Preview is ready. You can join now."
                  : deviceState === "requesting"
                    ? language === "ar"
                      ? "جارٍ طلب الأذونات..."
                      : "Requesting permissions..."
                    : language === "ar"
                      ? "سنُظهر حالة الكاميرا والصوت هنا."
                      : "Your camera and mic status will appear here."}
              </span>
            </div>

            <div className="prejoin-guidance">{guidanceText}</div>
            <div className="prejoin-join-hint">{joinHint}</div>

            <button type="button" className="prejoin-secondary-btn" onClick={() => void handleSoundTest()} disabled={isJoining}>
              <Mic className="h-4 w-4" />
              {soundTestState === "playing"
                ? language === "ar"
                  ? "جاري الاختبار..."
                  : "Testing..."
                : soundTestState === "done"
                  ? language === "ar"
                    ? "تم الاختبار"
                    : "Test complete"
                  : t.soundTest}
            </button>

            <div className="prejoin-action-row">
              <button type="button" className="prejoin-secondary-btn" onClick={onBackToSetup} disabled={isJoining}>
                {t.back}
              </button>
              <button type="button" className="prejoin-secondary-btn" onClick={recheckDevices} disabled={isJoining}>
                <RefreshCw className="h-4 w-4" />
                {t.refresh}
              </button>
              <button type="button" className="primary-btn prejoin-join-btn" onClick={onJoinSession} disabled={joinDisabled}>
                {isJoining ? (language === "ar" ? "جاري الانضمام..." : "Joining...") : t.joinNow}
              </button>
            </div>

            <div className="prejoin-privacy-note">
              {language === "ar"
                ? "الاتصال مشفّر بالكامل، ويمكنك طلب دعم سريع قبل الدخول إذا احتجت."
                : "The connection is fully encrypted, and you can request quick help before joining if needed."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
