import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Field, Input, PageMeta, Reveal } from '../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { AI_NOT_CONFIGURED, friendlyError, improveResume } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { getResumeImprovement, listResumeImprovements, saveResumeImprovement } from '../services/userData';
import { HistorySection, formatDate } from '../components/HistoryPanels';

const IMPROVE_STAGES = [
  'Reviewing your wording',
  'Improving clarity',
  'Strengthening impact',
  'Checking factual consistency'
];

const MIN_CHARS = 50;

async function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-secure contexts: hidden textarea + execCommand.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'absolute';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    if (!document.execCommand('copy')) throw new Error('copy failed');
  } finally {
    document.body.removeChild(ta);
  }
}

export default function Resume() {
  const [content, setContent] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');
  const [stage, setStage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [errorCode, setErrorCode] = React.useState('');
  const [original, setOriginal] = React.useState('');
  const [result, setResult] = React.useState(null); // { improvedText, changes[], summary }
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState('');
  const timer = React.useRef(null);
  const [history, setHistory] = React.useState([]);
  const [histLoading, setHistLoading] = React.useState(false);
  const [histError, setHistError] = React.useState('');
  const { user } = useAuth();

  React.useEffect(() => () => clearInterval(timer.current), []);

  const refreshHistory = React.useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    setHistLoading(true);
    try {
      setHistory(await listResumeImprovements(10));
    } catch {
      setHistError('Could not load your improvement history.');
    } finally {
      setHistLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    setHistory([]);
    setHistError('');
    refreshHistory();
  }, [user, refreshHistory]);

  async function submit(e) {
    e.preventDefault();
    setFieldError(''); setError(''); setErrorCode(''); setResult(null);
    setCopied(false); setCopyError('');
    const text = content.trim();
    if (text.length < MIN_CHARS) {
      setFieldError(`Paste at least ${MIN_CHARS} characters — a full section, several bullets, or your summary (currently ${text.length}).`);
      return;
    }
    setLoading(true); setStage(0); setOriginal(text);
    timer.current = setInterval(() => setStage((s) => Math.min(s + 1, IMPROVE_STAGES.length - 1)), 2200);
    try {
      const data = await improveResume({ resumeText: text, targetRole: targetRole.trim() || undefined });
      setResult(data?.data?.improvement || null);
      if (!data?.data?.improvement) throw new Error('No improvement was returned. Please try again.');
      if (isSupabaseConfigured && user && data?.data?.improvement) {
        try {
          await saveResumeImprovement({
            targetRole: targetRole.trim() || null,
            originalText: text,
            improvement: data.data.improvement
          });
          refreshHistory();
        } catch { /* additive only */ }
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      setError(friendlyError(err));
      setErrorCode(err.code || '');
    } finally {
      clearInterval(timer.current);
      setLoading(false);
    }
  }

  async function copyImproved() {
    if (!result?.improvedText) return;
    setCopyError(''); setCopied(false);
    try {
      await copyText(result.improvedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('Copy failed in this browser — select the improved text manually.');
    }
  }

  return (
    <>
      <PageMeta
        title="Resume studio"
        description="Improve your resume wording with AI — clearer, stronger, and strictly truthful. Nothing invented."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 960 }}>
        <p className="eyebrow">Resume studio</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Make your experience easier to understand.</h1>
        <p className="lede">Paste a section. Get sharper language back — with every change explained, and nothing invented.</p>

        <div className="studio" style={{ marginTop: 32 }}>
          <Card>
            <form onSubmit={submit} noValidate>
              <Field label="Your text" error={fieldError} htmlFor="ricontent">
                <textarea
                  id="ricontent"
                  className="textarea"
                  value={content}
                  aria-invalid={Boolean(fieldError)}
                  onChange={(e) => { setContent(e.target.value); setFieldError(''); }}
                  placeholder="Paste a resume section, bullet point, summary, or project description."
                  style={{ minHeight: 180 }}
                />
              </Field>
              <Field label="Target role" hint="optional — tunes relevance, never content" htmlFor="rirole">
                <Input
                  id="rirole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  autoComplete="off"
                />
              </Field>
              <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 16 }}>
                CareerPilot improves wording without inventing experience, skills, metrics or achievements.
              </p>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Improving…' : 'Improve my wording'} <span className="arr" aria-hidden="true">→</span>
              </button>
            </form>
          </Card>

          {loading && <LoadingState stages={IMPROVE_STAGES} active={stage} />}

          <ErrorState
            message={error}
            title={errorCode === AI_NOT_CONFIGURED ? 'AI engine not configured' : 'Something needs attention'}
            onRetry={() => { setError(''); setErrorCode(''); }}
          />

          {!loading && !result && !error && (
            <EmptyState
              title="Your improved wording will appear here"
              body="Submit a resume section above. The original and improved versions appear side by side, with every change explained."
            />
          )}

          {result && !loading && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="studio__grid">
                <div className="doc doc--orig">
                  <h3>Original — your words</h3>
                  <p>{original}</p>
                </div>
                <div className="doc">
                  <h3>Improved — same facts</h3>
                  <p>{result.improvedText}</p>
                  <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn--sm"
                      style={{ background: '#16181d', color: '#f5f4ef', minHeight: 44, padding: '0 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      onClick={copyImproved}
                    >
                      {copied ? 'Copied ✓' : 'Copy improved version'}
                    </button>
                    {copyError && <span className="field-error" role="alert">{copyError}</span>}
                  </div>
                </div>
              </div>

              {result.changes?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>Editorial notes</h3>
                  {result.changes.map((c, i) => (
                    <div key={i} className="annotation">
                      <strong>{c.area || `Change ${i + 1}`}</strong>
                      {c.whatChanged && <p>{c.whatChanged}</p>}
                      {c.why && <p className="faint"><em>Why: {c.why}</em></p>}
                    </div>
                  ))}
                </div>
              )}

              {result.summary && <p className="lede" style={{ fontSize: '1.05rem' }}>{result.summary}</p>}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/analyze" className="btn btn--primary">Analyze My Career <span className="arr" aria-hidden="true">→</span></Link>
                <Link to="/interview" className="btn btn--ghost">Practice Interviews</Link>
              </div>
            </div>
          )}

          <Reveal>
            <p className="faint" style={{ fontSize: '0.9rem', maxWidth: '68ch' }}>
              Never invented: experience, skills, metrics, employers, credentials.
              Where a real number would strengthen a bullet, the AI writes{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>[add result]</span>{' '}
              for you to fill in — never a fabricated figure. Your voice stays yours.
            </p>
          </Reveal>

          {isSupabaseConfigured && (
            <HistorySection
              kicker="History"
              title="Resume Improvement History"
              loading={histLoading}
              error={histError}
              items={history}
              empty={{ title: 'No saved improvements yet.', body: 'Each improvement you run is saved privately to your account.' }}
              renderItem={(r) => (
                <button
                  type="button"
                  className="hist__row"
                  onClick={async () => {
                    try {
                      const row = await getResumeImprovement(r.id);
                      if (row) {
                        setOriginal(row.original_text || '');
                        setResult({ improvedText: row.improved_text, changes: row.changes || [], summary: row.summary });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    } catch {
                      setHistError('Could not open that improvement.');
                    }
                  }}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  aria-label={`Open resume improvement from ${formatDate(r.created_at)}`}
                >
                  <div>
                    <p className="hist__name">{r.target_role || 'Resume Improvement'}</p>
                    <p className="muted" style={{ margin: 0 }}>{formatDate(r.created_at)}</p>
                  </div>
                  <span className="faint">View →</span>
                </button>
              )}
            />
          )}
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
