/**
 * useSpeech — CarePath AI
 *
 * Custom hook that wraps the browser's Web Speech API:
 *   • Speech Recognition  (STT) — mic → text
 *   • Speech Synthesis    (TTS) — text → voice
 *
 * Supports English (en), Hindi (hi), and Telugu (te).
 * Uses only free built-in browser APIs — no external service required.
 *
 * Known browser quirks handled here:
 *   1. Chrome loads voices ASYNCHRONOUSLY — we wait for onvoiceschanged before
 *      attempting to assign a voice to an utterance.
 *   2. Chrome has a bug where cancel() followed immediately by speak() drops the
 *      utterance silently — we defer speak() by one tick with setTimeout(fn, 0)
 *      after cancel() to let the engine flush.
 *   3. Long texts crash SpeechSynthesis on some browsers — we chunk at sentence
 *      boundaries and queue the chunks sequentially.
 *
 * Returns:
 *   isListening       {boolean}   — mic is active and capturing
 *   isSpeaking        {boolean}   — TTS is currently playing
 *   sttSupported      {boolean}   — browser supports SpeechRecognition
 *   ttsSupported      {boolean}   — browser supports SpeechSynthesis
 *   startListening    {function}  — (langCode, onResult) => void
 *   stopListening     {function}  — stop mic immediately
 *   speak             {function}  — (text, langCode, onEnd?) => void
 *   stopSpeaking      {function}  — cancel TTS immediately
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ── BCP-47 locale tags per language code ──────────────────────────────────────
const LANG_LOCALE = {
  en: 'en-IN',   // English (India)
  hi: 'hi-IN',   // Hindi
  te: 'te-IN',   // Telugu
};

// ── Detect language from transcript using Unicode script ranges ───────────────
const detectLangFromText = (text) => {
  if (!text) return null;
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const telugu     = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const total = devanagari + telugu;
  if (total === 0) return 'en';
  if (telugu > devanagari) return 'te';
  return 'hi';
};

// ── Pick the best available TTS voice for a locale ───────────────────────────
// Must be called AFTER voices are loaded (i.e. inside onvoiceschanged or after).
const pickVoice = (locale) => {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const baseLang = locale.split('-')[0]; // 'hi' from 'hi-IN'

  // Priority 1 — exact BCP-47 match (hi-IN, te-IN, en-IN)
  let v = voices.find((x) => x.lang === locale);
  // Priority 2 — same language, any region (hi-*, te-*, en-*)
  if (!v) v = voices.find((x) => x.lang.startsWith(baseLang + '-') || x.lang === baseLang);
  // Priority 3 — any English voice so it never silently fails
  if (!v) v = voices.find((x) => x.lang.startsWith('en'));
  return v || null;
};

// ── Strip Markdown / emoji so TTS reads clean prose ──────────────────────────
const cleanForTTS = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*((?!\*)[^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[•\-\*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/🚨|⚠️|👋|✓/g, '')
    .replace(/\[.*?\]/g, '')         // remove lang-hint brackets like [RESPOND IN ...]
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ── Split long text into sentence chunks (≤ 200 chars) ───────────────────────
// Prevents SpeechSynthesis from cutting off mid-way on long responses.
const chunkText = (text, maxLen = 200) => {
  // Split on sentence-ending punctuation followed by whitespace
  const sentences = text.match(/[^।.!?]+[।.!?]+\s*/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLen) {
      current += sentence;
    } else {
      if (current.trim()) chunks.push(current.trim());
      // If a single sentence is longer than maxLen, split on commas
      if (sentence.length > maxLen) {
        const parts = sentence.split(/,\s*/);
        let sub = '';
        for (const p of parts) {
          if ((sub + p).length <= maxLen) {
            sub += (sub ? ', ' : '') + p;
          } else {
            if (sub.trim()) chunks.push(sub.trim());
            sub = p;
          }
        }
        if (sub.trim()) current = sub.trim();
        else current = '';
      } else {
        current = sentence;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
};

// ── Hook ──────────────────────────────────────────────────────────────────────
const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);

  const recognitionRef  = useRef(null);
  const synthRef        = useRef(typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);
  // Cache voices once loaded so pickVoice() never sees an empty array
  const voicesCachedRef = useRef([]);
  // Chunk queue for sequential TTS playback
  const chunkQueueRef   = useRef([]);
  const speakingActiveRef = useRef(false);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const sttSupported = Boolean(SpeechRecognition);
  const ttsSupported = Boolean(synthRef.current);

  // ── Load & cache voices (Chrome fires onvoiceschanged asynchronously) ──────
  useEffect(() => {
    if (!ttsSupported) return;
    const synth = synthRef.current;

    const loadVoices = () => {
      const v = synth.getVoices();
      if (v.length) voicesCachedRef.current = v;
    };

    // Try to load immediately (Firefox / Safari have voices ready synchronously)
    loadVoices();

    // Chrome fires this event once voices are ready
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = loadVoices;
    }

    // Fallback poll — some Chromium variants delay the event
    const poll = setInterval(() => {
      if (voicesCachedRef.current.length) {
        clearInterval(poll);
        return;
      }
      loadVoices();
    }, 200);

    // Stop polling after 5 s regardless
    const stop = setTimeout(() => clearInterval(poll), 5000);

    return () => {
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, [ttsSupported]);

  // ── Pick voice using cached list ─────────────────────────────────────────
  const pickVoiceCached = useCallback((locale) => {
    const voices = voicesCachedRef.current.length
      ? voicesCachedRef.current
      : (typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : []);

    if (!voices.length) return null;

    const baseLang = locale.split('-')[0];
    let v = voices.find((x) => x.lang === locale);
    if (!v) v = voices.find((x) => x.lang.startsWith(baseLang + '-') || x.lang === baseLang);
    if (!v) v = voices.find((x) => x.lang.startsWith('en'));
    return v || null;
  }, []);

  // ── Internal: speak one chunk, then call next ─────────────────────────────
  const speakChunk = useCallback((chunks, index, locale, langCode, onEnd) => {
    if (!speakingActiveRef.current || index >= chunks.length) {
      speakingActiveRef.current = false;
      setIsSpeaking(false);
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    const synth = synthRef.current;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang   = locale;
    utterance.rate   = langCode === 'en' ? 0.95 : 0.88;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Assign voice — use cached list for reliability
    const voice = pickVoiceCached(locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (speakingActiveRef.current) {
        // Small pause between chunks so speech sounds natural
        setTimeout(() => speakChunk(chunks, index + 1, locale, langCode, onEnd), 50);
      } else {
        setIsSpeaking(false);
        if (typeof onEnd === 'function') onEnd();
      }
    };

    utterance.onerror = (e) => {
      // 'interrupted' is normal when cancel() is called — don't treat as error
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[useSpeech] TTS error:', e.error);
      }
      speakingActiveRef.current = false;
      setIsSpeaking(false);
      if (typeof onEnd === 'function') onEnd();
    };

    synth.speak(utterance);
  }, [pickVoiceCached]);

  // ── startListening ──────────────────────────────────────────────────────────
  const startListening = useCallback((langCode, onResult) => {
    if (!sttSupported) return;
    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const locale = LANG_LOCALE[langCode] || LANG_LOCALE.en;
    recognition.lang             = locale;
    recognition.continuous       = false;
    recognition.interimResults   = false;
    recognition.maxAlternatives  = 1;

    recognition.onstart  = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      const detected   = detectLangFromText(transcript);
      if (typeof onResult === 'function') {
        onResult(transcript, detected || langCode);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[useSpeech] STT error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [sttSupported, SpeechRecognition]);

  // ── stopListening ───────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── speak ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text, langCode = 'en', onEnd) => {
    if (!ttsSupported || !text) return;
    const synth = synthRef.current;

    // Stop any active speech first
    speakingActiveRef.current = false;
    synth.cancel();

    const clean = cleanForTTS(text);
    if (!clean) return;

    const locale = LANG_LOCALE[langCode] || LANG_LOCALE.en;
    const chunks = chunkText(clean);

    // ── Chrome bug fix: defer speak() by one event-loop tick after cancel() ──
    // Without this, Chrome silently drops the utterance ~100% of the time when
    // cancel() and speak() are called in the same synchronous block.
    setTimeout(() => {
      if (!synthRef.current) return;
      speakingActiveRef.current = true;
      setIsSpeaking(true);
      speakChunk(chunks, 0, locale, langCode, onEnd);
    }, 0);
  }, [ttsSupported, speakChunk]);

  // ── stopSpeaking ─────────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    speakingActiveRef.current = false;
    chunkQueueRef.current = [];
    if (ttsSupported) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, [ttsSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      speakingActiveRef.current = false;
      if (ttsSupported && synthRef.current) synthRef.current.cancel();
    };
  }, [ttsSupported]);

  return {
    isListening,
    isSpeaking,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};

export default useSpeech;
