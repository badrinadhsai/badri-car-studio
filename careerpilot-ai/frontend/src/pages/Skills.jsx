import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';
import { EmptyState } from '../components/States';

const LEGEND = [
  ['strong', 'Strong', 'Verified strengths to lead with'],
  ['matched', 'Matched', 'Required and present'],
  ['needs-work', 'Needs work', 'Present but thin'],
  ['missing', 'Missing', 'Required but absent']
];

export default function Skills() {
  return (
    <>
      <PageMeta
        title="Skill gap analysis"
        description="Current, required, matched and missing skills with priorities — the input to your roadmap."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)' }}>
        <p className="eyebrow">Skill gap analysis</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Know exactly what to learn next.</h1>
        <p className="lede">Current skills, required skills, matched skills, missing skills and priority gaps — the direct input to your personalized roadmap.</p>

        <Reveal>
          <div style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>How to read your map</h2>
            <div className="skill-list" style={{ maxWidth: 560 }}>
              {LEGEND.map(([tone, label, hint]) => (
                <span key={tone} title={hint} className="skill" data-tone={tone}>{label}<span className="skill-meta">{hint}</span></span>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 14, fontSize: '0.9rem' }}>
              Legend only — your live skill map renders in your report after analysis, with priority on every gap.
            </p>
          </div>
        </Reveal>

        <div className="discover" style={{ marginTop: 32 }}>
          {[
            ['Current skills', 'Extracted strictly from your resume — what you can already claim with confidence.'],
            ['Required skills', 'Parsed from the target role and job description — what “ready” actually means.'],
            ['Matched skills', 'The overlap: proof you belong in the conversation for this role.'],
            ['Priority gaps', 'The missing pieces ranked by hiring impact — these become roadmap stages.']
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 50}>
              <div className="discover__row">
                <div>
                  <p className="discover__k">{String(i + 1).padStart(2, '0')}</p>
                  <h3>{t}</h3>
                </div>
                <p>{b}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
          <EmptyState
            title="Your skill map is empty"
            body="Complete an analysis to see extracted, matched and missing skills with live priorities."
            actions={<Link to="/analyze" className="btn btn--primary btn--sm">Go to Analyze</Link>}
          />
          <div><CTA to="/analyze" magnetic={false}>Map my skills</CTA></div>
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
