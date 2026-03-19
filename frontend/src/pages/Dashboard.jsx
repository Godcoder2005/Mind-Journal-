import { useState, useEffect } from 'react'
import { getFullEnergyTracker } from '../api/client'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, LineChart, Line
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
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--text2)'
            }}>
                <div style={{ color: 'var(--text)', marginBottom: '4px' }}>{label}</div>
                <div>Energy: {payload[0].value}/10</div>
            </div>
        )
    }
    return null
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getFullEnergyTracker()
                setData(res.data)
            } catch (err) {
                setError('Write more entries to unlock your dashboard')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const summary = data?.summary || {}

    // format day map for chart
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
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                    Dashboard
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Loading your data...</div>
                    </div>
                )}

                {error && !loading && (
                    <div style={{
                        textAlign: 'center', padding: '60px 0',
                        color: 'var(--text3)', fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {data && !loading && (
                    <>
                        {/* Stat cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>
                            {[
                                {
                                    label: 'Total entries',
                                    value: summary.total_entries || 0,
                                    sub: 'journal entries'
                                },
                                {
                                    label: 'Peak day',
                                    value: summary.peak_day || '—',
                                    sub: 'highest energy'
                                },
                                {
                                    label: 'Low day',
                                    value: summary.low_day || '—',
                                    sub: 'needs protection'
                                },
                                {
                                    label: 'Consistency',
                                    value: summary.consistency || '—',
                                    sub: 'energy stability'
                                }
                            ].map((stat, i) => (
                                <div key={i} className="card">
                                    <div style={{
                                        fontSize: '10px', color: 'var(--text3)',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '8px'
                                    }}>
                                        {stat.label}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-serif)',
                                        fontSize: '26px', color: 'var(--text)',
                                        fontWeight: '400', marginBottom: '4px'
                                    }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                        {stat.sub}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>

                            {/* Energy by day chart */}
                            <div className="card">
                                <div style={{
                                    fontSize: '10px', color: 'var(--text3)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    marginBottom: '16px', fontWeight: '500'
                                }}>
                                    Energy by day of week
                                </div>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={chartData} barSize={28}>
                                            <XAxis
                                                dataKey="day"
                                                tick={{ fill: 'var(--text3)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[0, 10]}
                                                tick={{ fill: 'var(--text3)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={24}
                                            />
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

                            {/* DNA card */}
                            <div className="card" style={{
                                background: 'linear-gradient(135deg, rgba(107,79,255,0.12), rgba(138,110,255,0.04))',
                                border: '1px solid rgba(138,110,255,0.25)'
                            }}>
                                <div style={{
                                    fontSize: '10px', color: 'var(--text3)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    marginBottom: '12px', fontWeight: '500'
                                }}>
                                    Your energy DNA
                                </div>

                                {data.dna?.ready ? (
                                    <>
                                        <div style={{
                                            fontFamily: 'var(--font-serif)',
                                            fontSize: '24px', color: 'var(--purple3)',
                                            marginBottom: '6px'
                                        }}>
                                            {data.dna.dna_type}
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: 'var(--text2)',
                                            fontStyle: 'italic', marginBottom: '16px',
                                            lineHeight: '1.6'
                                        }}>
                                            {data.dna.dna_tagline}
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            {[
                                                { label: 'Superpower', value: data.dna.superpower },
                                                { label: 'Blind spot', value: data.dna.blind_spot }
                                            ].map((item, i) => (
                                                <div key={i} style={{ flex: 1, minWidth: '120px' }}>
                                                    <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.5' }}>
                                                        {item.value}
                                                    </div>
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
                                                <div style={{
                                                    background: 'var(--surface)',
                                                    borderRadius: '4px', height: '4px', marginBottom: '6px'
                                                }}>
                                                    <div style={{
                                                        background: 'var(--purple)',
                                                        borderRadius: '4px', height: '4px',
                                                        width: `${(data.dna.progress / data.dna.required) * 100}%`,
                                                        transition: 'width 0.5s'
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                    {data.dna.progress} / {data.dna.required} entries
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>

                            {/* Forecast */}
                            <div className="card">
                                <div style={{
                                    fontSize: '10px', color: 'var(--text3)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    marginBottom: '14px', fontWeight: '500'
                                }}>
                                    Tomorrow's forecast
                                </div>

                                {data.forecast?.ready ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '36px' }}>
                                                {data.forecast.weather_label === 'Sunny' ? '☀️' :
                                                    data.forecast.weather_label === 'Radiant' ? '✨' :
                                                        data.forecast.weather_label === 'Partly Sunny' ? '⛅' :
                                                            data.forecast.weather_label === 'Cloudy' ? '☁️' : '⛈'}
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text)' }}>
                                                    {data.forecast.weather_label}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                    {data.forecast.predicted_energy}/10 · {data.forecast.tomorrow}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: 'var(--text2)',
                                            lineHeight: '1.6', padding: '10px 12px',
                                            background: 'rgba(138,110,255,0.06)',
                                            borderRadius: '8px',
                                            borderLeft: '2px solid var(--purple)',
                                            borderTopLeftRadius: '0',
                                            borderBottomLeftRadius: '0'
                                        }}>
                                            {data.forecast.advice}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '20px 0' }}>
                                        {data.forecast?.message || 'Write more entries to unlock forecast'}
                                    </div>
                                )}
                            </div>

                            {/* Streak */}
                            <div className="card">
                                <div style={{
                                    fontSize: '10px', color: 'var(--text3)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    marginBottom: '14px', fontWeight: '500'
                                }}>
                                    Energy streak
                                </div>

                                {data.streak?.ready ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{
                                                fontFamily: 'var(--font-serif)',
                                                fontSize: '48px',
                                                color: data.streak.streak_status === 'on_streak' ? 'var(--green)' :
                                                    data.streak.streak_status === 'in_slump' ? 'var(--coral)' : 'var(--text)',
                                                lineHeight: '1'
                                            }}>
                                                {data.streak.current_streak}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                                day streak
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                                            {data.streak.streak_message}
                                        </div>
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
            </div>
        </div>
    )
}