import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Eye,
  EyeOff,
  Bot,
  Key,
  CheckCircle2,
  RefreshCw,
  Send,
  AlertTriangle,
  Copy,
  Check,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verifyAdminCredentials } from '../../services/adminService.js';
import { requestPasswordResetOtp, verifyOtpAndResetPassword } from '../../services/passwordResetService.js';

interface AuthGateProps {
  onContinueAsGuest?: () => void;
  onAdminLogin?: () => void;
  onOpenLegal?: (tab: 'terms' | 'license') => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onContinueAsGuest, onAdminLogin, onOpenLegal }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [authType, setAuthType] = useState<'user' | 'admin'>('user');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Firebase unauthorized domain state
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // User auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // User Forgot Password 2-Step Mail OTP
  const [userResetStep, setUserResetStep] = useState<'request' | 'verify'>('request');
  const [userOtp, setUserOtp] = useState('');

  // Admin auth state
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isAdminForgot, setIsAdminForgot] = useState(false);
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');

  // Admin Forgot Password 2-Step Mail OTP
  const [adminResetStep, setAdminResetStep] = useState<'request' | 'verify'>('request');
  const [adminOtp, setAdminOtp] = useState('');

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
    setUnauthorizedDomain(null);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!adminUser || !adminPass) {
      setError('Please enter both administrator username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await verifyAdminCredentials(adminUser, adminPass);
      if (isValid) {
        sessionStorage.setItem('sparkmind_admin_auth', 'true');
        if (onAdminLogin) {
          onAdminLogin();
        }
      } else {
        setError('Invalid Administrator credentials. Access denied.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Admin Requests Mail OTP
  const handleAdminRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = adminRecoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide your authorized administrator recovery email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordResetOtp(cleanEmail, 'admin');
      if (res.success) {
        setSuccessMsg(res.message);
        setAdminResetStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch administrator verification OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while requesting admin OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Admin Verifies OTP & Updates Password
  const handleAdminVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = adminRecoveryEmail.trim().toLowerCase();
    const cleanOtp = adminOtp.trim();
    const cleanPass = adminNewPass.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit administrator OTP code received on your mail.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('OTP code must be exactly 6 digits.');
      return;
    }

    if (cleanPass.length < 6) {
      setError('New administrator password must be at least 6 characters.');
      return;
    }

    if (cleanPass !== adminConfirmPass.trim()) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtpAndResetPassword(cleanEmail, cleanOtp, cleanPass, 'admin');
      if (res.success) {
        setSuccessMsg(res.message);
        setAdminUser(cleanEmail);
        setAdminPass(cleanPass);
        setTimeout(() => {
          setIsAdminForgot(false);
          setAdminResetStep('request');
          setAdminOtp('');
          setAdminNewPass('');
          setAdminConfirmPass('');
          setError(null);
        }, 1800);
      } else {
        setError(res.error || 'Failed to verify administrator OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while resetting administrator password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: User Requests Mail OTP
  const handleUserRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordResetOtp(cleanEmail, 'user');
      if (res.success) {
        setSuccessMsg(res.message);
        setUserResetStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch verification OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while requesting verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: User Verifies OTP & Updates Password
  const handleUserVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = userOtp.trim();
    const cleanPass = userNewPassword.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code received on your mail.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('OTP code must be exactly 6 digits.');
      return;
    }

    if (cleanPass.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (cleanPass !== userConfirmPassword.trim()) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtpAndResetPassword(cleanEmail, cleanOtp, cleanPass, 'user');
      if (res.success) {
        setSuccessMsg(res.message);
        setPassword(cleanPass);
        setTimeout(() => {
          setMode('signin');
          setUserResetStep('request');
          setUserOtp('');
          setUserNewPassword('');
          setUserConfirmPassword('');
          setError(null);
        }, 1800);
      } else {
        setError(res.error || 'Failed to verify OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    resetMessages();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed.');
      } else if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain')
      ) {
        const detectedDomain =
          err.domain || (typeof window !== 'undefined' ? window.location.hostname : 'your deployed domain');
        setUnauthorizedDomain(detectedDomain);
        setError(null);
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check if user is logging in with admin credentials directly on user form
    const isAdmin = await verifyAdminCredentials(cleanEmail, cleanPass);
    if (isAdmin) {
      sessionStorage.setItem('sparkmind_admin_auth', 'true');
      if (onAdminLogin) {
        onAdminLogin();
        return;
      }
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name.trim());
      }
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('Account not found') ||
        err.message?.includes('not found')
      ) {
        setError(
          "No registered account found with this email. Please click 'Create one now' below to register your account first."
        );
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please verify your credentials or click Forgot password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-transparent text-slate-900 dark:text-slate-100 overflow-x-hidden overflow-y-auto">
      {/* Persistent Top Sticky Header with SPARKMIND Brand */}
      <header className="sticky top-0 z-30 w-full border-b border-white/20 dark:border-white/10 bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/30">
            <Zap className="h-4.5 w-4.5 fill-amber-100 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-black text-xl tracking-wider text-slate-900 dark:text-white">SPARK</span>
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400 bg-clip-text text-transparent">
              MIND
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 ml-1">
            AI WORKSPACE
          </span>
        </div>

        {onContinueAsGuest && (
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 px-3 py-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            Explore as Guest &rarr;
          </button>
        )}
      </header>

      <div className="relative z-10 w-full max-w-md px-4 pt-4 sm:pt-6 pb-12 sm:pb-16">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-white/60 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 shadow-xl backdrop-blur-2xl mb-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/30">
              <Zap className="h-4.5 w-4.5 fill-amber-100 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-black text-2xl tracking-wider text-slate-900 dark:text-white">SPARK</span>
              <span className="font-black text-2xl tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400 bg-clip-text text-transparent ml-0.5">
                MIND
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {authType === 'admin'
              ? isAdminForgot
                ? 'Admin Password Reset'
                : 'Admin Console Access'
              : mode === 'forgot'
              ? 'Reset Account Password'
              : mode === 'signup'
              ? 'Create SparkMind Account'
              : 'Sign in to SparkMind AI'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium">
            {authType === 'admin'
              ? isAdminForgot
                ? 'Recover administrator credentials with authorized recovery email.'
                : 'Administrator credentials required for user management & system telemetry.'
              : mode === 'forgot'
              ? 'Enter your registered email to reset your account password.'
              : 'Authenticate to access private conversations, workspaces & unlimited uploads.'}
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 p-2 backdrop-blur-xl shadow-sm">
            <Shield className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">Encrypted Authentication</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 p-2 backdrop-blur-xl shadow-sm">
            <FileText className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="truncate font-semibold">Unlimited Uploads</span>
          </div>
        </div>

        {/* Tab Switcher: User Workspace vs Admin Portal */}
        <div className="mb-4 flex rounded-2xl bg-white/65 dark:bg-slate-900/70 p-1.5 border border-white/50 dark:border-white/15 backdrop-blur-2xl shadow-xl">
          <button
            type="button"
            onClick={() => {
              setAuthType('user');
              resetMessages();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              authType === 'user'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>User Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthType('admin');
              resetMessages();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              authType === 'admin'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl glass-surface p-6 sm:p-7 shadow-2xl backdrop-blur-3xl border border-white/60 dark:border-white/15">
          {/* Card Top Brand Header Badge */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white shadow-xs">
                <Zap className="h-3.5 w-3.5 fill-white text-white" />
              </div>
              <span className="font-black text-sm tracking-wider text-slate-900 dark:text-white">
                SPARK<span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">MIND</span>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {authType === 'admin' ? 'Admin Portal' : 'Workspace Access'}
            </span>
          </div>

          {/* Dedicated Firebase Unauthorized Domain Helper Banner */}
          {unauthorizedDomain && (
            <div className="mb-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-4 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <Globe className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-amber-950 dark:text-amber-100">
                      Firebase Domain Authorization Required
                    </p>
                    <button
                      type="button"
                      onClick={() => setUnauthorizedDomain(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-850 dark:text-amber-300 leading-relaxed">
                    Google Sign-In is blocked by Firebase until your deployed domain is authorized in the Firebase Console.
                  </p>

                  <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 p-2 rounded-xl border border-amber-500/20 font-mono text-xs">
                    <span className="truncate flex-1 font-semibold">{unauthorizedDomain}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(unauthorizedDomain);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold text-[11px] shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                    >
                      {copiedDomain ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">How to authorize in 30 seconds:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11px]">
                      <li>Open Firebase Console (Authentication &gt; Settings &gt; Authorized domains).</li>
                      <li>Click <strong>&quot;Add domain&quot;</strong> and paste: <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">{unauthorizedDomain}</code>.</li>
                      <li>Click <strong>Save</strong> — Google Sign-In will work immediately on this deployment!</li>
                    </ol>
                  </div>

                  <div className="pt-1.5 flex flex-wrap gap-2 items-center">
                    <a
                      href="https://console.firebase.google.com/project/vocal-rarity-lmn89/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer"
                    >
                      <span>Open Firebase Console Settings</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-[11px] text-slate-500">
                      Or register with Email & Password below right now!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {authType === 'admin' ? (
            /* Dedicated Admin Portal Form */
            isAdminForgot ? (
              /* Admin Forgot Password Form (2-Step Mail OTP) */
              <div className="space-y-4">
                <div className="text-center pb-1">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20 mb-2">
                    <Key className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {adminResetStep === 'request' ? 'Admin Recovery: Get Mail OTP' : 'Verify Admin OTP & Reset'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {adminResetStep === 'request'
                      ? 'Enter your authorized administrator recovery email to receive a 6-digit OTP code.'
                      : `Enter the 6-digit OTP code sent to ${adminRecoveryEmail} and configure your new password.`}
                  </p>
                </div>

                {/* Secure Direct Mail OTP Notification Banner */}
                {adminResetStep === 'verify' && (
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-3 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
                    <span className="text-base leading-none">📧</span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        OTP Sent Directly to Your Mail
                      </p>
                      <p className="text-[11px] text-blue-700/90 dark:text-blue-300">
                        A 6-digit verification code has been dispatched directly to <strong className="font-medium">{adminRecoveryEmail}</strong>. Check your inbox and spam folder.
                      </p>
                    </div>
                  </div>
                )}

                {adminResetStep === 'request' ? (
                  /* Step 1: Request Admin OTP */
                  <form onSubmit={handleAdminRequestOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Administrator Recovery Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={adminRecoveryEmail}
                          onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                          placeholder="admin@sparkmind.ai"
                          className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Direct password changes without OTP verification are prevented. A one-time passcode will be dispatched.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Admin OTP to Mail</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetMessages();
                          setIsAdminForgot(false);
                          setAdminResetStep('request');
                        }}
                        className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                      >
                        ← Back to Admin Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Verify OTP & Reset Admin Password */
                  <form onSubmit={handleAdminVerifyOtp} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          6-Digit Verification OTP
                        </label>
                        <button
                          type="button"
                          onClick={(e) => handleAdminRequestOtp(e)}
                          disabled={isSubmitting}
                          className="text-[11px] font-semibold text-amber-500 hover:underline"
                        >
                          Resend Code
                        </button>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={adminOtp}
                          onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Administrator Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={adminNewPass}
                          onChange={(e) => setAdminNewPass(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={adminConfirmPass}
                          onChange={(e) => setAdminConfirmPass(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          <span>Verify OTP & Update Password</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminResetStep('request');
                          resetMessages();
                        }}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetMessages();
                          setIsAdminForgot(false);
                          setAdminResetStep('request');
                        }}
                        className="font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Admin Sign In Form */
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20 mb-2">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrator Access</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage registered users, monitor active logins, view Gemini analytics and platform security.
                  </p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        placeholder="Enter admin email or username"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Admin Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          resetMessages();
                          setIsAdminForgot(true);
                          setAdminRecoveryEmail(adminUser || 'admin@sparkmind.ai');
                        }}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
                        title={showAdminPassword ? 'Hide password' : 'Show password'}
                      >
                        {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-700 hover:via-orange-700 hover:to-amber-700 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Sign In to Admin Console</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : mode === 'forgot' ? (
            /* User Forgot Password Form (2-Step Mail OTP) */
            <div className="space-y-4">
              <div className="text-center pb-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 mb-2">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {userResetStep === 'request' ? 'Forgot Password: Get Mail OTP' : 'Verify Mail OTP & Reset'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {userResetStep === 'request'
                    ? 'Enter your registered email address to receive a 6-digit verification code and reset instructions.'
                    : `Enter the 6-digit OTP code sent to ${email} and set your new password.`}
                </p>
              </div>

              {/* Secure Direct Mail OTP Notification Banner */}
              {userResetStep === 'verify' && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-3 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
                  <span className="text-base leading-none">📧</span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      OTP Sent Directly to Your Mail
                    </p>
                    <p className="text-[11px] text-blue-700/90 dark:text-blue-300">
                      A 6-digit verification code has been dispatched directly to <strong className="font-medium">{email}</strong>. Check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              )}

              {userResetStep === 'request' ? (
                /* Step 1: Request Mail OTP */
                <form onSubmit={handleUserRequestOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Direct password change without email verification is disabled for security. An OTP will be dispatched to your mail.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Reset OTP to Mail</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setMode('signin');
                        setUserResetStep('request');
                      }}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Verify OTP & Reset User Password */
                <form onSubmit={handleUserVerifyOtp} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        6-Digit Verification OTP
                      </label>
                      <button
                        type="button"
                        onClick={(e) => handleUserRequestOtp(e)}
                        disabled={isSubmitting}
                        className="text-[11px] font-semibold text-amber-500 hover:underline"
                      >
                        Resend Code
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={userOtp}
                        onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password <span className="text-slate-400 font-normal">(min. 6 characters)</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={userNewPassword}
                        onChange={(e) => setUserNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={userConfirmPassword}
                        onChange={(e) => setUserConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        <span>Verify OTP & Reset Password</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUserResetStep('request');
                        resetMessages();
                      }}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setMode('signin');
                        setUserResetStep('request');
                      }}
                      className="font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* User Sign In / Sign Up Form */
            <>
              {/* Google One-Click Login */}
              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all disabled:opacity-60 cursor-pointer active:scale-[0.99]"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  OR EMAIL
                </span>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Manoj Kumar"
                        className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          resetMessages();
                          setMode('forgot');
                        }}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/70 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switcher */}
              <div className="mt-5 text-center text-xs text-slate-400">
                {mode === 'signin' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setMode('signup');
                      }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      Create one now
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setMode('signin');
                      }}
                      className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      Sign in instead
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>


        {/* Terms and MIT License Notice */}
        <div className="mt-4 text-center text-[11px] text-slate-500">
          <span>By signing in or continuing, you agree to our </span>
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('terms')}
            className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            Terms & Conditions
          </button>
          <span> and </span>
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('license')}
            className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            MIT License
          </button>
          <span>.</span>
        </div>
      </div>
    </div>
  );
};
