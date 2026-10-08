import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, CountUp, Icon, PageMeta, Reveal, SectionHead, TrajectoryVisual, useMagnetic } from '../components/ui';

const Trajectory3D = React.lazy(() => import('../components/Trajectory3D'));

/* ---------- shared bits ---------- */

function Bar({ value }) {
  const [w, setW] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) {
        requestAnimationFrame(() => requestAnimationFrame(() => setW(value)));
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <span ref={ref} className="prod-meter__track" aria-hidden="true">
      <span style={{ width: `${w}%` }} />
    </span>
  );
}

function HeroCTA() {
  const ref = useMagnetic(0.16);
  return (
    <div className="hero-cine__actions">
      <Link to="/analyze" ref={ref} className="btn btn--accent">Analyze My Career <span className="arr" aria-hidden="true">→</span></Link>
      <Link to="/how-it-works" className="hero-cine__link">See How It Works <span className="arr" aria-hidden="true">→</span></Link>
    </div>
  );
}

function HeroScene() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  if (reduced) return <TrajectoryVisual />;
  return (
    <React.Suspense fallback={<TrajectoryVisual />}>
      <div style={{ position: 'relative' }}>
        <Trajectory3D />
        <div className="scene3d__caption">Profile → Skills → Role → Gap Analysis → Roadmap → Interview → Career Ready</div>
      </div>
    </React.Suspense>
  );
}

/* SECTION 01 — hero product visual (mirrors the real dashboard contract) */
const HERO_METERS = [
  { label: 'Resume Quality', value: 72, tone: '' },
  { label: 'Technical Skills', value: 76, tone: 'sage' },
  { label: 'Job Match', value: 64, tone: 'cobalt' },
  { label: 'Interview Readiness', value: 58, tone: 'sage' }
];

function HeroProduct() {
  return (
    <div className="prod-shell" role="img" aria-label="Preview of the CareerPilot readiness dashboard showing a career readiness score of 68 with skill gaps and a next move">
      <div className="prod-shell__bar"><i /><i /><i /><span style={{ marginLeft: 6 }}>careerpilot.ai / overview</span></div>
      <div className="prod-shell__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="prod-live">Live analysis</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--faint)' }}>TARGET · FRONTEND DEVELOPER</span>
        </div>
        <div className="prod-score">
          <span className="prod-score__num"><CountUp value={68} /></span>
          <span className="prod-score__meta"><strong>Career Readiness</strong>out of 100 · guidance signal, not a hiring verdict</span>
        </div>
        <div className="prod-meter">
          {HERO_METERS.map((m) => (
            <div key={m.label} className="prod-meter__row" data-tone={m.tone}>
              <span>{m.label}</span>
              <Bar value={m.value} />
              <span>{m.value}</span>
            </div>
          ))}
        </div>
        <div>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--faint)', fontWeight: 700, marginBottom: 8 }}>Top skill gaps</p>
          <div className="prod-gaps">
            <span className="prod-gap" data-hot="true">React</span>
            <span className="prod-gap" data-hot="true">AWS</span>
            <span className="prod-gap" data-hot="true">System Design</span>
          </div>
        </div>
        <div className="prod-next">
          <p><strong>Next move</strong>Build a production-ready project</p>
          <Link to="/analyze" className="btn btn--primary btn--sm">Open <span className="arr" aria-hidden="true">→</span></Link>
        </div>
        <div className="prod-toast"><Icon name="check" size={16} /><span><strong>Resume parsed.</strong> 14 skills extracted with evidence attached to each claim.</span></div>
      </div>
    </div>
  );
}

/* data */
const CAPS = [
  { no: '01', icon: 'resume', tone: '', t: 'Understand your profile', b: 'Your resume is read for evidence — skills, projects, experience. Nothing padded, nothing guessed.' },
  { no: '02', icon: 'target', tone: 'cobalt', t: 'Find your gaps', b: 'Matched strengths and missing requirements, ranked by what moves hiring outcomes.' },
  { no: '03', icon: 'roadmap', tone: 'sage', t: 'Build your next move', b: 'A staged plan with skills, practice and builds — foundations first, interviews last.' }
];

const SKILLMAP = [
  { n: 'React', w: 82, s: 'Strong', tone: 'strong' },
  { n: 'JavaScript', w: 78, s: 'Strong', tone: 'strong' },
  { n: 'Git', w: 74, s: 'Strong', tone: 'strong' },
  { n: 'AWS', w: 42, s: 'Growing', tone: 'growing' },
  { n: 'System Design', w: 22, s: 'Gap', tone: 'gap' },
  { n: 'Testing', w: 18, s: 'Gap', tone: 'gap' }
];

