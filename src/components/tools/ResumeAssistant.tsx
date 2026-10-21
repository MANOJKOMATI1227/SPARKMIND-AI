import React, { useState } from 'react';
import { FileCheck, Sparkles, X, ArrowRight, Target, Award } from 'lucide-react';

interface ResumeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitToChat: (prompt: string) => void;
}

export const ResumeAssistant: React.FC<ResumeAssistantProps> = ({
  isOpen,
  onClose,
  onSubmitToChat,
}) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [analysisType, setAnalysisType] = useState<'ats' | 'rewrite' | 'interview'>('ats');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    let prompt = '';
    if (analysisType === 'ats') {
      prompt = `Act as an expert technical recruiter and ATS parsing specialist. Analyze the candidate's resume below against the target role and job description.

Target Role: ${targetRole || 'Not specified'}
Job Description:
${jobDescription || 'Standard requirements for the role'}

Resume Content:
${resumeText}

Please provide:
1. "SparkMind Estimated ATS Compatibility": Score out of 100 with a breakdown (Keywords match, Format, Experience alignment).
2. Missing Critical Keywords & Skills that should be included.
3. 3 Weak Bullet Points and how to rewrite them with quantitative metrics and impact verbs.
4. Red Flags or Formatting Improvements to ensure 100% parsing success.`;
    } else if (analysisType === 'rewrite') {
      prompt = `Rewrite and elevate the bullet points in the following resume to make them compelling, action-oriented, and results-driven (using the Google X-Y-Z formula: Accomplished [X] as measured by [Y] by doing [Z]).

Target Role: ${targetRole}
Original Resume:
${resumeText}`;
    } else {
      prompt = `Based on the following resume and target role, generate 5 challenging, realistic interview questions (3 technical, 2 behavioral) that an interviewer would ask, along with recommended STAR framework answering tips:

Target Role: ${targetRole}
Resume:
${resumeText}`;
    }

    onSubmitToChat(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Resume ATS & Career Assistant
              </h2>
              <p className="text-xs text-slate-500">
                SparkMind Estimated ATS Compatibility & keyword optimization
              </p>
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
          {/* Analysis Mode Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Analysis Focus
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAnalysisType('ats')}
                className={`rounded-xl border p-2.5 text-center transition ${
                  analysisType === 'ats'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Award className="h-4 w-4 mx-auto mb-1" />
                <span>ATS Score & Keywords</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('rewrite')}
                className={`rounded-xl border p-2.5 text-center transition ${
                  analysisType === 'rewrite'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="h-4 w-4 mx-auto mb-1" />
                <span>Rewrite Bullet Points</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('interview')}
                className={`rounded-xl border p-2.5 text-center transition ${
                  analysisType === 'interview'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Target className="h-4 w-4 mx-auto mb-1" />
                <span>Interview Prep</span>
              </button>
            </div>
          </div>

          {/* Target Role */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Job Title (Optional)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer, Product Manager, Data Analyst"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Job Description / Key Requirements (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              placeholder="Paste job posting responsibilities and requirements to check keyword overlap..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Resume Text */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paste Resume Text / Experience Highlights *
            </label>
            <textarea
              required
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste your resume sections, skills, work experiences, and education here..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              disabled={!resumeText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              <span>Analyze with SparkMind</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
