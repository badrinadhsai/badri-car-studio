import React from 'react';
import { Link } from 'react-router-dom';
import { CTA, PageMeta, Reveal } from '../components/ui';
import { RoadmapTimeline, DemoBadge } from '../components/dashboard';
import { EmptyState } from '../components/States';
import { SAMPLE_ANALYSIS } from '../data/demoAnalysis';

export default function Roadmap() {
  return (
    <>
      <PageMeta
        title="Career roadmap"
        description="A staged, gap-driven learning plan with objectives, practice and builds."
      />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)' }}>
        <p className="eyebrow">Career roadmap</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>The way forward, in order.</h1>
        <p className="lede">Each stage carries an objective, skills to learn, recommended practice, a project or action, and a focus estimate — generated from your gaps, never generic.</p>

        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <DemoBadge />
          </div>
          <p className="muted" style={{ marginBottom: 28, maxWidth: '64ch' }}>
            How a finished roadmap reads — illustrative sample stages. Your personalized plan, built from your real gaps, uses this same journey.
          </p>
          <Reveal><RoadmapTimeline stages={SAMPLE_ANALYSIS.roadmap} /></Reveal>
          <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
            <EmptyState
              title="This preview is not your plan yet"
              body="Run an analysis and your own staged roadmap — same journey, your real data — appears in your report."
              actions={<Link to="/analyze" className="btn btn--primary btn--sm">Go to Analyze</Link>}
            />
            <div><CTA to="/analyze">Build my roadmap</CTA></div>
          </div>
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--space-7)' }} />
    </>
  );
}