const STAGES = [
  { no: 'Stage 01', t: 'Strengthen foundations', d: 'Close the highest-impact gaps first with verifiable practice.', items: ['React patterns', 'Testing basics', 'Ship one improvement'] },
  { no: 'Stage 02', t: 'Build proof', d: 'Turn skills into evidence a hiring manager can inspect.', items: ['Production project', 'Deployed demo', 'Code review habits'] },
  { no: 'Stage 03', t: 'Prepare for interviews', d: 'Convert readiness into clear, structured answers.', items: ['Role-specific questions', 'Scored mock sessions', 'Story bank'] },
  { no: 'Stage 04', t: 'Target roles', d: 'Apply where your profile already aligns.', items: ['Tailored resume', 'Match 70%+ roles', 'Follow-up plan'] }
];

const PCHAIN = [
  ['01', 'Role', 'A senior hiring lens for the target role — calibrated, not generic.'],
  ['02', 'Context', 'Your resume, target role and posting — the only facts allowed.'],
  ['03', 'Task', 'Score, compare, name gaps, sequence a roadmap, coach interviews.'],
  ['04', 'Constraints', 'No invented experience. No hiring guarantees. Evidence required.'],
  ['05', 'Output schema', 'Fixed JSON contract the UI already consumes and validates.'],
  ['06', 'Validation', 'Server-side checks before anything renders on screen.'],
  ['07', 'Career insight', 'Plain-language guidance you can act on this week.']
];

