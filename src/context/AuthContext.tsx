import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  testFirestoreConnection,
  AppUser,
  getSavedSession,
  saveSession,
  resetUserPassword,
} from '../lib/firebase';
import { checkRemoteUserAccess } from '../services/adminService';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;
  loginAsAdmin: (adminEmail?: string, adminName?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getSavedSession());
  const [loading, setLoading] = useState<boolean>(() => !getSavedSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().catch(() => {});

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        // Enforce access control: verify user is not suspended or deleted
        const access = await checkRemoteUserAccess(user.email);
        if (!access.allowed) {
          await logoutUser();
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providerData: [{ providerId: user.providerData?.[0]?.providerId || 'google' }],
        };
        setCurrentUser(appUser);
        saveSession(appUser);
      } else {
        const local = getSavedSession();
        if (local && local.email) {
          const access = await checkRemoteUserAccess(local.email);
          if (!access.allowed) {
            await logoutUser();
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          setCurrentUser(local);
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const handleGoogleLogin = async () => {
    const user = await loginWithGoogle();
    if (user.email) {
      const access = await checkRemoteUserAccess(user.email);
      if (!access.allowed) {
        await logoutUser();
        setCurrentUser(null);
        throw new Error(access.reason || 'Access denied by administrator.');
      }
    }
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    const access = await checkRemoteUserAccess(email);
    if (!access.allowed) {
      throw new Error(access.reason || 'Access denied by administrator.');
    }
    const user = await loginWithEmail(email, pass);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleEmailRegister = async (email: string, pass: string, name: string) => {
    const access = await checkRemoteUserAccess(email);
    if (!access.allowed) {
      throw new Error(access.reason || 'Access denied by administrator.');
    }
    const user = await registerWithEmail(email, pass, name);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handlePasswordReset = async (email: string, newPassword?: string) => {
    const result = await resetUserPassword(email, newPassword);
    return {
      success: result.success,
      message: result.message,
    };
  };

  const handleLoginAsAdmin = (adminEmail: string = 'admin@sparkmind.ai', adminName: string = 'Administrator') => {
    sessionStorage.setItem('sparkmind_admin_auth', 'true');
    const adminUser: AppUser = {
      uid: 'admin_session_root',
      email: adminEmail,
      displayName: adminName,
      photoURL: null,
      providerData: [{ providerId: 'system_admin' }],
    };
    setCurrentUser(adminUser);
    saveSession(adminUser);
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle: handleGoogleLogin,
        loginWithEmail: handleEmailLogin,
        registerWithEmail: handleEmailRegister,
        sendPasswordReset: handlePasswordReset,
        loginAsAdmin: handleLoginAsAdmin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
