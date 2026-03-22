import { useState, useEffect, useRef } from 'react'
import { chatAlterEgo, clearAlterEgo } from '../api/client'

export default function AlterEgo() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null) // eslint-disable-line no-unused-vars
    const bottomRef = useRef(null)

    const username = localStorage.getItem('username') || 'You'

    useEffect(() => {
        // show welcome message on load
        setStatus('ready')
        setMessages([{
            role: 'assistant',
            content: `I've been reading your entries. I know what weighs on you, what you keep avoiding, and what you actually want. Ask me anything — I'll answer as honestly as you would if you were being completely truthful with yourself.`
        }])
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            const res = await chatAlterEgo({ message: userMsg })
            const data = res.data

            if (!data.ready) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    isSystem: true
                }])
                return
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }])

        } catch (err) {
            console.error(err)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Something went wrong. Try again.',
                isError: true
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleClear = async () => {
        try {
            await clearAlterEgo()
            setMessages([{
                role: 'assistant',
                content: `Conversation cleared. I still remember everything from your journal — I just forgot what we talked about here. Ask me something new.`
            }])
        } catch (err) {
            console.error(err)
        }
    }

    const SUGGESTIONS = [
        'Should I take this opportunity?',
        'Why do I keep procrastinating?',
        'What is my biggest fear right now?',
        'What pattern am I not seeing?'
    ]

    return (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4a3080, var(--purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-serif)', fontSize: '16px',
                        color: 'var(--purple4)', fontStyle: 'italic'
                    }}>
                        A
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text)' }}>
                            Your alter ego
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            built from your journal entries
                        </div>
                    </div>
                </div>
                <button onClick={handleClear} style={{
                    background: 'transparent',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px', padding: '6px 14px',
                    color: 'var(--text3)', cursor: 'pointer',
                    fontSize: '11px', fontFamily: 'var(--font-sans)'
                }}>
                    Clear chat
                </button>
            </div>

            {/* Chat layout */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: '0' }}>

                {/* Messages */}
                <div style={{
                    flex: 1, overflow: 'auto', padding: '24px 28px',
                    display: 'flex', flexDirection: 'column', gap: '16px'
                }}>

                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            gap: '12px', alignItems: 'flex-start'
                        }}>

                            {/* Avatar */}
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                flexShrink: 0, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '12px', fontWeight: '500',
                                background: msg.role === 'user'
                                    ? 'var(--surface2)'
                                    : 'linear-gradient(135deg, #4a3080, var(--purple))',
                                color: msg.role === 'user' ? 'var(--text2)' : 'var(--purple4)',
                                fontFamily: msg.role === 'assistant' ? 'var(--font-serif)' : 'var(--font-sans)',
                                fontStyle: msg.role === 'assistant' ? 'italic' : 'normal'
                            }}>
                                {msg.role === 'user' ? username[0].toUpperCase() : 'A'}
                            </div>

                            {/* Bubble */}
                            <div style={{
                                maxWidth: '72%',
                                padding: '14px 18px',
                                borderRadius: '14px',
                                fontSize: '13px',
                                lineHeight: '1.7',
                                ...(msg.role === 'user' ? {
                                    background: 'rgba(107,79,255,0.18)',
                                    color: 'var(--text)',
                                    borderBottomRightRadius: '4px',
                                    border: '1px solid rgba(138,110,255,0.25)'
                                } : {
                                    background: 'var(--surface)',
                                    color: msg.isSystem ? 'var(--text3)' : 'var(--text2)',
                                    borderBottomLeftRadius: '4px',
                                    border: '1px solid var(--border)',
                                    fontStyle: 'italic'
                                })
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Loading bubble */}
                    {loading && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4a3080, var(--purple))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-serif)', fontSize: '16px',
                                color: 'var(--purple4)', fontStyle: 'italic', flexShrink: 0
                            }}>
                                A
                            </div>
                            <div style={{
                                padding: '14px 18px', borderRadius: '14px',
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderBottomLeftRadius: '4px',
                                display: 'flex', gap: '5px', alignItems: 'center'
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: 'var(--text3)',
                                        animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`
                                    }} />
                                ))}
                                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-4px); opacity: 1; }
                  }
                `}</style>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Right panel — suggestions + info */}
                <div style={{
                    width: '260px', minWidth: '260px',
                    borderLeft: '1px solid var(--border)',
                    background: 'var(--bg2)', padding: '20px',
                    overflow: 'auto', display: 'flex',
                    flexDirection: 'column', gap: '20px'
                }}>

                    {/* Suggestions */}
                    <div>
                        <div style={{
                            fontSize: '10px', color: 'var(--text3)',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            marginBottom: '10px', fontWeight: '500'
                        }}>
                            Ask your alter ego
                        </div>
                        {SUGGESTIONS.map((s, i) => (
                            <div key={i} onClick={() => setInput(s)} style={{
                                fontSize: '12px', color: 'var(--text3)',
                                padding: '9px 12px', borderRadius: '8px',
                                border: '1px solid var(--border)',
                                marginBottom: '6px', cursor: 'pointer',
                                transition: 'all 0.15s', lineHeight: '1.5'
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--purple)'
                                    e.currentTarget.style.color = 'var(--purple3)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border)'
                                    e.currentTarget.style.color = 'var(--text3)'
                                }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>

                    {/* How it works */}
                    <div>
                        <div style={{
                            fontSize: '10px', color: 'var(--text3)',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            marginBottom: '10px', fontWeight: '500'
                        }}>
                            How this works
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.7' }}>
                            Your alter ego was built from your journal entries. It answers as you would — honestly, using your actual patterns, fears, and goals.
                        </div>
                        <div style={{
                            fontSize: '12px', color: 'var(--text3)',
                            lineHeight: '1.7', marginTop: '10px'
                        }}>
                            The more you journal, the more accurately it speaks as you.
                        </div>
                    </div>

                </div>
            </div>

            {/* Input */}
            <div style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg2)',
                display: 'flex', gap: '10px'
            }}>
                <input
                    className="input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask your alter ego anything..."
                    style={{ flex: 1 }}
                />
                <button
                    className="btn-primary"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    style={{ padding: '10px 20px' }}
                >
                    Send
                </button>
            </div>
        </div>
    )
}