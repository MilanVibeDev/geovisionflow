import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Activity, Globe, Cpu, CheckCircle, AlertTriangle, ArrowLeft,
    Zap, TrendingUp, Shield, Search, Star, MessageSquare, Info,
    Bot, BrainCircuit, BarChart3, AlertCircle, Wifi, WifiOff, ServerCrash
} from 'lucide-react';
import UniqueLoading from '../components/ui/morph-loading';

// ── Client-side error classifier ─────────────────────────────────────────────
/**
 * Detects whether a fetch failure is an API error, server error, or network issue.
 * Returns: { type, label, message, color, icon }
 */
const classifyClientError = (err) => {
    if (!err.response && !err.request) {
        // Axios setup error or our own code threw
        return {
            type: 'SERVER_ERROR',
            label: 'Server Error',
            message: err.message || 'An unexpected internal error occurred.',
            color: '#f59e0b',
            icon: ServerCrash
        };
    }
    if (!err.response) {
        // Request was made but no response — network issue
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        return {
            type: 'NETWORK_ERROR',
            label: 'Network Connection Error',
            message: isTimeout
                ? 'The request timed out. Check your internet connection or try again later.'
                : 'Could not reach the server. Check your internet connection.',
            color: '#f97316',
            icon: WifiOff
        };
    }
    const status = err.response.status;
    if (status >= 500) {
        return {
            type: 'SERVER_ERROR',
            label: `Server Error (HTTP ${status})`,
            message: err.response?.data?.error || err.message || 'The server encountered an internal error.',
            color: '#f59e0b',
            icon: ServerCrash
        };
    }
    // 4xx — typically an API/configuration error
    return {
        type: 'API_ERROR',
        label: `API Error (HTTP ${status})`,
        message: err.response?.data?.error || err.message || 'The API returned an error response.',
        color: '#ef4444',
        icon: AlertTriangle
    };
};

// ── helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => {
    if (s === null || s === undefined) return 'var(--text-light)';
    if (s >= 80) return 'var(--primary)';
    if (s >= 55) return 'var(--accent-warning)';
    return 'var(--accent-coral)';
};

const scoreLabel = (s) => {
    if (s === null || s === undefined) return 'N/A';
    if (s >= 80) return 'Good';
    if (s >= 55) return 'Fair';
    return 'Poor';
};

const conicGradient = (score, color) =>
    score !== null && score !== undefined
        ? `conic-gradient(${color} ${score}%, var(--border-light) 0)`
        : `conic-gradient(var(--border-light) 100%, var(--border-light) 0)`;

// ── ScoreCard ─────────────────────────────────────────────────────────────────
const ScoreCard = ({ title, score, icon: Icon, description, badge, tooltip }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const color = scoreColor(score);
    const label = scoreLabel(score);

    return (
        <motion.div
            className="score-card"
            style={{ position: 'relative', cursor: 'default' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: conicGradient(score, color),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <div style={{
                    background: 'white', width: '74px', height: '74px', borderRadius: '50%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: score !== null ? '1.4rem' : '1rem', color: color
                }}>
                    {score !== null && score !== undefined ? score : '–'}
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <Icon size={16} color={color} />
                    <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>{title}</p>
                    {badge && (
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                            borderRadius: '4px', background: `${color}22`, color: color,
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>{badge}</span>
                    )}
                </div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: color }}>{label}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.2rem 0 0' }}>{description}</p>
            </div>

            {showTooltip && tooltip && (
                <div style={{
                    position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--text-dark)', color: 'white', padding: '0.6rem 1rem',
                    borderRadius: '8px', fontSize: '0.78rem', zIndex: 20, width: '220px',
                    textAlign: 'center', lineHeight: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
                }}>
                    {tooltip}
                    <div style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        border: '6px solid transparent', borderTopColor: 'var(--text-dark)'
                    }} />
                </div>
            )}
        </motion.div>
    );
};

// ── RationaleBox ──────────────────────────────────────────────────────────────
const RationaleBox = ({ label, text, color }) => (
    <div style={{
        padding: '1rem 1.25rem', borderRadius: '10px',
        background: 'var(--bg-main)', borderLeft: `4px solid ${color}`, marginBottom: '0.75rem'
    }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color, marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0 }}>{text}</p>
    </div>
);

