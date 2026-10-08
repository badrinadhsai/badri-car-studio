import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';
import { EmptyState } from '../components/States';

export default function JobMatch() {
  return (
    <>
      <PageMeta
        title="Job matching"
        description="Evidence-based matching of your profile against a target role and job description."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)' }}>
        <p className="eyebrow">Job matching</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Your profile, held against the role.</h1>
        <p className="lede">Candidate profile + job description = evidence-based match analysis. Matched vs missing requirements, a job-match score, and the proof behind every claim.</p>

        <div className="discover" style={{ marginTop: 40 }}>
          {[
            ['Matched requirements', 'What the posting asks for that your profile already demonstrates — quoted back to you, with the resume lines that prove it.'],
            ['Missing requirements', 'The gaps that matter most, ranked so preparation time goes where it counts — each with a reason and a next move.'],
            ['Evidence, not vibes', 'Every judgment traceable to your resume or the JD. Anything unstated is marked “not stated”. The verdict states plainly whether a posting was supplied.']
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 60}>
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
            title="No match computed yet"
            body="Submit a target role — and ideally the job description — in Analyze. Your evidence-backed match analysis is computed live by the backend."
            actions={<Link to="/analyze" className="btn btn--primary btn--sm">Go to Analyze</Link>}
          />
          <div><CTA to="/analyze">Check my fit</CTA></div>
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
