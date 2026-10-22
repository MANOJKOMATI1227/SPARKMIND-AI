import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  Moon,
  Sun,
  Settings,
  Languages,
  RotateCw,
  Search,
  MessageSquare,
  Trash2,
  Share2,
  Pin,
  Edit2,
  FileText,
  FileCheck,
  BookOpen,
  Briefcase,
  GraduationCap,
  Code2,
  Rocket,
  Layers,
  ChevronDown,
  Loader2,
  Zap,
  Globe,
  Upload,
  SquarePen,
  Keyboard,
  X,
  PanelLeft,
  FileDown,
  AlertOctagon,
} from 'lucide-react';
import { HlsVideoBackground } from './components/common/HlsVideoBackground.js';
import { BackgroundRibbons } from './components/common/BackgroundRibbons.js';
import { SparkLogo } from './components/common/SparkLogo.js';
import { Sidebar } from './components/sidebar/Sidebar.js';
import { MessageBubble } from './components/chat/MessageBubble.js';
import { Composer } from './components/chat/Composer.js';
import { WelcomeState } from './components/chat/WelcomeState.js';
import { ConversationSearchBar } from './components/chat/ConversationSearchBar.js';
import { AuthGate } from './components/auth/AuthGate.js';
import { FpsMonitor } from './components/common/FpsMonitor.js';

// Code-split heavy modals and assistant suites for ultra-fast mobile loading & 60 FPS
const SettingsModal = React.lazy(() => import('./components/settings/SettingsModal.js').then(m => ({ default: m.SettingsModal })));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal.js').then(m => ({ default: m.AuthModal })));
const PromptLibrary = React.lazy(() => import('./components/tools/PromptLibrary.js').then(m => ({ default: m.PromptLibrary })));
const ResumeAssistant = React.lazy(() => import('./components/tools/ResumeAssistant.js').then(m => ({ default: m.ResumeAssistant })));
const DataAssistant = React.lazy(() => import('./components/tools/DataAssistant.js').then(m => ({ default: m.DataAssistant })));
const SavedAnswers = React.lazy(() => import('./components/tools/SavedAnswers.js').then(m => ({ default: m.SavedAnswers })));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard.js').then(m => ({ default: m.AdminDashboard })));
const WorkspaceHubModal = React.lazy(() => import('./components/tools/WorkspaceHubModal.js').then(m => ({ default: m.WorkspaceHubModal })));
const ShareChatModal = React.lazy(() => import('./components/chat/ShareChatModal.js').then(m => ({ default: m.ShareChatModal })));
const ShortcutsModal = React.lazy(() => import('./components/common/ShortcutsModal.js').then(m => ({ default: m.ShortcutsModal })));
const LegalModal = React.lazy(() => import('./components/common/LegalModal.js').then(m => ({ default: m.LegalModal })));
import { getSharedChat } from './services/shareService.js';
import { exportConversationToPDF } from './services/pdfExportService.js';
import {
  AgentType,
  AttachmentItem,
  ChatMessage,
  Conversation,
  ReasoningMode,
  SavedAnswer,
  UserProfile,
  WorkspaceType,
} from './types/index.js';
import { sendChatMessage } from './services/chatService.js';
import { recordUserHeartbeat, checkRemoteUserAccess, fetchApiKeysSummary } from './services/adminService.js';
import {
  clearUserConversations,
  loadConversations,
  loadSavedAnswers,
  loadUserProfile,
  saveConversations,
  saveSavedAnswers,
  saveUserProfile,
} from './utils/storage.js';
import { getLocale, SupportedLanguage } from './locales/index.js';
import { useAuth } from './context/AuthContext.js';

