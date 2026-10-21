import React, { useEffect, useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  FileText,
  X,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  LogOut,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  Trash2,
  Mail,
  Eye,
  EyeOff,
  Check,
  MessageSquare,
  Send,
  KeyRound,
  Bell,
  BellRing,
  RotateCcw,
  Server,
  AlertOctagon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { fetchAdminStats } from '../../services/chatService.js';
import {
  fetchManagedUsers,
  subscribeToLiveUsers,
  toggleUserStatus,
  updateUserRole,
  createManagedUser,
  deleteManagedUser,
  verifyAdminCredentials,
  updateAdminCredentials,
  getStoredAdminUsername,
  fetchApiKeysSummary,
  resetAdminApiKeyQuota,
  simulateAdminFailover,
  fetchAdminNotifications,
  markAdminNotificationsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
  ManagedUser,
  UserManagementStats,
} from '../../services/adminService.js';
import { ApiKeysSummary, AdminNotification } from '../../types/index.js';
import { requestPasswordResetOtp, verifyOtpAndResetPassword } from '../../services/passwordResetService.js';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { loginAsAdmin } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sparkmind_admin_auth') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'telemetry' | 'credentials'>('users');

  // API Failover & Notification State
  const [apiKeysSummary, setApiKeysSummary] = useState<ApiKeysSummary | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isResettingKeyQuota, setIsResettingKeyQuota] = useState(false);
  const [isSimulatingFailover, setIsSimulatingFailover] = useState(false);

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Forgot Password state
  const [showForgotAdminPass, setShowForgotAdminPass] = useState(false);
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminForgotStep, setAdminForgotStep] = useState<'request' | 'verify'>('request');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminResetMsg, setAdminResetMsg] = useState<string | null>(null);
  const [adminResetError, setAdminResetError] = useState<string | null>(null);
  const [isResettingAdmin, setIsResettingAdmin] = useState(false);

  // Platform Telemetry State
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // User Management State (Default to 'active' so suspended users do not clutter active list)
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userStats, setUserStats] = useState<UserManagementStats>({
    totalUsers: 0,
    onlineCount: 0,
    activeToday: 0,
    adminCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'online' | 'active' | 'suspended'>('active');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Credentials Change State
  const [currentAdminUser, setCurrentAdminUser] = useState(() => getStoredAdminUsername());
  const [currentPass, setCurrentPass] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [platformStats, usersData, keysData, notifsData] = await Promise.all([
        fetchAdminStats(),
        fetchManagedUsers(),
        fetchApiKeysSummary(),
        fetchAdminNotifications(),
      ]);
      if (platformStats) setStats(platformStats);
      if (usersData) {
        setUsers(usersData.users);
        setUserStats(usersData.stats);
      }
      if (keysData) setApiKeysSummary(keysData);
      if (notifsData) setNotifications(notifsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    loadData();

    // Attach real-time Firestore listener for live user presence and accounts
    const unsubscribeLiveUsers = subscribeToLiveUsers((liveData) => {
      setUsers(liveData.users);
      setUserStats(liveData.stats);
    });

    // Auto-poll every 6 seconds while dashboard is open for real-time key failover alerts
    const interval = setInterval(async () => {
      try {
        const [keysData, notifsData, pStats] = await Promise.all([
          fetchApiKeysSummary(),
          fetchAdminNotifications(),
          fetchAdminStats(),
        ]);
        if (keysData) setApiKeysSummary(keysData);
        if (notifsData) setNotifications(notifsData);
        if (pStats) setStats(pStats);
      } catch (e) {}
    }, 6000);

    return () => {
      unsubscribeLiveUsers();
      clearInterval(interval);
    };
  }, [isOpen, isAuthenticated]);


  const handleResetKeyQuota = async () => {
    setIsResettingKeyQuota(true);
    try {
      const res = await resetAdminApiKeyQuota(1);
      if (res.success) {
        showNotification('Primary API Key (#1) status reset to Active!');
        if (res.summary) setApiKeysSummary(res.summary);
        const updatedNotifs = await fetchAdminNotifications();
        setNotifications(updatedNotifs);
      }
    } finally {
      setIsResettingKeyQuota(false);
    }
  };

  const handleSimulateFailover = async () => {
    setIsSimulatingFailover(true);
    try {
      const res = await simulateAdminFailover();
      if (res.success) {
        showNotification('Simulated Key #1 limit hit! Spare Key #2 engaged & alert added to console.');
        if (res.summary) setApiKeysSummary(res.summary);
        const updatedNotifs = await fetchAdminNotifications();
        setNotifications(updatedNotifs);
      }
    } finally {
      setIsSimulatingFailover(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAdminNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (apiKeysSummary) {
      setApiKeysSummary({ ...apiKeysSummary, unreadNotificationsCount: 0 });
    }
  };

  const handleDismissNotification = async (id: string) => {
    await deleteAdminNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (apiKeysSummary) {
      setApiKeysSummary({
        ...apiKeysSummary,
        unreadNotificationsCount: Math.max(0, apiKeysSummary.unreadNotificationsCount - 1),
      });
    }
  };

  const handleClearNotifications = async () => {
    await clearAllAdminNotifications();
    setNotifications([]);
    if (apiKeysSummary) {
      setApiKeysSummary({ ...apiKeysSummary, unreadNotificationsCount: 0 });
    }
    showNotification('All notifications cleared');
  };

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const isValid = await verifyAdminCredentials(usernameInput, passwordInput);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('sparkmind_admin_auth', 'true');
        loadData();
      } else {
        setLoginError('Invalid Administrator credentials. Access denied.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginAndChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const isValid = await verifyAdminCredentials(usernameInput, passwordInput);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('sparkmind_admin_auth', 'true');
        loginAsAdmin(usernameInput || 'admin@sparkmind.ai', 'Administrator');
        onClose();
      } else {
        setLoginError('Invalid Administrator credentials. Access denied.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleJumpToChat = () => {
    loginAsAdmin(currentAdminUser || 'admin@sparkmind.ai', 'Administrator');
    onClose();
  };

  const handleRequestAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetError(null);
    setAdminResetMsg(null);

    const cleanEmail = adminRecoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAdminResetError('Please enter your authorized administrator recovery email.');
      return;
    }

    setIsResettingAdmin(true);
    try {
      const res = await requestPasswordResetOtp(cleanEmail, 'admin');
      if (res.success) {
        setAdminResetMsg(res.message);
        setAdminForgotStep('verify');
      } else {
        setAdminResetError(res.error || 'Failed to dispatch administrator recovery OTP.');
      }
    } catch (err: any) {
      setAdminResetError(err.message || 'Error occurred while requesting OTP.');
    } finally {
      setIsResettingAdmin(false);
    }
  };

  const handleResetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminResetError(null);
    setAdminResetMsg(null);

    const cleanEmail = adminRecoveryEmail.trim().toLowerCase();
    const cleanOtp = adminOtp.trim();
    const cleanPass = adminNewPass.trim();

    if (!cleanOtp) {
      setAdminResetError('Please enter the 6-digit administrator OTP code received on your mail.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setAdminResetError('OTP code must be exactly 6 digits.');
      return;
    }

    if (cleanPass.length < 6) {
      setAdminResetError('New password must be at least 6 characters.');
      return;
    }

    if (cleanPass !== adminConfirmPass.trim()) {
      setAdminResetError('New password and confirmation password do not match.');
      return;
    }

    setIsResettingAdmin(true);
    try {
      const res = await verifyOtpAndResetPassword(cleanEmail, cleanOtp, cleanPass, 'admin');
      if (res.success) {
        setAdminResetMsg(res.message);
        setUsernameInput(cleanEmail);
        setPasswordInput(cleanPass);
        setTimeout(() => {
          setShowForgotAdminPass(false);
          setAdminForgotStep('request');
          setAdminOtp('');
          setAdminNewPass('');
          setAdminConfirmPass('');
          setLoginError(null);
        }, 1800);
      } else {
        setAdminResetError(res.error || 'Failed to verify administrator OTP.');
      }
    } catch (err: any) {
      setAdminResetError(err.message || 'Error occurred while resetting administrator password.');
    } finally {
      setIsResettingAdmin(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sparkmind_admin_auth');
    setUsernameInput('');
    setPasswordInput('');
  };

  // User Management Actions
  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const ok = await toggleUserStatus(user.id, nextStatus);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus, online: nextStatus === 'suspended' ? false : u.online } : u))
      );
      showNotification(`User ${user.email} is now ${nextStatus.toUpperCase()}.`);
    }
  };

  const handleToggleRole = async (user: ManagedUser) => {
    if (user.role === 'super_admin') return;
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const ok = await updateUserRole(user.id, nextRole);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      showNotification(`User ${user.email} role changed to ${nextRole.toUpperCase()}.`);
    }
  };

  const executeDeleteUser = async (userId: string, email: string) => {
    if (email.toLowerCase() === 'admin@sparkmind.ai') {
      showNotification('The root system admin (admin@sparkmind.ai) cannot be deleted.');
      setConfirmingDeleteId(null);
      return;
    }

    setConfirmingDeleteId(null);
    setUserToDelete(null);

    // Immediate optimistic removal from state
    setUsers((prev) => prev.filter((u) => u.id !== userId && u.email.toLowerCase() !== email.toLowerCase()));
    setUserStats((prev) => ({
      ...prev,
      totalUsers: Math.max(0, prev.totalUsers - 1),
    }));

    try {
      await deleteManagedUser(userId, email);
      showNotification(`User account ${email} has been permanently deleted and access revoked.`);
    } catch (e) {
      showNotification(`User ${email} removed.`);
    }
  };

  const handleDeleteUser = (userId: string, email: string, name?: string) => {
    if (email.toLowerCase() === 'admin@sparkmind.ai') {
      showNotification('The root administrator account cannot be deleted.');
      return;
    }
    setConfirmingDeleteId(userId);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const { id, email } = userToDelete;
    await executeDeleteUser(id, email);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    const user = await createManagedUser({
      name: newUserName || newUserEmail.split('@')[0],
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
    });
    if (user) {
      setUsers((prev) => [user, ...prev]);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      showNotification(`New user account ${user.email} provisioned.`);
    }
  };

  // Handle Credentials Update
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    if (newPass !== confirmPass) {
      setCredError('New password and confirmation password do not match.');
      return;
    }

    if (newPass.length < 6) {
      setCredError('New password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingCreds(true);
    try {
      const res = await updateAdminCredentials(currentPass, newAdminUsername, newPass);
      if (res.success) {
        setCredSuccess('Administrator credentials successfully updated! Your new password is now active.');
        setCurrentAdminUser(newAdminUsername || currentAdminUser);
        setCurrentPass('');
        setNewAdminUsername('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setCredError(res.error || 'Failed to update credentials. Check your current password.');
      }
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'online') return u.online && u.status === 'active';
    if (statusFilter === 'active') return u.status === 'active';
    if (statusFilter === 'suspended') return u.status === 'suspended';
    return u.status === 'active';
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20">
              {isAuthenticated ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  SparkMind Admin Console
                </h2>
                {isAuthenticated && (
                  <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Active Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAuthenticated
                  ? 'Manage registered users, monitor active logins, and update credentials'
                  : 'Administrator authentication required'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleJumpToChat}
                  className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-bold transition border border-amber-500/30 shadow-sm cursor-pointer"
                  title="Launch and chat immediately as Administrator"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                  <span>Chat as Admin</span>
                </button>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Refresh Data"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl font-semibold transition"
                  title="Lock Console"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Lock Console</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Secure Admin Login & Forgot Password Form */
          <div className="p-6 space-y-6 max-w-md mx-auto w-full my-auto overflow-y-auto">
            {showForgotAdminPass ? (
              /* Forgot Administrator Password View (2-Step Mail OTP) */
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20">
                    <Key className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {adminForgotStep === 'request' ? 'Admin Recovery: Get Mail OTP' : 'Verify Admin OTP & Reset'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {adminForgotStep === 'request'
                      ? 'Enter your authorized administrator recovery email to receive a 6-digit verification OTP.'
                      : `Enter the 6-digit code sent to ${adminRecoveryEmail} and set your new password.`}
                  </p>
                </div>

                {adminResetError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{adminResetError}</span>
                  </div>
                )}

                {adminResetMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>{adminResetMsg}</span>
                  </div>
                )}

                {/* Secure Direct Mail OTP Notification Banner */}
                {adminForgotStep === 'verify' && (
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-3 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
                    <span className="text-base leading-none">📧</span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        OTP Sent Directly to Your Mail
                      </p>
                      <p className="text-[11px] text-blue-700/90 dark:text-blue-300">
                        A 6-digit verification code has been dispatched directly to <strong className="font-medium">{adminRecoveryEmail}</strong>. Please check your inbox and spam folder.
                      </p>
                    </div>
                  </div>
                )}

                {adminForgotStep === 'request' ? (
                  /* Step 1: Request Admin OTP */
                  <form onSubmit={handleRequestAdminOtp} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Administrator Recovery Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={adminRecoveryEmail}
                          onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                          placeholder="admin@sparkmind.ai"
                          required
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Direct password updates without verification are disabled. A 6-digit OTP will be dispatched to this mail.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isResettingAdmin}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 py-3 px-4 font-semibold text-white shadow-md shadow-amber-500/20 transition active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      {isResettingAdmin ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
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
                          setShowForgotAdminPass(false);
                          setAdminResetError(null);
                          setAdminResetMsg(null);
                          setAdminForgotStep('request');
                        }}
                        className="text-xs font-bold text-amber-500 hover:text-amber-600 hover:underline cursor-pointer"
                      >
                        ← Back to Administrator Login
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Verify OTP & Reset Password */
                  <form onSubmit={handleResetAdminPassword} className="space-y-3.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          6-Digit Verification OTP
                        </label>
                        <button
                          type="button"
                          onClick={(e) => handleRequestAdminOtp(e)}
                          disabled={isResettingAdmin}
                          className="text-[11px] font-semibold text-amber-500 hover:underline cursor-pointer"
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
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-slate-100 placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Administrator Password <span className="text-slate-400 font-normal">(min. 6 characters)</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          value={adminNewPass}
                          onChange={(e) => setAdminNewPass(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          value={adminConfirmPass}
                          onChange={(e) => setAdminConfirmPass(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isResettingAdmin}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 py-3 px-4 font-semibold text-white shadow-md shadow-amber-500/20 transition active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      <Key className="h-4 w-4" />
                      <span>{isResettingAdmin ? 'Verifying OTP...' : 'Verify OTP & Update Password'}</span>
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setAdminForgotStep('request')}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        Change Recovery Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotAdminPass(false);
                          setAdminResetError(null);
                          setAdminResetMsg(null);
                          setAdminForgotStep('request');
                        }}
                        className="font-bold text-amber-500 hover:text-amber-600 hover:underline cursor-pointer"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Administrator Login View */
              <>
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Administrator Authentication
                  </h3>
                  <p className="text-xs text-slate-500">
                    Please enter your administrator email and password to access user management and system controls.
                  </p>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Administrator Username or Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Enter admin email or username"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Administrator Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginError(null);
                          setShowForgotAdminPass(true);
                          setAdminRecoveryEmail(usernameInput || 'admin@sparkmind.ai');
                        }}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showLoginPass ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-10 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showLoginPass ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 py-3 px-4 font-semibold text-white shadow-md shadow-rose-500/20 transition active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      <Unlock className="h-4 w-4" />
                      <span>{isVerifying ? 'Authenticating...' : 'Sign In to Admin Console'}</span>
                    </button>

                    {/* Chat directly through admin portal option */}
                    <button
                      type="button"
                      onClick={() => handleLoginAndChat()}
                      disabled={isVerifying}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 py-2.5 px-4 font-bold text-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-60 shadow-sm"
                      title="Sign in with admin credentials and open chat directly"
                    >
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      <span>Sign In & Chat as Admin</span>
                    </button>
                  </div>
                </form>

                <div className="text-center text-[11px] text-slate-400">
                  Credentials are encrypted and protected from public view.
                </div>
              </>
            )}
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action notification toast */}
            {actionSuccessMsg && (
              <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{actionSuccessMsg}</span>
                </div>
                <button onClick={() => setActionSuccessMsg(null)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* System Alert Banner */}
            {notifications.some((n) => !n.read) && (
              <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white px-4 py-3 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertOctagon className="h-5 w-5 shrink-0 animate-bounce text-amber-200" />
                  <div>
                    <p className="font-extrabold tracking-wide uppercase text-[11px] text-amber-200">
                      ⚠️ System Alert Message
                    </p>
                    <p className="text-[11px] text-white/95">
                      {notifications.find((n) => !n.read)?.message || 'New system alert recorded. Check alert messages log below.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('alerts')}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer backdrop-blur-md"
                  >
                    View Alert Messages
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/60 dark:bg-slate-900/60 overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>User Management ({users.length})</span>
                  {userStats.onlineCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {userStats.onlineCount} Online
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'alerts'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>System Alerts</span>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full animate-bounce shadow-sm shadow-rose-500/50">
                      <BellRing className="h-3 w-3" />
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'credentials'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="h-4 w-4" />
                  <span>Change Admin Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'telemetry'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Platform Telemetry</span>
                </button>
              </div>

              {activeTab === 'users' && (
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-rose-500/20 transition cursor-pointer shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add User</span>
                </button>
              )}
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeTab === 'users' ? (
                /* USER MANAGEMENT TAB */
                <div className="space-y-4 text-xs">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-[11px]">Total Registered</span>
                        <Users className="h-4 w-4 text-indigo-500" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {users.length}
                      </p>
                      <p className="text-[10px] text-slate-400">Total registered accounts</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                        <span className="font-semibold text-[11px]">Currently Logged In</span>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      </div>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                        {users.filter((u) => u.online).length}
                      </p>
                      <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Active browser sessions</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-[11px]">Active Accounts</span>
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {users.filter((u) => u.status === 'active').length}
                      </p>
                      <p className="text-[10px] text-slate-400">Unrestricted users</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-[11px]">Administrators</span>
                        <Shield className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length}
                      </p>
                      <p className="text-[10px] text-slate-400">Admin privileges</p>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'active' as const, label: `Active (${users.filter((u) => u.status === 'active').length})` },
                        { id: 'suspended' as const, label: `Suspended (${users.filter((u) => u.status === 'suspended').length})` },
                        { id: 'online' as const, label: `🟢 Online (${users.filter((u) => u.online && u.status === 'active').length})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                            statusFilter === tab.id
                              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users Directory Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-3">Role</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Last Login</th>
                            <th className="py-3 px-3">Activity</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">
                                No users match the current search or filter.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const isCurrentAdmin = u.email === currentAdminUser || u.email === 'admin@sparkmind.ai';
                              return (
                                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                  {/* User Info */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 dark:border-slate-700">
                                          {u.name ? u.name.charAt(0) : u.email.charAt(0)}
                                        </div>
                                        {u.online && (
                                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online now" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                          <span>{u.name}</span>
                                          {isCurrentAdmin && (
                                            <span className="text-[9px] bg-rose-500/15 text-rose-500 font-bold px-1.5 py-0.2 rounded-md">
                                              CURRENT ADMIN
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                          <span>{u.email}</span>
                                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded">
                                            {u.provider}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Role */}
                                  <td className="py-3 px-3">
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      disabled={isCurrentAdmin}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                        u.role === 'super_admin'
                                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                          : u.role === 'admin'
                                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:opacity-80 cursor-pointer'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:opacity-80 cursor-pointer'
                                      }`}
                                      title={isCurrentAdmin ? 'Admin role cannot be demoted' : 'Click to change role'}
                                    >
                                      {u.role.replace('_', ' ').toUpperCase()}
                                    </button>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        u.status === 'suspended'
                                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                          : u.online
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          u.status === 'suspended'
                                            ? 'bg-rose-500'
                                            : u.online
                                            ? 'bg-emerald-500 animate-pulse'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                      {u.status === 'suspended' ? 'Suspended' : u.online ? 'Online' : 'Active'}
                                    </span>
                                  </td>

                                  {/* Last Login */}
                                  <td className="py-3 px-3 text-[11px] text-slate-500">
                                    {u.lastLoginAt ? (
                                      u.online ? (
                                        <span className="font-semibold text-emerald-500">Active now</span>
                                      ) : (
                                        new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      )
                                    ) : (
                                      'Never'
                                    )}
                                  </td>

                                  {/* Activity */}
                                  <td className="py-3 px-3 text-[11px]">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {u.messagesSent}
                                    </span>{' '}
                                    <span className="text-slate-400">msgs</span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-4 text-right">
                                    {confirmingDeleteId === u.id ? (
                                      <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                                        <span className="text-[10px] font-bold text-rose-500">Delete?</span>
                                        <button
                                          type="button"
                                          onClick={() => executeDeleteUser(u.id, u.email)}
                                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-sm transition cursor-pointer"
                                          title="Confirm permanent deletion"
                                        >
                                          Yes, Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingDeleteId(null)}
                                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] transition cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        {/* Suspend / Activate */}
                                        <button
                                          type="button"
                                          disabled={u.email.toLowerCase() === 'admin@sparkmind.ai'}
                                          onClick={() => handleToggleStatus(u)}
                                          className={`p-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 ${
                                            u.status === 'active'
                                              ? 'text-amber-500 hover:bg-amber-500/10'
                                              : 'text-emerald-500 hover:bg-emerald-500/10'
                                          }`}
                                          title={u.status === 'active' ? 'Suspend User Access' : 'Reactivate User'}
                                        >
                                          {u.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                        </button>

                                        {/* Delete */}
                                        <button
                                          type="button"
                                          disabled={u.email.toLowerCase() === 'admin@sparkmind.ai'}
                                          onClick={() => setConfirmingDeleteId(u.id)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                          title={u.email.toLowerCase() === 'admin@sparkmind.ai' ? 'Root administrator cannot be deleted' : 'Delete User Account'}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'alerts' ? (
                /* SYSTEM ALERTS & INCIDENT LOG TAB (ALERT MESSAGES ONLY - NO KEY DETAILS) */
                <div className="space-y-4 max-w-4xl mx-auto py-2">
                  {/* Alert Console Header */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                          <BellRing className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              System Alert Messages
                            </h3>
                            {notifications.some((n) => !n.read) && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse">
                                Active Alerts
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Real-time incident and rate limit alerts logged when API thresholds are reached.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSimulateFailover}
                          disabled={isSimulatingFailover}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                          title="Trigger a test alert message to verify alert notifications"
                        >
                          <AlertTriangle className={`h-3.5 w-3.5 text-rose-500 ${isSimulatingFailover ? 'animate-spin' : ''}`} />
                          <span>{isSimulatingFailover ? 'Triggering...' : 'Trigger Test Alert'}</span>
                        </button>
                      </div>
                    </div>
                  </div>


                  {/* Alert Messages Incident Log */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-amber-500" />
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          Console Alert Messages ({notifications.length})
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.some((n) => !n.read) && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Mark All Read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearNotifications}
                            className="px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-200">No Alert Messages</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Gemini API is operating normally within quota limits.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                              !n.read
                                ? 'bg-rose-500/[0.08] dark:bg-rose-500/[0.12] border-rose-500/30'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${
                                n.severity === 'critical'
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              }`}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    {n.title}
                                  </span>
                                  {!n.read && (
                                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                      New
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                  {n.message}
                                </p>
                                {n.metadata?.error && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-black/5 dark:bg-black/30 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                                    {n.metadata.error}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDismissNotification(n.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0 transition"
                              title="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'credentials' ? (
                /* CHANGE CREDENTIALS TAB */
                <div className="max-w-xl mx-auto space-y-5 text-xs py-2">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Key className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Update Administrator Credentials
                        </h3>
                        <p className="text-slate-500 text-xs">
                          Change your administrator username or password. Credentials are encrypted and completely hidden from regular users.
                        </p>
                      </div>
                    </div>
                  </div>

                  {credSuccess && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{credSuccess}</span>
                    </div>
                  )}

                  {credError && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{credError}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateCredentials} className="space-y-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Administrator Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showChangePass ? 'text' : 'password'}
                          required
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="Enter your current admin password"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowChangePass(!showChangePass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showChangePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Required to verify authorization before changing credentials.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Admin Username or Email
                      </label>
                      <input
                        type="text"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        placeholder={currentAdminUser || 'admin@sparkmind.ai'}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Leave blank to keep current: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentAdminUser}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          New Admin Password *
                        </label>
                        <input
                          type={showChangePass ? 'text' : 'password'}
                          required
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Confirm New Password *
                        </label>
                        <input
                          type={showChangePass ? 'text' : 'password'}
                          required
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingCreds}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 font-bold text-white shadow-md shadow-rose-500/20 transition cursor-pointer disabled:opacity-60"
                      >
                        {isUpdatingCreds ? 'Saving Changes...' : 'Save New Administrator Credentials'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* PLATFORM & GEMINI TELEMETRY TAB */
                <div className="space-y-4 text-xs">
                  {/* Security Banner */}
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Gemini API Key Isolation: ACTIVE</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        The Google Gemini API secret is 100% server-side in Netlify Functions/Express. Zero frontend exposure.
                      </p>
                    </div>
                  </div>

                  {/* Key Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-medium text-[11px]">Total Requests</span>
                        <Zap className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {stats?.totalRequests ?? 0}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-medium">
                        {stats?.successfulRequests ?? 0} successful
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-medium text-[11px]">Web Grounding</span>
                        <Globe className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {stats?.webGroundingCount ?? 0}
                      </p>
                      <p className="text-[10px] text-slate-400">Google search grounded</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-medium text-[11px]">File Grounding</span>
                        <FileText className="h-4 w-4 text-indigo-500" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {stats?.fileGroundingCount ?? 0}
                      </p>
                      <p className="text-[10px] text-slate-400">Documents & images</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-medium text-[11px]">Rate Protection</span>
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                        {stats?.rateLimitHits ?? 0}
                      </p>
                      <p className="text-[10px] text-slate-400">429 throttles prevented</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-400 text-center">
              SparkMind Security & Admin Infrastructure • Protected Sessions
            </div>
          </div>
        )}

        {/* Modal: Add User */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-rose-500" />
                  Provision New User Account
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Administrator (Admin Console Access)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4 border border-rose-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
                Delete User Account?
              </h3>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{userToDelete.email}</strong>? This user and their access will be permanently removed.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  Yes, Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
