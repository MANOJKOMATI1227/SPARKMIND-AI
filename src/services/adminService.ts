import { ApiKeysSummary, AdminNotification } from '../types/index.js';
import {
  getFirestoreManagedUsers,
  subscribeToFirestoreManagedUsers,
  setFirestoreUserStatus,
  setFirestoreUserRole,
  removeFirestoreUser,
  syncUserPresenceAndProfile,
} from '../lib/firebase.js';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  status: 'active' | 'suspended';
  online: boolean;
  provider: 'google' | 'email' | 'system';
  createdAt: string;
  lastLoginAt: string;
  messagesSent: number;
  workspacesUsed: string[];
}

export interface UserManagementStats {
  totalUsers: number;
  onlineCount: number;
  activeToday: number;
  adminCount: number;
}

// Initial mock fallback seed in case server restart or offline
const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'usr_admin_01',
    name: 'SparkMind Administrator',
    email: 'admin@sparkmind.ai',
    role: 'super_admin',
    status: 'active',
    online: true,
    provider: 'system',
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
    status: 'active',
    online: true,
    provider: 'google',
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
    status: 'active',
    online: true,
    provider: 'google',
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
    status: 'active',
    online: false,
    provider: 'email',
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
    status: 'suspended',
    online: false,
    provider: 'email',
    createdAt: '2026-08-20T11:20:00Z',
    lastLoginAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    messagesSent: 15,
    workspacesUsed: ['research'],
  },
];

const LOCAL_STORAGE_USERS_KEY = 'sparkmind_managed_users';
const LOCAL_STORAGE_DELETED_KEY = 'sparkmind_deleted_users';
const LOCAL_STORAGE_SUSPENDED_KEY = 'sparkmind_suspended_users';

