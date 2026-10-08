import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';

export default function About() {
  return (
    <>
      <PageMeta
        title="About"
        description="CareerPilot AI is a Generative AI and Prompt Engineering project helping students understand career readiness."
      />
      <section className="statement" style={{ paddingTop: 'calc(var(--space-10) + 40px)' }}>
        <div className="container">
          <Reveal><p className="eyebrow">About CareerPilot</p></Reveal>
          <Reveal delay={100}>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4.2rem)', maxWidth: '20ch' }}>
              Career decisions are easier<br />
              when <span className="accent-word">the next step is clear.</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p>
              CareerPilot AI is AI career intelligence for students — a Generative AI and Prompt Engineering
              project that turns a resume, a target role and a job posting into an honest readiness analysis
              and a plan you can act on.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="discover">
            {[
              ['Purpose', 'Help students see where they stand against real roles — and exactly what to do next. Frontend/backend separation, input validation, server-side PDF parsing, a dedicated prompt layer per capability, and structured response validation. No custom model training; no black boxes.'],
              ['Responsible AI', 'Results are guidance, never hiring verdicts. Analysis uses only supplied information — gaps are disclosed, never filled in. Scores explain themselves. CareerPilot claims no university approvals, awards, users, partnerships, publications or company affiliations.'],
              ['Privacy', 'Resumes are parsed in memory for analysis, not hoarded. Model credentials live in backend environment variables — the browser holds none, and complete resume contents are never logged.'],
              ['Limitations & scope', 'Guidance for learning decisions, not predictions of outcomes. No auth, no database, no microservices — just the career workflows that matter. Interview readiness stays an estimate until you complete a session.']
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
          <Reveal>
            <div style={{ marginTop: 40 }}>
              <CTA to="/analyze">Analyze My Career</CTA>
            </div>
          </Reveal>
        </div>
      </section>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
