import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/client'

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
            navigate('/journal')
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed')
        } finally {
            setLoading(false)
        }
    }

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
