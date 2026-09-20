import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mic, MicOff, Globe2 } from 'lucide-react';

export function VoiceInput({ onTranscript }) {
  const { currentLangObj, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recognition, setRecognition] = useState(null);

  const langSpeechCode = currentLangObj?.speechCode || 'hi-IN';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = langSpeechCode;

      recog.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          onTranscript(currentTranscript);
        }
      };

      recog.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    } else {
      setSupported(false);
    }
  }, [langSpeechCode, onTranscript]);

  const toggleListening = () => {
    if (!supported || !recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.lang = langSpeechCode;
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (!supported) {
    return (
      <span className="text-xs text-slate-400 flex items-center gap-1" title="Voice typing requires a browser with SpeechRecognition support">
        <MicOff className="w-3.5 h-3.5" /> {t('voiceToText')}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
        isListening
          ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
      }`}
    >
      {isListening ? (
        <>
          <Mic className="w-3.5 h-3.5" /> {t('recordingVoice')}
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-emerald-600" /> {t('voiceToText')} ({currentLangObj.native})
        </>
      )}
    </button>
  );
}
