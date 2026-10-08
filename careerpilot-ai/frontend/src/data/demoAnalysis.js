// ---------------------------------------------------------------------------
// SAMPLE / DEMO CONTENT ONLY — clearly separated from live AI functionality.
// Nothing in this file is ever sent as, or confused with, a real analysis.
// It exists solely to preview the product UI (landing page, dashboard shells)
// until the backend LLM is wired in Step 3. Live workflows must NEVER import it
// as a result; they render `data.analysis` from the backend instead.
// ---------------------------------------------------------------------------

export const DEMO_TAG = 'Sample preview';

export const SAMPLE_ANALYSIS = {
  isDemo: true,
  targetRole: 'Frontend Developer (sample)',
  readinessScore: 78,
  summary:
    'Sample preview: a well-structured student profile with solid fundamentals and two strong projects. ' +
    'The main gap is production React experience and testing — both directly addressable in the roadmap below.',
  breakdown: {
    resumeQuality: 82,
    technicalSkills: 74,
    jobMatch: 71,
    projectsExperience: 76,
    interviewReadiness: 68
  },
  breakdownNotes: {
    resumeQuality: 'Clear structure, quantified project outcomes.',
    technicalSkills: 'Core stack present; depth in testing is thin.',
    jobMatch: 'Most requirements covered; 3 priority gaps remain.',
    projectsExperience: 'Two deployed projects; add one collaborative build.',
    interviewReadiness: 'Fundamentals strong; practice system-design basics.'
  },
  strengths: ['Clear project outcomes', 'Modern JavaScript fluency', 'Consistent Git history'],
  weaknesses: ['No testing experience stated', 'Limited accessibility practice', 'Vague internship bullets'],
  extractedSkills: ['JavaScript', 'React', 'HTML/CSS', 'Git', 'REST APIs'],
  matchedSkills: ['JavaScript', 'React', 'HTML/CSS', 'Git'],
  missingSkills: [
    { skill: 'Testing (Jest/Vitest)', priority: 'High' },
    { skill: 'TypeScript', priority: 'High' },
    { skill: 'Accessibility (a11y)', priority: 'Medium' }
  ],
  jobMatch: {
    score: 71,
    jdSupplied: true,
    basis: 'Sample preview basis statement.',
    matched: ['React component architecture', 'REST API integration', 'Responsive layouts'],
    missing: ['Unit/integration testing', 'TypeScript in production', 'CI/CD familiarity'],
    evidence: [
      'Resume states "built 12 reusable React components" — matches component-architecture requirement.',
      'No mention of testing frameworks — flagged as the top missing requirement.',
      'Portfolio links demonstrate deployed responsive work.'
    ]
  },
  recommendations: [
    'Add one tested feature to your strongest project and describe coverage.',
    'Convert a small module to TypeScript and document what changed.',
    'Rewrite internship bullets with outcomes, not duties.'
  ],
  roadmap: [
    {
      title: 'Foundation',
      objective: 'Close the testing gap on your existing stack.',
      skills: ['Vitest', 'Testing Library', 'Git branching'],
      practice: ['Write tests for 3 existing components', 'Reach 70%+ coverage on one repo'],
      build: 'Ship a tested feature to your portfolio project.',
      focus: '2–3 weeks'
    },
    {
      title: 'Role Readiness',
      objective: 'Become credible for junior frontend postings.',
      skills: ['TypeScript', 'Accessibility', 'CI basics'],
      practice: ['Type one project end-to-end', 'Audit a page with a screen reader'],
      build: 'Deploy a typed, accessible mini-app via CI.',
      focus: '3–4 weeks'
    },
    {
      title: 'Interview Preparation',
      objective: 'Convert readiness into offers.',
      skills: ['JS internals', 'Behavioral stories', 'Live-coding flow'],
      practice: ['Weekly mock interviews', 'Record and review 3 sessions'],
      build: 'A one-page interview playbook for your target role.',
      focus: '2 weeks'
    }
  ]
};

export const SAMPLE_QUESTIONS = [
  { n: 1, type: 'Technical', text: 'Sample: explain how React reconciliation works and why keys matter in lists.' },
  { n: 2, type: 'Behavioral', text: 'Sample: describe a time you debugged a difficult production issue. What was your process?' },
  { n: 3, type: 'Situational', text: 'Sample: your page loads slowly on mobile — how do you diagnose and fix it?' }
];