function getDeletedEmails(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function saveDeletedEmail(email: string) {
  try {
    const set = getDeletedEmails();
    set.add(email.toLowerCase().trim());
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function removeDeletedEmail(email: string) {
  try {
    const set = getDeletedEmails();
    set.delete(email.toLowerCase().trim());
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function isUserSuspendedOrDeletedLocally(email: string): { blocked: boolean; status?: 'suspended' | 'deleted' } {
  const cleanEmail = email.toLowerCase().trim();
  const deleted = getDeletedEmails();
  if (deleted.has(cleanEmail)) {
    return { blocked: true, status: 'deleted' };
  }
  const users = getLocalUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found && found.status === 'suspended') {
    return { blocked: true, status: 'suspended' };
  }
  return { blocked: false };
}

function getLocalUsers(): ManagedUser[] {
  const deleted = getDeletedEmails();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (raw) {
      const list: ManagedUser[] = JSON.parse(raw);
      return list.filter((u) => !deleted.has(u.email.toLowerCase()));
    }
  } catch (e) {}
  return INITIAL_USERS.filter((u) => !deleted.has(u.email.toLowerCase()));
}

function setLocalUsers(users: ManagedUser[]) {
  try {
    const deleted = getDeletedEmails();
    const filtered = users.filter((u) => !deleted.has(u.email.toLowerCase()));
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

export async function fetchManagedUsers(): Promise<{ users: ManagedUser[]; stats: UserManagementStats }> {
  const deleted = getDeletedEmails();

  // 1. First, read directly from live Firestore managed_users collection
  try {
    const firestoreUsers = await getFirestoreManagedUsers();
    if (firestoreUsers && firestoreUsers.length > 0) {
      const map = new Map<string, ManagedUser>();

      // Keep default administrators
      for (const initial of INITIAL_USERS) {
        if (!deleted.has(initial.email.toLowerCase())) {
          map.set(initial.email.toLowerCase(), initial);
        }
      }

      // Merge live registered and authenticated users
      for (const fu of firestoreUsers) {
        const clean = (fu.email || '').toLowerCase().trim();
        if (clean && !deleted.has(clean)) {
          const isOwnerAdmin =
            clean === 'komatimanojkumar1227@gmail.com' || clean === 'admin@sparkmind.ai';
          map.set(clean, {
            id: fu.id || `usr_${clean}`,
            name: fu.name || clean.split('@')[0],
            email: clean,
            role: fu.role || (isOwnerAdmin ? 'admin' : 'user'),
            status: fu.status || 'active',
            online: Boolean(fu.online),
            provider: fu.provider || 'email',
            createdAt: fu.createdAt || new Date().toISOString(),
            lastLoginAt: fu.lastLoginAt || new Date().toISOString(),
            messagesSent: fu.messagesSent || 0,
            workspacesUsed: fu.workspacesUsed || ['general'],
          });
        }
      }

      const mergedList = Array.from(map.values());
      setLocalUsers(mergedList);
      return {
        users: mergedList,
        stats: {
          totalUsers: mergedList.length,
          onlineCount: mergedList.filter((u) => u.online && u.status === 'active').length,
          activeToday: mergedList.filter((u) => u.status === 'active').length,
          adminCount: mergedList.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
        },
      };
    }
  } catch (err) {
    console.warn('Live Firestore managed users lookup notice:', err);
  }

  // 2. Server API fallback if running on fullstack node
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      if (data?.users) {
        const activeList = (data.users as ManagedUser[]).filter(
          (u) => !deleted.has(u.email.toLowerCase()) && !deleted.has(u.id)
        );
        setLocalUsers(activeList);
        return {
          users: activeList,
          stats: {
            totalUsers: activeList.length,
            onlineCount: activeList.filter((u) => u.online && u.status === 'active').length,
            activeToday: activeList.filter((u) => u.status === 'active').length,
            adminCount: activeList.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
          },
        };
      }
    }
  } catch (e) {}

  // 3. Fallback to local storage
  const users = getLocalUsers();
  const onlineCount = users.filter((u) => u.online && u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
  return {
    users,
    stats: {
      totalUsers: users.length,
      onlineCount,
      activeToday: users.filter((u) => u.status === 'active').length,
      adminCount,
    },
  };
}

/**
 * Subscribe to real-time live user presence and registrations from Firestore
 */
export function subscribeToLiveUsers(
  callback: (data: { users: ManagedUser[]; stats: UserManagementStats }) => void
): () => void {
  const deleted = getDeletedEmails();
  return subscribeToFirestoreManagedUsers((firestoreUsers) => {
    const map = new Map<string, ManagedUser>();

    // Initial base administrators
    for (const initial of INITIAL_USERS) {
      if (!deleted.has(initial.email.toLowerCase())) {
        map.set(initial.email.toLowerCase(), initial);
      }
    }

    // Live synced users from Firestore
    for (const fu of firestoreUsers) {
      const clean = (fu.email || '').toLowerCase().trim();
      if (clean && !deleted.has(clean)) {
        const isOwnerAdmin =
          clean === 'komatimanojkumar1227@gmail.com' || clean === 'admin@sparkmind.ai';
        map.set(clean, {
          id: fu.id || `usr_${clean}`,
          name: fu.name || clean.split('@')[0],
          email: clean,
          role: fu.role || (isOwnerAdmin ? 'admin' : 'user'),
          status: fu.status || 'active',
          online: Boolean(fu.online),
          provider: fu.provider || 'email',
          createdAt: fu.createdAt || new Date().toISOString(),
          lastLoginAt: fu.lastLoginAt || new Date().toISOString(),
          messagesSent: fu.messagesSent || 0,
          workspacesUsed: fu.workspacesUsed || ['general'],
        });
      }
    }

    const mergedList = Array.from(map.values());
    setLocalUsers(mergedList);
    callback({
      users: mergedList,
      stats: {
        totalUsers: mergedList.length,
        onlineCount: mergedList.filter((u) => u.online && u.status === 'active').length,
        activeToday: mergedList.filter((u) => u.status === 'active').length,
        adminCount: mergedList.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
      },
    });
  });
}

export async function toggleUserStatus(userId: string, newStatus: 'active' | 'suspended'): Promise<boolean> {
  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  const cleanEmail = target?.email.toLowerCase().trim();

  // 1. Sync to live Firestore
  if (cleanEmail) {
    await setFirestoreUserStatus(cleanEmail, newStatus);
  }

  // 2. Sync to local state
  const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
  setLocalUsers(updated);

  // 3. Sync to API route if present
  try {
    await fetch('/api/admin/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: cleanEmail, status: newStatus }),
    });
  } catch (e) {}

  return true;
}

export async function updateUserRole(userId: string, newRole: 'super_admin' | 'admin' | 'user'): Promise<boolean> {
  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  const cleanEmail = target?.email.toLowerCase().trim();

  // 1. Sync to live Firestore
  if (cleanEmail) {
    await setFirestoreUserRole(cleanEmail, newRole);
  }

  // 2. Sync to local state
  const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  setLocalUsers(updated);

  // 3. Sync to API route
  try {
    await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: cleanEmail, role: newRole }),
    });
  } catch (e) {}

  return true;
}

