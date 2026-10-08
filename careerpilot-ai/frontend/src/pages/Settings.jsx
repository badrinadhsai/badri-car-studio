import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, PageMeta, Reveal, useTheme } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <>
      <PageMeta title="Settings" description="Manage your CareerPilot theme, profile, and account." />
      <div className="container" style={{ paddingTop: 'calc(var(--space-9) + 30px)', maxWidth: 760 }}>
        <Reveal>
          <p className="eyebrow">Settings</p>
          <h1 className="page-title">Tune your workspace.</h1>
          <p className="lede">Signed in as <strong style={{ color: 'var(--ink)' }}>{user?.email}</strong></p>
        </Reveal>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <Reveal>
            <Card>
              <h3 style={{ marginBottom: 8 }}>Appearance</h3>
              <p className="muted" style={{ marginBottom: 14 }}>Light or dark — your choice persists on this device.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={toggle}>
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </button>
            </Card>
          </Reveal>
          <Reveal delay={60}>
            <Card>
              <h3 style={{ marginBottom: 8 }}>Profile</h3>
              <p className="muted" style={{ marginBottom: 14 }}>Name, target role, and experience level.</p>
              <Link to="/profile" className="btn btn--ghost btn--sm">Edit Profile →</Link>
            </Card>
          </Reveal>
          <Reveal delay={120}>
            <Card>
              <h3 style={{ marginBottom: 8 }}>Account</h3>
              <p className="muted" style={{ marginBottom: 14 }}>
                Log out on this device. Your saved analyses and history stay private to your account.
              </p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={logout} disabled={busy}>
                {busy ? 'Signing out…' : 'Log Out'}
              </button>
            </Card>
          </Reveal>
        </div>
        <div style={{ paddingBottom: 'var(--space-7)' }} />
      </div>
    </>
  );
}
