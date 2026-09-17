/**
 * AIAssistant — CarePath AI
 *
 * Patient-facing AI health assistant.
 * Provides a chat-style interface for health questions with disclaimers.
 * Responses are generated dynamically via the server AI endpoint (Gemini when
 * GEMINI_API_KEY is configured on the server; enhanced smart engine otherwise).
 * Supports multilingual responses: EN / HI / TE via LanguageContext.
 *
 * Voice features:
 *   • Mic button → browser Speech Recognition (STT) → fills input + auto-sends
 *   • Language controlled by the selected app language (EN/HI/TE)
 *   • Speaker button on every AI message → Text-to-Speech (TTS) in selected language
 *   • Both STT and TTS use the free built-in browser Web Speech API
 *
 * Route: /user/ai
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Send, RefreshCw, AlertCircle, User, Bot,
  Loader2, Info, Stethoscope, Building2, Calendar,
  Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import useSpeech from '../../hooks/useSpeech';
import { sendChatMessage } from '../../services/aiService';

// ── Lang display names (for auto-detect toast) ────────────────────────────────
const LANG_NAMES = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు' };

// ── Full Markdown renderer ─────────────────────────────────────────────────────
// Handles: ### headings, **bold**, bullet points (• * -), numbered lists,
//          horizontal rules (---), blockquotes (>), inline bold, emoji colours.
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule --- or ___
    if (/^[-_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-2 border-gray-200" />);
      i++;
      continue;
    }

    // Headings ### / ## / #
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const cls = level === 1
        ? 'text-sm font-bold text-gray-900 mt-3 mb-1'
        : level === 2
          ? 'text-xs font-bold text-gray-800 mt-2 mb-0.5'
          : 'text-xs font-semibold text-gray-700 mt-1.5 mb-0.5';
      elements.push(
        <p key={i} className={cls}
          dangerouslySetInnerHTML={{ __html: inlineFormat(content) }} />
      );
      i++;
      continue;
    }

    // Blockquote >
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-amber-400 pl-3 my-1 text-xs text-gray-600 italic">
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
        </blockquote>
      );
      i++;
      continue;
    }

    // Bold-only line: **text** alone on a line
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      elements.push(
        <p key={i} className="font-semibold text-gray-900 mt-2 mb-0.5 text-xs"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
      i++;
      continue;
    }

    // Bullet: • * -
    if (/^[\u2022\*\-]\s/.test(line)) {
      elements.push(
        <li key={i} className="ml-4 flex items-start gap-1.5 text-xs leading-relaxed">
          <span className="text-gray-400 mt-0.5 shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^[\u2022\*\-]\s+/, '')) }} />
        </li>
      );
      i++;
      continue;
    }

    // Numbered list: 1. 2. 3.
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 flex items-start gap-1.5 text-xs leading-relaxed">
          <span className="text-gray-400 shrink-0 font-medium">{numMatch[1]}.</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(numMatch[2]) }} />
        </li>
      );
      i++;
      continue;
    }

    // Empty line → small spacer
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
    );
    i++;
  }

  return elements;
};

// ── Inline formatting: **bold**, *italic*, emoji colour ───────────────────────
const inlineFormat = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*((?!\*)[^*]+)\*/g, '<em>$1</em>')
    .replace(/🚨|⚠️/g, (m) => `<span style="color:#ef4444">${m}</span>`);

