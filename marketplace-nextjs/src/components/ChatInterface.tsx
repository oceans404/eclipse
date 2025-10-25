'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
}

interface ChatInterfaceProps {
  contentId: string;
  productId: string;
  productTitle: string;
}

export function ChatInterface({
  contentId,
  productId,
  productTitle,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        tokensUsed: data.tokens_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '400px',
        border: '1px solid #e0e0e0',
        backgroundColor: '#fafaf8',
        overflow: 'hidden',
      }}
    >
      {/* Simplified Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f3',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: '#D97757',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          🌜
        </div>
        <div>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
              letterSpacing: '-0.01em',
              marginBottom: '0.125rem',
            }}
          >
            Eclipse AI Assistant
          </h3>
          <p
            style={{
              fontSize: '0.7rem',
              color: '#666',
              fontFamily: 'var(--font-inter)',
            }}
          >
            This AI assistant analyzes the encrypted content and answers your
            questions to make you feel more confident in this purchase.
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 && !isLoading && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#999',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxWidth: '350px',
                margin: '0 auto',
              }}
            >
              <button
                onClick={() =>
                  handleSubmit({ preventDefault: () => {} } as any)
                }
                onMouseDown={() => setInput('What is this content about?')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafaf8',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-inter)',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D97757';
                  e.currentTarget.style.backgroundColor = '#f5f5f3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#fafaf8';
                }}
              >
                💭 "What is this content about?"
              </button>
              <button
                onClick={() =>
                  handleSubmit({ preventDefault: () => {} } as any)
                }
                onMouseDown={() => setInput('What type of file is this?')}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafaf8',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-inter)',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D97757';
                  e.currentTarget.style.backgroundColor = '#f5f5f3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#fafaf8';
                }}
              >
                📁 "What type of file is this?"
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor:
                  message.role === 'user' ? '#f5f5f3' : '#D97757',
                color: message.role === 'user' ? '#666' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
                border: message.role === 'user' ? '1px solid #e0e0e0' : 'none',
              }}
            >
              {message.role === 'user' ? '👤' : '🌜'}
            </div>

            {/* Message Content */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: message.role === 'user' ? '#666' : '#D97757',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {message.role === 'user' ? 'You' : 'Eclipse AI'}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    color: '#999',
                  }}
                >
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.tokensUsed && (
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.7rem',
                      color: '#999',
                    }}
                  >
                    {message.tokensUsed} tokens
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: '#1a1a1a',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: '#D97757',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              🌜
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#D97757',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Eclipse AI
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#D97757',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#D97757',
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: '#D97757',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '1rem',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fff5f5',
              color: '#d32f2f',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-inter)',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1.5rem',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f3',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this content..."
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              padding: '0.875rem',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fafaf8',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 200ms',
              minHeight: '2.75rem',
              maxHeight: '8rem',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#D97757';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary"
            style={{
              padding: '0.875rem 2rem',
              fontSize: '0.875rem',
              opacity: !input.trim() || isLoading ? 0.5 : 1,
              cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Animation for loading dots */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
