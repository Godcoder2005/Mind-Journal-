import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { signup, googleAuth, getOnboardingStatus } from '../api/client'

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

export default function Signup() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!form.email || !form.username || !form.password) {
            setError('Please fill in all fields')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await signup(form)
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('username', res.data.username)
            localStorage.setItem('user_id', res.data.user_id)

            // ← check onboarding before redirecting
            const onboarding = await getOnboardingStatus()
            if (!onboarding.data.complete) {
                navigate('/onboarding')
            } else {
                navigate('/journal')
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true)
        setError('')
        try {
            const res = await googleAuth({ access_token: tokenResponse.access_token })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('username', res.data.username)
            localStorage.setItem('user_id', res.data.user_id)
            
            const onboarding = await getOnboardingStatus()
            if (!onboarding.data.complete) {
                navigate('/onboarding')
            } else {
                navigate('/journal')
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Google sign in failed')
        } finally {
            setLoading(false)
        }
    }

    const startGoogleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError('Google sign in was cancelled or failed')
    })

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '32px',
                        color: 'var(--purple3)',
                        marginBottom: '8px'
                    }}>
                        Mind Mirror
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                        Begin your journey
                    </div>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '22px',
                        marginBottom: '24px',
                        color: 'var(--text)'
                    }}>
                        Create your account
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={() => startGoogleLogin()}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            width: '100%', padding: '12px',
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            borderRadius: '8px', color: 'var(--text)',
                            fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: '500',
                            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '20px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                    >
                        <GoogleIcon />
                        <span>Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        marginBottom: '24px', opacity: 0.5
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</div>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(248,113,113,0.1)',
                            border: '1px solid rgba(248,113,113,0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '12px',
                            color: 'var(--coral)',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@gmail.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    {/* Username */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Username</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="akshith"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '24px' }}>
                        <label className="label">Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {loading ? 'Creating account...' : 'Get started →'}
                    </button>

                    {/* Login link */}
                    <div style={{
                        textAlign: 'center',
                        marginTop: '20px',
                        fontSize: '12px',
                        color: 'var(--text3)'
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--purple3)', textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
