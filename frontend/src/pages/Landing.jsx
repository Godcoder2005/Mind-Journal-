import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const QUOTES = [
    { text: "The most common form of despair is not being who you are.", author: "— Søren Kierkegaard" },
    { text: "Your visions will become clear only when you can look into your own heart.", author: "— Carl Jung" },
    { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "— Anne Lamott" },
    { text: "The privilege of a lifetime is to become who you truly are.", author: "— Carl Jung" },
    { text: "You cannot travel the path until you have become the path itself.", author: "— Buddha" },
]

const MOODS = [
    { emoji: '🔥', label: 'Thriving' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '🪫', label: 'Drained' },
    { emoji: '🌀', label: 'Lost' },
    { emoji: '😤', label: 'Angry' },
    { emoji: '🌱', label: 'Hopeful' },
]

export default function Landing() {
    const navigate = useNavigate()
    const [quoteIdx, setQuoteIdx] = useState(0)
    const [fadeIn, setFadeIn] = useState(true)
    const [selected, setSelected] = useState(null)

    // rotate quotes
    useEffect(() => {
        const interval = setInterval(() => {
            setFadeIn(false)
            setTimeout(() => {
                setQuoteIdx(i => (i + 1) % QUOTES.length)
                setFadeIn(true)
            }, 300)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const handleMoodSelect = (mood) => {
        setSelected(mood)
    }

    const handleStart = () => {
        navigate('/journal')
    }

    const q = QUOTES[quoteIdx]

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>

            {/* Nav */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 40px',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '20px', color: 'var(--purple3)'
                }}>
                    Mind Mirror
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/login')} style={{
                        padding: '8px 18px', borderRadius: '10px',
                        border: '1px solid var(--border2)',
                        background: 'transparent', color: 'var(--purple3)',
                        fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)'
                    }}>
                        Sign in
                    </button>
                    <button onClick={() => navigate('/signup')} className="btn-primary">
                        Start for free →
                    </button>
                </div>
            </div>

            {/* Hero */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px', textAlign: 'center',
                position: 'relative', overflow: 'hidden'
            }}>

                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: '-100px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '600px', height: '400px',
                    background: 'radial-gradient(ellipse, rgba(107,79,255,0.15) 0%, transparent 65%)',
                    pointerEvents: 'none'
                }} />

                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '5px 14px', borderRadius: '20px',
                    border: '1px solid rgba(138,110,255,0.3)',
                    background: 'rgba(138,110,255,0.08)',
                    fontSize: '11px', color: 'var(--purple3)',
                    marginBottom: '20px', fontFamily: 'var(--font-mono)'
                }}>
                    <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--purple3)',
                        animation: 'pulse 2s infinite'
                    }} />
                    AI journaling · 2026
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '52px', fontWeight: '400',
                    lineHeight: '1.1', marginBottom: '14px',
                    letterSpacing: '-1px', color: 'var(--text)'
                }}>
                    Your journal.<br />
                    <span style={{ color: 'var(--purple3)', fontStyle: 'italic' }}>
                        Your mirror.
                    </span>
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: '15px', color: 'var(--text2)',
                    maxWidth: '440px', lineHeight: '1.7',
                    marginBottom: '24px'
                }}>
                    Not just a diary. An AI that reads between the lines — detecting your energy patterns, what drains you, and who you're becoming.
                </p>

                {/* Quote card */}
                <div style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '14px', padding: '18px 24px',
                    maxWidth: '440px', width: '100%',
                    marginBottom: '28px', textAlign: 'left',
                    opacity: fadeIn ? 1 : 0,
                    transition: 'opacity 0.3s'
                }}>
                    <div style={{
                        fontSize: '14px', color: 'var(--text2)',
                        lineHeight: '1.7', fontStyle: 'italic',
                        marginBottom: '8px', fontFamily: 'var(--font-serif)'
                    }}>
                        "{q.text}"
                    </div>
                    <div style={{
                        fontSize: '10px', color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        {q.author}
                    </div>
                </div>

                {/* Emoji mood picker */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        fontSize: '10px', color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                        marginBottom: '12px'
                    }}>
                        HOW ARE YOU FEELING RIGHT NOW?
                    </div>
                    <div style={{
                        display: 'flex', gap: '8px',
                        flexWrap: 'wrap', justifyContent: 'center'
                    }}>
                        {MOODS.map((mood, i) => (
                            <div
                                key={i}
                                onClick={() => handleMoodSelect(mood)}
                                title={mood.label}
                                style={{
                                    width: '52px', height: '52px',
                                    borderRadius: '14px',
                                    border: selected?.label === mood.label
                                        ? '1px solid var(--purple)'
                                        : '1px solid var(--border)',
                                    background: selected?.label === mood.label
                                        ? 'rgba(138,110,255,0.15)'
                                        : 'var(--bg2)',
                                    cursor: 'pointer', fontSize: '22px',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    transform: selected?.label === mood.label
                                        ? 'translateY(-3px) scale(1.1)'
                                        : 'none'
                                }}
                            >
                                {mood.emoji}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                {selected ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '8px'
                    }}>
                        <button
                            onClick={handleStart}
                            style={{
                                padding: '13px 36px',
                                borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg, var(--purple2), #c026d3)',
                                color: 'white', fontSize: '15px',
                                fontFamily: 'var(--font-sans)', fontWeight: '500',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            I feel {selected.label} — tell me more →
                        </button>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            No account needed · Free to start
                        </div>
                    </div>
                ) : (
                    <button onClick={handleStart} className="btn-primary"
                        style={{ padding: '12px 32px', fontSize: '14px' }}>
                        Start journaling →
                    </button>
                )}

            </div>

            {/* Features strip */}
            <div style={{
                display: 'flex', justifyContent: 'center', gap: '32px',
                padding: '16px 40px', borderTop: '1px solid var(--border)',
                flexWrap: 'wrap'
            }}>
                {[
                    { icon: '⚡', text: 'Energy DNA' },
                    { icon: '👁️', text: 'Alter ego' },
                    { icon: '🔥', text: 'Streak system' },
                    { icon: '❋', text: 'Future self letter' },
                    { icon: '🌙', text: 'Nightly checkin' },
                ].map((f, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', color: 'var(--text3)'
                    }}>
                        <span style={{ fontSize: '14px' }}>{f.icon}</span>
                        {f.text}
                    </div>
                ))}
            </div>

        </div>
    )
}