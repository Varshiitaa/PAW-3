import React, { useState } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Button, Input } from '@streetpaw/ui';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste! I am the StreetPaw AI First-Aid & Medical Advisor. How can I help you care for a stray animal today?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const userMessage = inputMsg;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInputMsg('');

    setTimeout(() => {
      let botResponse = "For minor stray dog skin issues or non-bleed scrapes, clean gently with warm water. If you notice severe limping, active bleeding, or visible skin lesions like Demodicosis or Dermatitis, please use our 'Report Distress' page to dispatch local NGO rescuers immediately.";
      if (userMessage.toLowerCase().includes('bleed') || userMessage.toLowerCase().includes('injury')) {
        botResponse = "CRITICAL FIRST-AID: Apply gentle pressure with clean cloth to stop bleeding. Keep the dog warm and calm. Do not force feed water if unconscious. Submit a Distress Report immediately on our SOS page!";
      }
      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI First-Aid Advisor"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 990,
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'var(--primary-gradient)',
          color: '#ffffff',
          border: 'none',
          boxShadow: 'var(--shadow-lg), var(--primary-glow)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--motion-bounce)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Bot size={26} />
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            zIndex: 995,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            background: 'var(--bg-dark-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'sp-scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--primary-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>StreetPaw AI Medical Bot</h4>
                <span style={{ fontSize: '0.725rem', opacity: 0.9 }}>First-Aid & Triage Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: m.sender === 'user' ? 'var(--primary-gradient)' : 'var(--bg-card)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  border: m.sender === 'bot' ? '1px solid var(--border-subtle)' : 'none',
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask about dog injury or first-aid..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <Button variant="primary" icon={Send} size="sm" onClick={handleSend} />
          </div>
        </div>
      )}
    </>
  );
}
