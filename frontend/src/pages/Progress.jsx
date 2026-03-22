import { useState, useEffect } from 'react'
import { getUserStats, getOnboardingProfile } from '../api/client'

export default function Progress() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getUserStats()
                setStats(res.data)
                if (res.data.entry_count === 0) {
                    try {
                        const p = await getOnboardingProfile()
                        if (p.data?.ready) setProfile(p.data)
                    } catch { }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
                width: '36px', height: '36px',
                border: '2px solid var(--border2)',
                borderTop: '2px solid var(--purple)',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    if (!stats) return null

    const { level_info, streak, badges, active_dates, entry_count, checkin_count } = stats

    const today = new Date()
    const days = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (27 - i))
        return d.toISOString().split('T')[0]
    })

    return (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)'
            }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>
                    Your progress
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px',
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        borderRadius: '8px', fontSize: '12px', color: 'var(--amber)', fontWeight: '500'
                    }}>
                        🔥 {streak} day streak
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px',
                        background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.2)',
                        borderRadius: '20px', fontSize: '12px',
                        color: 'var(--green)', fontFamily: 'var(--font-mono)'
                    }}>
                        ⚡ {level_info.xp} XP
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Level card */}
                    <div style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: '16px', padding: '20px 24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, var(--purple2), #c026d3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-serif)', fontWeight: '400',
                                fontSize: '20px', color: 'white'
                            }}>
                                {level_info.level}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: 'var(--font-serif)', fontSize: '20px',
                                    color: 'var(--text)', marginBottom: '2px'
                                }}>
                                    {level_info.level_name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                    {level_info.xp} XP
                                    {level_info.next_level && ` · ${level_info.xp_to_next} XP to ${level_info.next_level}`}
                                </div>
                            </div>
                        </div>

                        {/* XP bar */}
                        <div style={{
                            height: '6px', background: 'var(--surface2)',
                            borderRadius: '3px', overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%', borderRadius: '3px',
                                background: 'linear-gradient(90deg, var(--purple2), #c026d3)',
                                width: `${level_info.progress_pct}%`,
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                        {[
                            { label: 'Journal entries', value: entry_count, icon: '✦' },
                            { label: 'Nightly checkins', value: checkin_count, icon: '◇' },
                            { label: 'Day streak', value: streak, icon: '🔥' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: 'var(--bg2)', border: '1px solid var(--border)',
                                borderRadius: '12px', padding: '14px 16px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '16px', marginBottom: '6px' }}>{s.icon}</div>
                                <div style={{
                                    fontFamily: 'var(--font-serif)', fontSize: '24px',
                                    color: 'var(--text)', marginBottom: '4px'
                                }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Day 1 goal card — only when no entries */}
                    {profile && entry_count === 0 && (
                        <div style={{
                            background: 'var(--bg2)', border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: '14px', padding: '18px 20px'
                        }}>
                            <div style={{
                                fontSize: '11px', color: '#4ade80',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                marginBottom: '14px', fontWeight: '500'
                            }}>
                                Your starting point
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{
                                    padding: '12px 14px',
                                    background: 'rgba(74,222,128,0.06)',
                                    border: '1px solid rgba(74,222,128,0.15)',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{
                                        fontSize: '9px', color: '#4ade80',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '5px'
                                    }}>
                                        Goal you keep coming back to
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>
                                        {profile.primary_goal}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '12px 14px',
                                    background: 'rgba(251,191,36,0.06)',
                                    border: '1px solid rgba(251,191,36,0.15)',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{
                                        fontSize: '9px', color: 'var(--amber)',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '5px'
                                    }}>
                                        What's on your mind
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>
                                        {profile.top_of_mind}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text3)' }}>
                                Journal your first entry to start tracking progress toward this goal.
                            </div>
                        </div>
                    )}

                    {/* Streak calendar */}
                    <div style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '18px 20px'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '12px'
                        }}>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Activity — last 28 days
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                {active_dates.length} active days
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '5px' }}>
                            {days.map((day, i) => {
                                const isActive = active_dates.includes(day)
                                const isToday = day === today.toISOString().split('T')[0]
                                return (
                                    <div key={i} title={day} style={{
                                        aspectRatio: '1', borderRadius: '6px',
                                        background: isToday ? 'var(--purple2)'
                                            : isActive ? 'rgba(138,110,255,0.35)'
                                                : 'var(--surface2)',
                                        border: isToday ? '1px solid var(--purple)' : 'none',
                                        transition: 'all 0.2s'
                                    }} />
                                )
                            })}
                        </div>
                        <div style={{
                            display: 'flex', gap: '12px', marginTop: '10px',
                            justifyContent: 'flex-end'
                        }}>
                            {[
                                { color: 'var(--surface2)', label: 'No entry' },
                                { color: 'rgba(138,110,255,0.35)', label: 'Active' },
                                { color: 'var(--purple2)', label: 'Today' }
                            ].map((l, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text3)' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color }} />
                                    {l.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges */}
                    <div style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '18px 20px'
                    }}>
                        <div style={{
                            fontSize: '11px', color: 'var(--text3)',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            marginBottom: '14px', fontWeight: '500'
                        }}>
                            Badges
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                            {badges.map((badge, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 14px',
                                    background: badge.unlocked ? 'var(--surface)' : 'transparent',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    opacity: badge.unlocked ? 1 : 0.35,
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '20px' }}>{badge.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '500' }}>
                                            {badge.name}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                                            {badge.desc}
                                        </div>
                                    </div>
                                    {badge.unlocked && (
                                        <div style={{
                                            marginLeft: 'auto', fontSize: '10px',
                                            color: 'var(--green)', fontFamily: 'var(--font-mono)'
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}