import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOnboardingStatus, submitOnboardingAnswer } from '../api/client'

const SARCASTIC_INTROS = [
    "So... you're a mystery. Even to yourself.",
    "We just met. Let's fix that.",
    "You showed up. That's already more than most people do.",
    "An AI that knows nothing about you is just a chatbot. Let's change that.",
    "5 questions. That's all. We've seen people figure out their entire personality in less.",
    "Don't worry — we're not your ex. We actually want to understand you.",
    "Your future self sent us. They said you needed this.",
]

export default function Onboarding() {
    const navigate = useNavigate()
    const [question, setQuestion] = useState('')
    const [step, setStep] = useState(1)
    const [total, setTotal] = useState(5)
    const [progress, setProgress] = useState(0)
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [intro] = useState(() =>
        SARCASTIC_INTROS[Math.floor(Math.random() * SARCASTIC_INTROS.length)]
    )

    useEffect(() => { fetchNext() }, [])

    const fetchNext = async () => {
        try {
            const res = await getOnboardingStatus()
            const data = res.data
            if (data.complete) { navigate('/journal'); return }
            setQuestion(data.question)
            setStep(data.step)
            setTotal(data.total)
            setProgress(data.progress)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!answer.trim()) return
        setSubmitting(true)
        try {
            const res = await submitOnboardingAnswer({ question, answer: answer.trim() })
            const data = res.data
            if (data.is_done) {
                setDone(true)
                setTimeout(() => navigate('/journal'), 2500)
            } else {
                setQuestion(data.next_question)
                setStep(data.step)
                setAnswer('')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '36px', height: '36px',
                border: '2px solid var(--border2)',
                borderTop: '2px solid var(--purple)',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (done) return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '24px'
        }}>
            <div style={{ fontSize: '48px' }}>✨</div>
            <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--purple3)'
            }}>
                Now we're talking.
            </div>
            <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '16px',
                color: 'var(--text2)', fontStyle: 'italic', maxWidth: '360px', lineHeight: '1.7'
            }}>
                "The journey of self-discovery begins with a single honest answer."
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>
                Your alter ego is waking up...
            </div>
        </div>
    )

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{ width: '100%', maxWidth: '520px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: '24px',
                        color: 'var(--purple3)', marginBottom: '16px'
                    }}>
                        Mind Mirror
                    </div>

                    {/* Sarcastic intro */}
                    <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border2)',
                        borderRadius: '14px', padding: '16px 20px',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            fontSize: '10px', color: 'var(--text3)',
                            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            letterSpacing: '0.08em', marginBottom: '8px'
                        }}>
                            Hey, new here?
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-serif)', fontSize: '18px',
                            color: 'var(--text)', lineHeight: '1.6', fontStyle: 'italic'
                        }}>
                            "{intro}"
                        </div>
                    </div>

                    <div style={{
                        fontSize: '12px', color: 'var(--text3)',
                        lineHeight: '1.7', maxWidth: '400px', margin: '0 auto'
                    }}>
                        We're about to ask you 5 quick questions.
                        Answer honestly — the more real you are, the smarter your AI gets.
                        No judgment. We've heard worse.
                    </div>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '28px 32px' }}>

                    {/* Progress */}
                    <div style={{ marginBottom: '22px' }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '11px', color: 'var(--text3)', marginBottom: '8px'
                        }}>
                            <span>Question {step} of {total}</span>
                            <span>{Math.round((progress / total) * 100)}% done</span>
                        </div>
                        <div style={{
                            background: 'var(--surface)', borderRadius: '4px',
                            height: '4px', overflow: 'hidden'
                        }}>
                            <div style={{
                                background: 'var(--purple)', height: '4px',
                                borderRadius: '4px',
                                width: `${(progress / total) * 100}%`,
                                transition: 'width 0.5s'
                            }} />
                        </div>
                    </div>

                    {/* Question */}
                    <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: '20px',
                        color: 'var(--text)', lineHeight: '1.5', marginBottom: '6px'
                    }}>
                        {question}
                    </div>
                    <div style={{
                        fontSize: '11px', color: 'var(--text3)',
                        marginBottom: '16px', fontStyle: 'italic'
                    }}>
                        {step === 1 && "Be real. We're not here to judge — we're here to remember."}
                        {step === 2 && "The thing you keep avoiding? That's probably this one."}
                        {step === 3 && "People shape us more than we admit. This matters."}
                        {step === 4 && "Your energy villains are about to get named."}
                        {step === 5 && "Last one. Make it count."}
                    </div>

                    {/* Textarea */}
                    <textarea
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Take your time — be honest with yourself..."
                        rows={4}
                        style={{
                            width: '100%', background: 'var(--surface)',
                            border: '1px solid var(--border2)', borderRadius: '10px',
                            padding: '14px 16px', color: 'var(--text)',
                            fontFamily: 'var(--font-sans)', fontSize: '14px',
                            lineHeight: '1.7', resize: 'none', outline: 'none',
                            marginBottom: '18px', transition: 'border-color 0.15s',
                            caretColor: 'var(--purple)'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
                    />

                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting || !answer.trim()}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {submitting ? 'Saving...' : step === total ? 'Finish →' : 'Next →'}
                    </button>

                    <div style={{
                        textAlign: 'center', marginTop: '12px',
                        fontSize: '11px', color: 'var(--text3)'
                    }}>
                        Cmd + Enter to continue · Your answers are completely private
                    </div>
                </div>

            </div>
        </div>
    )
}