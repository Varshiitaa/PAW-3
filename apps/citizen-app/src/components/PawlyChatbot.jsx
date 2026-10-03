import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Badge } from '@streetpaw/ui';
import { MessageSquare, X, Send, Sparkles, Copy, Check, Trash2, AlertCircle, ShieldCheck, Heart, ExternalLink, RefreshCw } from 'lucide-react';
import './PawlyChatbot.css';

const SUGGESTION_CHIPS = [
  "What to do for an injured dog?",
  "How to report a dog bite?",
  "Nearest NGO / Helpline?",
  "ABC sterilization rules in India"
];

export function PawlyChatbot({ context = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('streetpaw_pawly_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        role: 'assistant',
        content: "Hi there! 🐶 I'm Pawly, your StreetPaw AI animal welfare assistant. How can I help you care for stray dogs or emergency rescues today?",
        mode: 'live'
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLimitedMode, setIsLimitedMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeContext, setActiveContext] = useState(context);

  const messagesEndRef = useRef(null);

  // Sync context changes via props or custom window event
  useEffect(() => {
    if (context) {
      setActiveContext(context);
      setIsOpen(true);
    }
  }, [context]);

  useEffect(() => {
    const handleOpenWithContext = (e) => {
      if (e.detail) {
        setActiveContext(e.detail);
      }
      setIsOpen(true);
    };
    window.addEventListener('streetpaw:open-pawly-chat', handleOpenWithContext);
    return () => window.removeEventListener('streetpaw:open-pawly-chat', handleOpenWithContext);
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('streetpaw_pawly_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend || !textToSend.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: textToSend.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customText) setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: activeContext || {}
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          setMessages([...updatedMessages, {
            role: 'assistant',
            content: "⚠️ Rate limit reached. Please wait a minute before sending another message.",
            mode: 'limited'
          }]);
          setIsStreaming(false);
          return;
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let assistantContent = '';
      let currentMode = 'live';
      let suggestedLink = null;

      setMessages([...updatedMessages, { role: 'assistant', content: '', mode: 'live' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const payload = JSON.parse(line.substring(6));
              if (payload.chunk) {
                assistantContent += payload.chunk;
              }
              if (payload.mode) {
                currentMode = payload.mode;
                if (payload.mode === 'limited') setIsLimitedMode(true);
              }
              if (payload.link) suggestedLink = payload.link;

              setMessages([...updatedMessages, {
                role: 'assistant',
                content: assistantContent,
                mode: currentMode,
                link: suggestedLink
              }]);
            } catch (err) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: "Pawly is currently operating in Limited Mode. For animal emergencies, visit our Help & Contacts page.",
        mode: 'limited',
        link: 'Help & Contacts'
      }]);
      setIsLimitedMode(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    const initial = [
      {
        role: 'assistant',
        content: "Chat cleared! 🐶 How can Pawly help you with stray animal care or emergency rescues today?",
        mode: 'live'
      }
    ];
    setMessages(initial);
    localStorage.removeItem('streetpaw_pawly_chat_history');
    setIsLimitedMode(false);
  };

  return (
    <div className="pawly-chatbot-wrapper">
      {/* FLOATING ROUND BUTTON */}
      {!isOpen && (
        <button
          type="button"
          className="pawly-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Ask Pawly AI Assistant"
        >
          <div className="pawly-avatar-head">
            <span className="pawly-emoji">🐶</span>
            <span className="pawly-blink-eye" />
          </div>
          <span className="pawly-badge-sparkle">
            <Sparkles size={12} color="#ffffff" />
          </span>
        </button>
      )}

      {/* FLOATING CHAT PANEL */}
      {isOpen && (
        <div className="pawly-chat-panel">
          {/* Header */}
          <div className="pawly-header">
            <div className="pawly-header-left">
              <div className="pawly-avatar-small">🐶</div>
              <div>
                <h4 className="pawly-name flex items-center gap-1">
                  <span>Pawly AI Assistant</span>
                  <Sparkles size={14} color="#f59e0b" />
                </h4>
                <div className="pawly-status-text">
                  {isLimitedMode ? (
                    <span className="text-amber-400 font-bold">● Limited Mode (FAQ Fallback)</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">● Live Anthropic Claude Stream</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pawly-header-actions">
              <button type="button" className="header-icon-btn" onClick={handleClearChat} title="Clear Chat">
                <Trash2 size={16} />
              </button>
              <button type="button" className="header-icon-btn" onClick={() => setIsOpen(false)} title="Close Panel">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          {activeContext && (
            <div className="px-3 py-1.5 bg-indigo-950/80 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles size={12} className="text-amber-400 shrink-0" />
                <span className="font-semibold truncate">
                  Context: {activeContext.dog_id ? `Dog #${activeContext.dog_id}` : activeContext.scan_result ? `Scan (${activeContext.scan_result.breed || activeContext.scan_result.species || 'AI Analysis'})` : 'Attached Details'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                className="text-indigo-400 hover:text-white text-[10px] underline ml-2 shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Limited Mode Banner */}
          {isLimitedMode && (
            <div className="limited-mode-banner">
              <AlertCircle size={14} />
              <span>Limited Mode: Answering from local FAQ dataset. Pointing to Help & Contacts for emergencies.</span>
            </div>
          )}

          {/* Messages List */}
          <div className="pawly-messages-list">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              const isCopied = copiedIndex === idx;

              return (
                <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                  {isAssistant && <div className="bubble-avatar">🐶</div>}

                  <div className={`chat-bubble-content ${msg.role}`}>
                    <div className="bubble-text">{msg.content}</div>

                    {msg.link && (
                      <div className="mt-2">
                        <a href="#/contacts" className="text-xs text-rose-300 underline font-bold flex items-center gap-1">
                          <ExternalLink size={12} /> View {msg.link} Directory
                        </a>
                      </div>
                    )}

                    {isAssistant && msg.content && (
                      <button
                        type="button"
                        className="copy-bubble-btn"
                        onClick={() => handleCopy(idx, msg.content)}
                      >
                        {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bouncing Dots Typing Indicator */}
            {isStreaming && (
              <div className="chat-bubble-row assistant">
                <div className="bubble-avatar">🐶</div>
                <div className="chat-bubble-content assistant typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="suggestion-chips-bar">
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-chip"
                onClick={() => handleSendMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            className="pawly-input-bar"
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          >
            <input
              type="text"
              className="pawly-input-field"
              placeholder="Ask Pawly about first aid, bites, ABC rules, feeding..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
            />
            <button
              type="submit"
              className="pawly-send-btn"
              disabled={!input.trim() || isStreaming}
            >
              <Send size={16} />
            </button>
          </form>

          {/* Footer Medical Disclaimer */}
          <div className="pawly-disclaimer-footer">
            Pawly is an AI assistant, not a substitute for a licensed veterinarian.
          </div>
        </div>
      )}
    </div>
  );
}
