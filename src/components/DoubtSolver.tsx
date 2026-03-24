import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Sparkles, BookOpen } from 'lucide-react';
import { fetchDoubtAnswer, isGeminiConfigured, toFriendlyAssistantMessage } from '../utils/geminiExplain';
import { tryLocalDoubtAnswer } from '../utils/localDoubt';
import {
  cloudDoubtsRemaining,
  DOUBT_FREE_CLOUD_LIMIT,
  getCloudDoubtUses,
  incrementCloudDoubtUses,
} from '../utils/doubtQuota';

export type ChatMessage = { role: 'user' | 'assistant'; content: string; source?: 'cloud' | 'local' };

interface DoubtSolverProps {
  /** Optional one-line context from the latest prediction in session. */
  sessionContext?: string;
}

const SUGGESTED = [
  'How does EduPredict weight attendance and assignments?',
  'What should I focus on to improve my predicted CGPA?',
  'What does medium or high risk mean in this app?',
];

const DoubtSolver: React.FC<DoubtSolverProps> = ({ sessionContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const appendAssistant = (content: string, source?: 'cloud' | 'local') => {
    setMessages(prev => [...prev, { role: 'assistant', content, source }]);
  };

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    const local = tryLocalDoubtAnswer(text);
    if (local) {
      appendAssistant(local, 'local');
      setSending(false);
      return;
    }

    if (!isGeminiConfigured()) {
      appendAssistant(
        'To unlock live answers from the tutor, add a Gemini API key in your .env file (see .env.example). Meanwhile, try the suggested questions above — many match instant on-device help — or run a prediction first so we can discuss your numbers in context.',
        'local'
      );
      setSending(false);
      return;
    }

    if (getCloudDoubtUses() >= DOUBT_FREE_CLOUD_LIMIT) {
      appendAssistant(
        `You have used all ${DOUBT_FREE_CLOUD_LIMIT} free cloud answers for this browser session (demo limit to stay within free API tiers). Refresh the tab later for a new session, or keep using instant on-device hints by asking things like "How does the formula work?" or "How can I improve my CGPA?"`,
        'local'
      );
      setSending(false);
      return;
    }

    try {
      const answer = await fetchDoubtAnswer(text, sessionContext);
      incrementCloudDoubtUses();
      appendAssistant(answer, 'cloud');
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      appendAssistant(toFriendlyAssistantMessage(raw), 'local');
    } finally {
      setSending(false);
    }
  };

  const remaining = isGeminiConfigured() ? cloudDoubtsRemaining() : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-xl p-8 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shrink-0">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Doubt solver</h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base leading-relaxed max-w-2xl">
              Ask how the model works, how to improve, or what your results mean. Quick matches get instant on-device
              answers (no quota). Deeper questions can use the cloud tutor —{' '}
              <span className="text-indigo-300 font-medium">{DOUBT_FREE_CLOUD_LIMIT} free cloud replies per session</span>{' '}
              when your API key is set.
            </p>
            {isGeminiConfigured() && (
              <p className="text-xs text-slate-500 mt-3">
                Cloud replies left this session: <span className="text-slate-300 font-semibold">{remaining}</span> /{' '}
                {DOUBT_FREE_CLOUD_LIMIT}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden flex flex-col min-h-[420px] max-h-[min(70vh,560px)]">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-slate-950/40">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-slate-300">Conversation</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 px-4">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Start with a question below, or tap a suggestion. Formula and study-strategy questions often resolve
                instantly on your device.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-md'
                }`}
              >
                {m.role === 'assistant' && m.source && (
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-2">
                    {m.source === 'cloud' ? 'Cloud tutor' : 'On-device'}
                  </span>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-400">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-950/50 space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleSend(s)}
                disabled={sending}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/80 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your doubt…"
              className="flex-1 rounded-xl bg-slate-900/80 border border-slate-600/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-5 py-3 flex items-center gap-2 font-medium text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoubtSolver;
