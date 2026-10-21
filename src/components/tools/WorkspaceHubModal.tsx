import React, { useState } from 'react';
import {
  GraduationCap,
  Code2,
  Rocket,
  Briefcase,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck,
  Award,
  Layers,
  Zap,
} from 'lucide-react';
import { WorkspaceType } from '../../types/index.js';

interface WorkspaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceType;
  onSubmitToChat: (prompt: string) => void;
}

export const WorkspaceHubModal: React.FC<WorkspaceHubModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onSubmitToChat,
}) => {
  const [topicInput, setTopicInput] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');

  if (!isOpen) return null;

  const workspaceConfig: Record<
    WorkspaceType,
    {
      title: string;
      desc: string;
      icon: any;
      color: string;
      actions: { id: string; label: string; template: (topic: string) => string }[];
    }
  > = {
    student: {
      title: 'Student Study Center',
      desc: 'Master complex concepts, generate revision notes, and prepare 10-mark exam answers',
      icon: GraduationCap,
      color: 'text-amber-500',
      actions: [
        {
          id: '10mark',
          label: '📋 10-Mark University Exam Answer',
          template: (t) =>
            `Provide a comprehensive 10-mark university exam answer for "${t}". Include: Definition, Core Concepts, Architecture/Diagram description, Working Flow, Real-world Example, Advantages/Disadvantages, and a Summary Table.`,
        },
        {
          id: 'notes',
          label: '📝 High-Yield Revision Notes & Formulas',
          template: (t) =>
            `Create high-yield revision notes for "${t}". Structure with key terms, formulas/laws, memory mnemonics, and 5 quick recall questions.`,
        },
        {
          id: 'telugu',
          label: 'తెలుగులో వివరించండి (Explain in Simple Telugu)',
          template: (t) =>
            `ఈ కాన్సెప్ట్ "${t}" ని చాలా సులభంగా అర్థమయ్యే తెలుగులో మరియు మంచి రియల్ లైఫ్ ఎగ్జాంపుల్స్‌తో వివరించండి. టెక్నికల్ పదాలు ఇంగ్లీష్‌లోనే ఉంచండి.`,
        },
        {
          id: 'quiz',
          label: '❓ 5 Multiple Choice Questions (MCQs) with Explanations',
          template: (t) =>
            `Generate 5 challenging multiple-choice questions (MCQs) for "${t}". For each question, provide 4 options (A-D), specify the correct answer, and explain why the correct option is right and why others are wrong.`,
        },
        {
          id: 'flashcards',
          label: '🧠 8 Study Flashcards (Front / Back)',
          template: (t) =>
            `Create 8 high-impact study flashcards for "${t}". Format each card with [FRONT: Core Question/Term] and [BACK: Crisp, high-yield explanation].`,
        },
      ],
    },
    developer: {
      title: 'Developer Studio',
      desc: 'Code review, architecture design, test generation, and deep debugging',
      icon: Code2,
      color: 'text-blue-500',
      actions: [
        {
          id: 'review',
          label: '🔍 Senior Code Review & Security Audit',
          template: (t) =>
            `Perform a comprehensive senior software engineer code review on the following code or topic: "${t}". Check for injection flaws, race conditions, edge cases, and performance optimizations. Provide clean refactored code.`,
        },
        {
          id: 'tests',
          label: '🧪 Complete Unit Test Suite (Vitest / Jest)',
          template: (t) =>
            `Write a production-ready unit test suite with high code coverage for "${t}". Include happy paths, edge cases, null boundaries, and error mocks.`,
        },
        {
          id: 'debug',
          label: '🐞 Root-Cause Debugger & Fix',
          template: (t) =>
            `Analyze the following error or bug in "${t}". Explain the exact root cause, why it happened, and provide tested drop-in fixes.`,
        },
        {
          id: 'architecture',
          label: '⚡ Scalable Architecture & System Design',
          template: (t) =>
            `Design a production-grade, scalable system architecture for "${t}". Include component hierarchy, data flow, API schema, database design, and caching strategy.`,
        },
      ],
    },
    founder: {
      title: 'Founder Launchpad',
      desc: 'Idea validation, competitor analysis, pitch decks, and monetization',
      icon: Rocket,
      color: 'text-purple-500',
      actions: [
        {
          id: 'validate',
          label: '💡 Startup Idea Reality Check',
          template: (t) =>
            `Validate this startup idea: "${t}". Analyze ICP, core value proposition, unfair advantage, monetization, and top 3 fatal risks to mitigate.`,
        },
        {
          id: 'pitch',
          label: '📑 10-Slide Investor Pitch Deck Outline',
          template: (t) =>
            `Draft a compelling 10-slide angel investor pitch deck structure for "${t}". Include slide title, core hook, bullet points, and key metrics.`,
        },
        {
          id: 'pricing',
          label: '💰 Pricing & Unit Economics Strategy',
          template: (t) =>
            `Design a multi-tier SaaS pricing model (Free, Pro, Enterprise) for "${t}". Detail value metrics, feature gating, and target CAC/LTV benchmarks.`,
        },
        {
          id: 'gtm',
          label: '🚀 30-Day Go-To-Market (GTM) Launch Plan',
          template: (t) =>
            `Create an actionable 30-day Go-To-Market (GTM) launch checklist for "${t}" across Product Hunt, LinkedIn, direct sales, and developer communities.`,
        },
      ],
    },
    business: {
      title: 'Business Strategy Suite',
      desc: 'Executive summaries, client proposals, marketing plans, and SWOT analysis',
      icon: Briefcase,
      color: 'text-emerald-500',
      actions: [
        {
          id: 'proposal',
          label: '📄 Executive Client Proposal (SOW)',
          template: (t) =>
            `Write a polished B2B client proposal for "${t}". Include: Executive Summary, Scope of Work, Deliverables, Milestones, ROI justification, and Next Steps.`,
        },
        {
          id: 'email',
          label: '📧 High-Stakes Negotiation Email',
          template: (t) =>
            `Draft a diplomatic, high-impact executive negotiation email regarding "${t}". Set firm boundaries while preserving strong client rapport.`,
        },
        {
          id: 'marketing',
          label: '📣 Omnichannel Marketing Campaign Plan',
          template: (t) =>
            `Create a comprehensive marketing campaign plan for "${t}". Outline audience segmentation, messaging pillars, channel mix, budget allocation, and KPIs.`,
        },
        {
          id: 'swot',
          label: '🎯 SWOT Strategic Analysis',
          template: (t) =>
            `Conduct a thorough SWOT analysis for "${t}". Include actionable initiatives to convert strengths into advantages and mitigate key threats.`,
        },
      ],
    },
    general: {
      title: 'SPARKMIND Workspace',
      desc: 'Universal AI assistant for brainstorming, writing, and problem-solving',
      icon: Zap,
      color: 'text-amber-500',
      actions: [
        {
          id: 'explain',
          label: '🧠 Explain Simply with Analogies',
          template: (t) =>
            `Explain "${t}" in simple, intuitive terms using real-life analogies so anyone can grasp it immediately.`,
        },
        {
          id: 'translate',
          label: '🌍 Telugu & Global Translation',
          template: (t) =>
            `Translate and adapt the following into natural, fluent Telugu while preserving technical terms in English: "${t}"`,
        },
        {
          id: 'proscons',
          label: '⚖ Unbiased Pros & Cons Evaluation',
          template: (t) =>
            `Provide an objective, structured comparison and pros/cons analysis for "${t}".`,
        },
      ],
    },
  };

  const currentHub = workspaceConfig[workspace] || workspaceConfig.general;
  const Icon = currentHub.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() && !selectedAction) return;

    const actionObj = currentHub.actions.find((a) => a.id === selectedAction) || currentHub.actions[0];
    const generatedPrompt = actionObj.template(topicInput);

    onSubmitToChat(generatedPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${currentHub.color} font-bold`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {currentHub.title}
              </h2>
              <p className="text-xs text-slate-500">{currentHub.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Action
            </label>
            <div className="space-y-1.5">
              {currentHub.actions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setSelectedAction(act.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition ${
                    selectedAction === act.id || (!selectedAction && act.id === currentHub.actions[0].id)
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{act.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Enter Topic, Concept, or Text to Analyze *
            </label>
            <textarea
              required
              rows={4}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Operating System Semaphores, React server actions, Fintech startup idea, or paste code..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topicInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
            >
              <span>Execute with SparkMind</span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
