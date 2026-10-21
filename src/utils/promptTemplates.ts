import { PromptTemplate } from '../types/index.js';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Student prompts
  {
    id: 'student-exam-10mark',
    title: '10-Mark Exam Answer Outline',
    category: 'study',
    workspace: 'student',
    description: 'Generates a high-scoring, structured answer with definitions, working mechanisms, diagram descriptions, and summary points.',
    prompt: 'Provide a comprehensive 10-mark university exam answer for the following topic. Include: 1) Definition & Overview, 2) Key Principles / Theory, 3) Architecture / Working Flow, 4) Real-world Example, 5) Advantages & Limitations, 6) Summary Table.\n\nTopic: ',
  },
  {
    id: 'student-notes',
    title: 'High-Yield Revision Notes',
    category: 'study',
    workspace: 'student',
    description: 'Transform complex textbook chapters or lecture notes into crisp bulleted revision notes with formula boxes.',
    prompt: 'Create high-yield revision notes from the following text/concept. Organize with key terms, formulas/laws, memory mnemonics, and 5 quick recall questions:\n\n',
  },
  {
    id: 'student-telugu-explain',
    title: 'తెలుగులో కాన్సెప్ట్ అర్థం చేసుకోండి (Explain in Telugu)',
    category: 'study',
    workspace: 'student',
    description: 'Explain technical concepts in simple Telugu with real-life analogies while keeping technical keywords in English.',
    prompt: 'ఈ కాన్సెప్ట్‌ను చాలా సులభంగా అర్థమయ్యే తెలుగులో మరియు మంచి రియల్ లైఫ్ ఉదాహరణలతో వివరించండి. టెక్నికల్ పదాలు ఇంగ్లీష్‌లోనే ఉంచండి:\n\nకాన్సెప్ట్: ',
  },
  {
    id: 'student-quiz',
    title: 'MCQ & Quiz Generator',
    category: 'study',
    workspace: 'student',
    description: 'Generates 5 multiple choice questions with tricky distractors and detailed explanations for each option.',
    prompt: 'Generate 5 multiple-choice questions (MCQs) for the topic below. For each question, provide 4 options (A-D), specify the correct answer, and explain why the correct option is right and why others are wrong.\n\nTopic: ',
  },

  // Developer prompts
  {
    id: 'dev-code-review',
    title: 'Senior Code Review & Security Audit',
    category: 'coding',
    workspace: 'developer',
    description: 'Inspects code for OWASP vulnerabilities, performance bottlenecks, race conditions, and idiomatic improvements.',
    prompt: 'Perform a comprehensive senior software engineer code review on the following code. Identify: 1) Security risks or injection flaws, 2) Edge cases & unhandled errors, 3) Performance/memory bottlenecks, 4) Clean code refactored version.\n\n```\n\n```',
  },
  {
    id: 'dev-debug-error',
    title: 'Root-Cause Debugger',
    category: 'coding',
    workspace: 'developer',
    description: 'Pinpoints the exact root cause of an error trace and provides a drop-in tested fix.',
    prompt: 'Help me debug this error. Explain the root cause simply, outline why it occurred in this context, and provide the exact fixed code block:\n\nError Message:\n\nRelevant Code:\n',
  },
  {
    id: 'dev-unit-tests',
    title: 'Production Unit Test Suite',
    category: 'coding',
    workspace: 'developer',
    description: 'Writes complete Vitest / Jest / Pytest unit tests including edge cases, mocks, and happy/unhappy paths.',
    prompt: 'Write a comprehensive unit test suite with high code coverage for the following function/component. Include normal cases, boundary values, empty states, and error handling:\n\n',
  },

  // Startup prompts
  {
    id: 'startup-idea-validator',
    title: 'Startup Idea Reality Check',
    category: 'startup',
    workspace: 'founder',
    description: 'Brutally honest feasibility check: target audience, willingness to pay, competition, and distribution channels.',
    prompt: 'Validate this startup idea with an investor lens. Analyze: 1) Core Value Proposition, 2) Target Customer Profile (ICP), 3) Unfair Advantage / Moat, 4) Monetization Model, 5) Top 3 Fatal Risks & How to mitigate them.\n\nIdea: ',
  },
  {
    id: 'startup-pitch-outline',
    title: '10-Slide Investor Pitch Outline',
    category: 'startup',
    workspace: 'founder',
    description: 'A 10-slide pitch deck structure designed to capture angel and seed investors.',
    prompt: 'Draft an engaging 10-slide investor pitch deck structure for my startup. Include slide title, core hook, bullet points, and key metrics to highlight for each slide:\n\nStartup: ',
  },

  // Business prompts
  {
    id: 'business-proposal',
    title: 'Executive Client Proposal',
    category: 'business',
    workspace: 'business',
    description: 'Polished client statement of work and executive proposal detailing deliverables, timeline, and ROI.',
    prompt: 'Write a compelling, professional B2B client proposal for the following project. Include: Executive Summary, Scope of Work, Milestones & Timeline, Business ROI, and Next Steps:\n\nProject Details: ',
  },
  {
    id: 'business-email-negotiate',
    title: 'Executive Email Drafter',
    category: 'business',
    workspace: 'business',
    description: 'Drafts firm, diplomatic executive emails for negotiations, partnerships, or sensitive announcements.',
    prompt: 'Draft a diplomatic, high-impact executive email with clear call-to-actions regarding:\n\nContext: ',
  },

  // General Executive Brief
  {
    id: 'general-smart-summary',
    title: 'Executive Brief & Strategic Plan',
    category: 'writing',
    workspace: 'general',
    description: 'Synthesizes notes, ideas, or complex topics into an executive brief with clear actionable takeaways.',
    prompt: 'Summarize the following notes into a structured executive brief with key highlights, strategic takeaways, and actionable next steps:\n\nNotes / Topic: ',
  },
  {
    id: 'general-poster-studio',
    title: '🎨 AI Event Poster & Flyer Design',
    category: 'writing',
    workspace: 'general',
    description: 'Generate a high-impact, professional graphic poster with artistic typography layout and event breakdown.',
    prompt: 'Create a stunning event poster for Tech & Innovation Summit 2026 with futuristic neon aesthetics, key highlights, date, and venue.',
  },
  {
    id: 'general-image-generator',
    title: '🖼️ Ultra HD AI Artwork & Visuals',
    category: 'writing',
    workspace: 'general',
    description: 'Synthesize an ultra-high-definition, photorealistic 8K visual artwork with cinematic lighting.',
    prompt: 'Generate an ultra-realistic 8K image of a cybernetic warrior standing in a neon-lit rain-slicked city with volumetric lighting.',
  },
];
