import React, { useState } from 'react';
import {
  FileText,
  Scale,
  X,
  Check,
  Copy,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'license';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'license'>(initialTab);
  const [copiedLicense, setCopiedLicense] = useState(false);

  if (!isOpen) return null;

  const mitLicenseText = `MIT License

Copyright (c) 2026 Komati Manoj Kumar (komatimanojkumar1227@gmail.com) / SparkMind AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

  const copyLicense = () => {
    navigator.clipboard.writeText(mitLicenseText);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl glass-surface border border-white/60 dark:border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 px-6 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-500 border border-amber-500/30">
              {activeTab === 'terms' ? <FileText className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'terms' ? 'Terms & Conditions' : 'Open Source MIT License'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SparkMind AI Platform • Effective October 2026
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'terms'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Terms & Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'license'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>MIT License</span>
            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.2">
              Free & Open
            </span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700 dark:text-slate-300 space-y-6 leading-relaxed">
          {activeTab === 'terms' ? (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 dark:text-amber-200">
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  SparkMind AI is committed to transparent, private, and open-source computing. Please read these terms carefully to understand your rights, responsibilities, and how AI-generated content is managed.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">1</span>
                  <span>Acceptance of Terms</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  By accessing, creating an account, or interacting with SparkMind AI (the "Platform"), you agree to abide by these Terms and Conditions and our Privacy policies. If you do not accept these terms, you should cease usage of the application.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">2</span>
                  <span>Open Source Licensing & Codebase</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  SparkMind AI is released under the permissive <strong>MIT License</strong>. You are granted free permission to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, provided the copyright notice and license notice are preserved.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">3</span>
                  <span>User Accounts & Cloud Sync</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Users may authenticate using Email or Google Sign-In via Firebase Authentication. Active accounts sync their conversations, prompt templates, and custom settings with Firebase Firestore. Users may also use Guest mode with local storage persistence.
                </p>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">4</span>
                  <span>AI Models & Content Verification</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  SparkMind leverages Google Gemini multimodal AI models. Generative AI may produce outputs that contain errors, hallucinations, or obsolete facts. Users are responsible for verifying code, educational solutions, and critical decisions prior to production deployment.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">5</span>
                  <span>Live Code Execution Sandbox</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  SparkMind includes client-side live execution for HTML, SVG, JavaScript, TypeScript, and Python. All execution runs in isolated browser sandboxes. Attempting to run exploits, malicious network payloads, or denial-of-service scripts is strictly prohibited.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px]">6</span>
                  <span>Disclaimer of Warranties & Liability</span>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  The application is provided "AS IS" without warranty of any kind. In no event shall the authors, maintainers, or copyright holders be liable for any direct, indirect, incidental, or consequential damages resulting from the use of SparkMind.
                </p>
              </div>

              {/* Administration & Contact Info */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/30">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Project Administration & Ownership</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-slate-600 dark:text-slate-400">
                  <span><strong>Administrator:</strong> Komati Manoj Kumar</span>
                  <span><strong>Email:</strong> <a href="mailto:komatimanojkumar1227@gmail.com" className="font-mono text-amber-600 dark:text-amber-400 hover:underline">komatimanojkumar1227@gmail.com</a></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* License Header Card */}
              <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <div>
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    The MIT License (MIT)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    A short and simple permissive license with conditions only requiring preservation of copyright and license notices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyLicense}
                  className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {copiedLicense ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy License</span>
                    </>
                  )}
                </button>
              </div>

              {/* License Permissions Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">✔ Permissions</p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                    <li>Commercial use</li>
                    <li>Modification</li>
                    <li>Distribution</li>
                    <li>Private use</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                  <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">ℹ Conditions</p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                    <li>License and copyright notice</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="font-bold text-amber-600 dark:text-amber-400 mb-1">✕ Limitations</p>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                    <li>No Liability</li>
                    <li>No Warranty</li>
                  </ul>
                </div>
              </div>

              {/* Exact Text Box */}
              <div className="relative rounded-2xl bg-slate-950 p-5 font-mono text-xs text-slate-200 leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
                <pre className="whitespace-pre-wrap select-all font-mono text-[12px]">{mitLicenseText}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>SparkMind AI • Protected & Open Source</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
