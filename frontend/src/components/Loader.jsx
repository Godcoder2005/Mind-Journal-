import React from 'react';

export default function Loader({ text = "Loading your data..." }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', padding: '100px 0'
        }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', marginBottom: '24px' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    border: '2px solid rgba(138,110,255,0.1)',
                    borderTop: '2px solid var(--purple)',
                    borderRadius: '50%',
                    animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
                }} />
                <div style={{
                    position: 'absolute', inset: '8px',
                    border: '2px solid rgba(138,110,255,0.1)',
                    borderBottom: '2px solid var(--purple3)',
                    borderRadius: '50%',
                    animation: 'spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite reverse'
                }} />
                <div style={{
                    position: 'absolute', inset: '18px',
                    background: 'var(--purple)',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite',
                    boxShadow: '0 0 15px rgba(138,110,255,0.6)'
                }} />
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 
                    0%, 100% { transform: scale(0.8); opacity: 0.6; } 
                    50% { transform: scale(1.1); opacity: 1; } 
                }
            `}</style>
            <div style={{
                fontSize: '13px', color: 'var(--purple3)', 
                letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'normal',
                fontWeight: '500', animation: 'pulse 2s ease-in-out infinite'
            }}>
                {text}
            </div>
        </div>
    );
}