// ── Chat message bubble ────────────────────────────────────────────────────────
const Message = ({ msg, onSpeak, onStopSpeak, isSpeakingThis, ttsSupported, t }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-blue-100' : 'bg-violet-100'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5 text-blue-600" /> : <Bot className="w-3.5 h-3.5 text-violet-600" />}
      </div>
      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
        isUser
          ? 'bg-blue-600 text-white text-xs leading-relaxed'
          : 'bg-white border border-gray-200 text-gray-800'
      }`}>
        {isUser ? (
          <p className="text-xs">{msg.content}</p>
        ) : (
          <>
            <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
            {/* TTS speaker button — only on assistant messages when TTS supported */}
            {ttsSupported && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                <button
                  onClick={isSpeakingThis ? onStopSpeak : onSpeak}
                  title={isSpeakingThis ? t('ai.voiceStop') : t('ai.voiceReadAloud')}
                  className={`flex items-center gap-1 text-xs rounded-md px-2 py-1 transition-colors ${
                    isSpeakingThis
                      ? 'text-violet-700 bg-violet-100 hover:bg-violet-200'
                      : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
                  }`}
                >
                  {isSpeakingThis
                    ? <><VolumeX className="w-3 h-3" /> {t('ai.voiceStop')}</>
                    : <><Volume2 className="w-3 h-3" /> {t('ai.voiceReadAloud')}</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AIAssistant = () => {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();

  const firstName = user?.name?.split(' ')[0] || '';

  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content: t('ai.greeting')(firstName),
    },
  ]);
  const [input, setInput]           = useState('');
  const [thinking, setThinking]     = useState(false);
  const [speakingId, setSpeakingId] = useState(null);   // index of msg currently being spoken
  const [voiceToast, setVoiceToast] = useState('');     // auto-detect notification
  const bottomRef                   = useRef(null);
  const toastTimerRef               = useRef(null);

  // Voice hook
  const {
    isListening,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech();

  // When language changes: refresh the initial greeting message only
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t('ai.greeting')(firstName) }];
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Stop TTS when language changes
  useEffect(() => {
    stopSpeaking();
    setSpeakingId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Show transient toast ──────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setVoiceToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setVoiceToast(''), 3000);
  }, []);

  // ── Send message — calls the server AI endpoint ───────────────────────────
  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || thinking) return;

    // Capture current history snapshot before updating state
    const historySnapshot = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setThinking(true);
    // Stop any active TTS when user sends a new message
    stopSpeaking();
    setSpeakingId(null);

    let answer = '';
    try {
      const res = await sendChatMessage(question, historySnapshot, lang);
      // Accept both response shapes: { data: { answer } } or { answer }
      answer = res?.data?.answer ?? res?.answer ?? '';
    } catch (err) {
      // Graceful error message in the active language
      const errMsgs = {
        en: '⚠️ I had trouble connecting to the AI service. Please check your internet connection and try again.',
        hi: '⚠️ AI सेवा से कनेक्ट करने में समस्या हुई। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',
        te: '⚠️ AI సేవకు కనెక్ట్ అవ్వడంలో సమస్య వచ్చింది. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.',
      };
      answer = errMsgs[lang] || errMsgs.en;
    }

    if (!answer) {
      const emptyMsgs = {
        en: '⚠️ I received an empty response. Please try rephrasing your question.',
        hi: '⚠️ मुझे खाली प्रतिक्रिया मिली। कृपया अपना प्रश्न दोबारा लिखें।',
        te: '⚠️ నాకు ఖాళీ సమాధానం వచ్చింది. దయచేసి మీ ప్రశ్నను మళ్ళీ రాయండి.',
      };
      answer = emptyMsgs[lang] || emptyMsgs.en;
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    setThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    stopSpeaking();
    setSpeakingId(null);
    setMessages([
      {
        role: 'assistant',
        content: t('ai.chatCleared'),
      },
    ]);
  };

  // ── Mic button handler ────────────────────────────────────────────────────
  const handleMic = () => {
    if (isListening) {
      stopListening();
      return;
    }

    // Stop TTS before listening to avoid feedback
    stopSpeaking();
    setSpeakingId(null);

    startListening(
      lang,
      // onResult: transcript ready
      (transcript, detectedLang) => {
        setInput(transcript);
        // Auto-detect language switch — only switch if significantly different
        if (detectedLang && detectedLang !== lang) {
          setLang(detectedLang);
          showToast(
            typeof t('ai.voiceDetected') === 'function'
              ? t('ai.voiceDetected')(LANG_NAMES[detectedLang] || detectedLang)
              : t('ai.voiceDetected')
          );
        }
        // Auto-send voice input
        sendMessage(transcript);
      },
    );
  };

  // ── TTS: speak a specific message ─────────────────────────────────────────
  const handleSpeak = (idx, content) => {
    stopSpeaking();
    setSpeakingId(idx);
    speak(content, lang, () => setSpeakingId(null));
  };

  const handleStopSpeak = () => {
    stopSpeaking();
    setSpeakingId(null);
  };

  const suggestions = t('ai.suggestions');

  // ── Mic button appearance ─────────────────────────────────────────────────
  const micLabel = isListening ? t('ai.voiceListening') : t('ai.voiceTap');
  const micClass = isListening
    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
    : 'bg-violet-100 hover:bg-violet-200 text-violet-700';

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{t('ai.title')}</h1>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {t('common.online')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Medical Disclaimer — fully translated */}
      <div className="py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl my-3 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold mb-0.5">{t('ai.disclaimerTitle')}</p>
            <p className="leading-relaxed">
              {t('ai.disclaimerBody')}{' '}
              <strong>{t('ai.disclaimerEmergency')}</strong>{' '}
              {t('ai.disclaimerEnd')}
            </p>
          </div>
        </div>
      </div>

      {/* Voice status toast */}
      {(isListening || voiceToast) && (
        <div className={`mx-1 mb-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          isListening
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-violet-50 border-violet-200 text-violet-700'
        }`}>
          {isListening
            ? <><Mic className="w-3.5 h-3.5 animate-pulse shrink-0" /> {t('ai.voiceListening')}</>
            : <><Volume2 className="w-3.5 h-3.5 shrink-0" /> {voiceToast}</>
          }
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
        {messages.map((msg, i) => (
          <Message
            key={i}
            msg={msg}
            t={t}
            ttsSupported={ttsSupported}
            isSpeakingThis={speakingId === i}
            onSpeak={() => handleSpeak(i, msg.content)}
            onStopSpeak={handleStopSpeak}
          />
        ))}
        {thinking && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
              <span className="text-xs text-gray-500">{t('common.thinking')}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 2 && !thinking && Array.isArray(suggestions) && (
        <div className="py-3">
          <p className="text-xs text-gray-500 mb-2">{t('ai.suggestedQuestions')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={thinking}
            placeholder={t('ai.inputPlaceholder')}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />

          {/* Mic button */}
          {sttSupported ? (
            <button
              onClick={handleMic}
              disabled={thinking}
              title={micLabel}
              aria-label={micLabel}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 self-end disabled:opacity-40 ${micClass}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          ) : null}

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || thinking}
            className="w-10 h-10 flex items-center justify-center bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 self-end"
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Voice hint */}
        {sttSupported && (
          <p className="text-xs text-gray-400 mt-1.5 ml-1">
            🎤 {isListening ? t('ai.voiceListening') : t('ai.voiceTap')}
            {' · '}
            <span className="text-gray-300">EN / हिन्दी / తెలుగు</span>
          </p>
        )}

        {/* Quick-access links */}
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          <Link to="/user/appointments" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Calendar className="w-3 h-3" /> {t('common.bookAppointment')}
          </Link>
          <Link to="/user/hospitals" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Building2 className="w-3 h-3" /> {t('common.findHospital')}
          </Link>
          <Link to="/user/experts" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Stethoscope className="w-3 h-3" /> {t('common.talkToExpert')}
          </Link>
          <Link to="/user/emergency" className="flex items-center gap-1 hover:text-red-600 transition-colors">
            <AlertCircle className="w-3 h-3" /> {t('common.emergency')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
