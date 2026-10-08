import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, CountUp, Reveal } from './ui';
import { DEMO_TAG } from '../data/demoAnalysis';

/* Editorial career-intelligence report.
   Same `data.analysis` contract, narrative presentation:
   position → working → focus → roadmap → readiness → next move. */

const BREAKDOWN = [
  ['resumeQuality', 'Resume Quality'],
  ['technicalSkills', 'Technical Skills'],
  ['jobMatch', 'Job Match'],
  ['projectsExperience', 'Projects / Experience'],
  ['interviewReadiness', 'Interview Readiness']
];

export function DemoBadge() {
  return <Badge tone="demo">{DEMO_TAG} — not your result</Badge>;
}

function verdictFor(score) {
  if (score >= 75) return 'A strong foundation. Now sharpen the edges.';
  if (score >= 55) return 'Real momentum. A few focused moves change everything.';
  if (score >= 35) return 'A clear starting point — and a plan to leave it.';
  return 'Every expert started exactly here.';
}

function toneFor(v) {
  return v >= 75 ? 'high' : v >= 50 ? 'mid' : 'low';
}

function ArcScore({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const R = 120;
  const C = 2 * Math.PI * R;
  const [offset, setOffset] = React.useState(C);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(() => setOffset(C - (C * v) / 100));
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [v, C]);
  return (
    <div ref={ref} className="arc" role="img" aria-label={`Career readiness score ${v} out of 100`}>
      <svg viewBox="0 0 280 280" aria-hidden="true">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#76f7b5" />
            <stop offset="0.45" stopColor="#63e6e2" />
            <stop offset="0.75" stopColor="#8b7cff" />
            <stop offset="1" stopColor="#5da9ff" />
          </linearGradient>
        </defs>
        <circle className="arc__bg" cx="140" cy="140" r={R} fill="none" strokeWidth="10" />
        <circle className="arc__fg" cx="140" cy="140" r={R} fill="none" strokeWidth="10"
          strokeDasharray={C} strokeDashoffset={offset} />
      </svg>
      <div className="arc__center">
        <div>
          <div className="ready__num"><CountUp value={v} /></div>
          <div className="ready__cap">Readiness</div>
        </div>
      </div>
    </div>
  );
}

