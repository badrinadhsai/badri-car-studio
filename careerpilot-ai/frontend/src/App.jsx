import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Analyze from './pages/Analyze';
import Resume from './pages/Resume';
import JobMatch from './pages/JobMatch';
import Skills from './pages/Skills';
import Roadmap from './pages/Roadmap';
import Interview from './pages/Interview';
import HowItWorks from './pages/HowItWorks';
import PromptEngineering from './pages/PromptEngineering';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function NotFound() {
  return (
    <div className="container section">
      <p className="eyebrow">404</p>
      <h1 className="page-title">Page not found.</h1>
      <p className="lede">That route does not exist. Back to safety:</p>
      <p style={{ marginTop: 20 }}><Link to="/" className="btn btn--primary">Go home</Link></p>
    </div>
  );
}

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/prompt-engineering" element={<PromptEngineering />} />
          <Route path="/about" element={<About />} />

          {/* Authenticated (redirect to /login?redirect=… when logged out) */}
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/analyze" element={guard(<Analyze />)} />
          <Route path="/resume" element={guard(<Resume />)} />
          <Route path="/job-match" element={guard(<JobMatch />)} />
          <Route path="/skills" element={guard(<Skills />)} />
          <Route path="/roadmap" element={guard(<Roadmap />)} />
          <Route path="/interview" element={guard(<Interview />)} />
          <Route path="/profile" element={guard(<Profile />)} />
          <Route path="/settings" element={guard(<Settings />)} />

          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
