import { useState, useEffect } from 'react'
import {
    getEnergyDNA, getEnergyForecast,
    getEnergyVillain, getGoldenHours, getEnergyStreak
} from '../api/client'

export default function EnergyTracker() {
    const [dna, setDna] = useState(null)
    const [forecast, setForecast] = useState(null)
    const [villain, setVillain] = useState(null)
    const [golden, setGolden] = useState(null)
    const [streak, setStreak] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [d, f, v, g, s] = await Promise.all([
                    getEnergyDNA(),
                    getEnergyForecast(),
                    getEnergyVillain(),
                    getGoldenHours(),
                    getEnergyStreak()
                ])
                setDna(d.data)
                setForecast(f.data)
                setVillain(v.data)
                setGolden(g.data)
                setStreak(s.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    return (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)'
            }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                    Energy tracker
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    powered by {streak?.ready ? streak.personal_avg + '/10 avg' : 'your entries'}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            border: '2px solid var(--border2)',
                            borderTop: '2px solid var(--purple)',
                            borderRadius: '50%', margin: '0 auto 16px',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                            Analyzing your energy patterns...
                        </div>
                    </div>
                )}

                {!loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* DNA Card — full width */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(107,79,255,0.15), rgba(138,110,255,0.04))',
                            border: '1px solid rgba(138,110,255,0.3)',
                            borderRadius: '16px', padding: '24px 28px'
                        }}>
                            <div style={{
                                fontSize: '9px', textTransform: 'uppercase',
                                letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: '10px'
                            }}>
                                Your energy DNA
                            </div>

                            {dna?.ready ? (
                                <>
                                    <div style={{
                                        fontFamily: 'var(--font-serif)', fontSize: '32px',
                                        color: 'var(--purple3)', marginBottom: '6px'
                                    }}>
                                        {dna.dna_type}
                                    </div>
                                    <div style={{
                                        fontSize: '13px', color: 'var(--text2)',
                                        fontStyle: 'italic', marginBottom: '20px'
                                    }}>
                                        {dna.dna_tagline}
                                    </div>

                                    {/* Stats row */}
                                    <div style={{ display: 'flex', gap: '28px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Peak day', value: dna.peak_day },
                                            { label: 'Low day', value: dna.low_day },
                                            { label: 'Peak hours', value: dna.peak_hour },
                                            {
                                                label: 'Consistency', value: dna.consistency,
                                                color: dna.consistency === 'stable' ? 'var(--green)' :
                                                    dna.consistency === 'moderate' ? 'var(--amber)' : 'var(--coral)'
                                            },
                                            {
                                                label: 'Recovery', value: dna.recovery_speed,
                                                color: dna.recovery_speed === 'fast' ? 'var(--green)' :
                                                    dna.recovery_speed === 'medium' ? 'var(--amber)' : 'var(--coral)'
                                            }
                                        ].map((stat, i) => (
                                            <div key={i}>
                                                <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                                    {stat.label}
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-serif)', fontSize: '18px',
                                                    color: stat.color || 'var(--text)'
                                                }}>
                                                    {stat.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary */}
                                    <div style={{
                                        fontSize: '13px', color: 'var(--text2)',
                                        lineHeight: '1.7', marginBottom: '16px'
                                    }}>
                                        {dna.dna_summary}
                                    </div>

                                    {/* Superpower + Blind spot */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{
                                            background: 'rgba(74,222,128,0.08)',
                                            border: '1px solid rgba(74,222,128,0.2)',
                                            borderRadius: '10px', padding: '14px'
                                        }}>
                                            <div style={{ fontSize: '10px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                                Superpower
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                                                {dna.superpower}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'rgba(248,113,113,0.08)',
                                            border: '1px solid rgba(248,113,113,0.2)',
                                            borderRadius: '10px', padding: '14px'
                                        }}>
                                            <div style={{ fontSize: '10px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                                Blind spot
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                                                {dna.blind_spot}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Share button */}
                                    <button
                                        onClick={() => {
                                            const text = `My Energy DNA is "${dna.dna_type}"\n${dna.dna_tagline}\nPeak: ${dna.peak_day} | Low: ${dna.low_day}\nSuperpower: ${dna.superpower}\n#MindMirror`
                                            navigator.clipboard.writeText(text)
                                            alert('Copied to clipboard!')
                                        }}
                                        style={{
                                            marginTop: '16px',
                                            background: 'transparent',
                                            border: '1px solid var(--border2)',
                                            borderRadius: '8px', padding: '8px 16px',
                                            color: 'var(--text3)', cursor: 'pointer',
                                            fontSize: '11px', fontFamily: 'var(--font-sans)'
                                        }}
                                    >
                                        Copy to share ↗
                                    </button>
                                </>
                            ) : (
                                <NotReady data={dna} />
                            )}
                        </div>

                        {/* Row 2 — Forecast + Villain */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                            {/* Forecast */}
                            <div className="card">
                                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                    Tomorrow's forecast
                                </div>

                                {forecast?.ready ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                            <div style={{ fontSize: '44px' }}>
                                                {forecast.weather_label === 'Sunny' ? '☀️' :
                                                    forecast.weather_label === 'Radiant' ? '✨' :
                                                        forecast.weather_label === 'Partly Sunny' ? '⛅' :
                                                            forecast.weather_label === 'Cloudy' ? '☁️' : '⛈'}
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text)' }}>
                                                    {forecast.weather_label}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                                                    {forecast.predicted_energy}/10 · {forecast.tomorrow} · {forecast.confidence} confidence
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7',
                                            padding: '12px', background: 'rgba(138,110,255,0.06)',
                                            borderRadius: '8px', borderLeft: '2px solid var(--purple)',
                                            borderTopLeftRadius: '0', borderBottomLeftRadius: '0',
                                            marginBottom: forecast.villain_warning ? '10px' : '0'
                                        }}>
                                            {forecast.advice}
                                        </div>
                                        {forecast.villain_warning && (
                                            <div style={{
                                                fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7',
                                                padding: '10px 12px', background: 'rgba(248,113,113,0.06)',
                                                borderRadius: '8px', borderLeft: '2px solid var(--coral)',
                                                borderTopLeftRadius: '0', borderBottomLeftRadius: '0',
                                                marginTop: '8px'
                                            }}>
                                                {forecast.villain_warning}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <NotReady data={forecast} />
                                )}
                            </div>

                            {/* Villain */}
                            <div className="card">
                                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                    Energy villain
                                </div>

                                {villain?.ready && villain?.villain_found ? (
                                    <>
                                        <div style={{
                                            fontFamily: 'var(--font-serif)', fontSize: '22px',
                                            color: 'var(--coral)', marginBottom: '4px'
                                        }}>
                                            {villain.villain_name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                                            Drops your energy by {villain.energy_impact} points on average
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '10px' }}>
                                            {villain.pattern_summary}
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7',
                                            padding: '10px 12px', background: 'rgba(248,113,113,0.06)',
                                            borderRadius: '8px', borderLeft: '2px solid var(--coral)',
                                            borderTopLeftRadius: '0', borderBottomLeftRadius: '0'
                                        }}>
                                            {villain.advice}
                                        </div>
                                    </>
                                ) : (
                                    <NotReady data={villain} />
                                )}
                            </div>
                        </div>

                        {/* Row 3 — Golden Hours + Streak */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                            {/* Golden Hours */}
                            <div className="card">
                                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                    Golden hours
                                </div>

                                {golden?.ready ? (
                                    <>
                                        <div style={{
                                            fontSize: '11px', color: 'var(--amber)',
                                            marginBottom: '12px', lineHeight: '1.6'
                                        }}>
                                            {golden.time_type}
                                        </div>
                                        <div style={{ marginBottom: '14px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px' }}>
                                                Peak windows
                                            </div>
                                            {golden.peak_windows?.map((w, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '6px 0',
                                                    borderBottom: i < golden.peak_windows.length - 1 ? '1px solid var(--border)' : 'none'
                                                }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                                                        {w.window}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--amber)' }}>
                                                        {w.avg_energy}/10
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6',
                                            padding: '10px 12px', background: 'rgba(251,191,36,0.06)',
                                            borderRadius: '8px', borderLeft: '2px solid var(--amber)',
                                            borderTopLeftRadius: '0', borderBottomLeftRadius: '0'
                                        }}>
                                            {golden.advice}
                                        </div>
                                    </>
                                ) : (
                                    <NotReady data={golden} />
                                )}
                            </div>

                            {/* Streak */}
                            <div className="card">
                                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                    Energy streak
                                </div>

                                {streak?.ready ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                                            <div style={{
                                                fontFamily: 'var(--font-serif)', fontSize: '56px', lineHeight: '1',
                                                color: streak.streak_status === 'on_streak' ? 'var(--green)' :
                                                    streak.streak_status === 'in_slump' ? 'var(--coral)' :
                                                        streak.streak_status === 'recovering' ? 'var(--amber)' : 'var(--text)'
                                            }}>
                                                {streak.current_streak}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>day streak</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                    best: {streak.longest_streak} days
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '10px' }}>
                                            {streak.streak_message}
                                        </div>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            fontSize: '11px', color: 'var(--text3)'
                                        }}>
                                            <span>Personal avg: {streak.personal_avg}/10</span>
                                            {streak.slump_alert && (
                                                <span style={{ color: 'var(--coral)' }}>Slump alert</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <NotReady data={streak} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Reusable not-ready component
function NotReady({ data }) {
    return (
        <div style={{ padding: '16px 0' }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', lineHeight: '1.6' }}>
                {data?.message || 'Write more entries to unlock this feature'}
            </div>
            {data?.progress !== undefined && (
                <>
                    <div style={{
                        background: 'var(--surface)', borderRadius: '4px',
                        height: '4px', marginBottom: '6px', overflow: 'hidden'
                    }}>
                        <div style={{
                            background: 'var(--purple)', borderRadius: '4px', height: '4px',
                            width: `${Math.min((data.progress / data.required) * 100, 100)}%`,
                            transition: 'width 0.5s'
                        }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {data.progress} / {data.required} entries
                    </div>
                </>
            )}
        </div>
    )
}