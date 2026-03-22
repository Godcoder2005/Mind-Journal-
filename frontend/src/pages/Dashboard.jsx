import { useState, useEffect } from 'react'
import { getFullEnergyTracker, getOnboardingProfile } from '../api/client'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getEnergyColor = (score) => {
    if (score >= 7.5) return '#4ade80'
    if (score >= 5) return '#8a6eff'
    if (score >= 3.5) return '#fbbf24'
    return '#f87171'
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: '8px', padding: '8px 12px',
                fontSize: '12px', color: 'var(--text2)'
            }}>
                <div style={{ color: 'var(--text)', marginBottom: '4px' }}>{label}</div>
                <div>Energy: {payload[0].value}/10</div>
            </div>
        )
    }
    return null
}

// ── Day 1 Profile Card ────────────────────────────────────
function Day1ProfileCard({ profile }) {
    const toneColor = {
        positive: 'var(--green)',
        negative: 'var(--coral)',
        mixed: 'var(--amber)',
        neutral: 'var(--text3)'
    }[profile.emotional_tone] || 'var(--text3)'

    const energyColor = getEnergyColor(profile.baseline_energy)

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(107,79,255,0.10), rgba(138,110,255,0.03))',
            border: '1px solid rgba(138,110,255,0.25)',
            borderRadius: '16px', padding: '24px 28px',
            marginBottom: '20px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                    <div style={{
                        fontSize: '10px', color: 'var(--text3)',
                        textTransform: 'uppercase', letterSpacing: '0.10em',
                        marginBottom: '6px'
                    }}>
                        Your profile so far
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: '15px',
                        color: 'var(--text2)', lineHeight: '1.6', maxWidth: '520px',
                        fontStyle: 'italic'
                    }}>
                        "{profile.one_line_summary}"
                    </div>
                </div>
                <div style={{
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '10px', fontWeight: '500',
                    background: `${toneColor}18`,
                    border: `1px solid ${toneColor}40`,
                    color: toneColor, whiteSpace: 'nowrap'
                }}>
                    {profile.emotional_tone}
                </div>
            </div>

            {/* Stats grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px', marginBottom: '16px'
            }}>
                {/* Baseline energy */}
                <div style={{
                    background: 'var(--surface)', borderRadius: '12px',
                    padding: '14px 16px'
                }}>
                    <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Baseline energy
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: '28px',
                        color: energyColor, marginBottom: '4px'
                    }}>
                        {profile.baseline_energy}<span style={{ fontSize: '14px', color: 'var(--text3)' }}>/10</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>predicted from your answers</div>
                </div>

                {/* Energy drainer */}
                <div style={{
                    background: 'rgba(248,113,113,0.06)',
                    border: '1px solid rgba(248,113,113,0.15)',
                    borderRadius: '12px', padding: '14px 16px'
                }}>
                    <div style={{ fontSize: '9px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Energy drainer
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', fontWeight: '500' }}>
                        {profile.energy_drainer}
                    </div>
                </div>

                {/* Key person */}
                <div style={{
                    background: 'rgba(138,110,255,0.06)',
                    border: '1px solid rgba(138,110,255,0.15)',
                    borderRadius: '12px', padding: '14px 16px'
                }}>
                    <div style={{ fontSize: '9px', color: 'var(--purple3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Key person
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', fontWeight: '500' }}>
                        {profile.key_person}
                    </div>
                </div>
            </div>

            {/* Goal + Top of mind row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                    padding: '12px 14px',
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.15)',
                    borderRadius: '10px'
                }}>
                    <div style={{ fontSize: '9px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                        Primary goal
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                        {profile.primary_goal}
                    </div>
                </div>
                <div style={{
                    padding: '12px 14px',
                    background: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    borderRadius: '10px'
                }}>
                    <div style={{ fontSize: '9px', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                        On your mind
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                        {profile.top_of_mind}
                    </div>
                </div>
            </div>

            {/* Good vs bad day */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '9px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                        Good day looks like
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6' }}>
                        {profile.good_day_looks_like}
                    </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                        Bad day looks like
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6' }}>
                        {profile.bad_day_looks_like}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text3)' }}>
                This profile updates as you journal — write your first entry to start learning your real patterns.
            </div>
        </div>
    )
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [noEntries, setNoEntries] = useState(false)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await getFullEnergyTracker()
                setData(res.data)
                const totalEntries = res.data?.summary?.total_entries || 0
                if (totalEntries === 0) {
                    setNoEntries(true)
                    const p = await getOnboardingProfile()
                    if (p.data?.ready) setProfile(p.data)
                }
            } catch (err) {
                // no entries yet — load profile
                setNoEntries(true)
                try {
                    const p = await getOnboardingProfile()
                    if (p.data?.ready) setProfile(p.data)
                } catch { }
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    const summary = data?.summary || {}
    const chartData = summary.peak_day
        ? DAYS.map(day => ({
            day,
            energy: data?.dna?.raw_data?.day_map?.[day]?.avg_energy || 0
        })).filter(d => d.energy > 0)
        : []

    return (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)'
            }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>Dashboard</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
            </div>

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
                        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Loading your data...</div>
                    </div>
                )}

                {!loading && (
                    <>
                        {profile && [dna, forecast, villain, golden, streak].every(x => !x?.ready) && (
                            <Day1EnergyBaseline profile={profile} />
                        )}

                        {/* Day 1 profile card — only when no entries */}
                        {noEntries && profile && <Day1ProfileCard profile={profile} />}

                        {/* No entries prompt */}
                        {noEntries && !profile && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: '14px' }}>
                                Write your first journal entry to unlock your dashboard.
                            </div>
                        )}

                        {/* Normal dashboard — only when entries exist */}
                        {data && !noEntries && (
                            <>
                                {/* Stat cards */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '16px', marginBottom: '20px'
                                }}>
                                    {[
                                        { label: 'Total entries', value: summary.total_entries || 0, sub: 'journal entries' },
                                        { label: 'Peak day', value: summary.peak_day || '—', sub: 'highest energy' },
                                        { label: 'Low day', value: summary.low_day || '—', sub: 'needs protection' },
                                        { label: 'Consistency', value: summary.consistency || '—', sub: 'energy stability' }
                                    ].map((stat, i) => (
                                        <div key={i} className="card">
                                            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                {stat.label}
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--text)', fontWeight: '400', marginBottom: '4px' }}>
                                                {stat.value}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{stat.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

                                    <div className="card">
                                        <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', fontWeight: '500' }}>
                                            Energy by day of week
                                        </div>
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={180}>
                                                <BarChart data={chartData} barSize={28}>
                                                    <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis domain={[0, 10]} tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                                                        {chartData.map((entry, i) => (
                                                            <Cell key={i} fill={getEnergyColor(entry.energy)} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '40px 0', textAlign: 'center' }}>
                                                Write more entries to see your energy pattern
                                            </div>
                                        )}
                                    </div>

                                    <div className="card" style={{
                                        background: 'linear-gradient(135deg, rgba(107,79,255,0.12), rgba(138,110,255,0.04))',
                                        border: '1px solid rgba(138,110,255,0.25)'
                                    }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: '500' }}>
                                            Your energy DNA
                                        </div>
                                        {data.dna?.ready ? (
                                            <>
                                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--purple3)', marginBottom: '6px' }}>
                                                    {data.dna.dna_type}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text2)', fontStyle: 'italic', marginBottom: '16px', lineHeight: '1.6' }}>
                                                    {data.dna.dna_tagline}
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                    {[{ label: 'Superpower', value: data.dna.superpower }, { label: 'Blind spot', value: data.dna.blind_spot }].map((item, i) => (
                                                        <div key={i} style={{ flex: 1, minWidth: '120px' }}>
                                                            <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{item.label}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.5' }}>{item.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ padding: '20px 0' }}>
                                                <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px' }}>
                                                    {data.dna?.message || 'Keep journaling to unlock your DNA'}
                                                </div>
                                                {data.dna?.progress !== undefined && (
                                                    <>
                                                        <div style={{ background: 'var(--surface)', borderRadius: '4px', height: '4px', marginBottom: '6px' }}>
                                                            <div style={{ background: 'var(--purple)', borderRadius: '4px', height: '4px', width: `${(data.dna.progress / data.dna.required) * 100}%`, transition: 'width 0.5s' }} />
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{data.dna.progress} / {data.dna.required} entries</div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="card">
                                        <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                            Tomorrow's forecast
                                        </div>
                                        {data.forecast?.ready ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '36px' }}>
                                                        {data.forecast.weather_label === 'Sunny' ? '☀️' : data.forecast.weather_label === 'Radiant' ? '✨' : data.forecast.weather_label === 'Partly Sunny' ? '⛅' : data.forecast.weather_label === 'Cloudy' ? '☁️' : '⛈'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text)' }}>{data.forecast.weather_label}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{data.forecast.predicted_energy}/10 · {data.forecast.tomorrow}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6', padding: '10px 12px', background: 'rgba(138,110,255,0.06)', borderRadius: '8px', borderLeft: '2px solid var(--purple)', borderTopLeftRadius: '0', borderBottomLeftRadius: '0' }}>
                                                    {data.forecast.advice}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '20px 0' }}>
                                                {data.forecast?.message || 'Write more entries to unlock forecast'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card">
                                        <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '500' }}>
                                            Energy streak
                                        </div>
                                        {data.streak?.ready ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                                                    <div style={{
                                                        fontFamily: 'var(--font-serif)', fontSize: '48px',
                                                        color: data.streak.streak_status === 'on_streak' ? 'var(--green)' : data.streak.streak_status === 'in_slump' ? 'var(--coral)' : 'var(--text)',
                                                        lineHeight: '1'
                                                    }}>
                                                        {data.streak.current_streak}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>day streak</div>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>{data.streak.streak_message}</div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '20px 0' }}>
                                                {data.streak?.message || 'Write more entries to track your streak'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}