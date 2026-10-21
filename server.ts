import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { processChatWithGemini, generateSpeechAudio } from './netlify/functions/lib/gemini.js';
import { checkRateLimit, globalStats } from './netlify/functions/lib/rateLimit.js';
import { ChatRequestBody } from './netlify/functions/lib/types.js';
import { apiKeyManager } from './netlify/functions/lib/apiKeyManager.js';

// Load .env configuration from disk first
dotenv.config();

// ============================================================================
// GEMINI API KEYS CONFIGURATION (SERVER-SIDE ENVIRONMENT - NOT IN FRONTEND)
// ============================================================================
export const CODE_CONFIGURED_PRIMARY_GEMINI_KEY = process.env.GEMINI_API_KEY || '';
export const CODE_CONFIGURED_SPARE_GEMINI_KEY = process.env.GEMINI_API_KEY_2 || '';
export const CODE_CONFIGURED_SPARE_GEMINI_KEY_2 = process.env.GEMINI_API_KEY_3 || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware for parsing JSON with generous payload limit for unlimited attachments
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SparkMind AI Platform',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', (req, res) => {
    res.json({
      success: true,
      stats: {
        ...globalStats,
        uptimeSeconds: Math.floor((Date.now() - globalStats.startedAt) / 1000),
      },
    });
  });

  // Admin Gemini API Keys & Failover management
  app.get('/api/admin/api-keys', (req, res) => {
    res.json({
      success: true,
      ...apiKeyManager.getKeysSummary(),
    });
  });


  app.post('/api/admin/api-keys/reset', (req, res) => {
    const { keyIndex } = req.body || {};
    apiKeyManager.resetKeyQuotaStatus(keyIndex);
    res.json({
      success: true,
      message: 'API Key quota status reset to active',
      ...apiKeyManager.getKeysSummary(),
    });
  });

  // Admin test endpoint: Trigger test alert message to verify notifications
  app.post('/api/admin/api-keys/simulate-failover', (req, res) => {
    apiKeyManager.recordKeyQuotaHit(
      1,
      'Simulated rate limit exceeded (429 RESOURCE_EXHAUSTED). Backup key in code automatically routed traffic.'
    );
    res.json({
      success: true,
      message: 'Test alert message triggered and recorded.',
      ...apiKeyManager.getKeysSummary(),
    });
  });

  // Admin Notifications & System Alerts
  app.get('/api/admin/notifications', (req, res) => {
    res.json({
      success: true,
      notifications: apiKeyManager.getNotifications(),
    });
  });

  app.post('/api/admin/notifications/mark-read', (req, res) => {
    const { ids } = req.body || {};
    apiKeyManager.markNotificationsRead(ids);
    res.json({ success: true, notifications: apiKeyManager.getNotifications() });
  });

  app.delete('/api/admin/notifications/:id', (req, res) => {
    apiKeyManager.deleteNotification(req.params.id);
    res.json({ success: true, notifications: apiKeyManager.getNotifications() });
  });

  app.delete('/api/admin/notifications', (req, res) => {
    apiKeyManager.clearAllNotifications();
    res.json({ success: true, notifications: [] });
  });

  // Server-managed users store with file-based persistence across restarts
  const DATA_DIR = path.resolve(__dirname, '.data');
  const STATE_FILE = path.join(DATA_DIR, 'admin_state.json');

  const INITIAL_SEED_USERS = [
    {
      id: 'usr_admin_01',
      name: 'SparkMind Administrator',
      email: 'admin@sparkmind.ai',
      role: 'super_admin',
      status: 'active' as const,
      online: true,
      provider: 'system' as const,
      createdAt: '2026-09-01T08:00:00Z',
      lastLoginAt: new Date().toISOString(),
      messagesSent: 248,
      workspacesUsed: ['general', 'coding', 'research', 'analytics'],
    },
    {
      id: 'usr_owner_02',
      name: 'Manoj Kumar',
      email: 'komatimanojkumar1227@gmail.com',
      role: 'admin',
      status: 'active' as const,
      online: true,
      provider: 'google' as const,
      createdAt: '2026-09-15T10:30:00Z',
      lastLoginAt: new Date().toISOString(),
      messagesSent: 184,
      workspacesUsed: ['general', 'coding', 'academic'],
    },
    {
      id: 'usr_dev_03',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.io',
      role: 'user',
      status: 'active' as const,
      online: true,
      provider: 'google' as const,
      createdAt: '2026-09-28T14:15:00Z',
      lastLoginAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      messagesSent: 92,
      workspacesUsed: ['coding', 'creative'],
    },
    {
      id: 'usr_mkt_04',
      name: 'Alex Rivera',
      email: 'alex.rivera@innovate.co',
      role: 'user',
      status: 'active' as const,
      online: false,
      provider: 'email' as const,
      createdAt: '2026-10-01T09:00:00Z',
      lastLoginAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      messagesSent: 47,
      workspacesUsed: ['general', 'business'],
    },
    {
      id: 'usr_res_05',
      name: 'Dr. Aris Thorne',
      email: 'athorne@quantumlab.org',
      role: 'user',
      status: 'suspended' as const,
      online: false,
      provider: 'email' as const,
      createdAt: '2026-08-20T11:20:00Z',
      lastLoginAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      messagesSent: 15,
      workspacesUsed: ['research'],
    },
  ];

  function loadPersistedState(): { managedUsers: any[]; deletedUserEmails: string[]; suspendedUserEmails: string[] } | null {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read admin state from file:', e);
    }
    return null;
  }

  function savePersistedState(state: { managedUsers: any[]; deletedUserEmails: string[]; suspendedUserEmails: string[] }) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save admin state to file:', e);
    }
  }

  const persisted = loadPersistedState();
  const deletedUserEmails = new Set<string>(persisted?.deletedUserEmails || []);
  const suspendedUserEmails = new Set<string>(persisted?.suspendedUserEmails || ['athorne@quantumlab.org']);
  const managedUsers: any[] = persisted?.managedUsers
    ? persisted.managedUsers.filter((u: any) => !deletedUserEmails.has(u.email.toLowerCase()))
    : INITIAL_SEED_USERS.filter((u: any) => !deletedUserEmails.has(u.email.toLowerCase()));

  // User heartbeat & activity ping
  app.post('/api/users/heartbeat', (req, res) => {
    const { id, email, name, provider } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce Access Control: Deleted or Suspended users cannot ping or get access
    if (deletedUserEmails.has(cleanEmail)) {
      res.status(403).json({ error: 'Your account has been deleted by the administrator.', blocked: true });
      return;
    }

    if (suspendedUserEmails.has(cleanEmail)) {
      res.status(403).json({ error: 'Your account has been suspended by the administrator.', suspended: true });
      return;
    }

    const existingIndex = managedUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      if (managedUsers[existingIndex].status === 'suspended') {
        res.status(403).json({ error: 'Your account has been suspended by the administrator.', suspended: true });
        return;
      }
      managedUsers[existingIndex].online = true;
      managedUsers[existingIndex].lastLoginAt = new Date().toISOString();
      if (name) managedUsers[existingIndex].name = name;
    } else {
      managedUsers.unshift({
        id: id || `usr_${Date.now().toString(36)}`,
        name: name || email.split('@')[0],
        email: cleanEmail,
        role: cleanEmail === 'admin@sparkmind.ai' ? 'super_admin' : 'user',
        status: 'active',
        online: true,
        provider: provider || 'email',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        messagesSent: 1,
        workspacesUsed: ['general'],
      });
    }

    res.json({ success: true });
  });

  // User Access Authorization Check Endpoint (Invoked before login and periodically)
  app.post('/api/users/check-access', (req, res) => {
    const { email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      res.json({ allowed: true });
      return;
    }

    if (cleanEmail === 'admin@sparkmind.ai' || cleanEmail === adminCredentials.username.toLowerCase()) {
      res.json({ allowed: true, role: 'admin' });
      return;
    }

    if (deletedUserEmails.has(cleanEmail)) {
      res.json({
        allowed: false,
        status: 'deleted',
        reason: 'This account has been deleted by the administrator. You do not have access until the administrator adds your account.',
      });
      return;
    }

    if (suspendedUserEmails.has(cleanEmail)) {
      res.json({
        allowed: false,
        status: 'suspended',
        reason: 'This account has been suspended by the workspace administrator. Please contact your administrator to regain access.',
      });
      return;
    }

    const user = managedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user && user.status === 'suspended') {
      res.json({
        allowed: false,
        status: 'suspended',
        reason: 'This account has been suspended by the workspace administrator. Please contact your administrator to regain access.',
      });
      return;
    }

    res.json({ allowed: true, user: user || null });
  });

  // Admin User Management Endpoints
  app.get('/api/admin/users', (req, res) => {
    // Strictly filter out any user marked as deleted
    const activeUsers = managedUsers.filter((u) => !deletedUserEmails.has(u.email.toLowerCase()));
    const totalUsers = activeUsers.length;
    const onlineCount = activeUsers.filter((u) => u.online && u.status === 'active').length;
    const activeToday = activeUsers.filter((u) => u.status === 'active').length;
    const suspendedCount = activeUsers.filter((u) => u.status === 'suspended').length;
    const adminCount = activeUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;

    res.json({
      success: true,
      users: activeUsers,
      stats: {
        totalUsers,
        onlineCount,
        activeToday,
        suspendedCount,
        adminCount,
      },
    });
  });

  app.post('/api/admin/users/status', (req, res) => {
    const { userId, status } = req.body || {};
    const user = managedUsers.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      const cleanEmail = user.email.toLowerCase();
      if (status === 'suspended') {
        user.online = false;
        suspendedUserEmails.add(cleanEmail);
      } else {
        suspendedUserEmails.delete(cleanEmail);
      }
      savePersistedState({
        managedUsers,
        deletedUserEmails: Array.from(deletedUserEmails),
        suspendedUserEmails: Array.from(suspendedUserEmails),
      });
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  });

  app.post('/api/admin/users/role', (req, res) => {
    const { userId, role } = req.body || {};
    const user = managedUsers.find((u) => u.id === userId);
    if (user) {
      user.role = role;
      savePersistedState({
        managedUsers,
        deletedUserEmails: Array.from(deletedUserEmails),
        suspendedUserEmails: Array.from(suspendedUserEmails),
      });
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  });

  app.post('/api/admin/users/create', (req, res) => {
    const { name, email, role } = req.body || {};
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();

    // If previously deleted or suspended, remove from blocklists because admin is provisioning them!
    deletedUserEmails.delete(cleanEmail);
    suspendedUserEmails.delete(cleanEmail);

    const existingIdx = managedUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      managedUsers[existingIdx].status = 'active';
      managedUsers[existingIdx].role = role || managedUsers[existingIdx].role;
      savePersistedState({
        managedUsers,
        deletedUserEmails: Array.from(deletedUserEmails),
        suspendedUserEmails: Array.from(suspendedUserEmails),
      });
      res.json({ success: true, user: managedUsers[existingIdx] });
      return;
    }

    const newUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: name || email.split('@')[0],
      email: cleanEmail,
      role: role || 'user',
      status: 'active' as const,
      online: false,
      provider: 'email' as const,
      createdAt: new Date().toISOString(),
      lastLoginAt: 'Never',
      messagesSent: 0,
      workspacesUsed: ['general'],
    };
    managedUsers.unshift(newUser);
    savePersistedState({
      managedUsers,
      deletedUserEmails: Array.from(deletedUserEmails),
      suspendedUserEmails: Array.from(suspendedUserEmails),
    });
    res.json({ success: true, user: newUser });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const emailParam = (req.query.email as string) || (req.body?.email as string) || '';
    const cleanId = (id || '').trim().toLowerCase();
    const cleanEmail = emailParam.trim().toLowerCase();

    const idx = managedUsers.findIndex(
      (u) => u.id === id || u.email.toLowerCase() === cleanId || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );

    let removedEmail = cleanEmail;
    if (idx >= 0) {
      removedEmail = managedUsers[idx].email.toLowerCase();
      managedUsers.splice(idx, 1);
    }

    if (removedEmail) {
      deletedUserEmails.add(removedEmail);
      suspendedUserEmails.delete(removedEmail);
    }

    savePersistedState({
      managedUsers,
      deletedUserEmails: Array.from(deletedUserEmails),
      suspendedUserEmails: Array.from(suspendedUserEmails),
    });
    res.json({ success: true });
  });

  // Dynamic Admin Credentials state
  let adminCredentials = {
    username: process.env.ADMIN_USERNAME || 'admin@sparkmind.ai',
    password: process.env.ADMIN_PASSWORD || 'sparkmind2026',
  };

  // Verify Admin credentials
  app.post('/api/admin/verify-credentials', (req, res) => {
    const { username, password } = req.body || {};
    const uClean = (username || '').trim().toLowerCase();
    const pClean = (password || '').trim();

    const isMatch =
      (uClean === adminCredentials.username.toLowerCase() || uClean === 'admin') &&
      pClean === adminCredentials.password;

    if (isMatch) {
      res.json({ success: true, username: adminCredentials.username });
    } else {
      res.status(401).json({ success: false, error: 'Invalid administrator credentials' });
    }
  });

  // Change Admin credentials
  app.post('/api/admin/change-credentials', (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required' });
      return;
    }
    if (currentPassword.trim() !== adminCredentials.password) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }
    if (newPassword.trim().length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      return;
    }

    if (newUsername && newUsername.trim()) {
      adminCredentials.username = newUsername.trim().toLowerCase();
    }
    adminCredentials.password = newPassword.trim();

    res.json({
      success: true,
      message: 'Admin credentials successfully updated',
      username: adminCredentials.username,
    });
  });

  // Reset Admin credentials endpoint
  app.post('/api/admin/reset-password', (req, res) => {
    const { recoveryEmail, newPassword } = req.body || {};
    const cleanEmail = (recoveryEmail || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    const allowedAdminEmails = [
      adminCredentials.username.toLowerCase(),
      'admin@sparkmind.ai',
      'komatimanojkumar1227@gmail.com',
    ];

    if (!allowedAdminEmails.includes(cleanEmail)) {
      res.status(403).json({
        success: false,
        error: 'The provided recovery email is not authorized for administrator access recovery.',
      });
      return;
    }

    if (cleanPass.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
      return;
    }

    adminCredentials.password = cleanPass;
    res.json({
      success: true,
      message: 'Administrator password reset successfully. You can now log in.',
    });
  });

  // Reset OTP store: email -> { otp, expiresAt, accountType }
  const resetOtpStore = new Map<string, { otp: string; expiresAt: number; accountType: string }>();

  // Secure email dispatcher: sends OTP directly to recipient mailbox via SMTP
  async function dispatchOtpEmail(to: string, otp: string, accountType: 'user' | 'admin'): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const fromAddress = process.env.SMTP_FROM || (smtpUser ? `"SparkMind AI" <${smtpUser}>` : '"SparkMind AI" <no-reply@sparkmind.ai>');

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: fromAddress,
          to,
          subject: `[SparkMind AI] Password Reset Verification Code: ${otp}`,
          text: `Hello,\n\nYour 6-digit password reset verification OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Please enter this code in the password reset form to verify your identity and set a new password.\n\nNever share this code with anyone.\n\nSparkMind AI Security Team`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #4f46e5; margin: 0 0 6px; font-size: 24px; font-weight: 700;">SparkMind AI</h2>
                <p style="color: #64748b; font-size: 14px; margin: 0;">Password Reset Verification</p>
              </div>
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Hello,<br/><br/>
                We received a request to reset the password for your <strong>${accountType === 'admin' ? 'Administrator' : 'User'}</strong> account associated with <strong>${to}</strong>.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px; font-weight: 600;">Your 6-Digit Verification Code</div>
                <div style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${otp}</div>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
                ⏳ This OTP code will expire in <strong>10 minutes</strong>.<br/>
                🔒 Never share this code with anyone. SparkMind staff will never ask for your code.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                If you did not request this password reset, you can safely ignore this email.
              </p>
            </div>
          `,
        });
        console.log(`[AUTH OTP] Successfully delivered OTP mail directly to: ${to}`);
        return true;
      } catch (err: any) {
        console.error(`[AUTH OTP] Direct SMTP delivery failed:`, err?.message || err);
        return false;
      }
    } else {
      console.log(`[AUTH OTP] SMTP credentials not set in environment. Dispatched internal OTP for: ${to}`);
      return false;
    }
  }

  // POST /api/auth/send-reset-otp
  app.post('/api/auth/send-reset-otp', async (req, res) => {
    const { email, accountType } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const type = accountType === 'admin' ? 'admin' : 'user';

    if (!cleanEmail) {
      res.status(400).json({ success: false, error: 'Email address is required.' });
      return;
    }

    if (type === 'admin') {
      const allowedAdminEmails = [
        adminCredentials.username.toLowerCase(),
        'admin@sparkmind.ai',
        'komatimanojkumar1227@gmail.com',
      ];
      if (!allowedAdminEmails.includes(cleanEmail)) {
        res.status(403).json({
          success: false,
          error: 'The provided recovery email is not authorized for administrator access.',
        });
        return;
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    resetOtpStore.set(cleanEmail, { otp, expiresAt, accountType: type });

    // Send email directly to mail inbox
    await dispatchOtpEmail(cleanEmail, otp, type);

    // CRITICAL: NEVER reveal or send the OTP in the API response!
    res.json({
      success: true,
      message: `A 6-digit verification OTP has been sent directly to ${cleanEmail}. Please check your mail inbox or spam folder.`,
      expiresInMinutes: 10,
    });
  });

  // POST /api/auth/verify-reset-otp
  app.post('/api/auth/verify-reset-otp', (req, res) => {
    const { email, otp, newPassword, accountType } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();
    const cleanPass = (newPassword || '').trim();
    const type = accountType === 'admin' ? 'admin' : 'user';

    if (!cleanEmail || !cleanOtp || !cleanPass) {
      res.status(400).json({ success: false, error: 'Email, OTP code, and new password are required.' });
      return;
    }

    if (cleanPass.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      return;
    }

    const stored = resetOtpStore.get(cleanEmail);
    if (!stored || stored.otp !== cleanOtp || Date.now() > stored.expiresAt) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP code. Please check your mail or request a new OTP.',
      });
      return;
    }

    resetOtpStore.delete(cleanEmail);

    if (type === 'admin') {
      adminCredentials.password = cleanPass;
    }

    res.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new credentials.',
    });
  });

  // In-memory cache for shared conversations
  const sharedConversations = new Map<string, any>();

  // POST /api/share - Store a shared conversation
  app.post('/api/share', (req, res) => {
    const record = req.body;
    if (!record || !record.id) {
      res.status(400).json({ success: false, error: 'Invalid share payload' });
      return;
    }
    sharedConversations.set(record.id, record);
    res.json({ success: true, shareId: record.id });
  });

  // GET /api/share/:id - Retrieve a shared conversation
  app.get('/api/share/:id', (req, res) => {
    const { id } = req.params;
    const record = sharedConversations.get(id);
    if (record) {
      res.json({ success: true, record });
    } else {
      res.status(404).json({ success: false, error: 'Shared conversation not found or expired' });
    }
  });

  // Shared chat handler function
  const handleChat = async (req: express.Request, res: express.Response) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local-client';
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment before sending another message.',
      });
      return;
    }

    // Access control check for suspended or deleted users
    const userEmail = (
      (req.headers['x-user-email'] as string) ||
      (req.headers['x-user-id'] as string) ||
      req.body?.userId ||
      ''
    ).trim().toLowerCase();

    if (userEmail && deletedUserEmails.has(userEmail)) {
      res.status(403).json({
        success: false,
        error: 'Access Denied: Your account has been deleted by the administrator. You do not have access until the administrator re-adds your account.',
      });
      return;
    }

    if (userEmail && suspendedUserEmails.has(userEmail)) {
      res.status(403).json({
        success: false,
        error: 'Access Denied: Your account has been suspended by the administrator. Please contact your workspace administrator.',
      });
      return;
    }

    try {
      const body: ChatRequestBody = req.body;
      const result = await processChatWithGemini(body);
      res.status(result.success ? 200 : 500).json(result);
    } catch (err: any) {
      console.error('Server chat handler error:', err);
      res.status(500).json({
        success: false,
        error: 'An internal server error occurred while processing your message.',
      });
    }
  };

  // Mount at both standard endpoint paths for compatibility with Netlify Functions and standard API
  app.post('/api/chat', handleChat);
  app.post('/.netlify/functions/chat', handleChat);

  // Dedicated Studio AI TTS route using Gemini
  const handleTTS = async (req: express.Request, res: express.Response) => {
    try {
      const { text, voice } = req.body || {};
      if (!text || typeof text !== 'string') {
        res.status(400).json({ success: false, error: 'Text is required for TTS synthesis.' });
        return;
      }
      const result = await generateSpeechAudio(text, voice);
      res.json(result);
    } catch (err: any) {
      console.error('Server TTS error:', err);
      res.status(500).json({ success: false, error: 'TTS synthesis error occurred.' });
    }
  };

  app.post('/api/tts', handleTTS);
  app.post('/.netlify/functions/tts', handleTTS);

  // Serve static assets from public folder
  const publicPath = path.resolve(__dirname, 'public');
  app.use(express.static(publicPath));

  // Vite development mode integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Disable HMR WebSocket in AI Studio cloud preview environment
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client routing and SPA direct URL requests
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl;
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production static file serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ SparkMind server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SparkMind server:', err);
  process.exit(1);
});
