import React from 'react';
import { Field, Input, PageMeta, Reveal, Select, TargetRoleSelect } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['Student', 'Fresher', '0–1 years', '1–3 years', '3+ years'];

export default function Profile() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [level, setLevel] = React.useState('Fresher');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTargetRole(profile.target_role || '');
      setLevel(profile.experience_level || 'Fresher');
    }
  }, [profile]);

  React.useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completion = React.useMemo(() => {
    let done = 0;
    const total = 3;
    if (fullName.trim()) done += 1;
    if (targetRole.trim()) done += 1;
    if (level) done += 1;
    return Math.round((done / total) * 100);
  }, [fullName, targetRole, level]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await updateProfile({
      full_name: fullName.trim(),
      target_role: targetRole.trim() || null,
      experience_level: level
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNotice('Profile saved.');
  }

  const firstName = (profile?.full_name || user?.email || 'there').split(' ')[0];

  return (
    <>
      <PageMeta title="Your profile" description="View and update your CareerPilot profile." />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 760 }}>
        <Reveal>
          <p className="eyebrow">Your career profile</p>
          <h1 className="page-title">Hi, {firstName}.</h1>
          <p className="lede">This is how CareerPilot addresses you and pre-fills your target role.</p>
        </Reveal>
        <Reveal delay={80}>
          <div className="card" style={{ marginTop: 24 }}>
            <div className="profile-complete" aria-label={`Profile ${completion}% complete`}>
              <span>Profile completion</span>
              <span className="profile-complete__track" aria-hidden="true">
                <span style={{ width: `${completion}%` }} />
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{completion}%</span>
            </div>
            <form onSubmit={submit} noValidate style={{ marginTop: 20 }}>
              <Field label="Full Name" htmlFor="p-name">
                <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Email" hint="managed by your login — read-only">
                <Input value={user?.email || ''} disabled aria-label="Email (read-only)" />
              </Field>
              <Field label="Target Role" htmlFor="p-role">
                <TargetRoleSelect id="p-role" value={targetRole} onChange={setTargetRole} />
              </Field>
              <Field label="Experience Level" htmlFor="p-level">
                <Select id="p-level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </Select>
              </Field>
              {error && <p className="field-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
              {notice && <p className="auth-notice" role="status" style={{ marginBottom: 12 }}>{notice}</p>}
              <button type="submit" className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </div>
        </Reveal>
        <div style={{ paddingBottom: 'var(--space-7)' }} />
      </div>
    </>
  );
}
