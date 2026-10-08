import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark, Button, Card, CountUp, Field, PageMeta, Reveal, Select, TargetRoleSelect, Textarea } from '../components/ui';
import { ErrorState, EmptyState, InfoState } from '../components/States';
import { friendlyError, postInterviewChat, postInterviewSessionEval, AI_NOT_CONFIGURED } from '../services/api';
import { cleanForSpeech, recognitionMessage, useVoiceInterview } from '../hooks/useVoiceInterview';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { completeInterviewSession, createInterviewSession, listInterviewSessions, saveInterviewMessage } from '../services/userData';
import { HistorySection, ScorePill, formatDate } from '../components/HistoryPanels';

const LEVELS = ['Student', 'Fresher', '0–1 years', '1–3 years', '3+ years'];
const COUNTS = [3, 5, 7];

const QUALITY_LABEL = { strong: 'Strong', good: 'Good', developing: 'Developing' };

function qualityTone(q) {
  if (q === 'strong') return 'sage';
  if (q === 'developing') return 'gap';
  return 'cobalt';
}

function ModeToggle({ mode, onChange }) {
  return (
    <div className="voice-toggle" role="group" aria-label="Interview input mode">
      <button type="button" data-on={mode === 'text'} onClick={() => onChange('text')} aria-pressed={mode === 'text'}>Text</button>
      <button type="button" data-on={mode === 'voice'} onClick={() => onChange('voice')} aria-pressed={mode === 'voice'}>Voice</button>
    </div>
  );
}

function Waveform({ active, label }) {
  return (
    <span className="wave" data-active={active} aria-hidden="true">
      <span /><span /><span /><span /><span />
      <em className="wave__sr">{label}</em>
    </span>
  );
}