// ── DeductionRow ──────────────────────────────────────────────────────────────
const DeductionRow = ({ field, issue, severity }) => {
    const severityColor = severity === 'critical' ? 'var(--accent-coral)' : severity === 'warning' ? 'var(--accent-warning)' : 'var(--text-light)';
    const SevIcon = severity === 'critical' ? AlertTriangle : severity === 'warning' ? AlertCircle : Info;
    return (
        <li className="task-item" style={{ alignItems: 'flex-start' }}>
            <SevIcon size={18} color={severityColor} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
                <strong style={{ textTransform: 'capitalize' }}>{field}</strong>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-gray)', margin: '0.1rem 0 0' }}>{issue}</p>
            </div>
        </li>
    );
};

// ── NullScore ─────────────────────────────────────────────────────────────────
const NullScoreNotice = ({ label }) => (
    <div style={{
        padding: '0.75rem 1.25rem', borderRadius: '8px',
        background: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border-light)',
        fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem'
    }}>
        <Info size={16} />
        <span>{label} score is unavailable — AI analysis could not be completed.</span>
    </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [errorInfo, setErrorInfo] = useState(null); // { type, label, message, color, icon }
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!location.state?.url) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            // Ensure we use relative paths in production for unified hosting
            const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

            try {
                const response = await axios.post(`${apiUrl}/api/analyze`, {
                    url: location.state.url,
                    keyword: location.state?.keyword || 'general',
                    country: location.state?.country || 'global'
                });
                setData(response.data);
                setLoading(false);
            } catch (err) {
                const classified = classifyClientError(err);
                // Log classified error to the browser console
                const icons = { API_ERROR: '🔴 [API ERROR]', NETWORK_ERROR: '🟠 [NETWORK ERROR]', SERVER_ERROR: '🟡 [SERVER ERROR]' };
                console.error(`\n${icons[classified.type] || '❌ [ERROR]'} ${classified.label}`);
                console.error('  ↳ Type    :', classified.type);
                console.error('  ↳ Message :', classified.message);
                console.error('  ↳ Raw err :', err);
                setError(classified.message);
                setErrorInfo(classified);
                setLoading(false);
            }
        };

        fetchData();
    }, [location.state, navigate]);

    if (loading) return (
        <div className="dashboard">
            <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <UniqueLoading variant="morph" size="lg" />
                <h2 style={{ marginTop: '2rem' }}>AI Analyzing {location.state?.url}...</h2>
                <p className="hero-subtitle">Checking Technical SEO, AIO, GEO & AEO Readiness</p>
            </div>
        </div>
    );

    if (error) {
        const ErrIcon = errorInfo?.icon || AlertTriangle;
        const errColor = errorInfo?.color || 'var(--accent-coral)';
        const errLabel = errorInfo?.label || 'Analysis Failed';
        return (
            <div className="dashboard">
                <div className="dashboard-main" style={{ textAlign: 'center', marginTop: '8%', maxWidth: '560px', margin: '8% auto 0' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: `${errColor}18`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
                    }}>
                        <ErrIcon size={38} color={errColor} />
                    </div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.85rem', borderRadius: '20px',
                        background: `${errColor}18`, border: `1px solid ${errColor}55`,
                        fontSize: '0.8rem', fontWeight: 700, color: errColor,
                        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem'
                    }}>
                        <ErrIcon size={13} />
                        {errLabel}
                    </div>
                    <h2 style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>Failed to Analyze</h2>
                    <p className="hero-subtitle" style={{ margin: '0.75rem 0 1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>{error}</p>
                    {errorInfo?.type === 'API_ERROR' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                            💡 This is an API-level error from the server. Check your Gemini API key and quota.
                        </p>
                    )}
                    {errorInfo?.type === 'NETWORK_ERROR' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                            💡 Check your internet connection and make sure the server is running.
                        </p>
                    )}
                    {errorInfo?.type === 'SERVER_ERROR' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1.25rem' }}>
                            💡 An internal server error occurred. Try again or check the server console for details.
                        </p>
                    )}
                    <button className="btn btn-outline" onClick={() => navigate('/')}>Go Back</button>
                </div>
            </div>
        );
    }

    if (!data || !data.scores) {
        return (
            <div className="dashboard">
                <div className="dashboard-main" style={{ textAlign: 'center', marginTop: '10%' }}>
                    <h2>Unexpected Response</h2>
                    <p className="hero-subtitle">The server returned an empty or malformed result. Please try again.</p>
                    <div style={{
                        marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.05)',
                        borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-light)',
                        maxWidth: '100%', overflowX: 'auto', whiteSpace: 'pre-wrap', textAlign: 'left'
                    }}>
                        <strong>Raw Data:</strong> {data ? JSON.stringify(data, null, 2) : 'null/undefined'}
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }}>Go Back</button>
                </div>
            </div>
        );
    }

    const { scores, seoData, aiAudit, techDeductions = [] } = data;

    return (
        <div className="dashboard">
            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="logo" style={{ marginBottom: '2rem' }}>
                    <Zap className="gradient-text" /> SEO Calc
                </div>

                <button className="btn btn-outline" style={{ width: '100%', marginBottom: '2rem' }} onClick={() => navigate('/')}>
                    <ArrowLeft size={16} /> New Audit
                </button>

                <div className="sidebar-links">
                    {[
                        { id: 'overview', icon: BarChart3, label: 'Overview' },
                        { id: 'seo-audit', icon: CheckCircle, label: 'SEO Audit' },
                        { id: 'geo-insights', icon: Globe, label: 'GEO Insights' },
                        { id: 'ai-visibility', icon: BrainCircuit, label: 'AIO Details' },
                    ].map(({ id, icon: Icon, label }) => (
                        <div key={id} className={`sidebar-link ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                            <Icon size={18} /> {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="dashboard-main">
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Audit Dashboard</h1>
                            {data?.cached && (
                                <span style={{
                                    padding: '0.25rem 0.5rem', background: 'rgba(79, 70, 229, 0.1)',
                                    color: 'var(--primary)', borderRadius: '6px', fontSize: '0.75rem',
                                    fontWeight: '600', border: '1px solid rgba(79, 70, 229, 0.2)'
                                }}>CACHED</span>
                            )}
                        </div>
                        <a href={data?.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-gray)' }}>{data?.url}</a>
                    </div>
                </header>

                {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <>


                        <div className="score-grid">
                            <ScoreCard
                                title="Technical SEO"
                                score={scores.technical}
                                icon={Activity}
                                description="On-page signals measurable now"
                                badge="SEO"
                                tooltip="Measures title, description, H1, alt text, viewport, word count & page speed. Formula-based — no guesswork."
                            />
                            <ScoreCard
                                title="Page Speed"
                                score={scores.performance}
                                icon={Zap}
                                description="Google PageSpeed (mobile)"
                                badge="SEO"
                                tooltip="Google Lighthouse mobile speed score. Below 50 is critical; 90+ is excellent."
                            />
                            <ScoreCard
                                title="AIO Score"
                                score={scores.aio}
                                icon={Bot}
                                description="Can AI pull answers from your page?"
                                badge="AIO"
                                tooltip="AI Input Optimisation: How likely are tools like ChatGPT or Gemini to extract information from your page when answering user questions?"
                            />
                            <ScoreCard
                                title="GEO Score"
                                score={scores.geo}
                                icon={Globe}
                                description="Will AI recommend your brand?"
                                badge="GEO"
                                tooltip="Generative Engine Optimisation: How likely is an AI assistant to recommend or mention your brand? Driven by brand clarity, niche authority, and location signals."
                            />
                        </div>

                        {/* AI Scoring Rationale */}
                        {aiAudit?.scoringRationale && (scores.aio !== null || scores.geo !== null) && (
                            <div className="info-panel" style={{ marginTop: '1.5rem' }}>
                                <h3 className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={17} color="var(--primary)" /> Why These Scores?
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                                    The AI explains its honest reasoning below. Scores reflect actual detected signals — not estimates.
                                </p>
                                {aiAudit.scoringRationale.aio && <RationaleBox label="AIO Rationale" text={aiAudit.scoringRationale.aio} color="var(--primary)" />}
                                {aiAudit.scoringRationale.geo && <RationaleBox label="GEO Rationale" text={aiAudit.scoringRationale.geo} color="var(--accent-mint)" />}
                            </div>
                        )}

                        <div className="details-grid" style={{ marginTop: '1.5rem' }}>
                            <div className="info-panel">
                                <h3 className="panel-header">Action Plan</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                                    Priorities ordered by impact. Each task is tagged with the discipline it improves.
                                </p>
                                <ul className="task-list">
                                    {aiAudit?.actionPlan?.map((plan, i) => (
                                        <li key={i} className="task-item">
                                            <span className={`task-priority priority-${plan.priority}`}>{plan.priority}</span>
                                            <div style={{ flex: 1 }}>
                                                {plan.task}
                                                {plan.impact && (
                                                    <span style={{
                                                        marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700,
                                                        padding: '0.1rem 0.4rem', borderRadius: '4px',
                                                        background: 'rgba(79,70,229,0.1)', color: 'var(--primary)'
                                                    }}>{plan.impact}</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {(!aiAudit?.actionPlan || aiAudit.actionPlan.length === 0) && (
                                        <li className="task-item">
                                            <span className="task-priority priority-High">High</span>
                                            <div>Run a fresh analysis to receive AI-generated action items.</div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="info-panel" style={{ height: 'fit-content' }}>
                                <h3 className="panel-header">Content Insights</h3>
                                <ul className="task-list">
                                    <li className="task-item">
                                        {seoData.wordCount >= 600
                                            ? <CheckCircle size={20} color="var(--primary)" />
                                            : <AlertTriangle size={20} color="var(--accent-warning)" />}
                                        <div>
                                            <strong>Word Count:</strong> {seoData.wordCount} words
                                            {seoData.wordCount < 600 && <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', margin: '0.1rem 0 0' }}>Aim for 600+ words for better ranking potential.</p>}
                                        </div>
                                    </li>
                                    <li className="task-item">
                                        {seoData.imagesCount === seoData.imagesWithAlt
                                            ? <CheckCircle size={20} color="var(--primary)" />
                                            : <AlertTriangle size={20} color="var(--accent-warning)" />}
                                        <div>
                                            <strong>Images With Alt:</strong> {seoData.imagesWithAlt} / {seoData.imagesCount}
                                            {seoData.imagesCount > seoData.imagesWithAlt && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', margin: '0.1rem 0 0' }}>
                                                    {seoData.imagesCount - seoData.imagesWithAlt} image(s) are missing alt text — affects both SEO and AIO.
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                    <li className="task-item">
                                        {aiAudit?.llmReadability === 'Good'
                                            ? <CheckCircle size={20} color="var(--primary)" />
                                            : <AlertTriangle size={20} color={aiAudit?.llmReadability === 'Poor' ? 'var(--accent-coral)' : 'var(--accent-warning)'} />}
                                        <div>
                                            <strong>LLM Readability:</strong> {aiAudit?.llmReadability || 'Unknown'}
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: '0.1rem 0 0' }}>
                                                How easily language models can parse and extract content from this page.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="task-item">
                                        <BrainCircuit size={20} color="var(--primary)" />
                                        <div>
                                            <strong>AI Snippet Probability:</strong> {aiAudit?.aiSnippetProbability || 'Unknown'}
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: '0.1rem 0 0' }}>
                                                Likelihood of appearing in AI-generated search answers.
                                            </p>
                                        </div>
                                    </li>
                                </ul>

                                {aiAudit?.contentGaps?.length > 0 && (
                                    <>
                                        <h3 className="panel-header" style={{ marginTop: '1.5rem' }}>Content Gaps</h3>
                                        <ul style={{ paddingLeft: '1rem', color: 'var(--text-gray)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {aiAudit.contentGaps.map((gap, i) => (
                                                <li key={i}>{gap}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ══ SEO AUDIT TAB ══════════════════════════════════════════════════════ */}
                {activeTab === 'seo-audit' && (
                    <div className="seo-audit-section">
                        <div className="responsive-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '50%', flexShrink: 0,
                                background: conicGradient(scores.technical, scoreColor(scores.technical)),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1.5rem'
                            }}>
                                <div style={{ background: 'white', width: '74px', height: '74px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: scoreColor(scores.technical) }}>
                                    {scores.technical}
                                </div>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Technical SEO Score</h2>
                                <p className="hero-subtitle" style={{ margin: 0, fontSize: '0.9rem' }}>
                                    Formula-based — calculated from measurable, objective on-page signals. No AI estimates.
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                    Keyword being tracked: <strong>{seoData.targetKeyword}</strong> · Region: <strong>{seoData.targetCountry}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div className="info-panel">
                                <h3 className="panel-header">On-Page Analysis</h3>
                                <ul className="task-list">
                                    {/* Title */}
                                    <li className="task-item">
                                        {seoData.title ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-coral)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>Meta Title</strong>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>{seoData.title || 'Missing — this is critical for SEO ranking.'}</p>
                                            {seoData.title && (seoData.title.length < 30 || seoData.title.length > 60) && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
                                                    Length: {seoData.title.length} chars — ideal is 30–60.
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                    {/* Description */}
                                    <li className="task-item">
                                        {seoData.description ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-coral)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>Meta Description</strong>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>{seoData.description || 'Missing — write a compelling 120–160 character description.'}</p>
                                            {seoData.description && (seoData.description.length < 120 || seoData.description.length > 160) && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
                                                    Length: {seoData.description.length} chars — ideal is 120–160.
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                    {/* H1 */}
                                    <li className="task-item">
                                        {seoData.h1Count === 1 ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-warning)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>H1 Tags ({seoData.h1Count} found)</strong>
                                            {seoData.h1Tags?.map((h1, idx) => (
                                                <p key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>"{h1}"</p>
                                            ))}
                                            {seoData.h1Count !== 1 && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
                                                    A page must have exactly 1 H1. {seoData.h1Count === 0 ? 'Add one that includes your target keyword.' : 'Remove extra H1s — only one should exist.'}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                    {/* Images */}
                                    <li className="task-item">
                                        {seoData.imagesWithAlt === seoData.imagesCount ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-warning)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>Image Alt Text ({seoData.imagesWithAlt}/{seoData.imagesCount})</strong>
                                            <p style={{ fontSize: '0.8rem', color: seoData.imagesWithAlt === seoData.imagesCount ? 'var(--text-gray)' : 'var(--accent-warning)', marginTop: '0.25rem' }}>
                                                {seoData.imagesWithAlt === seoData.imagesCount
                                                    ? 'All images have alt text — good for both SEO and accessibility.'
                                                    : `${seoData.imagesCount - seoData.imagesWithAlt} image(s) are missing alt text. Alt text describes the image to search engines and helps AIO.`}
                                            </p>
                                        </div>
                                    </li>
                                    {/* Viewport */}
                                    <li className="task-item">
                                        {seoData.hasViewport ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-coral)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>Mobile Viewport Tag</strong>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>{seoData.hasViewport ? 'Present — page signals mobile-friendliness.' : 'Missing — Google penalises non-mobile-friendly pages.'}</p>
                                        </div>
                                    </li>
                                    {/* H2 */}
                                    <li className="task-item">
                                        {seoData.h2Tags?.length > 0 ? <CheckCircle color="var(--primary)" /> : <AlertTriangle color="var(--accent-warning)" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>H2 Sub-Headings ({seoData.h2Tags?.length || 0} found)</strong>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '0.25rem' }}>
                                                {seoData.h2Tags?.length > 0
                                                    ? `Structured content found: "${seoData.h2Tags.slice(0, 3).join('", "')}"`
                                                    : 'No H2 tags — add sub-headings to structure content for SEO and AIO readability.'}
                                            </p>
                                        </div>
                                    </li>
                                </ul>

                                {techDeductions.length > 0 && (
                                    <>
                                        <h3 className="panel-header" style={{ marginTop: '1.5rem' }}>Score Deductions</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                                            Each item below caused a point deduction from the Technical SEO score:
                                        </p>
                                        <ul className="task-list">
                                            {techDeductions.map((d, i) => (
                                                <DeductionRow key={i} {...d} />
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            <div className="info-panel" style={{ height: 'fit-content' }}>
                                <h3 className="panel-header">AI Suggested Improvements</h3>
                                {aiAudit?.suggestedMetaTitle && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.35rem' }}>Suggested Meta Title</p>
                                        <div style={{ background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid var(--primary)' }}>
                                            "{aiAudit.suggestedMetaTitle}"
                                        </div>
                                    </div>
                                )}
                                {aiAudit?.suggestedH1 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-mint)', marginBottom: '0.35rem' }}>Suggested H1</p>
                                        <div style={{ background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent-mint)' }}>
                                            "{aiAudit.suggestedH1}"
                                        </div>
                                    </div>
                                )}
                                {aiAudit?.suggestedMetaDescription && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-warning)', marginBottom: '0.35rem' }}>Suggested Meta Description</p>
                                        <div style={{ background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent-warning)' }}>
                                            "{aiAudit.suggestedMetaDescription}"
                                        </div>
                                    </div>
                                )}

                                <h3 className="panel-header" style={{ marginTop: '1rem' }}>SEO Quick Wins</h3>
                                <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-gray)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><strong>Long-tail keywords (4+ words)</strong> rank better and face less competition. E.g. "automation agency in Serbia" beats "automation agency".</li>
                                    <li><strong>Search intent match</strong> matters more than keyword density. Analyse what format top-ranking pages use: blog, product page, how-to guide.</li>
                                    <li><strong>Backlinks</strong> from relevant sites are a major trust signal. Aim for mentions and links from sites in your niche.</li>
                                    <li><strong>Google Reviews</strong> embedded on your page add trust signals for both SEO and GEO recommendations.</li>
                                    <li><strong>Compress images</strong> to reduce load time — a direct PageSpeed and Core Web Vitals factor.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ GEO INSIGHTS TAB ════════════════════════════════════════════════════ */}
                {activeTab === 'geo-insights' && (
                    <div className="geo-insights-section">
                        {/* Score Header */}
                        <div className="responsive-header" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-light)', gap: '1.25rem', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                                background: conicGradient(scores.geo, scoreColor(scores.geo)),
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{ background: 'white', width: '66px', height: '66px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', color: scoreColor(scores.geo) }}>
                                    {scores.geo ?? '–'}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>GEO Score</h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                                    Generative Engine Optimisation — will an AI assistant mention or recommend your brand to users?
                                </p>
                                {scores.geo === null && <NullScoreNotice label="GEO" />}
                            </div>
                        </div>

                        {/* Rationale */}
                        {aiAudit?.scoringRationale && (
                            <div className="info-panel" style={{ marginBottom: '1.5rem' }}>
                                <h3 className="panel-header">AI Scoring Rationale</h3>
                                {aiAudit.scoringRationale.geo && <RationaleBox label="GEO" text={aiAudit.scoringRationale.geo} color="var(--accent-mint)" />}
                            </div>
                        )}

                        <div className="details-grid">
                            <div className="info-panel">
                                <h3 className="panel-header">GEO Improvement Roadmap</h3>
                                {aiAudit?.geoRoadmap ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                                                <Activity size={18} /> Technical Steps
                                            </h4>
                                            <ul className="task-list">
                                                {aiAudit.geoRoadmap.technical.map((task, i) => (
                                                    <li key={i} className="task-item" style={{ background: 'var(--bg-main)' }}>
                                                        <CheckCircle size={16} color="var(--primary)" />
                                                        <div style={{ fontSize: '0.92rem' }}>{task}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-mint)', marginBottom: '0.75rem' }}>
                                                <Globe size={18} /> Content Steps
                                            </h4>
                                            <ul className="task-list">
                                                {aiAudit.geoRoadmap.content.map((task, i) => (
                                                    <li key={i} className="task-item" style={{ background: 'var(--bg-main)' }}>
                                                        <CheckCircle size={16} color="var(--accent-mint)" />
                                                        <div style={{ fontSize: '0.92rem' }}>{task}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)', marginBottom: '0.75rem' }}>
                                                <TrendingUp size={18} /> Visibility Steps
                                            </h4>
                                            <ul className="task-list">
                                                {aiAudit.geoRoadmap.visibility.map((task, i) => (
                                                    <li key={i} className="task-item" style={{ background: 'var(--bg-main)' }}>
                                                        <CheckCircle size={16} color="var(--accent-warning)" />
                                                        <div style={{ fontSize: '0.92rem' }}>{task}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-gray)' }}>Run a fresh analysis to generate your GEO roadmap.</p>
                                )}
                            </div>

                            <div className="info-panel" style={{ height: 'fit-content' }}>
                                <h3 className="panel-header" style={{ borderColor: 'var(--accent-mint)' }}>GEO Suggestions</h3>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                    <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {aiAudit?.geoSuggestions?.map((suggestion, i) => (
                                            <li key={i} style={{ fontSize: '0.9rem' }}>
                                                <strong>{suggestion.split(':')[0]}:</strong>
                                                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-gray)', fontSize: '0.83rem' }}>{suggestion.split(':').slice(1).join(':') || 'See roadmap for details.'}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <h3 className="panel-header" style={{ borderColor: 'var(--accent-warning)', marginTop: '1rem' }}>GEO Optimisation Tips</h3>
                                <ul style={{ paddingLeft: '1rem', color: 'var(--text-gray)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <li><strong>Add FAQ sections</strong> with direct Q&amp;A format — AI assistants extract brand answers from these most often.</li>
                                    <li><strong>Use JSON-LD structured data</strong> (LocalBusiness, FAQPage) so AI can clearly identify your brand, location, and niche.</li>
                                    <li><strong>State your brand name, location, and service</strong> clearly and repeatedly in your content — AI needs explicit signals to recommend you.</li>
                                    <li><strong>Get mentioned on niche-relevant external sites</strong> — brand mentions on authority sites are the strongest GEO signal.</li>
                                    <li><strong>Being in the top 3 Google results</strong> directly improves AIO since that is where AI crawlers prioritise crawling.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ AIO TAB ════════════════════════════════════════════════════════════ */}
                {activeTab === 'ai-visibility' && (
                    <div className="ai-visibility-section">
                        <div className="responsive-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', flexShrink: 0,
                                background: conicGradient(scores.aio, scoreColor(scores.aio)),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '2rem'
                            }}>
                                <div style={{ background: 'white', width: '84px', height: '84px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem', color: scoreColor(scores.aio) }}>
                                    {scores.aio ?? '–'}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>AIO Score — AI Input Optimisation</h2>
                                        <p className="hero-subtitle" style={{ margin: 0, fontSize: '1rem' }}>
                                            How effectively AI tools (ChatGPT, Gemini, Perplexity) can extract information from your page when answering user questions.
                                        </p>
                                    </div>
                                    {aiAudit?.aiVisibilityDetails?.discoveryEase && aiAudit.aiVisibilityDetails.discoveryEase !== 'Unknown' && (
                                        <div className="ai-discovery-container" style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>Discovery Rating</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: aiAudit.aiVisibilityDetails.discoveryEase === 'Easy' ? 'var(--accent-mint)' : aiAudit.aiVisibilityDetails.discoveryEase === 'Hard' ? 'var(--accent-coral)' : 'var(--accent-warning)' }}>
                                                {aiAudit.aiVisibilityDetails.discoveryEase}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {scores.aio === null && <NullScoreNotice label="AIO" />}

                        <div className="details-grid">
                            <div className="info-panel">
                                <h3 className="panel-header">AIO Signal Breakdown</h3>
                                <div className="ai-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                    {[
                                        { label: 'SEO Optimisation', key: 'seoOptimization', icon: Search, color: 'var(--primary)', tip: 'Google ranking signals that directly feed AI crawlability' },
                                        { label: 'Brand Mentions', key: 'brandMentions', icon: MessageSquare, color: 'var(--accent-mint)', tip: 'Frequency and clarity of brand references on the page' },
                                        { label: 'Tech Structure', key: 'technicalStructure', icon: Shield, color: 'var(--accent-warning)', tip: 'Schema markup, semantic HTML, and structured data quality' },
                                        { label: 'Content Clarity', key: 'contentClarity', icon: Star, color: 'var(--accent-coral)', tip: 'How clearly the page communicates its topic to an AI' },
                                    ].map(({ label, key, icon: Icon, color, tip }) => {
                                        const val = aiAudit?.aiVisibilityDetails?.[key];
                                        return (
                                            <div key={key} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                                                <Icon size={22} color={color} style={{ marginBottom: '0.5rem' }} />
                                                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '0.25rem' }}>{label}</h4>
                                                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: val !== null && val !== undefined ? scoreColor(val) : 'var(--text-light)', margin: 0 }}>
                                                    {val !== null && val !== undefined ? `${val}%` : '–'}
                                                </p>
                                                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>{tip}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {aiAudit?.aiVisibilityDetails?.aiKeyAssociations?.length > 0 && (
                                    <>
                                        <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Star size={18} color="var(--accent-warning)" /> AI Topic Associations
                                        </h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '1rem' }}>
                                            Keywords and topics that AI models associate with your page based on its content:
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            {aiAudit.aiVisibilityDetails.aiKeyAssociations.map((item, i) => (
                                                <span key={i} style={{
                                                    padding: '0.45rem 0.9rem', borderRadius: '8px', background: 'white',
                                                    border: '1px solid var(--border-light)', fontSize: '0.88rem',
                                                    fontWeight: 500, color: 'var(--text-dark)',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}>
                                                    <TrendingUp size={13} color="var(--primary)" /> {item}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* AIO Rationale */}
                                {aiAudit?.scoringRationale?.aio && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <RationaleBox label="AIO Rationale" text={aiAudit.scoringRationale.aio} color="var(--primary)" />
                                    </div>
                                )}
                            </div>

                            <div className="info-panel" style={{ height: 'fit-content' }}>
                                <h3 className="panel-header">Brand Sentiment</h3>
                                <div style={{
                                    padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center',
                                    background: aiAudit?.aiVisibilityDetails?.brandSentiment === 'Positive'
                                        ? 'rgba(45, 212, 191, 0.1)' : aiAudit?.aiVisibilityDetails?.brandSentiment === 'Negative'
                                            ? 'rgba(239,68,68,0.08)' : 'var(--bg-main)'
                                }}>
                                    <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        How AI perceives the tone and authority of your brand on this page:
                                    </p>
                                    <p style={{
                                        fontSize: '1.75rem', fontWeight: 800, margin: 0,
                                        color: aiAudit?.aiVisibilityDetails?.brandSentiment === 'Positive' ? 'var(--accent-mint)'
                                            : aiAudit?.aiVisibilityDetails?.brandSentiment === 'Negative' ? 'var(--accent-coral)'
                                                : 'var(--text-dark)'
                                    }}>
                                        {aiAudit?.aiVisibilityDetails?.brandSentiment ?? '—'}
                                    </p>
                                </div>

                                <h3 className="panel-header">How to Improve AIO</h3>
                                <ul style={{ fontSize: '0.85rem', color: 'var(--text-gray)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <li><strong>Be in the top 3 on Google</strong> — this is where AI crawlers source most of their information, directly boosting AIO.</li>
                                    <li><strong>Use FAQ sections</strong> with question-and-answer format so AI can extract clear, direct answers.</li>
                                    <li><strong>Add JSON-LD structured data</strong> (e.g. FAQPage, HowTo, LocalBusiness) to help AI understand your content structure.</li>
                                    <li><strong>Ensure content is factual and educational</strong>, not just promotional — AI prefers pages that provide genuine answers.</li>
                                    <li><strong>Keep content up to date</strong> — AI systems prefer fresh, authoritative content.</li>
                                    <li><strong>Consistent NAP</strong> (Name, Address, Phone) across all online mentions reinforces entity recognition for AI.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
