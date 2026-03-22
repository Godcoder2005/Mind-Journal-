import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getOnboardingStatus } from '../api/client'

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token')
    const [checking, setChecking] = useState(true)
    const [needsOnboarding, setNeedsOnboarding] = useState(false)

    useEffect(() => {
        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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