export default function Interview() {
  const [role, setRole] = React.useState('');
  const [level, setLevel] = React.useState('Fresher');
  const [count, setCount] = React.useState(5);
  const [phase, setPhase] = React.useState('setup'); // setup|chat|report-loading|report
  const [messages, setMessages] = React.useState([]); // {role:'assistant'|'user', content}
  const [turn, setTurn] = React.useState(1);
  const [signal, setSignal] = React.useState(null); // latest {quality, depth}
  const [draft, setDraft] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [report, setReport] = React.useState(null);
  const [error, setError] = React.useState('');
  const [errorCode, setErrorCode] = React.useState('');
  const [openQ, setOpenQ] = React.useState(0);
  const bottomRef = React.useRef(null);
  const sessionIdRef = React.useRef(null);
  const [history, setHistory] = React.useState([]);
  const [histLoading, setHistLoading] = React.useState(false);
  const [histError, setHistError] = React.useState('');
  const { user } = useAuth();

  const refreshHistory = React.useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;
    setHistLoading(true);
    try {
      setHistory(await listInterviewSessions(10));
    } catch {
      setHistError('Could not load your interview history.');
    } finally {
      setHistLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    // New account (or account switch): never leak the previous session.
    setHistory([]);
    setHistError('');
    setMessages([]);
    setReport(null);
    setPhase('setup');
    sessionIdRef.current = null;
    refreshHistory();
  }, [user, refreshHistory]);

  // ---- Voice mode (additive; text mode behavior unchanged) ----
  const [mode, setMode] = React.useState('text'); // 'text' | 'voice'
  const [voiceError, setVoiceError] = React.useState('');
  const voice = useVoiceInterview();
  const spokenRef = React.useRef(0);
  const autoTimer = React.useRef(null);
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;

  const voiceStatus = voiceError ? 'error'
    : voice.speaking ? 'ai-speaking'
    : thinking ? 'thinking'
    : voice.listening ? 'listening'
    : 'ready';
  const VOICE_STATUS_TEXT = {
    error: voiceError,
    'ai-speaking': 'Speaking…',
    thinking: 'Thinking…',
    listening: 'Listening…',
    ready: 'Ready'
  };

  function clearAutoTimer() {
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
  }
  React.useEffect(() => () => {
    clearAutoTimer();
    voice.stopSpeaking();
    voice.stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startMic() {
    setVoiceError('');
    voice.stopSpeaking();
    const ok = voice.startListening({
      onResult: (text) => setDraft((prev) => (prev ? `${prev} ${text}` : text)),
      onError: (code) => setVoiceError(recognitionMessage(code))
    });
    if (!ok) setVoiceError("Voice input isn't supported in this browser.");
  }

  function switchMode(next) {
    setVoiceError('');
    clearAutoTimer();
    voice.stopSpeaking();
    voice.stopListening();
    setMode(next);
    if (next === 'voice' && phaseRef.current === 'chat') {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && voice.voiceOutput && voice.supportedSynth && cleanForSpeech(last.content)) {
        voice.speak(last.content);
      }
    }
  }

  // Speak each new AI message in voice mode; optionally auto-listen after.
  React.useEffect(() => {
    if (mode !== 'voice' || !voice.voiceOutput || !voice.supportedSynth) return;
    if (phaseRef.current !== 'chat') return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (spokenRef.current >= messages.length) return;
    spokenRef.current = messages.length;
    voice.speak(last.content, () => {
      if (!voice.autoListen) return;
      if (phaseRef.current !== 'chat') return;
      clearAutoTimer();
      autoTimer.current = setTimeout(() => {
        if (phaseRef.current !== 'chat') return;
        startMic();
      }, 700);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, mode, voice.voiceOutput]);

  const asked = Math.min(turn, count);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking, phase]);

  async function start(e) {
    e?.preventDefault();
    setError(''); setErrorCode(''); setVoiceError('');
    if (role.trim().length < 2) { setError('Select your target role first — or enter a custom one.'); return; }
    clearAutoTimer(); voice.stopSpeaking(); voice.stopListening();
    spokenRef.current = 0;
    setMessages([]); setReport(null); setSignal(null); setTurn(1); setDraft('');
    setPhase('chat'); setThinking(true);
    // Create the owner-scoped interview session (best-effort; interview works regardless).
    sessionIdRef.current = null;
    if (isSupabaseConfigured && user) {
      try {
        const s = await createInterviewSession({
          targetRole: role.trim(), experienceLevel: level,
          interviewType: 'Technical Interview', totalQuestions: count
        });
        sessionIdRef.current = s?.id || null;
      } catch { /* additive only */ }
    }
    try {
      const data = await postInterviewChat({
        targetRole: role.trim(), experienceLevel: level, messages: [],
        questionNumber: 1, totalQuestions: count
      });
      const t = data?.data;
      setMessages([{ role: 'assistant', content: t.message }]);
      setSignal({ quality: t.quality, depth: t.evaluation?.depth });
      if (sessionIdRef.current) {
        saveInterviewMessage({ sessionId: sessionIdRef.current, role: 'assistant', content: t.message, questionNumber: 1 });
      }
    } catch (err) {
      setError(friendlyError(err) || 'Your interviewer is temporarily unavailable. Please try again.');
      setErrorCode(err.code || '');
      setPhase('setup');
    } finally {
      setThinking(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || thinking) return;
    if (text.length < 2) { setError('Write a short answer first — even a sentence is enough to continue.'); return; }
    setError(''); setErrorCode(''); setVoiceError('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setDraft(''); setThinking(true);
    clearAutoTimer(); voice.stopSpeaking(); voice.stopListening();
    try {
      const data = await postInterviewChat({
        targetRole: role.trim(), experienceLevel: level, messages: next,
        questionNumber: turn + 1, totalQuestions: count
      });
      const t = data?.data;
      const all = [...next, { role: 'assistant', content: t.message }];
      setMessages(all);
      setTurn((n) => n + 1);
      setSignal({ quality: t.quality, depth: t.evaluation?.depth });
      if (sessionIdRef.current) {
        saveInterviewMessage({ sessionId: sessionIdRef.current, role: 'user', content: text, questionNumber: turn + 1 });
        saveInterviewMessage({ sessionId: sessionIdRef.current, role: 'assistant', content: t.message, questionNumber: turn + 1 });
      }
      if (t.isComplete) {
        await finish(all);
      } else {
        document.getElementById('ianswer')?.focus();
      }
    } catch (err) {
      setError(friendlyError(err) || 'Your interviewer is temporarily unavailable. Please try again.');
      setErrorCode(err.code || '');
    } finally {
      setThinking(false);
    }
  }

  async function finish(transcript) {
    setPhase('report-loading');
    clearAutoTimer(); voice.stopSpeaking(); voice.stopListening();
    try {
      const data = await postInterviewSessionEval({
        targetRole: role.trim(), experienceLevel: level, messages: transcript
      });
      setReport(data?.data?.report || null);
      setPhase('report');
      if (sessionIdRef.current && data?.data?.report) {
        try {
          await completeInterviewSession({ sessionId: sessionIdRef.current, report: data.data.report });
          refreshHistory();
        } catch { /* additive only */ }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(friendlyError(err) || 'Your interviewer is temporarily unavailable. Please try again.');
      setErrorCode(err.code || '');
      setPhase('chat');
    }
  }

  function endEarly() {
    clearAutoTimer(); voice.stopSpeaking(); voice.stopListening();
    if (messages.length >= 2 && !thinking) finish(messages);
    else { setPhase('setup'); setMessages([]); }
  }

  function practiceAgain() {
    clearAutoTimer(); voice.stopSpeaking(); voice.stopListening();
    spokenRef.current = 0;
    setPhase('setup'); setMessages([]); setReport(null);
    setSignal(null); setTurn(1); setDraft(''); setError(''); setErrorCode('');
  }

  function onInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      <PageMeta
        title="AI interview coach"
        description="Practice a realistic adaptive mock interview for your target role and get scored feedback."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 1080 }}>
        <p className="eyebrow">AI mock interview</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Walk in prepared.</h1>
        <p className="lede">Practice a realistic interview for your target role and get feedback after every answer.</p>

        {phase === 'setup' && (
          <Reveal>
            <div className="session" style={{ marginTop: 32, maxWidth: 720 }}>
              <div className="session__pane">
                <Card>
                  <form onSubmit={start}>
                    <Field label={<>Target Role <span aria-hidden="true" style={{ color: 'var(--accent)' }}>*</span></>} error={undefined} htmlFor="irole">
                      <TargetRoleSelect id="irole" value={role} onChange={setRole} />
                    </Field>
                    <Field label="Experience Level" htmlFor="ilevel">
                      <Select id="ilevel" value={level} onChange={(e) => setLevel(e.target.value)}>
                        {LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </Select>
                    </Field>
                    <div className="grid grid--2">
                      <Field label="Interview Type" htmlFor="itype">
                        <Select id="itype" value="Technical Interview" onChange={() => {}}>
                          <option>Technical Interview</option>
                        </Select>
                      </Field>
                      <Field label="Number of Questions" htmlFor="icount">
                        <Select id="icount" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                          {COUNTS.map((c) => <option key={c} value={c}>{c} questions</option>)}
                        </Select>
                      </Field>
                    </div>
                    <button type="submit" className="btn btn--primary">Start Mock Interview <span className="arr" aria-hidden="true">→</span></button>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span className="faint" style={{ fontSize: '0.85rem' }}>Input mode:</span>
                      <ModeToggle mode={mode} onChange={switchMode} />
                    </div>
                  </form>
                  <div style={{ marginTop: 16 }}>
                    <EmptyState
                      title="How it works"
                      body="Your AI interviewer will ask role-specific questions, evaluate your responses, and adapt follow-up questions based on your answers."
                    />
                  </div>
                </Card>
                <div style={{ marginTop: 16 }}>
                  <ErrorState message={error} onRetry={() => { setError(''); setErrorCode(''); }} />
                  {errorCode === AI_NOT_CONFIGURED && (
                    <InfoState tone="warn" title="Coach unavailable" body="The interview coach calls the live backend, which reported the AI engine is not configured. Configure the server-side LLM provider, then start again." />
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {phase === 'setup' && isSupabaseConfigured && (
          <div style={{ marginTop: 32, maxWidth: 720 }}>
            <HistorySection
              kicker="History"
              title="Previous Interviews"
              loading={histLoading}
              error={histError}
              items={history}
              empty={{ title: 'No interviews yet.', body: 'Completed mock interviews with scores will appear here.' }}
              renderItem={(s) => (
                <div className="hist__row">
                  <div>
                    <p className="hist__name">{s.interview_type || 'Technical Interview'} · {s.target_role}</p>
                    <p className="muted" style={{ margin: 0 }}>
                      {formatDate(s.created_at)} · {s.total_questions} questions{s.overall_score != null ? ` · Score ${s.overall_score}` : ''}
                    </p>
                  </div>
                  {s.overall_score != null && <ScorePill value={s.overall_score} />}
                </div>
              )}
            />
          </div>
        )}

        {(phase === 'chat' || phase === 'report-loading') && (
          <div className="ivchat" style={{ marginTop: 32 }}>
            <div className="ivchat__main">
              <div className="ivchat__head">
                <span className="ivchat__avatar" data-speaking={mode === 'voice' && voice.speaking} aria-hidden="true"><BrandMark size={26} /></span>
                <div>
                  <p className="ivchat__who" aria-live="polite">
                    {mode === 'voice' ? VOICE_STATUS_TEXT[voiceStatus] : (thinking ? 'Thinking…' : 'AI Interviewer')}
                  </p>
                  <p className="ivchat__sub">Technical interview · {role} · Question {asked} / {count}</p>
                </div>
                <ModeToggle mode={mode} onChange={switchMode} />
                <span className="ivchat__live" data-busy={thinking || voice.speaking} aria-hidden="true" />
              </div>

              <div className="ivchat__log" role="log" aria-live="polite" aria-label="Interview conversation">
                {messages.map((m, i) => m.role === 'assistant' ? (
                  <div key={i} className="msg msg--ai">
                    <span className="msg__avatar" aria-hidden="true"><BrandMark size={22} /></span>
                    <div className="msg__bubble">
                      <p className="msg__kicker">CareerPilot AI Interviewer</p>
                      <p>{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="msg msg--you">
                    <div className="msg__bubble">
                      <p className="msg__kicker">You</p>
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="msg msg--ai">
                    <span className="msg__avatar" aria-hidden="true"><BrandMark size={22} /></span>
                    <div className="msg__bubble msg__thinking" aria-label="AI interviewer is thinking">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <span ref={bottomRef} />
              </div>

              {phase === 'chat' && mode === 'voice' && (
                <div className="voicebar" aria-label="Voice controls">
                  <Waveform active={voice.speaking || voice.listening} label={VOICE_STATUS_TEXT[voiceStatus]} />
                  <div className="voicebar__btns">
                    {voice.speaking ? (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => voice.stopSpeaking()}>
                        Stop Speaking
                      </button>
                    ) : voice.listening ? (
                      <button type="button" className="voice-mic" data-on={true} onClick={() => voice.stopListening()} aria-label="Stop listening">
                        <span aria-hidden="true">■</span> Stop Listening
                      </button>
                    ) : voice.supportedRec ? (
                      <button type="button" className="voice-mic" data-on={false} onClick={startMic} disabled={thinking} aria-label="Start speaking">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="9" y="2" width="6" height="12" rx="3" />
                          <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                        </svg>
                        Start Speaking
                      </button>
                    ) : null}
                  </div>
                  <p className="voicebar__status" role="status">
                    {!voice.supportedRec
                      ? "Voice input isn't supported in this browser."
                      : voice.interim
                        ? `Listening… “${voice.interim}”`
                        : VOICE_STATUS_TEXT[voiceStatus]}
                  </p>
                  {!voice.supportedRec && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => switchMode('text')}>
                      Continue with Text Interview
                    </button>
                  )}
                  {voiceError && (
                    <div className="voicebar__error" role="alert">
                      <p>{voiceError}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={startMic}>Try Again</button>
                        <button type="button" className="btn btn--quiet btn--sm" onClick={() => switchMode('text')}>Continue with Text</button>
                      </div>
                    </div>
                  )}
                  <details className="voicebar__settings">
                    <summary>Voice Settings</summary>
                    <label className="voicebar__opt">
                      <input type="checkbox" checked={voice.voiceOutput} onChange={voice.toggleOutput} /> Voice Output
                    </label>
                    <label className="voicebar__opt">
                      <input type="checkbox" checked={voice.autoListen} onChange={voice.toggleAuto} disabled={!voice.supportedRec} /> Auto Listen
                    </label>
                    <label className="voicebar__opt">
                      Speaking speed
                      <select value={voice.rate} onChange={(e) => voice.changeRate(e.target.value)} aria-label="Speaking speed">
                        <option value="0.75">0.75×</option>
                        <option value="1">1.0×</option>
                        <option value="1.25">1.25×</option>
                        <option value="1.5">1.5×</option>
                      </select>
                    </label>
                  </details>
                </div>
              )}

              {phase === 'chat' && (
                <form className="ivchat__input" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <label className="ivchat__label" htmlFor="ianswer">Type your answer</label>
                  <div className="ivchat__row">
                    <Textarea
                      id="ianswer"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onInputKey}
                      placeholder="Type your answer… (Enter to send, Shift + Enter for a new line)"
                      disabled={thinking}
                      rows={2}
                    />
                    <button type="submit" className="btn btn--primary" disabled={thinking || !draft.trim()} aria-label="Send answer">
                      {thinking ? '…' : 'Send ↑'}
                    </button>
                  </div>
                </form>
              )}
              {phase === 'report-loading' && (
                <p className="muted" style={{ padding: '12px 4px' }}>Writing your final report…</p>
              )}
              <ErrorState message={error} onRetry={() => { setError(''); setErrorCode(''); }} />
            </div>

            <aside className="ivchat__side" aria-label="Interview progress">
              <details className="ivchat__progress" open>
                <summary>Progress · {asked} / {count}</summary>
                <div className="ivchat__bar" aria-hidden="true"><span style={{ width: `${(asked / count) * 100}%` }} /></div>
                <dl className="ivchat__meta">
                  <div><dt>Target Role</dt><dd>{role}</dd></div>
                  <div><dt>Experience</dt><dd>{level}</dd></div>
                  {signal && (
                    <div>
                      <dt>Answer Quality</dt>
                      <dd><span className="pill" data-tone={qualityTone(signal.quality)}><i />{QUALITY_LABEL[signal.quality] || 'Good'}</span></dd>
                    </div>
                  )}
                  {signal?.depth != null && (
                    <div><dt>Technical Depth</dt><dd style={{ fontFamily: 'var(--font-mono)' }}>{signal.depth} / 100</dd></div>
                  )}
                </dl>
                <Button variant="quiet" onClick={endEarly} disabled={thinking}>
                  {messages.length >= 2 ? 'End & see report' : 'End session'}
                </Button>
              </details>
            </aside>
          </div>
        )}

        {phase === 'report' && report && (
          <div style={{ marginTop: 32 }}>
            <Reveal>
              <p className="eyebrow">Interview complete</p>
              <h2 className="section-title">Your mock interview is complete.</h2>
              <div className="ivchat__score">
                <span className="prod-score__num"><CountUp value={report.overallScore} /></span>
                <span className="prod-score__meta"><strong>Overall Interview Score</strong>out of 100 · from your answers, not a hiring verdict</span>
              </div>
              <div className="prod-meter" style={{ marginTop: 20, maxWidth: 640 }}>
                {[
                  ['Technical Accuracy', report.technicalAccuracy, ''],
                  ['Communication', report.communication, 'sage'],
                  ['Problem Solving', report.problemSolving, 'cobalt'],
                  ['Technical Depth', report.technicalDepth, 'sage'],
                  ['Clarity', report.clarity, '']
                ].map(([n, v, tone]) => (
                  <div key={n} className="prod-meter__row" data-tone={tone}>
                    <span>{n}</span>
                    <span className="prod-meter__track" aria-hidden="true"><span style={{ width: `${v}%` }} /></span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="grid grid--3" style={{ marginTop: 28 }}>
              {[
                ['What you did well', report.strengths],
                ['Needs improvement', report.improvements],
                ['Recommended preparation', report.recommendations]
              ].map(([t, items]) => (
                <Card key={t}>
                  <div className="eval-block">
                    <h4>{t}</h4>
                    <ul>{(items || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                </Card>
              ))}
            </div>

            {report.questions?.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Question-by-question review</h3>
                {report.questions.map((q, i) => (
                  <div key={i} className="player" data-open={openQ === i}>
                    <button type="button" className="player__head" onClick={() => setOpenQ(openQ === i ? -1 : i)} aria-expanded={openQ === i}>
                      <span className="player__num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="player__name">{q.question}</span>
                      <span className="faint" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{q.score}</span>
                      <span className="player__plus" aria-hidden="true">+</span>
                    </button>
                    <div className="player__body"><div>
                      <p><strong style={{ color: 'var(--ink)' }}>Your answer: </strong>{q.answer || '—'}</p>
                      <p><strong style={{ color: 'var(--ink)' }}>AI feedback: </strong>{q.feedback || '—'}</p>
                    </div></div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28, paddingBottom: 'var(--space-7)' }}>
              <button className="btn btn--primary" onClick={practiceAgain}>Practice Again <span className="arr" aria-hidden="true">→</span></button>
              <Link to="/resume" className="btn btn--ghost">Improve My Resume</Link>
              <Link to="/roadmap" className="btn btn--ghost">View Career Roadmap</Link>
              <Link to="/analyze" className="btn btn--ghost">Analyze Another Role</Link>
            </div>
          </div>
        )}
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
