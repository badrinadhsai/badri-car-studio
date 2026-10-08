import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, FileUpload, Input, PageMeta, Select, TargetRoleSelect, Textarea } from '../components/ui';
import { ANALYSIS_STAGES, EmptyState, ErrorState, InfoState, LoadingState } from '../components/States';
import { AnalysisDashboard, DemoBadge } from '../components/dashboard';
import { friendlyError, postFullAnalysis, AI_NOT_CONFIGURED } from '../services/api';
import { SAMPLE_ANALYSIS } from '../data/demoAnalysis';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { getAnalysis, listAnalyses, saveAnalysis } from '../services/userData';
import { HistorySection, ScorePill, formatDate } from '../components/HistoryPanels';

const LEVELS = ['Student', 'Fresher', '0–1 years', '1–3 years', '3+ years'];

export default function Analyze() {
  const [step, setStep] = React.useState(1);
  const [resumeText, setResumeText] = React.useState('');
  const [resumeFile, setResumeFile] = React.useState(null);
  const [targetRole, setTargetRole] = React.useState('');
  const [experienceLevel, setExperienceLevel] = React.useState('Fresher');
  const [jobDescription, setJobDescription] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [stage, setStage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [errorCode, setErrorCode] = React.useState('');
  const [result, setResult] = React.useState(null); // { foundation } or { analysis }
  const [history, setHistory] = React.useState([]);
  const [histLoading, setHistLoading] = React.useState(false);
  const [histError, setHistError] = React.useState('');
  const { profile, user } = useAuth();

  // Pre-fill from the user's profile (never overwrites what they typed).
  React.useEffect(() => {
    if (profile?.target_role && !targetRole) setTargetRole(profile.target_role);
    if (profile?.experience_level && experienceLevel === 'Fresher') setExperienceLevel(profile.experience_level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const refreshHistory = React.useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    setHistLoading(true);
    setHistError('');
    try {
      setHistory(await listAnalyses(10));
    } catch {
      setHistError('Could not load your analysis history.');
    } finally {
      setHistLoading(false);
    }
  }, [user]);

  // Clear user-specific state on account switch so User B never sees User A's data.
  React.useEffect(() => {
    setResult(null);
    setHistory([]);
    setHistError('');
    refreshHistory();
  }, [user, refreshHistory]);

  const stageTimer = React.useRef(null);
  React.useEffect(() => () => clearInterval(stageTimer.current), []);

  function validate(profileOnly) {
    const errs = {};
    if (!resumeFile && resumeText.trim().length < 50) {
      errs.resume = 'Upload a PDF resume or paste resume text (minimum 50 characters).';
    }
    if (!profileOnly && targetRole.trim().length < 2) {
      errs.role = 'Enter your target role, e.g. “Frontend Developer”.';
    }
    setFieldErrors(errs);
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate(false);
    if (errs.resume) { setStep(1); return; }
    if (errs.role) { setStep(2); return; }
    setError(''); setErrorCode(''); setResult(null);
    setLoading(true); setStage(0);
    // Advance stages on the REAL request clock (no fake percentages).
    stageTimer.current = setInterval(() => setStage((s) => Math.min(s + 1, ANALYSIS_STAGES.length - 1)), 2200);
    try {
      const data = await postFullAnalysis({ resumeFile, resumeText, targetRole, jobDescription, experienceLevel });
      const payload = data.data || {};
      if (payload.analysis) {
        setResult({ analysis: payload.analysis });
        // Persist the structured result to the owner's history (best-effort;
        // the on-screen result never depends on the save succeeding).
        if (isSupabaseConfigured && user) {
          try {
            await saveAnalysis({ targetRole, experienceLevel, jobDescription, analysis: payload.analysis });
            refreshHistory();
          } catch { /* history is additive — never block the result */ }
        }
      } else {
        setResult({ foundation: payload });
      }
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(friendlyError(err));
      setErrorCode(err.code || '');
    } finally {
      clearInterval(stageTimer.current);
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Analyze your career"
        description="Upload your resume, set a target role, add a job description and get AI-powered career readiness analysis."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 960 }}>
        <p className="eyebrow">The analysis</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Four steps to clarity.</h1>
        <p className="lede">Your data goes to the backend for real AI analysis — validated first, scored honestly.</p>

        {!result?.analysis && (
          <div className="flow-rail" aria-label={`Step ${Math.min(step, 4)} of 4`} role="list">
            {['Experience', 'Direction', 'Opportunity', 'Report'].map((label, i) => {
              const n = i + 1;
              const done = result?.analysis ? true : step > n || loading;
              const on = step === n && !loading && !result;
  async function viewStored(id) {
    try {
      const row = await getAnalysis(id);
      if (row?.full_result) {
        setResult({ analysis: row.full_result });
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setHistError('Could not open that analysis.');
    }
  }

  return (
                <React.Fragment key={label}>
                  <span className="flow-rail__node" role="listitem" data-on={on} data-done={done} aria-current={on ? 'step' : undefined}>
                    <span className="flow-rail__num">{done && !on ? '✓' : String(n).padStart(2, '0')}</span>
                    <span className="flow-rail__name">{label}</span>
                  </span>
                  {n < 4 && <span className="flow-rail__bar" aria-hidden="true"><span style={{ width: step > n || loading || result ? '100%' : '0%' }} /></span>}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {!result?.analysis && (
          <form onSubmit={submit} noValidate>
            <div className="flow-steps">
              <div className="flow-step" data-active={step === 1 && !loading} data-done={step > 1 || loading}>
                <span className="flow-step__no" aria-hidden="true">01</span>
                <div className="flow-step__body">
                  <h2>Your experience</h2>
                  <p>Upload your resume — or paste it directly.</p>
                  {step === 1 && !loading && (
                    <div className="flow-step__panel">
                      <Field label="Upload PDF resume" hint="Option A" error={undefined} htmlFor="pdf">
                        <FileUpload id="pdf" file={resumeFile} onChange={(f) => { setResumeFile(f); setFieldErrors((p) => ({ ...p, resume: '' })); }} />
                      </Field>
                      <Field label="Or paste resume text" hint="Option B" error={fieldErrors.resume} htmlFor="rtext">
                        <Textarea
                          id="rtext"
                          value={resumeText}
                          aria-invalid={Boolean(fieldErrors.resume)}
                          onChange={(e) => { setResumeText(e.target.value); setFieldErrors((p) => ({ ...p, resume: '' })); }}
                          placeholder="Paste your resume text here…"
                        />
                      </Field>
                      <Button variant="primary" onClick={() => { const e = validate(true); if (!e.resume) setStep(2); }}>Continue <span className="arr" aria-hidden="true">→</span></Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flow-step" data-active={step === 2 && !loading} data-done={step > 2 || loading}>
                <span className="flow-step__no" aria-hidden="true">02</span>
                <div className="flow-step__body">
                  <h2>Your direction</h2>
                  <p>What role are you targeting? Every score is calibrated to a real goal.</p>
                  {step === 2 && !loading && (
                    <div className="flow-step__panel">
                      <Field label={<>Target Role <span aria-hidden="true" style={{ color: 'var(--accent)' }}>*</span></>} error={fieldErrors.role} htmlFor="role">
                        <TargetRoleSelect
                          id="role"
                          value={targetRole}
                          ariaInvalid={Boolean(fieldErrors.role)}
                          onChange={(v) => { setTargetRole(v); setFieldErrors((p) => ({ ...p, role: '' })); }}
                        />
                      </Field>
                      <Field label="Experience level" htmlFor="level">
                        <Select id="level" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                          {LEVELS.map((l) => <option key={l}>{l}</option>)}
                        </Select>
                      </Field>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button variant="primary" onClick={() => { const e = validate(true); if (!e.role && targetRole.trim().length >= 2) setStep(3); else if (targetRole.trim().length < 2) setFieldErrors((p) => ({ ...p, role: 'Enter your target role, e.g. “Frontend Developer”.' })); }}>Continue <span className="arr" aria-hidden="true">→</span></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flow-step" data-active={step === 3 && !loading} data-done={step > 3 || loading}>
                <span className="flow-step__no" aria-hidden="true">03</span>
                <div className="flow-step__body">
                  <h2>Your opportunity</h2>
                  <p><strong style={{ color: 'var(--ink)' }}>Optional but recommended.</strong> A job description lets CareerPilot compare your profile directly against the requirements.</p>
                  {step === 3 && !loading && (
                    <div className="flow-step__panel">
                      <Field label="Paste job description" hint="optional" htmlFor="jd">
                        <Textarea
                          id="jd"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the job posting for sharper, evidence-backed matching (optional)…"
                        />
                      </Field>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                        <Button variant="primary" onClick={() => setStep(4)}>Continue <span className="arr" aria-hidden="true">→</span></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flow-step" data-active={step === 4 && !loading && !result} data-done={loading || !!result}>
                <span className="flow-step__no" aria-hidden="true">04</span>
                <div className="flow-step__body">
                  <h2>Your analysis</h2>
                  <p>Review your inputs, then begin.</p>
                  {step === 4 && !loading && !result && (
                    <div className="flow-step__panel">
                      <ul style={{ margin: '0 0 20px', paddingLeft: 18, color: 'var(--muted)', display: 'grid', gap: 6 }}>
                        <li><strong style={{ color: 'var(--ink)' }}>Profile:</strong> {resumeFile ? `PDF — ${resumeFile.name}` : `${resumeText.trim().length} characters pasted`}</li>
                        <li><strong style={{ color: 'var(--ink)' }}>Target role:</strong> {targetRole || '—'} · {experienceLevel}</li>
                        <li><strong style={{ color: 'var(--ink)' }}>Job description:</strong> {jobDescription.trim() ? 'attached' : 'not attached'}</li>
                      </ul>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                        <button type="submit" className="btn btn--primary">Analyze my career <span className="arr" aria-hidden="true">→</span></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        <div style={{ marginTop: 20, display: 'grid', gap: 16, paddingBottom: 'var(--space-7)' }}>
          {loading && <LoadingState active={stage} />}
          <ErrorState
            message={error}
            title={errorCode === AI_NOT_CONFIGURED ? 'AI engine not configured' : 'Something needs attention'}
            onRetry={() => { setError(''); setErrorCode(''); }}
          />
          {errorCode === AI_NOT_CONFIGURED && !loading && (
            <InfoState
              tone="warn"
              title="What this means"
              body="The backend validated your input successfully, but the server-side LLM provider is not configured. Set the backend LLM credentials and run the analysis again. Nothing was faked."
            />
          )}
          {result?.analysis && (
            <div>
              <AnalysisDashboard analysis={result.analysis} />
            </div>
          )}
          {result?.foundation && (
            <>
              <InfoState
                tone="ok"
                title="Input accepted — foundation verified"
                body={`Role “${result.foundation.targetRole}” · resume ${result.foundation.resumeChars} characters · JD ${result.foundation.hasJobDescription ? 'attached' : 'not attached'}. The server returned a validation-only response, so below is a clearly-labeled preview of the dashboard format — not your result.`}
                actions={<><Link to="/interview" className="btn btn--ghost btn--sm">Preview Interview Coach</Link></>}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><DemoBadge /></div>
              <AnalysisDashboard analysis={SAMPLE_ANALYSIS} demo />
            </>
          )}
          {!loading && !result && !error && step !== 4 && (
            <EmptyState
              title="Your results will appear here"
              body="Complete the four steps above and run the analysis. Scores, gaps, evidence and your roadmap land on this page."
            />
          )}
          {isSupabaseConfigured && (
            <HistorySection
              kicker="History"
              title="Career Analysis History"
              loading={histLoading}
              error={histError}
              items={history}
              empty={{ title: 'No saved analyses yet.', body: 'Each analysis you run is saved privately to your account.' }}
              renderItem={(a) => (
                <button
                  type="button"
                  className="hist__row"
                  onClick={() => viewStored(a.id)}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  aria-label={`Open analysis for ${a.target_role} from ${formatDate(a.created_at)}`}
                >
                  <div>
                    <p className="hist__name">{a.target_role || 'Analysis'}</p>
                    <p className="muted" style={{ margin: 0 }}>{formatDate(a.created_at)} · {a.experience_level || ''}</p>
                  </div>
                  <ScorePill value={a.readiness_score} />
                </button>
              )}
            />
          )}
        </div>
      </div>
    </>
  );
}

