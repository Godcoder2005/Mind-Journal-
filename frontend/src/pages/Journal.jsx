import { useState, useEffect } from 'react'
import { submitEntry } from '../api/client'

export default function Journal() {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [insight, setInsight] = useState(null)
    const [error, setError] = useState('')
    const [words, setWords] = useState(0)

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    })

    useEffect(() => {
        const count = text.trim().split(/\s+/).filter(w => w).length
        setWords(text.trim() ? count : 0)
    }, [text])

    const handleSubmit = async () => {
        if (!text.trim() || words < 3) {
            setError('Write at least a few words first')
            return
        }
        setLoading(true)
        setError('')
        setInsight(null)
        try {
            const res = await submitEntry({ query: text })
            setInsight(res.data.insight)
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)'
            }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text)' }}>
                    Write
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {dateStr}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px', maxWidth: '720px', width: '100%', margin: '0 auto' }}>

                {/* Not submitted yet — show editor */}
                {!insight && (
                    <div style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: '16px', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Editor header */}
                        <div style={{
                            padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-serif)', fontSize: '16px',
                                fontStyle: 'italic', color: 'var(--purple3)'
                            }}>
                                {dateStr}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                                {words} words
                            </div>
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="What's on your mind today..."
                            style={{
                                minHeight: '320px', background: 'transparent',
                                border: 'none', outline: 'none', color: 'var(--text)',
                                fontFamily: 'var(--font-sans)', fontSize: '15px',
                                lineHeight: '1.8', padding: '24px', resize: 'none',
                                caretColor: 'var(--purple)'
                            }}
                        />

                        {/* Writing prompts */}
                        <div style={{ padding: '0 24px 16px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Need a prompt?
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    'What is weighing on me today?',
                                    'What did I learn this week?',
                                    'When did I feel most like myself?'
                                ].map((prompt, i) => (
                                    <div key={i} onClick={() => setText(prompt + ' ')} style={{
                                        fontSize: '11px', color: 'var(--text3)',
                                        padding: '4px 10px', borderRadius: '20px',
                                        border: '1px solid var(--border2)', cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                        onMouseEnter={e => { e.target.style.color = 'var(--purple3)'; e.target.style.borderColor = 'var(--purple)' }}
                                        onMouseLeave={e => { e.target.style.color = 'var(--text3)'; e.target.style.borderColor = 'var(--border2)' }}
                                    >
                                        {prompt}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px', borderTop: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            {error
                                ? <div style={{ fontSize: '12px', color: 'var(--coral)' }}>{error}</div>
                                : <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                    {loading ? 'Reading your entry...' : 'This is your safe space'}
                                </div>
                            }
                            <button className="btn-primary" onClick={handleSubmit} disabled={loading || !text.trim()}>
                                {loading ? 'Reflecting...' : 'Reflect →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            border: '2px solid var(--border2)',
                            borderTop: '2px solid var(--purple)',
                            borderRadius: '50%', margin: '0 auto 20px',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <div style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>
                            Reading what you wrote...
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Insight — only reflection + nudge shown */}
                {insight && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Reflection */}
                        <div style={{
                            background: 'var(--bg2)', border: '1px solid var(--border)',
                            borderRadius: '16px', padding: '28px 32px'
                        }}>
                            <div style={{
                                fontSize: '10px', textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--text3)',
                                marginBottom: '16px', fontWeight: '500'
                            }}>
                                Mind Mirror reflects
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-serif)', fontSize: '18px',
                                color: 'var(--text)', lineHeight: '1.8',
                                fontStyle: 'italic'
                            }}>
                                "{insight.reflection}"
                            </div>
                        </div>

                        {/* Nudge */}
                        <div style={{
                            background: 'rgba(138,110,255,0.06)',
                            border: '1px solid rgba(138,110,255,0.2)',
                            borderRadius: '14px', padding: '20px 24px',
                            borderLeft: '3px solid var(--purple)'
                        }}>
                            <div style={{
                                fontSize: '10px', textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--purple3)',
                                marginBottom: '10px', fontWeight: '500'
                            }}>
                                One thing for today
                            </div>
                            <div style={{
                                fontSize: '14px', color: 'var(--text2)', lineHeight: '1.7'
                            }}>
                                {insight.nudge}
                            </div>
                        </div>

                        {/* Write again */}
                        <button onClick={() => { setText(''); setInsight(null) }} style={{
                            background: 'transparent',
                            border: '1px solid var(--border2)',
                            borderRadius: '10px', padding: '12px',
                            color: 'var(--text3)', cursor: 'pointer',
                            fontSize: '12px', fontFamily: 'var(--font-sans)',
                            transition: 'all 0.15s', width: '100%'
                        }}
                            onMouseEnter={e => e.target.style.color = 'var(--text2)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
                        >
                            Write another entry
                        </button>

                    </div>
                )}
            </div>
        </div>
    )
}