import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { isUserSuspendedOrDeletedLocally } from '../services/adminService.js';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with experimentalForceLongPolling to prevent WebChannel RPC stream transport disconnects
export const db = (() => {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      dbId
    );
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
})();

// Connection test per skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
      return false;
    }
    return true;
  }
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  providerData?: Array<{ providerId: string }>;
}

export const LOCAL_USERS_KEY = 'sparkmind_registered_users_db_v1';
export const ACTIVE_SESSION_KEY = 'sparkmind_active_auth_session_v1';

export function getSavedSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveSession(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (e) {}
}

export interface StoredAccount {
  id: string;
  email: string;
  pass: string;
  name: string;
  createdAt: string;
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveStoredAccount(account: StoredAccount) {
  try {
    const accounts = getStoredAccounts().filter((a) => a.email !== account.email);
    accounts.push(account);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
  } catch (e) {}
}

/**
 * Synchronize live user presence, account information, and last login directly to Firestore managed_users collection
 */
export async function syncUserPresenceAndProfile(
  user: {
    uid?: string;
    id?: string;
    email: string | null;
    displayName?: string | null;
    name?: string | null;
  },
  provider: 'google' | 'email' | 'system' = 'email',
  online: boolean = true
): Promise<void> {
  if (!user || !user.email) return;
  const cleanEmail = user.email.toLowerCase().trim();
  const isAdmin =
    cleanEmail === 'komatimanojkumar1227@gmail.com' || cleanEmail === 'admin@sparkmind.ai';

  try {
    const userRef = doc(db, 'managed_users', cleanEmail);
    await setDoc(
      userRef,
      {
        id: user.uid || user.id || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: user.displayName || user.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        online,
        provider,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to sync presence to Firestore:', e);
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const cleanEmail = (result.user.email || '').toLowerCase().trim();

    // Enforce access control: suspended and deleted users are strictly denied
    const accessCheck = isUserSuspendedOrDeletedLocally(cleanEmail);
    if (accessCheck.blocked) {
      await signOut(auth);
      throw new Error(
        accessCheck.status === 'deleted'
          ? 'Access Denied: This account has been deleted by the administrator. You do not have access until the administrator re-adds your account.'
          : 'Access Denied: Your account has been suspended by the administrator. Please contact your workspace administrator to regain access.'
      );
    }

    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      providerData: [{ providerId: 'google' }],
    };
    saveSession(appUser);

    // Sync to Firestore managed_users for live Admin Console presence
    await syncUserPresenceAndProfile(appUser, 'google', true);

    return appUser;
  } catch (err: any) {
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your deployed domain';
      const friendlyErr = new Error(
        `Firebase Domain Authorization Required: Your deployed domain "${currentHost}" is not yet added to Firebase Console Authorized Domains. Please add "${currentHost}" under Firebase Console -> Authentication -> Settings -> Authorized domains to enable Google Sign-In.`
      );
      (friendlyErr as any).code = 'auth/unauthorized-domain';
      (friendlyErr as any).domain = currentHost;
      throw friendlyErr;
    }
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  // Enforce access control: suspended and deleted users are strictly denied
  const accessCheck = isUserSuspendedOrDeletedLocally(cleanEmail);
  if (accessCheck.blocked) {
    throw new Error(
      accessCheck.status === 'deleted'
        ? 'Access Denied: This account has been deleted by the administrator. You do not have access until the administrator re-adds your account.'
        : 'Access Denied: Your account has been suspended by the administrator. Please contact your workspace administrator to regain access.'
    );
  }

  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      providerData: [{ providerId: 'password' }],
    };
    saveSession(appUser);

    // Sync presence to Firestore
    await syncUserPresenceAndProfile(appUser, 'email', true);

    return appUser;
  } catch (err: any) {
    if (
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('operation-not-allowed')
    ) {
      const accounts = getStoredAccounts();
      const match = accounts.find((a) => a.email === cleanEmail);
      if (!match) {
        throw new Error('Account not found. Please click "Create one now" below to sign up first.');
      }

      if (match.pass !== pass) {
        throw new Error('Incorrect password. Please verify your credentials and try again.');
      }

      const appUser: AppUser = {
        uid: match.id,
        email: match.email,
        displayName: match.name,
        photoURL: null,
        providerData: [{ providerId: 'password' }],
      };
      saveSession(appUser);

      // Sync presence to Firestore
      await syncUserPresenceAndProfile(appUser, 'email', true);

      return appUser;
    }

    if (
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/invalid-email'
    ) {
      throw new Error('Account not found. Please click "Create one now" below to sign up first.');
    }

    throw err;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  // Enforce access control: suspended and deleted users cannot register
  const accessCheck = isUserSuspendedOrDeletedLocally(cleanEmail);
  if (accessCheck.blocked) {
    throw new Error(
      accessCheck.status === 'deleted'
        ? 'Access Denied: This account was removed. You do not have access until approved or re-added by the administrator.'
        : 'Access Denied: This account is currently suspended by the workspace administrator.'
    );
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: displayName || result.user.displayName,
      photoURL: result.user.photoURL,
      providerData: [{ providerId: 'password' }],
    };
    saveSession(appUser);

    // Save and sync directly to Firestore managed_users
    await syncUserPresenceAndProfile(appUser, 'email', true);

    return appUser;
  } catch (err: any) {
    if (
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('operation-not-allowed')
    ) {
      const existing = getStoredAccounts().find((a) => a.email === cleanEmail);
      if (existing) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      const newAccount: StoredAccount = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        pass,
        name: displayName || cleanEmail.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      saveStoredAccount(newAccount);

      const appUser: AppUser = {
        uid: newAccount.id,
        email: newAccount.email,
        displayName: newAccount.name,
        photoURL: null,
        providerData: [{ providerId: 'password' }],
      };
      saveSession(appUser);

      // Save and sync directly to Firestore managed_users
      await syncUserPresenceAndProfile(appUser, 'email', true);

      return appUser;
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  const session = getSavedSession();
  if (session && session.email) {
    try {
      await setDoc(
        doc(db, 'managed_users', session.email.toLowerCase().trim()),
        {
          online: false,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {}
  }
  saveSession(null);
  try {
    await signOut(auth);
  } catch (e) {}
}

/**
 * Reset password for email accounts (Supports Firebase Auth email reset and local storage accounts)
 */
export async function resetUserPassword(
  email: string,
  newPassword?: string
): Promise<{ success: boolean; mode: 'email_sent' | 'password_updated'; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  // 1. Try Firebase Auth native sendPasswordResetEmail first
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      mode: 'email_sent',
      message: `Password reset link has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`,
    };
  } catch (err: any) {
    // If operation not allowed or user is in local storage account fallback
    const accounts = getStoredAccounts();
    const existingIndex = accounts.findIndex((a) => a.email === cleanEmail);

    if (existingIndex >= 0) {
      if (newPassword && newPassword.trim().length >= 6) {
        // Direct password reset for locally-provisioned account
        accounts[existingIndex].pass = newPassword.trim();
        try {
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
        } catch (e) {}
        return {
          success: true,
          mode: 'password_updated',
          message: 'Your account password has been successfully updated! You can now sign in with your new password.',
        };
      } else {
        return {
          success: true,
          mode: 'email_sent',
          message: `Password reset instructions have been prepared for ${cleanEmail}. Enter a new password to complete the reset.`,
        };
      }
    }

    // If user not found in Firebase or local
    if (err?.code === 'auth/user-not-found') {
      throw new Error(`No registered account found with email ${cleanEmail}.`);
    }

    // If operation-not-allowed, prompt user to set password directly
    if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
      if (newPassword && newPassword.trim().length >= 6) {
        const newAccount: StoredAccount = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: cleanEmail,
          pass: newPassword.trim(),
          name: cleanEmail.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        saveStoredAccount(newAccount);
        return {
          success: true,
          mode: 'password_updated',
          message: 'Your password has been successfully configured! You can now log in.',
        };
      }
    }

    throw new Error(err.message || 'Unable to process password reset. Please try again.');
  }
}

// Cloud Document Storage Helpers (for unlimited documents & image records)
export interface CloudFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  createdAt: string;
}

export async function saveUserCloudDocument(userId: string, fileRecord: CloudFileRecord): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, 'users', userId, 'documents', fileRecord.id);
  await setDoc(docRef, {
    ...fileRecord,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserCloudDocuments(userId: string): Promise<CloudFileRecord[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'documents');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as CloudFileRecord);
  } catch (err) {
    console.error('Error fetching user cloud documents:', err);
    return [];
  }
}

