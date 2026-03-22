import { useState, useEffect } from 'react'
import { getCheckinStatus, submitCheckin, getWeeklyReport } from '../api/client'
import Loader from '../components/Loader'

const QUESTIONS = [
    {
        id: 'best_moment',
        text: 'What was the best moment of today?',
        placeholder: 'Something good that happened...',
        required: true,
        color: 'var(--green)'
    },
    {
        id: 'reaction_moment',
        text: 'Was there a moment you reacted instead of responded?',
        placeholder: 'Optional — be honest with yourself...',
        required: false,
        color: 'var(--amber)'
    },
    {
        id: 'patience_test',
        text: 'What or who tested your patience today?',
        placeholder: 'Optional...',
        required: false,
        color: 'var(--coral)'
    },
    {
        id: 'blame_target',
        text: 'Did you catch yourself blaming someone — or yourself?',
        placeholder: 'Optional...',
        required: false,
        color: 'var(--purple3)'
    },
    {
        id: 'tomorrow_intention',
        text: 'One thing you want to do differently tomorrow?',
        placeholder: 'A small intention for tomorrow...',
        required: false,
        color: 'var(--teal)'
    }
]

export default function NightlyCheckin() {
    const [status, setStatus] = useState(null)
    const [answers, setAnswers] = useState({})
    const [result, setResult] = useState(null)
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [tab, setTab] = useState('checkin')

    useEffect(() => {
        const init = async () => {
            try {
                const [s, r] = await Promise.all([
                    getCheckinStatus(),
                    getWeeklyReport()
                ])
                setStatus(s.data)
                setReport(r.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleSubmit = async () => {
        if (!answers.best_moment?.trim()) {
            alert('Please answer the first question')
            return
        }
        setSubmitting(true)
        try {
            const res = await submitCheckin(answers)
            setResult(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
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
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                    Nightly checkin
                </div>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    {['checkin', 'report'].map(t => (
                        <div key={t} onClick={() => setTab(t)} style={{
                            padding: '6px 16px', borderRadius: '7px', fontSize: '12px',
                            cursor: 'pointer', transition: 'all 0.15s',
                            background: tab === t ? 'var(--surface2)' : 'transparent',
                            color: tab === t ? 'var(--purple3)' : 'var(--text3)',
                            fontWeight: tab === t ? '500' : '400',
                            textTransform: 'capitalize'
                        }}>
                            {t === 'checkin' ? 'Tonight' : 'Weekly report'}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px' }}>

                {loading && (
                    <Loader text="Loading check-in..." />
                )}

                {/* Checkin tab */}
                {!loading && tab === 'checkin' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                        {/* Already checked in */}
                        {status?.checked_in_today && !result && (
                            <div style={{
                                textAlign: 'center', padding: '48px 24px',
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: '16px'
                            }}>
                                <div style={{ fontSize: '36px', marginBottom: '16px' }}>✓</div>
                                <div style={{
                                    fontFamily: 'var(--font-serif)', fontSize: '22px',
                                    color: 'var(--text)', marginBottom: '10px'
                                }}>
                                    You've checked in today
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.7' }}>
                                    Come back tomorrow evening. Your streak is building.
                                </div>
                                <div onClick={() => setTab('report')} style={{
                                    marginTop: '20px', fontSize: '12px',
                                    color: 'var(--purple3)', cursor: 'pointer'
                                }}>
                                    View your weekly report →
                                </div>
                            </div>
                        )}

                        {/* Result after submitting */}
                        {result && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{
                                    background: 'var(--bg2)', border: '1px solid var(--border)',
                                    borderRadius: '16px', padding: '28px 32px'
                                }}>
                                    <div style={{
                                        fontSize: '10px', color: 'var(--text3)',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                        marginBottom: '14px', fontWeight: '500'
                                    }}>
                                        Tonight's reflection
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-serif)', fontSize: '17px',
                                        color: 'var(--text)', lineHeight: '1.8', fontStyle: 'italic'
                                    }}>
                                        "{result.emotional_pattern}"
                                    </div>
                                </div>

                                {result.nudge && (
                                    <div style={{
                                        padding: '18px 22px',
                                        background: 'rgba(138,110,255,0.06)',
                                        border: '1px solid rgba(138,110,255,0.2)',
                                        borderLeft: '3px solid var(--purple)',
                                        borderRadius: '12px',
                                        borderTopLeftRadius: '0',
                                        borderBottomLeftRadius: '0'
                                    }}>
                                        <div style={{
                                            fontSize: '10px', color: 'var(--purple3)',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: '8px', fontWeight: '500'
                                        }}>
                                            For tomorrow
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7' }}>
                                            {result.nudge}
                                        </div>
                                    </div>
                                )}

                                {result.weekly_insight && (
                                    <div style={{
                                        padding: '18px 22px',
                                        background: 'rgba(251,191,36,0.06)',
                                        border: '1px solid rgba(251,191,36,0.2)',
                                        borderLeft: '3px solid var(--amber)',
                                        borderRadius: '12px',
                                        borderTopLeftRadius: '0',
                                        borderBottomLeftRadius: '0'
                                    }}>
                                        <div style={{
                                            fontSize: '10px', color: 'var(--amber)',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: '8px', fontWeight: '500'
                                        }}>
                                            Weekly pattern
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7' }}>
                                            {result.weekly_insight}
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 18px',
                                    background: 'var(--bg2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                        Day {result.streak} of your checkin streak
                                    </div>
                                    <div style={{
                                        fontSize: '12px', color: 'var(--purple3)',
                                        cursor: 'pointer'
                                    }} onClick={() => setTab('report')}>
                                        View weekly report →
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Checkin form */}
                        {!status?.checked_in_today && !result && (
                            <div style={{
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: '16px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '20px 24px 16px',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <div style={{
                                        fontFamily: 'var(--font-serif)', fontSize: '18px',
                                        color: 'var(--text)', marginBottom: '4px'
                                    }}>
                                        2 minutes for yourself
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                        Answer honestly — only you see this
                                    </div>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    {QUESTIONS.map((q) => (
                                        <div key={q.id} style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '8px', marginBottom: '8px'
                                            }}>
                                                <div style={{
                                                    width: '4px', height: '16px',
                                                    borderRadius: '2px',
                                                    background: q.color
                                                }} />
                                                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '400' }}>
                                                    {q.text}
                                                    {!q.required && (
                                                        <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: '6px' }}>
                                                            optional
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <textarea
                                                value={answers[q.id] || ''}
                                                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                placeholder={q.placeholder}
                                                rows={2}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border2)',
                                                    borderRadius: '10px',
                                                    padding: '10px 14px',
                                                    color: 'var(--text)',
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '13px',
                                                    lineHeight: '1.6',
                                                    resize: 'none',
                                                    outline: 'none',
                                                    transition: 'border-color 0.15s'
                                                }}
                                                onFocus={e => e.target.style.borderColor = q.color}
                                                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                                            />
                                        </div>
                                    ))}

                                    <button
                                        className="btn-primary"
                                        onClick={handleSubmit}
                                        disabled={submitting || !answers.best_moment?.trim()}
                                        style={{ width: '100%', padding: '12px' }}
                                    >
                                        {submitting ? 'Reflecting...' : 'Submit checkin →'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Weekly report tab */}
                {!loading && tab === 'report' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        {report?.ready ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Summary card */}
                                <div className="card">
                                    <div style={{
                                        fontSize: '10px', color: 'var(--text3)',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                        marginBottom: '14px', fontWeight: '500'
                                    }}>
                                        This week
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-serif)', fontSize: '16px',
                                        color: 'var(--text)', lineHeight: '1.8',
                                        fontStyle: 'italic', marginBottom: '16px'
                                    }}>
                                        "{report.summary}"
                                    </div>

                                    {/* Stats */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '12px'
                                    }}>
                                        {[
                                            { label: 'Checkins', value: report.completion_rate, color: 'var(--purple3)' },
                                            { label: 'Reaction days', value: report.reaction_days, color: 'var(--amber)' },
                                            { label: 'Patience tested', value: report.patience_days, color: 'var(--coral)' }
                                        ].map((stat, i) => (
                                            <div key={i} style={{
                                                background: 'var(--surface)',
                                                borderRadius: '10px', padding: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    fontFamily: 'var(--font-serif)',
                                                    fontSize: '24px', color: stat.color, marginBottom: '4px'
                                                }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                                                    {stat.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Triggers */}
                                {report.triggers?.length > 0 && (
                                    <div className="card">
                                        <div style={{
                                            fontSize: '10px', color: 'var(--text3)',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: '12px', fontWeight: '500'
                                        }}>
                                            What tested your patience this week
                                        </div>
                                        {report.triggers.map((t, i) => (
                                            <div key={i} style={{
                                                fontSize: '13px', color: 'var(--text2)',
                                                padding: '10px 0',
                                                borderBottom: i < report.triggers.length - 1
                                                    ? '1px solid var(--border)' : 'none',
                                                display: 'flex', alignItems: 'flex-start', gap: '10px'
                                            }}>
                                                <div style={{
                                                    width: '4px', height: '4px', borderRadius: '50%',
                                                    background: 'var(--coral)', marginTop: '7px', flexShrink: 0
                                                }} />
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Best moments */}
                                {report.best_moments?.length > 0 && (
                                    <div className="card">
                                        <div style={{
                                            fontSize: '10px', color: 'var(--text3)',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: '12px', fontWeight: '500'
                                        }}>
                                            Best moments this week
                                        </div>
                                        {report.best_moments.map((m, i) => (
                                            <div key={i} style={{
                                                fontSize: '13px', color: 'var(--text2)',
                                                padding: '10px 0',
                                                borderBottom: i < report.best_moments.length - 1
                                                    ? '1px solid var(--border)' : 'none',
                                                display: 'flex', alignItems: 'flex-start', gap: '10px'
                                            }}>
                                                <div style={{
                                                    width: '4px', height: '4px', borderRadius: '50%',
                                                    background: 'var(--green)', marginTop: '7px', flexShrink: 0
                                                }} />
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '60px 24px',
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: '16px'
                            }}>
                                <div style={{
                                    fontFamily: 'var(--font-serif)', fontSize: '20px',
                                    color: 'var(--text)', marginBottom: '10px'
                                }}>
                                    Your weekly report is building
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.7', marginBottom: '16px' }}>
                                    {report?.message || 'Complete 3 nightly checkins to unlock your weekly report'}
                                </div>
                                {report?.current !== undefined && (
                                    <>
                                        <div style={{
                                            background: 'var(--surface)', borderRadius: '4px',
                                            height: '4px', maxWidth: '200px', margin: '0 auto 8px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                background: 'var(--purple)', height: '4px',
                                                width: `${(report.current / report.needed) * 100}%`,
                                                transition: 'width 0.5s', borderRadius: '4px'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                            {report.current} / {report.needed} checkins
                                        </div>
                                    </>
                                )}
                                <div onClick={() => setTab('checkin')} style={{
                                    marginTop: '20px', fontSize: '12px',
                                    color: 'var(--purple3)', cursor: 'pointer'
                                }}>
                                    Do tonight's checkin →
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}