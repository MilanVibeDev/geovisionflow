import { motion } from 'framer-motion';
import { Globe, MapPin, Navigation, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const GeoInsights = () => {
    return (
        <div className="main-content">
            <nav className="navbar">
                <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                    <Zap className="gradient-text" /> SEO Calc
                </Link>
                <div className="nav-links">
                    <Link to="/#features" className="nav-link">Features</Link>
                    <Link to="/geo-insights" className="nav-link" style={{ color: 'var(--primary)', fontWeight: 600 }}>GEO Insights</Link>
                    <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
                </div>
            </nav>

            <section className="hero" style={{ minHeight: '60vh', padding: '6rem 2rem 4rem' }}>
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--accent-mint)', padding: '1rem', borderRadius: '50%' }}>
                            <Globe size={48} />
                        </div>
                    </div>
                    <h1>Master Your <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-mint) 0%, var(--primary) 100%)' }}>Local Market</span> Presence</h1>
                    <p className="hero-subtitle" style={{ margin: '1.5rem auto 2.5rem' }}>
                        Geographic SEO optimization helps you dominate search results in your target countries and regions. Understand local intent and capture high-converting traffic.
                    </p>
                    <Link to="/" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={20} /> Analyze Your Website
                    </Link>
                </motion.div>
            </section>

            <section className="features-section" style={{ background: 'var(--bg-main)', padding: '5rem 2rem' }}>
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 className="section-title">Why Geo-Targeting Matters</h2>
                    <p className="hero-subtitle" style={{ margin: '0 auto' }}>Localized search results require localized strategies.</p>
                </div>

                <div className="features-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div className="feature-card" whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                            <MapPin size={24} />
                        </div>
                        <h3 className="feature-title">Local Intent Matching</h3>
                        <p className="feature-desc">Search engines prioritize results physically closer to the user. We help you signal your relevance to specific regions effectively.</p>
                    </motion.div>

                    <motion.div className="feature-card" whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--accent-mint)' }}>
                            <Navigation size={24} />
                        </div>
                        <h3 className="feature-title">Hreflang & Meta Precision</h3>
                        <p className="feature-desc">Ensure your international sites don't compete against each other. Proper tags direct users to their localized version seamlessly.</p>
                    </motion.div>

                    <motion.div className="feature-card" whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="feature-title">Higher Conversion Rates</h3>
                        <p className="feature-desc">Users are up to 3x more likely to convert when landing on a page optimized for their language, currency, and culture.</p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default GeoInsights;
