import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta, Reveal } from '../components/ui';
import { HistorySection, ScorePill, formatDate } from '../components/HistoryPanels';
import { useAuth } from '../context/AuthContext';
import { listAnalyses, listInterviewSessions, listResumeImprovements } from '../services/userData';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [analyses, setAnalyses] = React.useState([]);
  const [interviews, setInterviews] = React.useState([]);
  const [improvements, setImprovements] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      // No Supabase → show the guided empty state, not fake data.
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [a, i, r] = await Promise.all([
          listAnalyses(5).catch(() => []),
          listInterviewSessions(5).catch(() => []),
          listResumeImprovements(5).catch(() => [])
        ]);
        if (!mounted) return;
        setAnalyses(a);
        setInterviews(i);
        setImprovements(r);
      } catch {
        if (mounted) setError('Could not load your career history. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

  const firstName = (profile?.full_name || user?.email || 'there').split(' ')[0];
  const latest = analyses[0];
  const hasAnything = analyses.length > 0 || interviews.length > 0 || improvements.length > 0;

  return (
    <>
      <PageMeta title="Your dashboard" description="Your personal CareerPilot dashboard — recent analyses, readiness, and history." />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 1080 }}>
        <Reveal>
          <p className="eyebrow">Your career profile</p>
          <h1 className="page-title">Welcome back, {firstName}.</h1>
          <p className="lede">
            {profile?.target_role
              ? <>Targeting <strong style={{ color: 'var(--ink)' }}>{profile.target_role}</strong>{profile.experience_level ? <> · {profile.experience_level}</> : null}.</>
              : 'Set a target role to personalize every score.'}
          </p>
        </Reveal>

        {!loading && !hasAnything && !error && (
          <Reveal delay={80}>
            <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: '48px 32px' }}>
              <p className="eyebrow eyebrow--center">Fresh start</p>
              <h2 className="section-title" style={{ textAlign: 'center' }}>Your career journey starts here.</h2>
              <p className="section-sub" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
                Run your first CareerPilot analysis to build your personalized roadmap.
              </p>
              <p style={{ marginTop: 20 }}>
                <Link to="/analyze" className="btn btn--primary">Analyze My Resume →</Link>
              </p>
            </div>
          </Reveal>
        )}

        {latest && (
          <Reveal delay={60}>
            <div className="card" style={{ marginTop: 24 }}>
              <p className="eyebrow">Latest readiness</p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.6rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{latest.readiness_score}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{latest.target_role}</p>
                  <p className="muted" style={{ margin: 0 }}>{formatDate(latest.created_at)} · Job match {latest.job_match_score}</p>
                </div>
                <span style={{ marginLeft: 'auto' }}>
                  <Link to="/analyze" className="btn btn--primary btn--sm">Run New Analysis →</Link>
                </span>
              </div>
            </div>
          </Reveal>
        )}

        <div style={{ display: 'grid', gap: 32, marginTop: 32 }}>
          <HistorySection
            kicker="Analysis"
            title="Career Analysis History"
            loading={loading}
            error={error}
            items={analyses}
            empty={{ title: 'No analyses yet.', body: 'Your readiness scores and roadmaps will collect here.', cta: 'Analyze My Resume', ctaTo: '/analyze' }}
            renderItem={(a) => (
              <div className="hist__row">
                <div>
                  <p className="hist__name">{a.target_role || 'Analysis'}</p>
                  <p className="muted" style={{ margin: 0 }}>{formatDate(a.created_at)} · {a.experience_level || ''}</p>
                </div>
                <ScorePill value={a.readiness_score} />
              </div>
            )}
          />
          <HistorySection
            kicker="Interviews"
            title="Previous Interviews"
            loading={loading}
            error={error}
            items={interviews}
            empty={{ title: 'No interviews yet.', body: 'Mock interview reports will collect here.', cta: 'Start an Interview', ctaTo: '/interview' }}
            renderItem={(s) => (
              <div className="hist__row">
                <div>
                  <p className="hist__name">{s.interview_type || 'Technical Interview'} · {s.target_role}</p>
                  <p className="muted" style={{ margin: 0 }}>
                    {formatDate(s.created_at)} · {s.total_questions} questions{s.overall_score != null ? ` · Score ${s.overall_score}` : ' · In progress'}
                  </p>
                </div>
                {s.overall_score != null && <ScorePill value={s.overall_score} />}
              </div>
            )}
          />
          <HistorySection
            kicker="Resume"
            title="Resume Improvements"
            loading={loading}
            error={error}
            items={improvements}
            empty={{ title: 'No improvements yet.', body: 'Your polished resume versions will collect here.', cta: 'Improve My Resume', ctaTo: '/resume' }}
            renderItem={(r) => (
              <div className="hist__row">
                <div>
                  <p className="hist__name">{r.target_role || 'Resume Improvement'}</p>
                  <p className="muted" style={{ margin: 0 }}>{formatDate(r.created_at)}</p>
                </div>
              </div>
            )}
          />
        </div>
        <div style={{ paddingBottom: 'var(--space-7)' }} />
      </div>
    </>
  );
}
