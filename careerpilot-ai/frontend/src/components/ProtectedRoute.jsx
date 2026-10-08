import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container section" aria-busy="true" aria-label="Loading your account">
        <p className="eyebrow">CareerPilot AI</p>
        <h1 className="page-title">Loading your career…</h1>
        <p className="lede">Checking your session.</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="container section">
        <p className="eyebrow">Setup required</p>
        <h1 className="page-title">Authentication is not configured.</h1>
        <p className="lede">
          This page needs Supabase credentials. Follow <strong>SUPABASE_SETUP.md</strong> in the
          project root, add your <strong>VITE_SUPABASE_URL</strong> and{' '}
          <strong>VITE_SUPABASE_ANON_KEY</strong>, then reload.
        </p>
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}