export async function createManagedUser(user: {
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
}): Promise<ManagedUser | null> {
  const cleanEmail = user.email.toLowerCase().trim();
  removeDeletedEmail(cleanEmail);

  const newUser: ManagedUser = {
    id: `usr_${Date.now().toString(36)}`,
    name: user.name,
    email: cleanEmail,
    role: user.role,
    status: 'active',
    online: false,
    provider: 'email',
    createdAt: new Date().toISOString(),
    lastLoginAt: 'Never',
    messagesSent: 0,
    workspacesUsed: ['general'],
  };

  // 1. Persist to Firestore
  try {
    await syncUserPresenceAndProfile(
      {
        id: newUser.id,
        email: cleanEmail,
        name: newUser.name,
      },
      'email',
      false
    );
  } catch (e) {}

  // 2. Persist locally
  const currentList = getLocalUsers().filter((u) => u.email.toLowerCase() !== cleanEmail);
  const users = [newUser, ...currentList];
  setLocalUsers(users);

  // 3. Server API sync
  try {
    await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (e) {}

  return newUser;
}

export async function deleteManagedUser(userId: string, email?: string): Promise<boolean> {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  if (cleanEmail) {
    saveDeletedEmail(cleanEmail);
    await removeFirestoreUser(cleanEmail);
  }
  const all = getLocalUsers();
  const target = all.find((u) => u.id === userId || (cleanEmail && u.email.toLowerCase() === cleanEmail));
  if (target) {
    saveDeletedEmail(target.email.toLowerCase().trim());
    await removeFirestoreUser(target.email.toLowerCase().trim());
  }

  // Always update local storage
  const remaining = all.filter((u) => u.id !== userId && (!cleanEmail || u.email.toLowerCase() !== cleanEmail));
  setLocalUsers(remaining);

  try {
    const url = `/api/admin/users/${userId}${cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : ''}`;
    await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
  } catch (e) {}

  return true;
}

export async function checkRemoteUserAccess(email: string): Promise<{ allowed: boolean; reason?: string; status?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const localCheck = isUserSuspendedOrDeletedLocally(cleanEmail);
  if (localCheck.blocked) {
    return {
      allowed: false,
      status: localCheck.status,
      reason:
        localCheck.status === 'deleted'
          ? 'This account has been deleted by the administrator. You do not have access until the administrator adds your account.'
          : 'This account has been suspended by the administrator. Please contact your workspace administrator to regain access.',
    };
  }

  try {
    const res = await fetch('/api/users/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.allowed) {
        if (data.status === 'deleted') saveDeletedEmail(cleanEmail);
        return {
          allowed: false,
          status: data.status,
          reason: data.reason || 'Access denied by administrator.',
        };
      }
      return { allowed: true };
    }
  } catch (e) {}

  return { allowed: true };
}

export async function recordUserHeartbeat(user: {
  id?: string;
  email?: string | null;
  name?: string | null;
  provider?: string;
}): Promise<void> {
  if (!user.email) return;
  const cleanEmail = user.email.toLowerCase().trim();

  // 1. Live presence update in Firestore
  try {
    await syncUserPresenceAndProfile(
      {
        uid: user.id,
        email: cleanEmail,
        displayName: user.name,
      },
      (user.provider as any) || 'email',
      true
    );
  } catch (e) {}

  // 2. Update local state
  const users = getLocalUsers();
  const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (match) {
    match.online = true;
    match.lastLoginAt = new Date().toISOString();
    setLocalUsers(users);
  }

  // 3. Heartbeat API
  try {
    await fetch('/api/users/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id || `usr_${Date.now()}`,
        email: cleanEmail,
        name: user.name || cleanEmail.split('@')[0],
        provider: user.provider || 'email',
      }),
    });
  } catch (e) {}
}

const ADMIN_STORAGE_KEY = 'sparkmind_admin_custom_creds_v2';

interface StoredAdminCreds {
  username: string;
  passwordHash: string; // Base64 encoded or plaintext in local
}

function getLocalAdminCreds(): StoredAdminCreds {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    username: 'admin@sparkmind.ai',
    passwordHash: 'sparkmind2026',
  };
}

