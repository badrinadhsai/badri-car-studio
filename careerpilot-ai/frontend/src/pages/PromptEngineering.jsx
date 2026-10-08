import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';

const LAYERS = [
  ['System role', 'Who the model is: a rigorous, honest career analyst for students — never a hype-driven chatbot.'],
  ['Candidate context', 'The supplied resume text, parsed faithfully. The model may only use what is present.'],
  ['Target role', 'The goal every judgment is calibrated against, plus experience level.'],
  ['Job requirements', 'The supplied posting, when provided — the basis for evidence-backed matching.'],
  ['Task', 'Exactly one job per prompt: analyze, match, gap-scan, plan, question, evaluate or improve.'],
  ['Constraints', 'No invented qualifications, projects, metrics, employers or credentials. Unknowns marked “not stated”.'],
  ['Output schema', 'Strict JSON contracts per capability, so the dashboard renders reliably.'],
  ['Validation', 'Server-side parse, schema check and safe failure — malformed output never reaches you.']
];

const PROMPTS = [
  ['Resume Analysis', 'Strengths, weaknesses, skills and wording signals — all traceable to the resume.'],
  ['Job Matching', 'Profile vs posting with per-requirement evidence and an honest score.'],
  ['Skill Gap', 'Extracted vs matched vs missing skills with impact-ranked priorities.'],
  ['Roadmap', 'Gap-built stages: objective, skills, practice, build and focus estimate.'],
  ['Interview Questions', 'Role-specific technical, behavioral and situational questions.'],
  ['Interview Evaluation', 'Score, strengths, gaps, improvements and better-answer structure.'],
  ['Resume Improvement', 'Clearer, stronger wording with zero fabricated content.']
];

function LayerAccordion() {
  const [open, setOpen] = React.useState(0);
  return (
    <div style={{ marginTop: 32 }}>
      {LAYERS.map(([name, body], i) => (
        <Reveal key={name} delay={i * 40}>
          <div className="player" data-open={open === i}>
            <button
              type="button"
              className="player__head"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span className="player__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="player__name">{name}</span>
              <span className="player__plus" aria-hidden="true">+</span>
            </button>
            <div className="player__body" aria-hidden={open !== i}>
              <div><p>{body}</p></div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function PromptEngineering() {
  return (
    <>
      <PageMeta
        title="Prompt engineering methodology"
        description="Seven dedicated prompt templates with role, context, task, constraints, schema and validation — the core technical contribution."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)' }}>
        <p className="eyebrow">Methodology</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Engineered prompts, not a chatbot.</h1>
        <p className="lede">Seven dedicated templates — role, context, task, constraints, output schema, quality rules, safety rules. Open each layer to see what it does.</p>

        <LayerAccordion />

        <div style={{ marginTop: 56 }}>
          <p className="eyebrow">Seven prompts, one job each</p>
          <h2 className="section-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Small models of the same discipline.</h2>
          <div className="discover" style={{ marginTop: 24 }}>
            {PROMPTS.map(([t, b], i) => (
              <Reveal key={t} delay={(i % 2) * 60}>
                <div className="discover__row">
                  <div>
                    <p className="discover__k">{String(i + 1).padStart(2, '0')} — Prompt</p>
                    <h3>{t}</h3>
                  </div>
                  <p>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 28, fontSize: '0.9rem' }}>
            Templates live in <code style={{ fontFamily: 'var(--font-mono)' }}>backend/prompts/</code> and execute
            server-side only. No credentials or internal keys are ever exposed through this page.
          </p>
          <div style={{ marginTop: 24 }}>
            <CTA to="/analyze">Try what they produce</CTA>
          </div>
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