export async function deleteUserCloudDocument(userId: string, docId: string): Promise<void> {
  if (!userId || !docId) return;
  await deleteDoc(doc(db, 'users', userId, 'documents', docId));
}

/**
 * Fetch all users stored in Firestore managed_users collection
 */
export async function getFirestoreManagedUsers(): Promise<any[]> {
  try {
    const colRef = collection(db, 'managed_users');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      email: docSnap.data().email || docSnap.id,
    }));
  } catch (e) {
    console.warn('Could not read from Firestore managed_users:', e);
    return [];
  }
}

/**
 * Real-time listener for Firestore managed_users collection
 */
export function subscribeToFirestoreManagedUsers(callback: (users: any[]) => void): () => void {
  try {
    const colRef = collection(db, 'managed_users');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({
          ...d.data(),
          email: d.data().email || d.id,
        }));
        callback(users);
      },
      (err) => {
        console.warn('Managed users snapshot error:', err);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Update user status in Firestore managed_users
 */
export async function setFirestoreUserStatus(email: string, status: 'active' | 'suspended'): Promise<void> {
  if (!email) return;
  try {
    await setDoc(
      doc(db, 'managed_users', email.toLowerCase().trim()),
      {
        status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {}
}

/**
 * Update user role in Firestore managed_users
 */
export async function setFirestoreUserRole(
  email: string,
  role: 'super_admin' | 'admin' | 'user'
): Promise<void> {
  if (!email) return;
  try {
    await setDoc(
      doc(db, 'managed_users', email.toLowerCase().trim()),
      {
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {}
}

/**
 * Remove user from Firestore managed_users
 */
export async function removeFirestoreUser(email: string): Promise<void> {
  if (!email) return;
  try {
    await deleteDoc(doc(db, 'managed_users', email.toLowerCase().trim()));
  } catch (e) {}
}
