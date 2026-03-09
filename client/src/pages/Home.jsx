import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Zap, Globe, Cpu, BarChart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Particles } from '@/components/ui/particles';
import FAQs from '@/components/ui/text-reveal-faqs';


const Home = () => {
    const [url, setUrl] = useState('');
    const navigate = useNavigate();

    const handleAnalyze = (e) => {
        e.preventDefault();
        if (!url) return;

        let target = url.trim();
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
            target = 'https://' + target;
        }

        navigate('/dashboard', { state: { url: target } });
    };

    return (
        <div className="main-content">
            {/* Navbar */}
            <nav className="navbar relative z-10">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Zap className="gradient-text" /> SEO Calc
                </Link>
                <div className="nav-links">
                    <a href="/#features" className="nav-link">Features</a>
                    <a href="/#faq" className="nav-link">FAQ</a>
                    <button className="btn btn-primary" onClick={() => document.getElementById('urlInput').focus()}>Get Started</button>
                </div>

            </nav>

            {/* Hero Section */}
            <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
                <Particles
                    className="absolute inset-0 pointer-events-none z-0"
                    quantity={100}
                    ease={80}
                    color="#4F46E5"
                    refresh
                />
                <motion.div
                    className="hero-content relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1>Know How <span className="gradient-text" style={{ fontFamily: '"Birthstone", cursive', fontWeight: 400, fontStyle: 'normal', fontSize: '1.25em' }}>AI & Google</span> See Your Website.</h1>
                    <p className="hero-subtitle">
                        Get instant AI visibility scores, technical SEO audits, and custom improvement roadmaps to dominate search.
                    </p>

                    <form className="analyze-form" onSubmit={handleAnalyze}>
                        <Search color="var(--text-light)" style={{ alignSelf: 'center', marginLeft: '0.5rem' }} />
                        <input
                            id="urlInput"
                            type="text"
                            className="url-input"
                            placeholder="Enter your website URL (e.g., example.com)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            Analyze <ArrowRight size={18} />
                        </button>
                    </form>
                </motion.div>

                <motion.div
                    className="hero-mockup relative z-10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {/* Mockup Placeholder Graphic */}
                    <div style={{ padding: '2rem', background: '#FAFBFF', height: '100%', minHeight: '300px' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'white', flex: 1, height: '100px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1rem', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.1, marginRight: '1rem' }}></div>
                                <div>
                                    <div style={{ width: '80px', height: '10px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '8px' }}></div>
                                    <div style={{ width: '120px', height: '15px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                                </div>
                            </div>
                            <div style={{ background: 'white', flex: 1, height: '100px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1rem', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--secondary)', borderRadius: '50%', opacity: 0.1, marginRight: '1rem' }}></div>
                                <div>
                                    <div style={{ width: '80px', height: '10px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '8px' }}></div>
                                    <div style={{ width: '60px', height: '15px', background: 'var(--secondary)', borderRadius: '4px' }}></div>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'white', height: '150px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1.5rem' }}>
                            <div style={{ width: '100%', height: '15px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '1rem' }}></div>
                            <div style={{ width: '80%', height: '15px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '1rem' }}></div>
                            <div style={{ width: '90%', height: '15px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Everything you need to rank higher</h2>
                    <p className="hero-subtitle" style={{ margin: '0 auto' }}>Advanced insights without the complexity.</p>
                </div>
                <div className="features-grid">
                    <motion.div className="feature-card" whileHover={{ y: -5 }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                            <BarChart />
                        </div>
                        <h3 className="feature-title">Technical SEO Intelligence</h3>
                        <p className="feature-desc">Instantly audit metas, headings, and render performance to keep your technical foundation spotless.</p>
                    </motion.div>
                    <motion.div className="feature-card" whileHover={{ y: -5 }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--accent-mint)' }}>
                            <Globe />
                        </div>
                        <h3 className="feature-title">GEO Optimization Insights</h3>
                        <p className="feature-desc">Understand how your website targets specific geographic locations and discover local intent gaps.</p>
                    </motion.div>
                    <motion.div className="feature-card" whileHover={{ y: -5 }}>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--secondary)' }}>
                            <Cpu />
                        </div>
                        <h3 className="feature-title">AI Visibility Score</h3>
                        <p className="feature-desc">AIO readiness analysis ensures your content is structured for LLMs and AI Search Assistants.</p>
                    </motion.div>
                </div>
            </section>

            <div className="w-full flex justify-center py-20">
                <FAQs />
            </div>


        </div>

    );
};

export default Home;