export default function App() {
  const { currentUser, loading: authLoading, openAuthModal, logout, loginAsAdmin } = useAuth();
  const [user, setUser] = useState<UserProfile>(loadUserProfile);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations(user.id)
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(user.preferredWorkspace || 'general');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>(() => {
    try {
      const saved = localStorage.getItem('sparkmind_reasoning_mode');
      if (saved === 'flash' || saved === 'medium' || saved === 'deep') return saved;
    } catch {}
    return 'flash';
  });

  const handleModeChange = (mode: ReasoningMode) => {
    setReasoningMode(mode);
    try {
      localStorage.setItem('sparkmind_reasoning_mode', mode);
    } catch {}
  };
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (user.preferredLanguage as SupportedLanguage) || 'en'
  );
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user.theme || 'dark');
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>(() =>
    loadSavedAnswers(user.id)
  );

  // Initial prompt bridge (from Prompt Library, Resume, etc. to Composer)
  const [initialPrompt, setInitialPrompt] = useState('');

  // Modals & Drawers state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sparkmind_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sparkmind_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isResumeAssistantOpen, setIsResumeAssistantOpen] = useState(false);
  const [isDataAssistantOpen, setIsDataAssistantOpen] = useState(false);
  const [isSavedAnswersOpen, setIsSavedAnswersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWorkspaceHubOpen, setIsWorkspaceHubOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [conversationToShare, setConversationToShare] = useState<Conversation | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'license'>('terms');
  const [appNotice, setAppNotice] = useState<string | null>(null);

  // In-conversation message search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Dual Gemini API Key failover & admin alert status
  const [adminAlertCount, setAdminAlertCount] = useState(0);
  const [isFailoverActive, setIsFailoverActive] = useState(false);
  const [composerResetKey, setComposerResetKey] = useState(0);

  // Authenticated administrator verification (alerts and controls accessible to authorized administrators)
  const isAuthorizedAdminEmail = (emailStr: string | null | undefined): boolean => {
    const clean = (emailStr || '').toLowerCase().trim();
    return clean === 'admin@sparkmind.ai' || clean === 'komatimanojkumar1227@gmail.com';
  };

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      const email = (currentUser?.email || user?.email || '').toLowerCase().trim();
      if (email && !isAuthorizedAdminEmail(email) && sessionStorage.getItem('sparkmind_admin_auth') !== 'true') {
        return false;
      }
      return (
        currentUser?.providerData?.some((p) => p.providerId === 'system_admin') === true ||
        isAuthorizedAdminEmail(email) ||
        sessionStorage.getItem('sparkmind_admin_auth') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Real-time user heartbeat to keep admin active presence console synchronized in Firestore
  useEffect(() => {
    if (!currentUser?.email) return;
    recordUserHeartbeat({
      id: currentUser.uid,
      email: currentUser.email,
      name: currentUser.displayName,
      provider: currentUser.providerData?.[0]?.providerId || 'email',
    });

    const heartbeatInterval = setInterval(() => {
      recordUserHeartbeat({
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        provider: currentUser.providerData?.[0]?.providerId || 'email',
      });
    }, 45000);

    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  useEffect(() => {
    const updateAdminStatus = () => {
      try {
        const email = (currentUser?.email || user?.email || '').toLowerCase().trim();
        const isAdmin =
          currentUser?.providerData?.some((p) => p.providerId === 'system_admin') === true ||
          isAuthorizedAdminEmail(email) ||
          sessionStorage.getItem('sparkmind_admin_auth') === 'true';
        setIsAdminLoggedIn(!!isAdmin);
      } catch {
        setIsAdminLoggedIn(false);
      }
    };

    updateAdminStatus();
    window.addEventListener('storage', updateAdminStatus);
    window.addEventListener('sparkmind:open-admin', updateAdminStatus);
    window.addEventListener('sparkmind:admin-login-changed', updateAdminStatus);
    return () => {
      window.removeEventListener('storage', updateAdminStatus);
      window.removeEventListener('sparkmind:open-admin', updateAdminStatus);
      window.removeEventListener('sparkmind:admin-login-changed', updateAdminStatus);
    };
  }, [currentUser, user]);

  const checkApiKeysStatus = async () => {
    try {
      const summary = await fetchApiKeysSummary();
      if (summary) {
        setAdminAlertCount(summary.unreadNotificationsCount || 0);
        setIsFailoverActive(summary.failoverActive || summary.keys?.[0]?.status === 'quota_exhausted');
      }
    } catch {}
  };

  useEffect(() => {
    checkApiKeysStatus();
    const interval = setInterval(checkApiKeysStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenLegal = (tab: 'terms' | 'license' = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Cinematic HLS background video controls
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  // Background animation brightness at 100 percent (1.0)
  const [videoOpacity, setVideoOpacity] = useState(1.0);
  const [sharedBanner, setSharedBanner] = useState<{
    id: string;
    title: string;
    sharedBy?: string;
    messageCount: number;
    conversation: Conversation;
  } | null>(null);

  // Check for shared conversation link in URL (?share=<id>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (!shareId) return;

    getSharedChat(shareId).then((sharedRecord) => {
      if (sharedRecord && sharedRecord.conversation) {
        const sharedConv = sharedRecord.conversation;
        setSharedBanner({
          id: sharedRecord.id,
          title: sharedRecord.title,
          sharedBy: sharedRecord.sharedBy,
          messageCount: sharedRecord.messageCount,
          conversation: sharedConv,
        });

        // Add to conversations view if not already there
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === sharedConv.id);
          if (exists) return prev;
          return [sharedConv, ...prev];
        });
        setActiveConversationId(sharedConv.id);
      }
    });
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const locales = getLocale(currentLanguage);

  // Automatic laptop mode detection (automatically recognizes laptop Dark or Light mode without manual options)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemMode = (matches: boolean) => {
      setSystemIsDark(matches);
    };
    updateSystemMode(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => updateSystemMode(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // ALWAYS Able to see in only Dark Mode except user-selected modes (Light Mode).
  // Note: Dark Mode is even also System Default.
  const isDarkActive = theme === 'light' ? false : true;

  // Sync dark class on body & document element based on active theme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDarkActive) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [isDarkActive]);

  const handleSelectTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const updated = { ...user, theme: newTheme };
    setUser(updated);
    saveUserProfile(updated);
  };

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' | 'system' = isDarkActive ? 'light' : 'dark';
    handleSelectTheme(nextTheme);
  };

  // Global event listener to open admin console from any modal or gate
  useEffect(() => {
    const handleOpenAdmin = () => {
      loginAsAdmin('admin@sparkmind.ai', 'Administrator');
      setIsAdminOpen(true);
    };
    window.addEventListener('sparkmind:open-admin', handleOpenAdmin);
    return () => window.removeEventListener('sparkmind:open-admin', handleOpenAdmin);
  }, []);

  // Sync Firebase currentUser with app user state and continuously verify access
  useEffect(() => {
    if (currentUser) {
      setUser((prev) => ({
        ...prev,
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || prev.email,
        avatar: currentUser.photoURL || prev.avatar,
      }));
      recordUserHeartbeat({
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        provider: currentUser.providerData?.[0]?.providerId || 'email',
      });

      // Immediate & continuous access check: revoked users lose access immediately
      let isAlive = true;
      const verifyAccess = async () => {
        if (!currentUser.email) return;
        const res = await checkRemoteUserAccess(currentUser.email);
        if (!isAlive) return;
        if (!res.allowed) {
          await logout();
          setUser((prev) => ({
            ...prev,
            id: 'guest_user',
            name: 'Guest User',
            email: '',
            avatar: '',
          }));
        }
      };

      verifyAccess();
      const interval = setInterval(verifyAccess, 5000);
      return () => {
        isAlive = false;
        clearInterval(interval);
      };
    }
  }, [currentUser, logout]);

  // Synchronize and load conversations when user.id changes
  useEffect(() => {
    const loaded = loadConversations(user.id);
    if (loaded && loaded.length > 0) {
      setConversations(loaded);
      if (!activeConversationId) {
        setActiveConversationId(loaded[0].id);
      }
    }
  }, [user.id]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    saveConversations(user.id, conversations);
  }, [conversations, user.id]);

  // Save saved answers
  useEffect(() => {
    saveSavedAnswers(user.id, savedAnswers);
  }, [savedAnswers, user.id]);

  // Scroll to bottom (used when user submits question or switches chats)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to the START of a replied answer so user reads from the beginning (never jump to end)
  const scrollToMessageStart = (messageId: string, behavior: ScrollBehavior = 'smooth') => {
    const attemptScroll = (attemptsLeft: number) => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el && chatScrollContainerRef.current) {
        const container = chatScrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 16;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior,
        });
      } else if (attemptsLeft > 0) {
        setTimeout(() => attemptScroll(attemptsLeft - 1), 50);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(() => attemptScroll(4), 50);
    });
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // When switching conversations, display recent conversation
  useEffect(() => {
    if (activeConversationId) {
      setTimeout(() => {
        scrollToBottom('auto');
      }, 60);
    }
  }, [activeConversationId]);

  // Handle New Chat creation
  const handleNewChat = (workspace: WorkspaceType = activeWorkspace) => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    setInitialPrompt('');
    setSearchQuery('');
    setIsSearchOpen(false);
    setSharedBanner(null);

    // If an existing conversation is already empty in this workspace, select it
    const existingEmpty = conversations.find(
      (c) => c.messages.length === 0 && c.workspace === workspace
    );

    let targetId: string;
    if (existingEmpty) {
      targetId = existingEmpty.id;
      setActiveConversationId(targetId);
    } else {
      const newConvId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: locales.newChat || 'New Chat',
        workspace: workspace,
        agent: 'auto',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTemporary: isTemporaryChat,
      };
      targetId = newConvId;
      setConversations((prev) => {
        const updated = [newConv, ...prev];
        saveConversations(user.id, updated);
        return updated;
      });
      setActiveConversationId(targetId);
    }

    setActiveWorkspace(workspace);
    setComposerResetKey((prev) => prev + 1);

    // Scroll chat view container to top and focus input
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
    }, 60);
  };

  // Toggle temporary incognito chat
  const handleToggleTemporaryChat = () => {
    setIsTemporaryChat(!isTemporaryChat);
    handleNewChat();
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    attachments: AttachmentItem[],
    useWebGrounding: boolean,
    agent: AgentType,
    mode: ReasoningMode = reasoningMode
  ) => {
    if (!text.trim() && attachments.length === 0) return;

    // Update current active mode if passed
    handleModeChange(mode);

    let targetConvId = activeConversationId;
    let updatedConversations = [...conversations];

    const newUserMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // If no active conversation, create a new one
    if (!targetConvId) {
      targetConvId = `conv_${Date.now()}`;
      const firstLine = text.trim().slice(0, 45) || 'New Conversation';
      const newConv: Conversation = {
        id: targetConvId,
        title: firstLine,
        workspace: activeWorkspace,
        agent: agent,
        messages: [newUserMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTemporary: isTemporaryChat,
      };
      updatedConversations.unshift(newConv);
      setActiveConversationId(targetConvId);
    } else {
      const firstLine = text.trim().slice(0, 45) || 'New Conversation';
      updatedConversations = updatedConversations.map((c) => {
        if (c.id === targetConvId) {
          const isDefaultTitle =
            !c.title ||
            c.title === 'New Chat' ||
            c.title === 'కొత్త చాట్' ||
            c.title === 'नई चैट' ||
            c.messages.length === 0;
          return {
            ...c,
            title: isDefaultTitle ? firstLine : c.title,
            messages: [...c.messages, newUserMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
    }

    setConversations(updatedConversations);
    saveConversations(user.id, updatedConversations);
    setIsLoading(true);
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 60);

    // Verify active account authorization before processing query
    const userEmailToCheck = (user.email || currentUser?.email || '').trim().toLowerCase();
    if (userEmailToCheck) {
      const access = await checkRemoteUserAccess(userEmailToCheck);
      if (!access.allowed) {
        setIsLoading(false);
        abortControllerRef.current = null;
        await logout();
        setUser((prev) => ({
          ...prev,
          id: 'guest_user',
          name: 'Guest User',
          email: '',
          avatar: '',
        }));
        setAppNotice(access.reason || 'Your account access has been revoked by the administrator.');
        return;
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Call serverless / Express Gemini function
    const currentConv = updatedConversations.find((c) => c.id === targetConvId);
    const history = currentConv ? currentConv.messages.slice(0, -1) : [];

    const result = await sendChatMessage({
      message: text,
      history: history,
      workspace: activeWorkspace,
      agent: agent,
      mode: mode,
      model: user.preferredModel || 'gemini-3.8-flash',
      imageQuality: user.imageQuality || 'high',
      language: currentLanguage,
      useWebGrounding: useWebGrounding,
      attachments: attachments,
      userId: user.email || currentUser?.email || user.id,
      signal: controller.signal,
    });

    setIsLoading(false);
    abortControllerRef.current = null;

    if (!result.success && result.error?.includes('Access Denied')) {
      await logout();
      setUser((prev) => ({
        ...prev,
        id: 'guest_user',
        name: 'Guest User',
        email: '',
        avatar: '',
      }));
      setAppNotice(result.error);
      return;
    }

    const rawError = result.error || 'Unable to complete request. Please try again.';
    const cleanError = rawError.includes('response format') || rawError.includes('HTML') || rawError.includes('<!DOCTYPE')
      ? 'SparkMind service is ready. Please try sending your prompt again or switch cognitive mode.'
      : rawError;

    const newAiMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'model',
      content: result.success
        ? result.reply
        : `⚠️ **SparkMind Notice:** ${cleanError}`,
      timestamp: Date.now(),
      sources: result.sources,
      groundingType: result.groundingType,
      reasoningMode: result.reasoningMode || mode,
      detectedLanguage: result.detectedLanguage,
    };

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            messages: [...c.messages, newAiMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      saveConversations(user.id, updated);
      return updated;
    });

    // Scroll to the START of the replied answer so the user reads from the beginning
    scrollToMessageStart(newAiMessage.id);
  };

  // Re-submit edited query (creates clean conversation branch)
  const handleEditSubmit = (messageId: string, newContent: string) => {
    if (!activeConversation) return;
    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate messages after this point and re-run with new message
    const trimmedHistory = activeConversation.messages.slice(0, msgIndex);
    const targetConvId = activeConversation.id;

    const editedUserMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: newContent,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            messages: [...trimmedHistory, editedUserMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setIsLoading(true);
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 60);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    sendChatMessage({
      message: newContent,
      history: trimmedHistory,
      workspace: activeWorkspace,
      agent: activeConversation.agent,
      mode: reasoningMode,
      model: user.preferredModel || 'gemini-3.8-flash',
      imageQuality: user.imageQuality || 'high',
      language: currentLanguage,
      userId: user.email || currentUser?.email || user.id,
      signal: controller.signal,
    }).then((result) => {
      setIsLoading(false);
      checkApiKeysStatus();
      abortControllerRef.current = null;
      if (result.isAborted) return;

      const newAiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'model',
        content: result.success
          ? result.reply
          : `⚠️ ${result.error || 'Unable to complete request.'}`,
        timestamp: Date.now(),
        sources: result.sources,
        groundingType: result.groundingType,
        reasoningMode: result.reasoningMode || reasoningMode,
        detectedLanguage: result.detectedLanguage,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: [...c.messages, newAiMessage],
              updatedAt: Date.now(),
            };
          }
          return c;
        })
      );
      scrollToMessageStart(newAiMessage.id);
    });
  };

  // Regenerate last response
  const handleRegenerate = (aiMessageId: string) => {
    if (!activeConversation || isLoading) return;
    const aiIndex = activeConversation.messages.findIndex((m) => m.id === aiMessageId);
    if (aiIndex <= 0) return;

    const lastUserMsg = activeConversation.messages[aiIndex - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    const history = activeConversation.messages.slice(0, aiIndex - 1);
    setIsLoading(true);
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 60);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    sendChatMessage({
      message: lastUserMsg.content,
      history: history,
      workspace: activeWorkspace,
      agent: activeConversation.agent,
      mode: reasoningMode,
      model: user.preferredModel || 'gemini-3.8-flash',
      imageQuality: user.imageQuality || 'high',
      language: currentLanguage,
      attachments: lastUserMsg.attachments,
      userId: user.email || currentUser?.email || user.id,
      signal: controller.signal,
    }).then((result) => {
      setIsLoading(false);
      checkApiKeysStatus();
      abortControllerRef.current = null;
      if (result.isAborted) return;

      const replacedAiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'model',
        content: result.success
          ? result.reply
          : `⚠️ ${result.error || 'Unable to regenerate response.'}`,
        timestamp: Date.now(),
        sources: result.sources,
        groundingType: result.groundingType,
        reasoningMode: result.reasoningMode || reasoningMode,
        detectedLanguage: result.detectedLanguage,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            const copy = [...c.messages];
            copy[aiIndex] = replacedAiMessage;
            return { ...c, messages: copy };
          }
          return c;
        })
      );
      scrollToMessageStart(replacedAiMessage.id);
    });
  };

  // Save answer to library
  const handleSaveAnswer = (aiMessage: ChatMessage) => {
    if (!activeConversation) return;
    const idx = activeConversation.messages.findIndex((m) => m.id === aiMessage.id);
    const question = idx > 0 ? activeConversation.messages[idx - 1].content : 'Untitled Question';

    const newSaved: SavedAnswer = {
      id: `saved_${Date.now()}`,
      conversationId: activeConversation.id,
      question: question.slice(0, 80),
      answer: aiMessage.content,
      timestamp: Date.now(),
      workspace: activeWorkspace,
      sources: aiMessage.sources,
    };

    setSavedAnswers((prev) => [newSaved, ...prev.filter((s) => s.id !== newSaved.id)]);
  };

  // Message feedback
  const handleFeedback = (messageId: string, isLike: boolean) => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, liked: isLike ? true : false, disliked: !isLike ? true : false }
                : m
            ),
          };
        }
        return c;
      })
    );
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(user.id, updated);
      return updated;
    });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c));
      saveConversations(user.id, updated);
      return updated;
    });
  };

  // Pin / unpin conversation
  const handleTogglePin = (id: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c));
      saveConversations(user.id, updated);
      return updated;
    });
  };

  // Pin / unpin specific message within conversation
  const handleTogglePinMessage = (messageId: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        const hasMsg = c.messages.some((m) => m.id === messageId);
        if (!hasMsg) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
          ),
          updatedAt: Date.now(),
        };
      });
      saveConversations(user.id, updated);
      return updated;
    });
  };

  // Jump to specific message within conversation with smooth scroll & highlight
  const handleJumpToMessage = (messageId: string, targetConvId?: string) => {
    if (targetConvId && targetConvId !== activeConversationId) {
      setActiveConversationId(targetConvId);
    }
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-amber-500', 'bg-amber-500/10', 'rounded-2xl');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-500/10', 'rounded-2xl');
        }, 2200);
      }
    }, 120);
  };

  // Clear all conversations
  const handleClearHistory = () => {
    clearUserConversations(user.id);
    setConversations([]);
    setActiveConversationId(null);
  };

  // Share conversation handler
  const handleOpenShareModal = (conv?: Conversation | null) => {
    const target = conv || activeConversation;
    if (!target) return;
    setConversationToShare(target);
    setIsShareModalOpen(true);
  };

  // Export current conversation to downloadable PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const handleExportPDF = async () => {
    const target = activeConversation;
    if (!target || target.messages.length === 0) return;
    try {
      setIsExportingPDF(true);
      await exportConversationToPDF(target, {
        userName: user.name || currentUser?.displayName || 'User',
        userEmail: user.email || currentUser?.email || '',
      });
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setAppNotice('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Matches within current active conversation
  const matchingMessageIds = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed || !activeConversation) return [];
    return activeConversation.messages
      .filter((m) => m.content.toLowerCase().includes(trimmed))
      .map((m) => m.id);
  }, [searchQuery, activeConversation]);

  // Adjust match index if out of range when matches change
  useEffect(() => {
    if (matchingMessageIds.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matchingMessageIds.length) {
      setCurrentMatchIndex(0);
    }
  }, [matchingMessageIds.length, currentMatchIndex]);

  // Automatically scroll to current search match
  useEffect(() => {
    if (!isSearchOpen || matchingMessageIds.length === 0) return;
    const targetId = matchingMessageIds[currentMatchIndex];
    if (!targetId) return;
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSearchOpen, currentMatchIndex, matchingMessageIds]);

  const handleNextSearchMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevSearchMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
      } else {
        setCurrentMatchIndex(0);
      }
      return next;
    });
  };

  // Import shared chat into user's conversations
  const handleImportSharedChat = () => {
    if (!sharedBanner) return;
    const conv = sharedBanner.conversation;
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conv.id);
      if (exists) return prev;
      return [{ ...conv, id: `conv_${Date.now()}` }, ...prev];
    });
    // Clean URL query
    window.history.replaceState({}, document.title, window.location.pathname);
    setSharedBanner(null);
  };

  // Execute shortcut action from modal click
  const handleExecuteShortcut = (shortcutId: string) => {
    switch (shortcutId) {
      case 'new-chat':
        handleNewChat(activeWorkspace);
        break;
      case 'share-chat':
        if (activeConversation) handleOpenShareModal(activeConversation);
        break;
      case 'toggle-sidebar':
        if (window.innerWidth < 768) {
          setIsSidebarOpen((prev) => !prev);
        } else {
          toggleSidebarCollapse();
        }
        break;
      case 'focus-composer':
        document.querySelector('textarea')?.focus();
        break;
      case 'clear-chat':
        if (activeConversationId) handleDeleteConversation(activeConversationId);
        break;
      case 'search-chat':
        handleToggleSearch();
        break;
      case 'export-pdf':
        handleExportPDF();
        break;
      case 'shortcuts-modal':
        setIsShortcutsOpen((prev) => !prev);
        break;
      case 'settings-modal':
        setIsSettingsOpen(true);
        break;
      case 'prompt-library':
        setIsPromptLibraryOpen(true);
        break;
      case 'resume-assistant':
        setIsResumeAssistantOpen(true);
        break;
      case 'workspace-hub':
        setIsWorkspaceHubOpen(true);
        break;
      case 'toggle-theme':
        handleToggleTheme();
        break;
      default:
        break;
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // 1. Toggle Sidebar: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsSidebarOpen((prev) => !prev);
        } else {
          toggleSidebarCollapse();
        }
        return;
      }

      // 2. Share Active Chat: Ctrl+Shift+S or Cmd+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeConversation) {
          handleOpenShareModal(activeConversation);
        }
        return;
      }

      // 3. Search in Current Conversation: Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (activeConversation && activeConversation.messages.length > 0) {
          e.preventDefault();
          setIsSearchOpen(true);
          return;
        }
      }

      // 4. Export Conversation to PDF: Ctrl+Shift+E or Cmd+Shift+E
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        if (activeConversation && activeConversation.messages.length > 0) {
          e.preventDefault();
          handleExportPDF();
          return;
        }
      }

      // 5. New Chat: Ctrl+Shift+O or Ctrl+Shift+N
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'n')
      ) {
        e.preventDefault();
        handleNewChat(activeWorkspace);
        return;
      }

      // 6. Keyboard Shortcuts: Ctrl+/ or Cmd+/ or ? (when not inside an input field)
      if (((e.ctrlKey || e.metaKey) && e.key === '/') || (!isInput && e.key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 7. Focus Message Composer: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
        return;
      }

      // 8. Toggle Dark / Light Theme: Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      // 9. Open Prompt Library: Ctrl+Shift+P or Cmd+Shift+P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPromptLibraryOpen((prev) => !prev);
        return;
      }

      // 10. Open ATS Resume: Ctrl+Shift+R or Cmd+Shift+R
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsResumeAssistantOpen((prev) => !prev);
        return;
      }

      // 11. Open Workspace Hub: Ctrl+Shift+W or Cmd+Shift+W
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWorkspaceHubOpen((prev) => !prev);
        return;
      }

      // 12. Clear current conversation: Ctrl+Shift+Delete or Ctrl+Shift+Backspace
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'Backspace' || e.key === 'Delete')
      ) {
        e.preventDefault();
        if (activeConversationId) handleDeleteConversation(activeConversationId);
        return;
      }

      // 13. Escape closes any open modal or search
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
          return;
        }
        if (isSidebarOpen) setIsSidebarOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isShareModalOpen) setIsShareModalOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isPromptLibraryOpen) setIsPromptLibraryOpen(false);
        else if (isResumeAssistantOpen) setIsResumeAssistantOpen(false);
        else if (isDataAssistantOpen) setIsDataAssistantOpen(false);
        else if (isSavedAnswersOpen) setIsSavedAnswersOpen(false);
        else if (isAdminOpen) setIsAdminOpen(false);
        else if (isWorkspaceHubOpen) setIsWorkspaceHubOpen(false);
        else if (isLegalModalOpen) setIsLegalModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOpen,
    isSidebarOpen,
    isShortcutsOpen,
    isShareModalOpen,
    isSettingsOpen,
    isLegalModalOpen,
    isPromptLibraryOpen,
    isResumeAssistantOpen,
    isDataAssistantOpen,
    isSavedAnswersOpen,
    isAdminOpen,
    isWorkspaceHubOpen,
    activeConversation,
    activeConversationId,
    activeWorkspace,
    theme,
  ]);

  // Handle open tool from sidebar
  const handleOpenTool = (tool: 'prompts' | 'resume' | 'data' | 'saved' | 'admin') => {
    setIsSidebarOpen(false);
    if (tool === 'prompts') setIsPromptLibraryOpen(true);
    if (tool === 'resume') setIsResumeAssistantOpen(true);
    if (tool === 'data') setIsDataAssistantOpen(true);
    if (tool === 'saved') setIsSavedAnswersOpen(true);
    if (tool === 'admin') setIsAdminOpen(true);
  };

  // Workspace icons mapping
  const workspaceIcons: Record<WorkspaceType, any> = {
    general: Layers,
    student: GraduationCap,
    developer: Code2,
    founder: Rocket,
    business: Briefcase,
  };
  const CurrentWorkspaceIcon = workspaceIcons[activeWorkspace] || Layers;

  // Loading splash while checking Firebase session
  if (authLoading) {
    return (
      <div className="relative flex min-h-screen w-screen items-center justify-center bg-transparent text-slate-900 dark:text-white overflow-hidden">
        {/* Abstract Liquid-Light Silk Ribbons (z-index: 0) */}
        <BackgroundRibbons opacity={videoOpacity} brightness={1.0} isDark={isDarkActive} />
        {/* Dark overlay vignette (z-index: 0) */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]"
          aria-hidden="true"
        />
        <HlsVideoBackground opacity={videoOpacity} isPaused={isVideoPaused} isDark={isDarkActive} />
        <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in duration-300 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 shadow-2xl">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white shadow-xl shadow-orange-500/25 animate-pulse">
            <Zap className="h-8 w-8 fill-amber-100 text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <span>Initializing SparkMind Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate: prompt login first before revealing the chat section
  if (!currentUser) {
    return (
      <div className="relative min-h-screen h-full w-full overflow-y-auto bg-transparent">
        {/* Abstract Liquid-Light Silk Ribbons (z-index: 0) */}
        <BackgroundRibbons opacity={videoOpacity} brightness={1.0} isDark={isDarkActive} />
        {/* Dark overlay vignette (z-index: 0) */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]"
          aria-hidden="true"
        />
        <HlsVideoBackground opacity={videoOpacity} isPaused={isVideoPaused} isDark={isDarkActive} />
        <AuthGate
          onAdminLogin={() => {
            loginAsAdmin('admin@sparkmind.ai', 'Administrator');
            setIsAdminOpen(true);
          }}
          onOpenLegal={handleOpenLegal}
        />
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen h-[100dvh] w-full overflow-hidden bg-transparent font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Abstract Liquid-Light Silk Ribbons (z-index: 0) */}
      <BackgroundRibbons opacity={videoOpacity} brightness={1.0} isDark={isDarkActive} />

      {/* Dark overlay vignette (z-index: 0) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]"
        aria-hidden="true"
      />

      {/* Full Webpage Cinematic HLS Video Background */}
      <HlsVideoBackground opacity={videoOpacity} isPaused={isVideoPaused} isDark={isDarkActive} />

      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          handleNewChat(ws);
        }}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        onOpenTool={handleOpenTool}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        locales={locales}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        systemIsDark={systemIsDark}
        onSelectTheme={handleSelectTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onShareConversation={(conv) => handleOpenShareModal(conv)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLegal={handleOpenLegal}
        onTogglePinMessage={handleTogglePinMessage}
        onJumpToMessage={handleJumpToMessage}
        adminAlertCount={adminAlertCount}
        isFailoverActive={isFailoverActive}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Chat Interface */}
      <main className="relative flex flex-1 flex-col h-full overflow-hidden min-w-0 bg-transparent">
        {/* Top Header Bar with Liquid Glass aesthetic */}
        <header className="flex h-14 items-center justify-between glass-header px-3 sm:px-4 z-30 text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile-only menu drawer button (full layout toggle removed from desktop header) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
              className="flex md:hidden items-center justify-center rounded-xl border border-white/50 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-white/85 dark:hover:bg-white/20 p-2 text-slate-700 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition shadow-[0_2px_10px_rgba(0,0,0,0.04)] cursor-pointer backdrop-blur-xl"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            {/* Quick New Chat Button */}
            <button
              type="button"
              onClick={() => handleNewChat()}
              title="New Chat (Ctrl+Shift+O)"
              aria-label="New Chat"
              className="flex items-center justify-center rounded-xl border border-white/50 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-white/85 dark:hover:bg-white/20 p-2 text-slate-700 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition shadow-[0_2px_10px_rgba(0,0,0,0.04)] cursor-pointer backdrop-blur-xl group active:scale-95"
            >
              <SquarePen className="h-4 w-4 text-amber-500 dark:text-amber-400 group-hover:rotate-6 transition-transform" />
            </button>

            {/* SPARKMIND Prominent Brand Mark */}
            <div className="flex items-center gap-2 pl-0.5 sm:pl-1 select-none">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-white/70 dark:bg-white/10 border border-white/50 dark:border-white/15 shadow-sm backdrop-blur-xl">
                <SparkLogo className="h-4 w-4 sm:h-5 sm:w-5" size={20} glow={true} />
              </div>
              <span className="font-extrabold tracking-tight text-sm sm:text-base flex items-center">
                <span className="text-slate-900 dark:text-white font-black">SPARK</span>
                <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent font-black ml-0.5">MIND</span>
              </span>
            </div>

            {/* Workspace Indicator Badge */}
            <button
              onClick={() => setIsWorkspaceHubOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-white/85 dark:hover:bg-white/20 border border-white/50 dark:border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400/60 transition cursor-pointer backdrop-blur-xl shadow-sm"
              title="Change Workspace or Explore Templates"
            >
              <CurrentWorkspaceIcon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <span className="capitalize">{activeWorkspace}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isTemporaryChat && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300 backdrop-blur-md shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>Temporary Chat</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* System Alert Notification Indicator Button - ONLY for logged-in admin users */}
            {isAdminLoggedIn && (isFailoverActive || adminAlertCount > 0) && (
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                title="⚠️ System Alert - Click to view Admin Console alerts"
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer backdrop-blur-xl shadow-sm animate-pulse"
              >
                <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden sm:inline">Alert</span>
                {adminAlertCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {adminAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* Search in Current Conversation (Symbol Only - No Text) */}
            <button
              type="button"
              onClick={handleToggleSearch}
              title="Search in conversation (Ctrl+F)"
              aria-label="Search"
              className={`flex items-center justify-center rounded-xl border p-2 transition cursor-pointer backdrop-blur-xl shadow-sm ${
                isSearchOpen
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'border-white/50 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-white/85 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-500 dark:hover:text-amber-400'
              }`}
            >
              <Search className="h-4 w-4 text-amber-500" />
            </button>

            {/* Share Chat Button (Symbol Only - No Text) */}
            <button
              type="button"
              onClick={() => {
                if (activeConversation) {
                  handleOpenShareModal(activeConversation);
                } else if (conversations.length > 0) {
                  handleOpenShareModal(conversations[0]);
                } else {
                  handleOpenShareModal({
                    id: `draft_${Date.now()}`,
                    title: 'New SparkMind Chat',
                    messages: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    workspace: activeWorkspace,
                    agent: 'auto',
                  });
                }
              }}
              title="Share Conversation (Ctrl+Shift+S)"
              aria-label="Share"
              className="flex items-center justify-center rounded-xl border border-white/50 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-white/85 dark:hover:bg-white/20 p-2 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer backdrop-blur-xl shadow-sm"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* Language Switcher Badge */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/45 dark:border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition backdrop-blur-xl cursor-pointer shadow-sm"
              >
                <span>🌍</span>
                <span className="uppercase">{currentLanguage}</span>
              </button>
            </div>

            {/* Account Profile / Sign In Button */}
            {currentUser ? (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 rounded-xl border border-white/50 dark:border-white/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl py-1 px-2.5 hover:border-amber-500/60 shadow-md transition"
                title="Account Settings & Unlimited Cloud Sync"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-6 w-6 rounded-full object-cover border border-amber-500/40"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-[11px] font-bold text-white uppercase shadow-sm">
                    {(currentUser.displayName || currentUser.email || 'U')[0]}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-1.5 text-xs font-bold shadow-md shadow-amber-500/20 backdrop-blur-md border border-white/25 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Pinned Context Banner (Keeps Important Context Visible) */}
        {activeConversation && activeConversation.messages.some((m) => m.isPinned) && (
          <div className="z-20 border-b border-amber-500/25 bg-amber-500/[0.07] dark:bg-amber-500/[0.05] backdrop-blur-2xl px-3 sm:px-4 py-2 transition-all shadow-xs">
            <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                  <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                </div>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider shrink-0 hidden sm:inline">
                  Pinned Context:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar flex-1 min-w-0">
                  {activeConversation.messages
                    .filter((m) => m.isPinned)
                    .map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleJumpToMessage(msg.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs max-w-[240px] shrink-0 group text-xs backdrop-blur-md"
                        title={`Click to jump to: ${msg.content}`}
                      >
                        <span className={`text-[10px] font-semibold shrink-0 ${msg.role === 'user' ? 'text-blue-500' : 'text-amber-500'}`}>
                          {msg.role === 'user' ? '👤 Prompt' : '✨ AI'}
                        </span>
                        <span className="truncate text-[11px] font-normal">
                          {msg.content}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinMessage(msg.id);
                          }}
                          className="opacity-50 group-hover:opacity-100 hover:text-rose-500 ml-0.5 p-0.5 rounded transition cursor-pointer"
                          title="Unpin message"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 shrink-0 hidden md:inline">
                {activeConversation.messages.filter((m) => m.isPinned).length} pinned
              </span>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div
          ref={chatScrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
        >
          {/* In-Conversation Search Bar */}
          <ConversationSearchBar
            isOpen={isSearchOpen}
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setCurrentMatchIndex(0);
            }}
            currentMatchIndex={currentMatchIndex}
            totalMatches={matchingMessageIds.length}
            onNextMatch={handleNextSearchMatch}
            onPrevMatch={handlePrevSearchMatch}
          />

          {/* Shared Conversation Banner */}
          {sharedBanner && (
            <div className="mx-4 mt-3 mb-2 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <Share2 className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="truncate">
                  <strong>Viewing Shared Chat:</strong> "{sharedBanner.title}"
                  {sharedBanner.sharedBy ? ` (shared by ${sharedBanner.sharedBy})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleImportSharedChat}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition cursor-pointer"
                >
                  Save & Continue Chat
                </button>
                <button
                  onClick={() => setSharedBanner(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="flex flex-col py-4 w-full">
              {activeConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  locales={locales}
                  onEditSubmit={handleEditSubmit}
                  onRegenerate={handleRegenerate}
                  onSaveAnswer={handleSaveAnswer}
                  onFeedback={handleFeedback}
                  onShareConversation={() => handleOpenShareModal(activeConversation)}
                  onTogglePin={handleTogglePinMessage}
                  searchQuery={isSearchOpen ? searchQuery : undefined}
                  isCurrentSearchMatch={isSearchOpen && matchingMessageIds[currentMatchIndex] === message.id}
                />
              ))}

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="flex w-full max-w-4xl mx-auto gap-3 py-3 px-4 items-start animate-in fade-in">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-white/15 shadow-md backdrop-blur-xl">
                    <SparkLogo className="h-5 w-5 animate-pulse" size={20} />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl rounded-tl-none border border-white/50 dark:border-white/15 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 shadow-xl">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full animate-bounce ${reasoningMode === 'deep' ? 'bg-purple-500' : reasoningMode === 'medium' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                      <span className={`h-2 w-2 rounded-full animate-bounce [animation-delay:0.2s] ${reasoningMode === 'deep' ? 'bg-purple-400' : reasoningMode === 'medium' ? 'bg-indigo-400' : 'bg-orange-500'}`} />
                      <span className={`h-2 w-2 rounded-full animate-bounce [animation-delay:0.4s] ${reasoningMode === 'deep' ? 'bg-fuchsia-400' : reasoningMode === 'medium' ? 'bg-sky-400' : 'bg-rose-500'}`} />
                    </div>
                    <span className="font-semibold tracking-wide">
                      {reasoningMode === 'deep'
                        ? '🧠 SparkMind is running Deep cognitive chain-of-thought...'
                        : reasoningMode === 'medium'
                        ? '⚖️ SparkMind is structuring Medium balanced response...'
                        : '⚡ SparkMind is generating instant Flash response...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeState
              activeWorkspace={activeWorkspace}
              onSelectPrompt={(p) => setInitialPrompt(p)}
              locales={locales}
              onOpenLegal={handleOpenLegal}
              reasoningMode={reasoningMode}
              onModeChange={handleModeChange}
            />
          )}
        </div>

        {/* Bottom Composer */}
        <footer className="w-full">
          <Composer
            key={composerResetKey}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            locales={locales}
            defaultMode={reasoningMode}
            onModeChange={handleModeChange}
            currentLanguage={currentLanguage}
            initialPrompt={initialPrompt}
            onClearInitialPrompt={() => setInitialPrompt('')}
          />
        </footer>
      </main>

      {/* Modals & Tools (Lazy-loaded on demand for 60 FPS mobile speed) */}
      <React.Suspense fallback={null}>
        {isPromptLibraryOpen && (
          <PromptLibrary
            isOpen={isPromptLibraryOpen}
            onClose={() => setIsPromptLibraryOpen(false)}
            onSelectPrompt={(p: string) => setInitialPrompt(p)}
          />
        )}

        {isResumeAssistantOpen && (
          <ResumeAssistant
            isOpen={isResumeAssistantOpen}
            onClose={() => setIsResumeAssistantOpen(false)}
            onSubmitToChat={(p: string) => setInitialPrompt(p)}
          />
        )}

        {isDataAssistantOpen && (
          <DataAssistant
            isOpen={isDataAssistantOpen}
            onClose={() => setIsDataAssistantOpen(false)}
            onSubmitToChat={(p: string) => setInitialPrompt(p)}
          />
        )}

        {isSavedAnswersOpen && (
          <SavedAnswers
            isOpen={isSavedAnswersOpen}
            onClose={() => setIsSavedAnswersOpen(false)}
            savedAnswers={savedAnswers}
            onDeleteSavedAnswer={(id: string) => {
              const updated = savedAnswers.filter((a) => a.id !== id);
              setSavedAnswers(updated);
              saveSavedAnswers(user.id, updated);
            }}
          />
        )}

        {isAdminOpen && (
          <AdminDashboard
            isOpen={isAdminOpen}
            onClose={() => {
              setIsAdminOpen(false);
              checkApiKeysStatus();
            }}
          />
        )}

        {isWorkspaceHubOpen && (
          <WorkspaceHubModal
            isOpen={isWorkspaceHubOpen}
            onClose={() => setIsWorkspaceHubOpen(false)}
            workspace={activeWorkspace}
            onSubmitToChat={(p: string) => setInitialPrompt(p)}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            locales={locales}
            currentLanguage={currentLanguage}
            onSelectLanguage={(lang) => {
              setCurrentLanguage(lang);
              const updated = { ...user, preferredLanguage: lang };
              setUser(updated);
              saveUserProfile(updated);
            }}
            theme={theme}
            onSelectTheme={handleSelectTheme}
            systemIsDark={systemIsDark}
            selectedModel={user.preferredModel || 'gemini-3.8-flash'}
            onSelectModel={(modelId) => {
              const updated = { ...user, preferredModel: modelId };
              setUser(updated);
              saveUserProfile(updated);
            }}
            imageQuality={user.imageQuality || 'high'}
            onSelectImageQuality={(quality) => {
              const updated = { ...user, imageQuality: quality };
              setUser(updated);
              saveUserProfile(updated);
            }}
            onClearHistory={handleClearHistory}
            onOpenAuth={openAuthModal}
            onOpenLegal={handleOpenLegal}
          />
        )}

        {isShareModalOpen && (
          <ShareChatModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            conversation={conversationToShare}
            user={user}
          />
        )}

        {isShortcutsOpen && (
          <ShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
            onExecuteShortcut={handleExecuteShortcut}
          />
        )}

        {isLegalModalOpen && (
          <LegalModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
            initialTab={legalModalTab}
          />
        )}
      </React.Suspense>

      {/* Real-time FPS & Performance Speedometer for Mobile & Tablets */}
      <FpsMonitor showBadge={true} />

      {/* In-app Notice & Alert Modal */}
      {appNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/40 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-3xl text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <SparkLogo className="h-6 w-6" size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  SparkMind Notification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Message</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-5">
              {appNotice}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAppNotice(null)}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal />
    </div>
  );
}