const IMG = (id, w = 1200) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export default function Landing() {
  return (
    <>
      <PageMeta
        title="Turn your skills into a career roadmap"
        description="CareerPilot AI analyzes your resume, target role, skills and interview readiness to show you what to improve and what to do next."
      />

      {/* SECTION 01 — HERO */}
      <section className="hero-cine">
        <div className="hero-aura" aria-hidden="true" />
        <div className="container hero-cine__grid">
          <div>
            <Reveal><p className="eyebrow">Career intelligence platform</p></Reveal>
            <h1>
              <Reveal delay={90}><span className="rl"><span style={{ '--d': '90ms' }}>Turn your skills</span></span></Reveal>
              <Reveal delay={200}><span className="rl"><span style={{ '--d': '200ms' }}>into a career roadmap.</span></span></Reveal>
            </h1>
            <Reveal delay={320}>
              <p className="lede">CareerPilot AI analyzes your resume, target role, skills and interview readiness to show you what to improve and what to do next.</p>
            </Reveal>
            <Reveal delay={400}><HeroCTA /></Reveal>
            <Reveal delay={480}>
              <div className="journey-strip" aria-label="How it works">
                <b>Upload resume</b><span className="sep">·</span>
                <b>Target role</b><span className="sep">·</span>
                <b>Career score</b><span className="sep">·</span>
                <b>Skill gaps</b><span className="sep">·</span>
                <b>Roadmap</b><span className="sep">·</span>
                <b>Interview coach</b>
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal delay={260}><HeroProduct /></Reveal>
            <Reveal delay={380}><HeroScene /></Reveal>
          </div>
        </div>
        <div className="hero-cine__scroll" aria-hidden="true">Scroll</div>
      </section>

      {/* SECTION 02 — TRUST / POSITIONING */}
      <section className="statement" style={{ paddingBottom: 0 }}>
        <div className="container">
          <Reveal>
            <h2>
              Your resume tells your story.<br />
              <span className="dim">CareerPilot helps you understand where that story needs to go next.</span>
            </h2>
          </Reveal>
          <div className="cap-grid">
            {CAPS.map((c, i) => (
              <Reveal key={c.no} delay={i * 80}>
                <div className="cap">
                  <span className="icon-badge" data-tone={c.tone}><Icon name={c.icon} /></span>
                  <div>
                    <p className="cap__no">{c.no}</p>
                    <h3>{c.t}</h3>
                    <p>{c.b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03 — REAL PRODUCT EXPERIENCE */}
      <section className="section">
        <div className="container">
          <SectionHead
            kicker="Product experience"
            title="See your career from a different angle."
            lede="The same score system, labels and components as the live dashboard — readiness, skill profile, job match, gaps and recommendations."
          />
          <div className="split-prod">
            <Reveal>
              <div className="shot">
                <img src={IMG('photo-1522071820081-009f0129c71c')} alt="Two young professionals reviewing work together at a desk" loading="lazy" />
                <span className="shot__cap">Real profiles · real roles</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="mini-ui">
                <h3>Career score</h3>
                <div className="mini-ui__score"><b><CountUp value={68} /></b><span className="muted">/ 100 readiness</span></div>
                <div className="prod-meter">
                  <div className="prod-meter__row"><span>Resume</span><Bar value={72} /><span>72</span></div>
                  <div className="prod-meter__row" data-tone="sage"><span>Skills</span><Bar value={76} /><span>76</span></div>
                  <div className="prod-meter__row" data-tone="cobalt"><span>Job match</span><Bar value={64} /><span>64</span></div>
                </div>
                <div className="pill-row">
                  <span className="pill"><i />React · Strong</span>
                  <span className="pill" data-tone="gap"><i />AWS · Gap</span>
                  <span className="pill" data-tone="cobalt"><i />System Design · Priority</span>
                </div>
                <Link to="/analyze" className="btn btn--primary btn--sm" style={{ justifySelf: 'start' }}>Run your analysis <span className="arr" aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 04 — RESUME INTELLIGENCE */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead kicker="Resume intelligence" title="Turn your resume into useful insight." lede="Understand where your profile stands — experience, skills, projects, keywords and concrete improvement suggestions." />
          <div className="split-prod">
            <Reveal>
              <div className="shot">
                <img src={IMG('photo-1454165804606-c3d57bc86b40')} alt="Professional reviewing career documents and planning notes" loading="lazy" />
                <span className="shot__cap">Evidence first · nothing invented</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="mini-ui">
                <h3>Resume quality · 72</h3>
                <div className="prod-meter">
                  <div className="prod-meter__row"><span>Experience</span><Bar value={70} /><span>70</span></div>
                  <div className="prod-meter__row" data-tone="sage"><span>Skills</span><Bar value={76} /><span>76</span></div>
                  <div className="prod-meter__row" data-tone="cobalt"><span>Projects</span><Bar value={68} /><span>68</span></div>
                  <div className="prod-meter__row"><span>Keywords</span><Bar value={61} /><span>61</span></div>
                </div>
                <p className="muted" style={{ fontSize: '0.9rem' }}>“Built responsive pages for a college fest site; resolved layout issues reported by users.” — same facts, sharper wording.</p>
                <Link to="/resume" className="btn btn--ghost btn--sm" style={{ justifySelf: 'start' }}>Open Resume Studio <span className="arr" aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 05 — JOB MATCHING */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead kicker="Job matching" title="Know what employers are looking for." lede="See which skills matter for your target role — matched, missing and what to do about each." />
          <div className="split-prod">
            <Reveal>
              <div className="mini-ui">
                <h3>Target role · Frontend Developer</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>React · TypeScript · Testing · System Design · Cloud deployment · Git · Communication</p>
                <div className="shot" style={{ minHeight: 0 }}>
                  <img src={IMG('photo-1497032628192-86f99bcd76bc')} alt="Developer workstation with laptop and notebook" loading="lazy" style={{ aspectRatio: '16 / 8' }} />
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="mini-ui">
                <h3>CareerPilot analysis · 78% alignment</h3>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--faint)', fontWeight: 700 }}>Matched</p>
                <div className="pill-row">
                  <span className="pill"><i />React</span>
                  <span className="pill"><i />JavaScript</span>
                  <span className="pill"><i />Git</span>
                </div>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--faint)', fontWeight: 700 }}>Needs attention</p>
                <div className="pill-row">
                  <span className="pill" data-tone="gap"><i />Testing</span>
                  <span className="pill" data-tone="gap"><i />System Design</span>
                  <span className="pill" data-tone="gap"><i />Cloud deployment</span>
                </div>
                <Link to="/job-match" className="btn btn--primary btn--sm" style={{ justifySelf: 'start' }}>Check your match <span className="arr" aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 06 — SKILL GAP */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container split">
          <div className="split__sticky">
            <SectionHead kicker="Skill gaps" title="Know what to learn next." lede="A clean map of where you stand — strong, growing, or gap — ranked by hiring impact." />
            <Link to="/skills" className="btn btn--ghost btn--sm">Explore skill gaps <span className="arr" aria-hidden="true">→</span></Link>
          </div>
          <Reveal delay={100}>
            <div className="skillmap" role="list" aria-label="Skill map">
              {SKILLMAP.map((s) => (
                <div key={s.n} className="skillmap__row" data-tone={s.tone} role="listitem" title={`${s.n} — ${s.s}`}>
                  <span className="nm">{s.n}</span>
                  <span className="skillmap__line" aria-hidden="true"><span style={{ width: `${s.w}%` }} /></span>
                  <span className="skillmap__st">{s.s}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 07 — ROADMAP */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead kicker="Roadmap" title="Turn gaps into a plan." lede="Foundations first, proof second, interviews last. Each stage carries a goal, skills, a project and an action." />
          <div className="stages-h">
            {STAGES.map((s, i) => (
              <Reveal key={s.no} delay={i * 80}>
                <div className="stage-h">
                  <span className="stage-h__no">{s.no}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <ul>{s.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div style={{ marginTop: 20 }}>
              <Link to="/roadmap" className="btn btn--primary btn--sm">View your roadmap <span className="arr" aria-hidden="true">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 08 — INTERVIEW COACH */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead kicker="Interview coach" title="Prepare before the interview." lede="Practice before the interview — role-specific questions with structured, honest feedback." />
          <div className="split-prod">
            <Reveal>
              <div className="shot">
                <img src={IMG('photo-1573496359142-b8d87734a5a2')} alt="Young professional preparing for a job interview" loading="lazy" />
                <span className="shot__cap">Practice out loud</span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="iv-mock">
                <p className="eyebrow" style={{ margin: 0 }}>Question 03 / 05 · System design</p>
                <p className="iv-mock__q">“Explain how you would design a scalable web application.”</p>
                <div className="iv-bars">
                  {[['Clarity', 72], ['Technical depth', 58], ['Structure', 66], ['Confidence', 61]].map(([n, v]) => (
                    <div key={n} className="iv-bar"><span>{n}</span><span className="iv-bar__t"><span style={{ width: `${v}%` }} /></span><span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{v}</span></div>
                  ))}
                </div>
                <Link to="/interview" className="btn btn--ghost btn--sm" style={{ justifySelf: 'start' }}>Meet the interview coach <span className="arr" aria-hidden="true">→</span></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 09 — PROMPT ENGINEERING */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container split">
          <div className="split__sticky">
            <SectionHead kicker="Prompt engineering" title="Structured prompting, visible." lede="How CareerPilot turns your input into reliable career insight — a dedicated prompt layer per capability, validated server-side." />
            <Link to="/prompt-engineering" className="btn btn--ghost btn--sm">How prompting works <span className="arr" aria-hidden="true">→</span></Link>
          </div>
          <div className="pchain">
            {PCHAIN.map(([n, t, b], i) => (
              <Reveal key={n} delay={i * 50}>
                <div>
                  <div className="pchain__node">
                    <strong>{n}</strong>
                    <div><h3>{t}</h3><p>{b}</p></div>
                  </div>
                  {i < PCHAIN.length - 1 && <div className="pchain__arrow" aria-hidden="true">↓</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 — RESPONSIBLE AI */}
      <section className="section band" style={{ paddingTop: 0 }}>
        <div className="container band__inner">
          <SectionHead kicker="Responsible AI" title="Honest by design." />
          <div className="trust-grid">
            {[
              ['security', 'No guaranteed employment', 'Scores are readiness signals to guide learning — never hiring outcomes.'],
              ['doc', 'No fabricated experience', 'The AI works only from what you supply. It will not invent skills or credentials.'],
              ['analysis', 'AI-generated guidance', 'Structured prompts with validated schemas — every claim traced to evidence.'],
              ['progress', 'Your data stays yours', 'Resumes are parsed in memory for analysis, not stored unnecessarily.'],
              ['interview', 'Private by architecture', 'API keys stay server-side. The browser holds none.']
            ].map(([icon, t, b], i) => (
              <Reveal key={t} delay={i * 60}>
                <div className="trust">
                  <span className="icon-badge" data-tone={i % 2 ? 'sage' : ''}><Icon name={icon} /></span>
                  <h3>{t}</h3>
                  <p>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11 — FINAL CTA */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-panel" style={{ textAlign: 'left' }}>
              <div className="final-split">
                <div>
                  <p className="eyebrow">Begin</p>
                  <h2>Your next career move starts with clarity.</h2>
                  <p style={{ marginTop: 12 }}>Upload your resume and target role to get started.</p>
                  <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <CTA to="/analyze">Analyze My Career</CTA>
                    <Link to="/how-it-works" className="btn btn--ghost">See How It Works</Link>
                  </div>
                </div>
                <div className="shot">
                  <img src={IMG('photo-1497366216548-37526070297c', 1000)} alt="Modern professional workspace with natural light" loading="lazy" />
                  <span className="shot__cap">Clarity first</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
