import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { sendChatMessage } from '../../api/chat';

const STORAGE_KEY = 'veloce_chat_history';
const MAX_HISTORY_TO_SEND = 12;

const STARTER_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm Veloce Assistant. I can help you find vehicles, answer rental questions, book a vehicle, or cancel an approved booking. What would you like to do?",
};

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [STARTER_MESSAGE];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [STARTER_MESSAGE];
  } catch {
    return [STARTER_MESSAGE];
  }
}

function saveHistory(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsTyping(true);

    try {
      const history = nextMessages
        .filter((msg) => (msg.role === 'user' || msg.role === 'assistant') && msg.content?.trim())
        .slice(0, -1)
        .slice(-MAX_HISTORY_TO_SEND)
        .map((msg) => ({ role: msg.role, content: String(msg.content).slice(0, 8000) }));

      const response = await sendChatMessage({
        message: trimmed,
        conversationHistory: history,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      const message =
        err.code === 'ECONNABORTED'
          ? 'The assistant took too long to respond. Please try again.'
          : err.normalizedMessage || 'Unable to reach the assistant. Please try again.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I ran into a problem: ${message}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([STARTER_MESSAGE]);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft transition hover:scale-105 hover:bg-ink"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(640px,calc(100vh-3rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 bg-sand px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">Veloce Assistant</p>
                <p className="text-xs text-slate-500">Book, cancel, and ask about rentals</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-ink"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={`${msg.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-md bg-brand text-white'
                        : 'rounded-bl-md border border-slate-100 bg-mist text-ink'
                    }`}
                  >
                    {!isUser ? (
                      <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-brand">
                        <Bot className="h-3.5 w-3.5" />
                        Assistant
                      </div>
                    ) : null}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-mist px-4 py-3 text-sm text-slate-500">
                  Assistant is typing...
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="px-4 pb-1 text-xs text-rose-600">{error}</p> : null}

          <footer className="border-t border-slate-100 bg-white p-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about vehicles, book, or cancel..."
                className="max-h-28 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink outline-none ring-brand focus:ring-2"
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      ) : null}
    </>
  );
}
