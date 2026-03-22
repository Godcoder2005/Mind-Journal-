import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getOnboardingStatus } from '../api/client'

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token')
    const [checking, setChecking] = useState(true)
    const [needsOnboarding, setNeedsOnboarding] = useState(false)

    useEffect(() => {
        if (!token) {
            setChecking(false)
            return
        }
        getOnboardingStatus()
            .then(res => {
                if (!res.data.complete) setNeedsOnboarding(true)
            })
            .catch(() => { })
            .finally(() => setChecking(false))
    }, [token])

    if (checking) return null
    if (needsOnboarding) return <Navigate to="/onboarding" replace />
    return children
}
// ```

// ---

// Now the complete flow is:
// ```
// New user signs up
//       ↓
// Token saved to localStorage
//       ↓
// Check /auth/onboarding/status
//       ↓
// complete: false → redirect to /onboarding
//       ↓
// User answers 5 questions
//       ↓
// complete: true → redirect to /journal
//       ↓
// Knowledge graph pre-populated
// Alter Ego has a head start