import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import './Auth.css';

const Auth = () => {
    const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Read the URL the user was analyzing before being sent to auth
    const returnUrl = location.state?.returnUrl || null;
    const returnKeyword = location.state?.keyword || 'general';
    const returnCountry = location.state?.country || 'global';

    const isEmailValid = /\S+@\S+\.\S+/.test(email);
    const isPasswordValid = password.length >= 6;
    const isConfirmPasswordValid = mode === 'signin' || confirmPassword.length >= 6;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (mode === 'signup' && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
            const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
            const apiUrl = base ? `${base}${endpoint}` : endpoint;

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Authentication failed');
            
            // Save authentication success
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.session) {
                localStorage.setItem('seocalc_token', data.session.access_token);
            }
            
            // If we have a return URL (user came from Dashboard), go back there with the URL in state
            if (returnUrl) {
                navigate('/dashboard', {
                    state: { url: returnUrl, keyword: returnKeyword, country: returnCountry },
                    replace: true
                });
            } else {
                // No return URL — go to home page
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-noise" />
            <div className="auth-gradient" />

            <header className="auth-header">
                <button className="auth-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="auth-brand">
                    <div className="auth-logo-dot" />
                    <span>SEO Calc</span>
                </div>
            </header>

            <main className="auth-main">
                <motion.section
                    className="auth-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <div className="auth-card-header">
                        <div className="auth-chip">
                            <Sparkles size={14} />
                            <span>Unlock full report</span>
                        </div>
                        <h1>{mode === 'signin' ? 'Sign in to see all improvements' : 'Create your free account'}</h1>
                        <p>
                            Save your audits, unlock the full action plan, and track how your SEO, AIO and GEO scores improve over time.
                        </p>
                    </div>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                            onClick={() => setMode('signin')}
                        >
                            Sign in
                        </button>
                        <button
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => setMode('signup')}
                        >
                            Create account
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-field">
                            <span>Email</span>
                            <div className="auth-input-wrap">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </label>

                        <label className="auth-field">
                            <span>Password</span>
                            <div className="auth-input-wrap">
                                <Lock size={18} />
                                <input
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </label>

                        {mode === 'signup' && (
                            <label className="auth-field">
                                <span>Confirm password</span>
                                <div className="auth-input-wrap">
                                    <Lock size={18} />
                                    <input
                                        type="password"
                                        placeholder="Type it again"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </label>
                        )}

                        {error && (
                            <div className="auth-error" style={{ color: 'var(--accent-coral)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || loading}
                        >
                            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign in' : 'Create account')}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </motion.section>

                <section className="auth-side">
                    <div className="auth-side-card">
                        <h2>Why create an account?</h2>
                        <ul>
                            <li>See the full AI-generated improvement roadmap for every audit.</li>
                            <li>Save past audits and compare SEO, AIO and GEO scores over time.</li>
                            <li>Get tailored suggestions for your niche, location and industry.</li>
                        </ul>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Auth;

