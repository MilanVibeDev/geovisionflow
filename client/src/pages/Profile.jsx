import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import './Auth.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/auth'); // Redirect to login if not logged in
        }
    }, [navigate]);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('seocalc_token');
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="auth-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-noise" />
            <div className="auth-gradient" />

            <header className="auth-header" style={{ width: '100%', position: 'absolute', top: 0, padding: '2rem' }}>
                <button className="auth-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="auth-brand">
                    <div className="auth-logo-dot" />
                    <span>SEO Calc</span>
                </div>
            </header>

            <main className="auth-main" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
                <motion.section
                    className="auth-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ width: '100%', padding: '2.5rem' }}
                >
                    <div className="auth-card-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.9 }}>
                                <User size={36} />
                            </div>
                        </div>
                        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>My Account</h1>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Manage your profile and settings.</p>
                    </div>

                    <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                            <div className="auth-input-wrap" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '1rem' }}>{user.email}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="btn auth-submit"
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                width: '100%', 
                                padding: '1rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                color: 'var(--accent-coral)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                borderRadius: '8px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                transition: 'all 0.2s',
                                marginTop: '1rem'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                            }}
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </motion.section>
            </main>
        </div>
    );
};

export default Profile;
