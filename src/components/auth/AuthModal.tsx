import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  Key,
  Shield,
  Send,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verifyAdminCredentials } from '../../services/adminService.js';
import { requestPasswordResetOtp, verifyOtpAndResetPassword } from '../../services/passwordResetService.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithEmail, registerWithEmail, currentUser, logout } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [forgotType, setForgotType] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Firebase domain authorization helper state
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // User 2-step OTP state
  const [userForgotStep, setUserForgotStep] = useState<'request' | 'verify'>('request');
  const [userOtp, setUserOtp] = useState('');

  // Admin 2-step OTP state
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminForgotStep, setAdminForgotStep] = useState<'request' | 'verify'>('request');
  const [adminOtp, setAdminOtp] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setName('');
    setNewPassword('');
    setConfirmPassword('');
    setUserForgotStep('request');
    setUserOtp('');
    setAdminRecoveryEmail('');
    setAdminNewPass('');
    setAdminConfirmPass('');
    setAdminForgotStep('request');
    setAdminOtp('');
    setUnauthorizedDomain(null);
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    setSuccessMsg(null);
    setUnauthorizedDomain(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      resetForm();
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

  // Step 1: User requests mail OTP
  const handleUserRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide your registered account email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordResetOtp(cleanEmail, 'user');
      if (res.success) {
        setSuccessMsg(res.message);
        setUserForgotStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch verification OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while requesting OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: User verifies OTP and updates password
  const handleUserVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = userOtp.trim();
    const cleanPass = newPassword.trim();

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

    if (cleanPass !== confirmPassword.trim()) {
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
          setUserForgotStep('request');
          setUserOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setError(null);
        }, 2000);
      } else {
        setError(res.error || 'Failed to verify OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Admin requests mail OTP
  const handleAdminRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
        setAdminForgotStep('verify');
      } else {
        setError(res.error || 'Failed to dispatch administrator verification OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while requesting admin OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Admin verifies OTP and updates password
  const handleAdminVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
        setEmail(cleanEmail);
        setPassword(cleanPass);
        setTimeout(() => {
          setMode('signin');
          setAdminForgotStep('request');
          setAdminOtp('');
          setAdminNewPass('');
          setAdminConfirmPass('');
          setError(null);
        }, 2000);
      } else {
        setError(res.error || 'Failed to reset administrator password.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying administrator OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const isAdmin = await verifyAdminCredentials(cleanEmail, cleanPass);
    if (isAdmin) {
      sessionStorage.setItem('sparkmind_admin_auth', 'true');
      closeAuthModal();
      window.dispatchEvent(new CustomEvent('sparkmind:open-admin'));
      return;
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
      resetForm();
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('Account not found') ||
        err.message?.includes('not found')
      ) {
        setError("No registered account found with this email. Please click 'Create one' to sign up first.");
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please verify your credentials or reset your password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-3.5 top-3.5 z-20 rounded-xl p-1.5 text-slate-400 hover:bg-white/40 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 overscroll-contain">
          {currentUser ? (
            /* User Profile View if already authenticated */
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg overflow-hidden">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentUser.displayName || 'SparkMind User'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 px-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <span>Unlimited Uploads & Cloud Sync Active</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={async () => {
                  await logout();
                  closeAuthModal();
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              >
                Sign Out
              </button>
              <button
                onClick={closeAuthModal}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up / Forgot Password Form */
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SPARKMIND ACCOUNT</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {mode === 'signin'
                  ? 'Welcome Back'
                  : mode === 'signup'
                  ? 'Create Your Account'
                  : 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'forgot'
                  ? 'Enter your registered email to receive a reset link or configure a new password'
                  : 'Sign in to sync conversations & unlock unlimited file & document uploads'}
              </p>
            </div>

            {/* Dedicated Firebase Unauthorized Domain Helper Banner */}
            {unauthorizedDomain && (
              <div className="mb-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-2.5">
                  <Globe className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-amber-950 dark:text-amber-100">
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
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Google Sign-In is blocked by Firebase until your deployed domain is added to Authorized Domains in Firebase Console.
                    </p>

                    <div className="flex items-center gap-2 bg-black/10 dark:bg-black/30 p-1.5 rounded-xl border border-amber-500/20 font-mono text-xs">
                      <span className="truncate flex-1 font-semibold">{unauthorizedDomain}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(unauthorizedDomain);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold text-[10px] shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                      >
                        {copiedDomain ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2 items-center">
                      <a
                        href="https://console.firebase.google.com/project/vocal-rarity-lmn89/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        <span>Open Firebase Settings</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'forgot' ? (
              /* Forgot Password Form (User & Administrator) */
              <div className="space-y-4">
                {/* Account Type Selector */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setForgotType('user');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      forgotType === 'user'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>User Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setForgotType('admin');
                      setAdminRecoveryEmail(email || 'admin@sparkmind.ai');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      forgotType === 'admin'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Administrator</span>
                  </button>
                </div>

                {forgotType === 'user' ? (
                  /* User Forgot Password Form (2-Step Mail OTP) */
                  <div className="space-y-3">
                    {userForgotStep === 'verify' && (
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-2.5 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5">📧</span>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            OTP Sent Directly to Your Mail
                          </p>
                          <p className="text-[11px] text-blue-700/90 dark:text-blue-300">
                            A 6-digit verification code has been dispatched to <strong className="font-medium">{email}</strong>. Please check your inbox and spam folder.
                          </p>
                        </div>
                      </div>
                    )}

                    {userForgotStep === 'request' ? (
                      /* Step 1: Request OTP */
                      <form onSubmit={handleUserRequestOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Account Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Direct password updates without verification are disabled. A 6-digit OTP will be dispatched to your mail.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
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
                      </form>
                    ) : (
                      /* Step 2: Verify OTP & Reset Password */
                      <form onSubmit={handleUserVerifyOtp} className="space-y-3">
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
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={userOtp}
                              onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter 6-digit OTP"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            New Password <span className="text-slate-400 font-normal">(min. 6 characters)</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Key className="h-4 w-4" />}
                          <span>Verify OTP & Reset Password</span>
                        </button>

                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setUserForgotStep('request')}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          >
                            Change Email Address
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Admin Forgot Password Form (2-Step Mail OTP) */
                  <div className="space-y-3">
                    {adminForgotStep === 'verify' && (
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-2.5 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5">📧</span>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            OTP Sent Directly to Your Mail
                          </p>
                          <p className="text-[11px] text-blue-700/90 dark:text-blue-300">
                            A 6-digit verification code has been dispatched to <strong className="font-medium">{adminRecoveryEmail}</strong>. Please check your inbox and spam folder.
                          </p>
                        </div>
                      </div>
                    )}

                    {adminForgotStep === 'request' ? (
                      /* Step 1: Admin Request OTP */
                      <form onSubmit={handleAdminRequestOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Administrator Recovery Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={adminRecoveryEmail}
                              onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                              placeholder="admin@sparkmind.ai"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Direct password updates without OTP verification are disabled for security.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-700 hover:via-orange-700 hover:to-amber-700 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
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
                      </form>
                    ) : (
                      /* Step 2: Admin Verify OTP & Update Password */
                      <form onSubmit={handleAdminVerifyOtp} className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              6-Digit Admin Verification OTP
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
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={adminOtp}
                              onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter 6-digit OTP"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            New Administrator Password <span className="text-slate-400 font-normal">(min. 6 characters)</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={adminNewPass}
                              onChange={(e) => setAdminNewPass(e.target.value)}
                              placeholder="Enter new administrator password"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Confirm New Administrator Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={adminConfirmPass}
                              onChange={(e) => setAdminConfirmPass(e.target.value)}
                              placeholder="Re-enter new password"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-700 hover:via-orange-700 hover:to-amber-700 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Key className="h-4 w-4" />}
                          <span>Verify OTP & Update Password</span>
                        </button>

                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setAdminForgotStep('request')}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          >
                            Change Recovery Email
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('signin');
                    }}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600 hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Google One-Click Login */}
                <button
                  type="button"
                  onClick={handleGoogleSubmit}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-400 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-400">
                    OR WITH EMAIL
                  </span>
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Display Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Miller"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                            setError(null);
                            setSuccessMsg(null);
                            setMode('forgot');
                          }}
                          className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  </button>
                </form>

                {/* Switch Mode Toggle */}
                <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'signin' ? (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setMode('signup');
                        }}
                        className="font-bold text-amber-500 hover:text-amber-600 hover:underline"
                      >
                        Sign Up
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setMode('signin');
                        }}
                        className="font-bold text-amber-500 hover:text-amber-600 hover:underline"
                      >
                        Sign In
                      </button>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