export function getStoredAdminUsername(): string {
  return getLocalAdminCreds().username;
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const uClean = username.trim().toLowerCase();
  const pClean = password.trim();

  // Try server verification first
  try {
    const res = await fetch('/api/admin/verify-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uClean, password: pClean }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return true;
      }
    }
  } catch (e) {}

  // Fallback to local stored custom credentials
  const local = getLocalAdminCreds();
  return (
    (uClean === local.username.toLowerCase() || uClean === 'admin') &&
    pClean === local.passwordHash
  );
}

export async function updateAdminCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // First verify locally or via server
  const isValidCurrent = await verifyAdminCredentials(getLocalAdminCreds().username, currentPassword);
  if (!isValidCurrent) {
    return { success: false, error: 'Current administrator password is incorrect' };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }

  const finalUsername = (newUsername && newUsername.trim()) || getLocalAdminCreds().username;

  // Sync to server
  try {
    const res = await fetch('/api/admin/change-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: currentPassword.trim(),
        newUsername: finalUsername.toLowerCase().trim(),
        newPassword: newPassword.trim(),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Server rejected credentials update' };
    }
  } catch (e) {}

  // Persist locally
  try {
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({
        username: finalUsername.toLowerCase().trim(),
        passwordHash: newPassword.trim(),
      })
    );
  } catch (e) {}

  return { success: true };
}

/**
 * Reset Administrator Password using registered admin recovery email
 */
export async function resetAdminPassword(
  recoveryEmail: string,
  newPassword: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const cleanEmail = (recoveryEmail || '').trim().toLowerCase();
  const cleanPass = (newPassword || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Administrator recovery email is required.', message: '' };
  }

  if (cleanPass.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.', message: '' };
  }

  const currentCreds = getLocalAdminCreds();
  const localUsers = getLocalUsers();
  const adminUsersEmails = localUsers
    .filter((u) => u.role === 'admin' || u.role === 'super_admin')
    .map((u) => u.email.toLowerCase());

  const authorizedEmails = [
    currentCreds.username.toLowerCase(),
    'admin@sparkmind.ai',
    'admin',
    'komatimanojkumar1227@gmail.com',
    ...adminUsersEmails,
  ];

  if (!authorizedEmails.includes(cleanEmail)) {
    return {
      success: false,
      error: 'The provided email is not registered as an administrator recovery account.',
      message: '',
    };
  }

  // Sync to server if running
  try {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recoveryEmail: cleanEmail,
        newPassword: cleanPass,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      if (data.error) {
        return { success: false, error: data.error, message: '' };
      }
    }
  } catch (e) {}

  // Update local storage
  try {
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({
        username: cleanEmail,
        passwordHash: cleanPass,
      })
    );
  } catch (e) {}

  return {
    success: true,
    message: 'Administrator password reset successfully! You can now log in with your new credentials.',
  };
}

// ==========================================
// Gemini API Keys & Spare Failover Management
// ==========================================

export async function fetchApiKeysSummary(): Promise<ApiKeysSummary | null> {
  try {
    const res = await fetch('/api/admin/api-keys');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Offline or serverless endpoint not provisioned - return null silently
  }
  return null;
}

export async function updateAdminApiKeys(
  key1?: string,
  key2?: string
): Promise<{ success: boolean; message: string; summary?: ApiKeysSummary }> {
  try {
    const res = await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key1, key2 }),
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || (res.ok ? 'Updated API keys successfully' : 'Failed to update keys'),
      summary: data,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Network error updating API keys' };
  }
}

export async function resetAdminApiKeyQuota(
  keyIndex?: number
): Promise<{ success: boolean; message: string; summary?: ApiKeysSummary }> {
  try {
    const res = await fetch('/api/admin/api-keys/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyIndex }),
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || 'Reset quota status',
      summary: data,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Network error resetting quota' };
  }
}

export async function simulateAdminFailover(): Promise<{
  success: boolean;
  message: string;
  summary?: ApiKeysSummary;
}> {
  try {
    const res = await fetch('/api/admin/api-keys/simulate-failover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || 'Simulated failover',
      summary: data,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Network error simulating failover' };
  }
}

// ==========================================
// Admin Notifications & System Alerts
// ==========================================

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const res = await fetch('/api/admin/notifications');
    if (res.ok) {
      const data = await res.json();
      return data.notifications || [];
    }
  } catch (e) {
    console.warn('Failed to fetch admin notifications:', e);
  }
  return [];
}

export async function markAdminNotificationsRead(ids?: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteAdminNotification(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function clearAllAdminNotifications(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/notifications', {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
