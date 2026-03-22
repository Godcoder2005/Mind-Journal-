import { useState, useEffect } from 'react'
import { getFutureLetter, generateFutureLetter, getAllLetters } from '../api/client'
import Loader from '../components/Loader'

export default function FutureLetter() {
    const [letter, setLetter] = useState(null)
    const [archive, setArchive] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [tab, setTab] = useState('current')

    useEffect(() => {
        const init = async () => {
            try {
                const [l, a] = await Promise.all([
                    getFutureLetter(),
                    getAllLetters()
                ])
                setLetter(l.data)
                setArchive(a.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const res = await generateFutureLetter()
            setLetter(res.data)
            // refresh archive
            const a = await getAllLetters()
            setArchive(a.data)
        } catch (err) {
            console.error(err)
        } finally {
            setGenerating(false)
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
                    Future self letter
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex', gap: '4px', background: 'var(--bg)',
                        padding: '4px', borderRadius: '10px',
                        border: '1px solid var(--border)'
                    }}>
                        {['current', 'archive'].map(t => (
                            <div key={t} onClick={() => setTab(t)} style={{
                                padding: '6px 16px', borderRadius: '7px', fontSize: '12px',
                                cursor: 'pointer', transition: 'all 0.15s',
                                background: tab === t ? 'var(--surface2)' : 'transparent',
                                color: tab === t ? 'var(--purple3)' : 'var(--text3)',
                                fontWeight: tab === t ? '500' : '400',
                                textTransform: 'capitalize'
                            }}>
                                {t === 'current' ? 'This month' : 'Archive'}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px 28px' }}>

                {loading && (
                    <Loader text="Loading your letters..." />
                )}

                {/* Current letter tab */}
                {!loading && tab === 'current' && (
                    <div style={{ maxWidth: '640px', margin: '0 auto' }}>

                        {letter?.ready ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Letter card */}
                                <div style={{
                                    background: 'var(--bg2)',
                                    border: '1px solid rgba(138,110,255,0.25)',
                                    borderRadius: '16px', overflow: 'hidden'
                                }}>
                                    {/* Letter header */}
                                    <div style={{
                                        padding: '24px 32px 20px',
                                        borderBottom: '1px solid var(--border)',
                                        background: 'linear-gradient(135deg, rgba(107,79,255,0.08), transparent)'
                                    }}>
                                        <div style={{
                                            fontSize: '10px', color: 'var(--text3)',
                                            textTransform: 'uppercase', letterSpacing: '0.12em',
                                            marginBottom: '8px'
                                        }}>
                                            {letter.month}
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--font-serif)', fontSize: '24px',
                                            color: 'var(--purple3)', fontStyle: 'italic',
                                            marginBottom: '8px'
                                        }}>
                                            {letter.subject || 'A letter from your future self'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                Avg energy this month: {letter.avg_energy}/10
                                            </div>
                                            {letter.mood_of_month && (
                                                <div style={{ fontSize: '11px', color: 'var(--purple3)' }}>
                                                    {letter.mood_of_month}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Letter body */}
                                    <div style={{ padding: '32px' }}>
                                        <div style={{
                                            fontFamily: 'var(--font-serif)',
                                            fontSize: '16px',
                                            color: 'var(--text2)',
                                            lineHeight: '2',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {letter.letter}
                                        </div>
                                    </div>

                                    {/* Letter footer */}
                                    <div style={{
                                        padding: '16px 32px',
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                            Received {letter.created_at}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(letter.letter)
                                                alert('Letter copied to clipboard')
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid var(--border2)',
                                                borderRadius: '8px', padding: '6px 14px',
                                                color: 'var(--text3)', cursor: 'pointer',
                                                fontSize: '11px', fontFamily: 'var(--font-sans)'
                                            }}
                                        >
                                            Copy letter
                                        </button>
                                    </div>
                                </div>

                                {/* Generate new */}
                                <div style={{
                                    padding: '16px 20px',
                                    background: 'var(--bg2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.6' }}>
                                        Letters auto-generate on the 1st of each month.
                                        You can also request one manually.
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        style={{ marginLeft: '16px', whiteSpace: 'nowrap', flexShrink: 0 }}
                                    >
                                        {generating ? 'Writing...' : 'Generate now'}
                                    </button>
                                </div>

                            </div>
                        ) : (
                            /* No letter yet */
                            <div style={{
                                textAlign: 'center', padding: '60px 32px',
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: '16px'
                            }}>
                                <div style={{
                                    fontFamily: 'var(--font-serif)', fontSize: '28px',
                                    color: 'var(--purple3)', marginBottom: '16px',
                                    fontStyle: 'italic'
                                }}>
                                    Your letter is waiting
                                </div>
                                <div style={{
                                    fontSize: '14px', color: 'var(--text3)',
                                    lineHeight: '1.8', marginBottom: '28px',
                                    maxWidth: '420px', margin: '0 auto 28px'
                                }}>
                                    {letter?.message || 'Write at least 5 journal entries this month and your future self will write back.'}
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    style={{ padding: '12px 32px' }}
                                >
                                    {generating ? 'Writing your letter...' : 'Generate my letter →'}
                                </button>
                                {generating && (
                                    <div style={{
                                        marginTop: '16px', fontSize: '12px',
                                        color: 'var(--text3)', fontStyle: 'italic'
                                    }}>
                                        Your future self is reading your entries...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Archive tab */}
                {!loading && tab === 'archive' && (
                    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                        {archive?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    fontSize: '12px', color: 'var(--text3)',
                                    marginBottom: '8px'
                                }}>
                                    {archive.length} letter{archive.length !== 1 ? 's' : ''} from your future self
                                </div>
                                {archive.map((l, i) => (
                                    <div key={i} style={{
                                        background: 'var(--bg2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px', padding: '18px 22px',
                                        cursor: 'pointer', transition: 'border-color 0.15s'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(138,110,255,0.3)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between', marginBottom: '8px'
                                        }}>
                                            <div style={{
                                                fontFamily: 'var(--font-serif)',
                                                fontSize: '16px', color: 'var(--purple3)'
                                            }}>
                                                {l.month}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                {l.created_at}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '13px', color: 'var(--text3)',
                                            fontStyle: 'italic', marginBottom: '10px'
                                        }}>
                                            {l.subject}
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {l.mood_of_month && (
                                                <span style={{
                                                    fontSize: '10px', color: 'var(--purple3)',
                                                    background: 'rgba(138,110,255,0.1)',
                                                    padding: '2px 8px', borderRadius: '10px'
                                                }}>
                                                    {l.mood_of_month}
                                                </span>
                                            )}
                                            {l.avg_energy && (
                                                <span style={{
                                                    fontSize: '10px', color: 'var(--text3)',
                                                    background: 'var(--surface)',
                                                    padding: '2px 8px', borderRadius: '10px'
                                                }}>
                                                    avg {l.avg_energy}/10 energy
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                                    No letters yet
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.7' }}>
                                    Your first letter will appear here after you generate it.
                                    Letters build up over months — each one a snapshot of who you were.
                                </div>
                                <div onClick={() => setTab('current')} style={{
                                    marginTop: '20px', fontSize: '12px',
                                    color: 'var(--purple3)', cursor: 'pointer'
                                }}>
                                    Generate your first letter →
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}