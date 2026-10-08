import React from 'react';

/* Browser-native voice for the interview coach.
   - Output: SpeechSynthesis (no audio leaves the device, no new API key).
   - Input: SpeechRecognition / webkitSpeechRecognition transcribes locally;
     only the resulting TEXT is sent to the existing interview backend.
   - No audio is recorded, stored, or uploaded anywhere. */

const PREF_OUTPUT = 'careerpilot-voice-output';
const PREF_AUTO = 'careerpilot-auto-listen';
const PREF_RATE = 'careerpilot-voice-rate';

function readPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch { return fallback; }
}

function writePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

/** Strip anything that should never be spoken aloud (symbols, fences, URLs). */
export function cleanForSpeech(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_#>|~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function pickEnglishVoice() {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return null;
    const voices = synth.getVoices ? synth.getVoices() : [];
    if (!voices.length) return null;
    const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang || ''));
    const pool = en.length ? en : voices;
    // Prefer a natural / Google / default voice without hard-coding a name.
    return (
      pool.find((v) => v.default) ||
      pool.find((v) => /natural|google us english|samantha|zira/i.test(v.name || '')) ||
      pool[0]
    );
  } catch { return null; }
}

export function useVoiceInterview() {
  const supportedSynth = React.useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    []
  );
  const supportedRec = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const [voiceOutput, setVoiceOutput] = React.useState(() => readPref(PREF_OUTPUT, 'on') !== 'off');
  const [autoListen, setAutoListen] = React.useState(() => readPref(PREF_AUTO, 'off') === 'on');
  const [rate, setRate] = React.useState(() => {
    const n = Number(readPref(PREF_RATE, '1'));
    return Number.isFinite(n) && n >= 0.5 && n <= 2 ? n : 1;
  });
  const [speaking, setSpeaking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState('');

  const recogRef = React.useRef(null);
  const onResultRef = React.useRef(null);
  const onEndRef = React.useRef(null);
  const onErrorRef = React.useRef(null);
  // Explicit user intent vs. browser auto-end. Only finalize when the USER
  // asked to stop; any other onend while listening restarts the session.
  const stopRequested = React.useRef(false);
  const sessionGen = React.useRef(0);
  const restarts = React.useRef(0);
  const lastFatal = React.useRef(null);
  const restartTimer = React.useRef(null);
  const MAX_AUTO_RESTARTS = 10;

  const toggleOutput = React.useCallback(() => {
    setVoiceOutput((v) => {
      const next = !v;
      writePref(PREF_OUTPUT, next ? 'on' : 'off');
      if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return next;
    });
  }, []);
  const toggleAuto = React.useCallback(() => {
    setAutoListen((v) => {
      const next = !v;
      writePref(PREF_AUTO, next ? 'on' : 'off');
      return next;
    });
  }, []);
  const changeRate = React.useCallback((r) => {
    const n = Math.min(2, Math.max(0.5, Number(r) || 1));
    setRate(n);
    writePref(PREF_RATE, String(n));
  }, []);

  const stopSpeaking = React.useCallback(() => {
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch { /* noop */ }
    setSpeaking(false);
  }, []);

  const speak = React.useCallback((text, onDone) => {
    if (!('speechSynthesis' in window)) return false;
    const clean = cleanForSpeech(text);
    if (!clean) return false;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      const voice = pickEnglishVoice();
      if (voice) utter.voice = voice;
      utter.rate = rate;
      utter.onstart = () => setSpeaking(true);
      const done = () => { setSpeaking(false); onDone?.(); };
      utter.onend = done;
      utter.onerror = done;
      synth.speak(utter);
      return true;
    } catch { return false; }
  }, [rate]);

  const stopListening = React.useCallback(() => {
    // The ONLY path that finalizes the transcript: explicit user action.
    stopRequested.current = true;
    sessionGen.current += 1; // invalidate any in-flight session + pending restart
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }
    setInterim('');
    try { recogRef.current?.stop(); } catch { /* noop */ }
    // 'end' event finalizes state; force it for engines that lag.
    setListening(false);
  }, []);

  const startListening = React.useCallback(({ onResult, onEnd, onError } = {}) => {
    if (typeof window === 'undefined') return false;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return false;
    // Never overlap recognition with speech output.
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    setSpeaking(false);
    onResultRef.current = onResult || null;
    onEndRef.current = onEnd || null;
    onErrorRef.current = onError || null;
    stopRequested.current = false;
    restarts.current = 0;
    lastFatal.current = null;
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }
    const gen = ++sessionGen.current;

    function launch() {
      // Stale session (user stopped / new session started / unmounted) — never launch.
      if (gen !== sessionGen.current || stopRequested.current) return;
      try { recogRef.current?.abort(); } catch { /* noop */ }
      let recog;
      try {
        recog = new Ctor();
      } catch {
        setListening(false);
        return;
      }
      recog.lang = 'en-US';
      // Effectively unlimited speaking time: the engine may still auto-end a
      // session (pause, internal limit) — onend below restarts it safely.
      recog.continuous = true;
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.onresult = (e) => {
        if (gen !== sessionGen.current) return;
        let interimText = '';
        let finalText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0]?.transcript || '';
          if (e.results[i].isFinal) finalText += t;
          else interimText += t;
        }
        if (interimText) setInterim(interimText);
        if (finalText) {
          setInterim('');
          restarts.current = 0; // progress heard — fresh restart budget
          onResultRef.current?.(finalText.trim());
        }
      };
      recog.onerror = (e) => {
        if (gen !== sessionGen.current) return;
        const code = e?.error || 'unknown';
        if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
          // Permanent: permission revoked/denied or no mic — never restart.
          lastFatal.current = code;
          stopRequested.current = true;
          setListening(false);
          setInterim('');
          onErrorRef.current?.(code);
        }
        // 'no-speech', 'network', 'aborted', 'language', etc. are transient:
        // stay silent here; onend decides the guarded restart. Final text
        // already delivered stays in the caller's draft — never wiped.
      };
      recog.onend = () => {
        if (gen !== sessionGen.current) return;
        if (stopRequested.current || lastFatal.current) {
          setListening(false);
          setInterim('');
          onEndRef.current?.();
          return;
        }
        if (restarts.current >= MAX_AUTO_RESTARTS) {
          stopRequested.current = true;
          setListening(false);
          setInterim('');
          onErrorRef.current?.('network');
          return;
        }
        // Browser auto-ended the session mid-answer — restart transparently.
        restarts.current += 1;
        restartTimer.current = setTimeout(() => {
          restartTimer.current = null;
          launch();
        }, 150);
      };
      recogRef.current = recog;
      try {
        recog.start();
        setListening(true);
      } catch {
        if (gen === sessionGen.current && !stopRequested.current) {
          setListening(false);
          onErrorRef.current?.('unknown');
        }
      }
    }

    launch();
    return true;
  }, []);

  // Full cleanup on unmount: never leave speech, recognition, or a pending
  // restart running — and never restart after unmount.
  React.useEffect(() => () => {
    stopRequested.current = true;
    sessionGen.current += 1;
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null; }
    try { recogRef.current?.abort(); } catch { /* noop */ }
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  return {
    supportedSynth,
    supportedRec,
    voiceOutput,
    autoListen,
    rate,
    speaking,
    listening,
    interim,
    toggleOutput,
    toggleAuto,
    changeRate,
    speak,
    stopSpeaking,
    startListening,
    stopListening
  };
}

/** Human-friendly recognition error → UI message. */
export function recognitionMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is required for voice interview mode.';
    case 'no-speech':
      return "I didn't hear an answer. Try again.";
    case 'audio-capture':
      return 'No microphone was found. You can continue with text.';
    case 'network':
      return 'Voice input is temporarily unavailable. You can continue with text.';
    default:
      return 'Voice input is temporarily unavailable. You can continue with text.';
  }
}
