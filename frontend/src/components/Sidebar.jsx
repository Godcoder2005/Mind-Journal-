import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
    { section: 'Journal' },
    { path: '/journal', icon: '✦', label: 'Write' },
    { path: '/dashboard', icon: '◈', label: 'Dashboard' },
    { section: 'Features' },
    { path: '/energy', icon: '◉', label: 'Energy tracker' },
    { path: '/alter-ego', icon: '◎', label: 'Alter ego' },
    { path: '/checkin', icon: '◇', label: 'Nightly checkin' },
    { path: '/letter', icon: '❋', label: 'Future letter' },
]

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const username = localStorage.getItem('username') || 'You'
    const token = localStorage.getItem('token')    // ← add this line

    const logout = () => {
        localStorage.clear()
        navigate('/login')
    }

    return (
        <div style={{
            width: '220px', minWidth: '220px',
            background: 'var(--bg2)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 0'
        }}>
            {/* Logo — unchanged */}
            <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--purple3)' }}>
                    Mind Mirror
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                    Your inner companion
                </div>
            </div>

            {/* Nav — unchanged */}
            {NAV.map((item, i) => {
                if (item.section) {
                    return (
                        <div key={i} style={{
                            fontSize: '9px', textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: 'var(--text3)',
                            padding: '16px 20px 6px', fontWeight: '500'
                        }}>
                            {item.section}
                        </div>
                    )
                }

                const active = location.pathname === item.path

                return (
                    <div key={i} onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 20px', cursor: 'pointer',
                            borderLeft: active ? '2px solid var(--purple)' : '2px solid transparent',
                            background: active ? 'rgba(138,110,255,0.08)' : 'transparent',
                            color: active ? 'var(--purple3)' : 'var(--text3)',
                            fontSize: '13px', transition: 'all 0.15s'
                        }}
                    >
                        <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                        {item.label}
                    </div>
                )
            })}

            {/* User — this section changes */}
            <div style={{
                marginTop: 'auto', padding: '16px 20px',
                borderTop: '1px solid var(--border)'
            }}>
                {token ? (
                    // ── logged in — existing UI unchanged ────────────
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--purple2), var(--purple))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '500', color: 'white'
                            }}>
                                {username[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{username}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>journaling daily</div>
                            </div>
                        </div>
                        <div onClick={logout} style={{
                            fontSize: '11px', color: 'var(--text3)',
                            cursor: 'pointer', padding: '4px 0'
                        }}>
                            Sign out
                        </div>
                    </>
                ) : (
                    // ── not logged in — show auth links ───────────────
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                            fontSize: '11px', color: 'var(--text3)',
                            marginBottom: '4px', lineHeight: '1.5'
                        }}>
                            Save your entries
                        </div>
                        <div onClick={() => navigate('/login')} style={{
                            fontSize: '12px', color: 'var(--purple3)',
                            cursor: 'pointer', padding: '4px 0'
                        }}>
                            Sign in →
                        </div>
                        <div onClick={() => navigate('/signup')} style={{
                            fontSize: '12px', color: 'var(--text3)',
                            cursor: 'pointer', padding: '4px 0'
                        }}>
                            Create account
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
// ```

// Only two things changed vs your existing file:
// ```
// 1. const token = localStorage.getItem('token')  ← added line 5
// 2. User section at bottom                        ← wrapped in token ? ... : ...
//    logged in → exact same UI you had
//    not logged in → sign in + create account links