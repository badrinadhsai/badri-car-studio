import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';

const STAGES = [
  ['Understand', 'Your resume is read for evidence — skills, projects, experience. Nothing padded, nothing guessed. Parsed server-side, never stored.'],
  ['Compare', 'That evidence is held against your target role — and, when you supply one, the actual job description. Every score is calibrated to a real goal.'],
  ['Diagnose', 'Matched strengths and missing requirements are named with proof attached. Anything unstated is marked “not stated”, never filled in.'],
  ['Plan', 'Your gaps are ranked by hiring impact and sequenced into a staged roadmap: foundations first, role readiness next.'],
  ['Prepare', 'Role-specific interview questions with scored, structured feedback — plus a resume studio that sharpens wording without inventing facts.']
];

function StickyStory() {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef([]);
  React.useEffect(() => {
    const els = refs.current.filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = Number(e.target.dataset.i);
          setActive(i);
          e.target.dataset.on = 'true';
        }
      });
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="story">
      <div className="story__visual" aria-hidden="true">
        <div>
          <div className="story__bignum" key={active}>{String(active + 1).padStart(2, '0')}</div>
          <div className="story__stagename">{STAGES[active][0]}</div>
          <div className="story__bar"><span style={{ width: `${((active + 1) / STAGES.length) * 100}%` }} /></div>
        </div>
      </div>
      <div className="story__steps">
        {STAGES.map(([name, body], i) => (
          <div
            key={name}
            ref={(el) => { refs.current[i] = el; }}
            data-i={i}
            data-on={active === i}
            className="story__step"
          >
            <h3>{name}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <PageMeta
        title="How it works"
        description="From resume upload to career roadmap: the five-stage CareerPilot AI method."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)' }}>
        <p className="eyebrow">The method / 02</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>Five stages. Zero guesswork.</h1>
        <p className="lede">Scroll the story — each stage takes the spotlight as it becomes current.</p>
        <Reveal><StickyStory /></Reveal>
        <Reveal>
          <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <CTA to="/analyze">Analyze My Career</CTA>
            <Link to="/prompt-engineering" className="btn btn--ghost">How the prompts work</Link>
          </div>
        </Reveal>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