export function ReadinessHero({ analysis, demo }) {
  const score = analysis.readinessScore ?? 0;
  return (
    <div>
      <div className="report-kicker">
        <p className="eyebrow" style={{ margin: 0 }}>Career readiness</p>
        {demo && <DemoBadge />}
      </div>
      <div className="ready">
        <div className="ready__score">
          <ArcScore value={score} />
        </div>
        <div>
          <p className="ready__verdict">{verdictFor(score)}</p>
          <p className="ready__summary">{analysis.summary}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge>Guidance metric — not a hiring probability</Badge>
          </div>
          {analysis.scoreExplanation && (
            <p className="muted" style={{ marginTop: 12, fontSize: '0.92rem', maxWidth: '58ch' }}>{analysis.scoreExplanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FactorBar({ value }) {
  const [w, setW] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(() => requestAnimationFrame(() => setW(value)));
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <span ref={ref} className="factor__bar" aria-hidden="true"><span style={{ width: `${w}%` }} /></span>
  );
}

export function ScoreBreakdown({ analysis }) {
  return (
    <div className="report-sec">
      <div className="report-sec__head">
        <p className="eyebrow">Your position</p>
        <h2>Five factors, one honest picture.</h2>
        <p>Weighted 20 / 25 / 20 / 15 / 20 into a single guidance score — computed server-side, never inflated.</p>
      </div>
      <div>
        {BREAKDOWN.map(([key, label]) => {
          const v = Math.max(0, Math.min(100, Number(analysis.breakdown?.[key]) || 0));
          const note = analysis.breakdownNotes?.[key] || '';
          const estimated = key === 'interviewReadiness' && /estimat/i.test(note);
          return (
            <Reveal key={key}>
              <div className="factor" data-tone={toneFor(v)}>
                <span className="factor__name">{label} {estimated && <Badge tone="info">Estimated</Badge>}</span>
                <span className="factor__val">{v} / 100</span>
                {note && <span className="factor__note">{note}</span>}
                <FactorBar value={v} />
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function SkillsSection({ analysis }) {
  const strong = (analysis.strengths || []).map((s) => ({ name: s, tone: 'strong' }));
  const developing = (analysis.matchedSkills || []).map((s) => ({ name: s, tone: 'matched' }));
  const gaps = (analysis.missingSkills || []).map((m) =>
    typeof m === 'string'
      ? { name: m, tone: 'missing' }
      : {
          name: m.skill,
          meta: m.priority,
          tone: m.priority === 'High' ? 'missing' : 'needs-work',
          reason: m.reason,
          evidence: m.currentEvidence,
          action: m.action
        }
  );
  const cols = [
    ['Strong', 'Lead with these.', strong],
    ['Developing', 'Present — deepen them.', developing],
    ['Next', 'The moves that matter most.', gaps.map((g) => ({ name: g.name, meta: g.meta, tone: g.tone }))]
  ];
  const detailed = gaps.filter((g) => g.reason || g.action);
  return (
    <div className="report-sec">
      <div className="report-sec__head">
        <p className="eyebrow">What is working</p>
        <h2>Know what to lead with — and what comes next.</h2>
      </div>
      <div className="grid grid--3">
        {cols.map(([title, sub, items]) => (
          <Reveal key={title}>
            <div>
              <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{title}</h3>
              <p className="faint" style={{ fontSize: '0.85rem', marginBottom: 12 }}>{sub}</p>
              <div className="skill-list">
                {items.length === 0 && <span className="faint">No data yet.</span>}
                {items.map((s, i) => (
                  <span key={`${s.name}-${i}`} className="skill" data-tone={s.tone}>
                    {s.name}
                    {s.meta && <span className="skill-meta">{s.meta}</span>}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      {detailed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          {detailed.map((g, i) => (
            <Reveal key={g.name} delay={i * 60}>
              <div className="gap">
                <span className="gap__idx">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="gap__name" style={{ fontSize: '1.15rem' }}>{g.name}</p>
                  {g.reason && <p className="gap__why">{g.reason}</p>}
                  <div className="gap__meta">
                    {g.evidence && <span><strong>Evidence:</strong> {g.evidence}</span>}
                    {g.action && <span><strong>Move:</strong> {g.action}</span>}
                  </div>
                </div>
                <div className="gap__impact" data-tone={g.tone}>
                  <span className="lvl">{g.meta || 'Gap'}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
      {analysis.extractedSkills?.length > 0 && (
        <p className="faint" style={{ marginTop: 24, fontSize: '0.88rem' }}>
          Extracted from your profile: {analysis.extractedSkills.join(' · ')}
        </p>
      )}
    </div>
  );
}

export function JobMatchSection({ analysis }) {
  const jm = analysis.jobMatch;
  if (!jm) return null;
  const matched = jm.matched || [];
  const missing = jm.missing || [];
  const total = matched.length + missing.length;
  return (
    <div className="report-sec">
      <div className="report-sec__head">
        <p className="eyebrow">The comparison</p>
        <h2>Your profile, held against the role.</h2>
        {jm.jdSupplied === false ? (
          <p><Badge tone="warn">Role-based matching — no job description supplied</Badge></p>
        ) : (
          <p><Badge tone="info">Matched against your job description</Badge></p>
        )}
      </div>
      {jm.basis && <p className="muted" style={{ marginBottom: 20, maxWidth: '64ch' }}>{jm.basis}</p>}
      <div className="compare">
        <div className="compare__col compare__col--you">
          <h3>Your profile</h3>
          <div className="skill-list">
            {matched.map((m) => <span key={m} className="skill" data-tone="strong">{m}</span>)}
            {matched.length === 0 && <span className="faint">Nothing evidenced yet.</span>}
          </div>
        </div>
        <div className="compare__col compare__col--role">
          <h3>Target role</h3>
          <div className="skill-list">
            {matched.map((m) => <span key={m} className="skill" data-tone="matched">{m}</span>)}
            {missing.map((m) => <span key={m} className="skill" data-tone="missing">{m}<span className="skill-meta">to develop</span></span>)}
          </div>
        </div>
      </div>
      {total > 0 && (
        <p className="compare__verdict">
          You already cover {matched.length} of {total} core requirement{total === 1 ? '' : 's'} — match score {jm.score} / 100.
        </p>
      )}
      {jm.evidence?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>Why we believe it</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', display: 'grid', gap: 8, maxWidth: '70ch' }}>
            {jm.evidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ResumeAnalysisSection({ analysis }) {
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const recs = analysis.recommendations || [];
  return (
    <div className="report-sec">
      <div className="report-sec__head">
        <p className="eyebrow">The reading</p>
        <h2>What your resume says about you.</h2>
      </div>
      <div className="grid grid--2">
        <Reveal>
          <div>
            <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>Where to focus</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 14 }}>
              {strengths.map((t, i) => <li key={i} style={{ fontSize: '1.05rem', maxWidth: '40ch' }}>{t}</li>)}
              {strengths.length === 0 && <li className="faint">No data yet.</li>}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div>
            <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--warning)', marginBottom: 12 }}>Honest gaps</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 14 }}>
              {weaknesses.map((t, i) => <li key={i} className="muted" style={{ fontSize: '1.05rem', maxWidth: '40ch' }}>{t}</li>)}
              {weaknesses.length === 0 && <li className="faint">No data yet.</li>}
            </ul>
          </div>
        </Reveal>
      </div>
      {recs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>Recommended next moves</h3>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, color: 'var(--muted)', maxWidth: '70ch' }}>
            {recs.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

export function RoadmapTimeline({ stages }) {
  const [seen, setSeen] = React.useState(0);
  const listRef = React.useRef(null);
  React.useEffect(() => {
    const items = listRef.current?.querySelectorAll('.journey__item');
    if (!items || !items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.dataset.seen = 'true';
          setSeen((n) => n + 1);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [stages]);
  if (!stages || stages.length === 0) return <p className="faint">Roadmap will appear here after analysis.</p>;
  const fillPct = stages.length <= 1 ? 100 : Math.min(100, (seen / stages.length) * 100 + 8);
  return (
    <ol ref={listRef} className="journey">
      <span className="journey__fill" aria-hidden="true" style={{ height: `calc(${fillPct}% - 24px)` }} />
      {stages.map((s, i) => (
        <li key={s.title || i} className="journey__item">
          <span className="journey__dot" aria-hidden="true" />
          <span className="journey__stage">{i === 0 ? 'Now' : i === stages.length - 1 ? 'Ready' : `Next · ${String(i + 1).padStart(2, '0')}`}</span>
          <h3>{s.title}</h3>
          {s.objective && <p className="obj">{s.objective}</p>}
          {s.skills?.length > 0 && (
            <div className="journey__tags">{s.skills.map((k) => <span key={k} className="journey__tag">{k}</span>)}</div>
          )}
          {s.practice?.length > 0 && (
            <ul style={{ margin: '0 0 4px', paddingLeft: 18, color: 'var(--muted)', fontSize: '0.95rem', display: 'grid', gap: 4 }}>
              {s.practice.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          )}
          <div className="journey__foot">
            {s.build && <span><strong style={{ color: 'var(--muted)' }}>Build:</strong> {s.build}</span>}
            {s.focus && <Badge tone="info">Focus · {s.focus}</Badge>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AnalysisDashboard({ analysis, demo }) {
  return (
    <div className="report">
      <ReadinessHero analysis={analysis} demo={demo} />
      <ScoreBreakdown analysis={analysis} />
      <SkillsSection analysis={analysis} />
      <JobMatchSection analysis={analysis} />
      <ResumeAnalysisSection analysis={analysis} />
      <div className="report-sec">
        <div className="report-sec__head">
          <p className="eyebrow">Your roadmap</p>
          <h2>The way forward, in order.</h2>
          <p>Built from your gaps — foundations first, interviews last.</p>
        </div>
        <RoadmapTimeline stages={analysis.roadmap} />
      </div>
      <div className="report-sec">
        <div className="report-sec__head">
          <p className="eyebrow">Next move</p>
          <h2>Prove it out loud.</h2>
          <p>Take your gaps into a mock interview, or sharpen the resume that started all of this.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/interview" className="btn btn--primary">Continue to Interview Coach <span className="arr" aria-hidden="true">→</span></Link>
          <Link to="/resume" className="btn btn--ghost">Improve My Resume</Link>
        </div>
      </div>
    </div>
  );
}
