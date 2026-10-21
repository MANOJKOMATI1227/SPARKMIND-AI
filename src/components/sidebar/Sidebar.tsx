import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Sparkles,
  BookOpen,
  FileCheck,
  BarChart3,
  Bookmark,
  Activity,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
  X,
  GraduationCap,
  Code2,
  Rocket,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  PanelLeftOpen,
  PanelLeft,
  Maximize2,
  Minimize2,
  Zap,
  Share2,
  Keyboard,
  FileText,
  Scale,
} from 'lucide-react';
import { Conversation, UserProfile, WorkspaceType } from '../../types/index.js';
import { LocaleStrings } from '../../locales/en.js';
import { useAuth } from '../../context/AuthContext.js';
import { SparkLogo } from '../common/SparkLogo.js';
import { ThemeFacility } from '../common/ThemeFacility.js';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: (workspace?: WorkspaceType) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  activeWorkspace: WorkspaceType;
  onSelectWorkspace: (workspace: WorkspaceType) => void;
  isTemporaryChat: boolean;
  onToggleTemporaryChat: () => void;
  onOpenTool: (tool: 'prompts' | 'resume' | 'data' | 'saved' | 'admin') => void;
  onOpenSettings: () => void;
  user: UserProfile;
  locales: LocaleStrings;
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
  systemIsDark?: boolean;
  onSelectTheme?: (theme: 'light' | 'dark' | 'system') => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onShareConversation?: (conversation: Conversation) => void;
  onOpenShortcuts?: () => void;
  onOpenLegal?: (tab: 'terms' | 'license') => void;
  onTogglePinMessage?: (messageId: string) => void;
  onJumpToMessage?: (messageId: string, conversationId?: string) => void;
  adminAlertCount?: number;
  isFailoverActive?: boolean;
  isAdminLoggedIn?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  activeWorkspace,
  onSelectWorkspace,
  isTemporaryChat,
  onToggleTemporaryChat,
  onOpenTool,
  onOpenSettings,
  user,
  locales,
  theme,
  onToggleTheme,
  systemIsDark = true,
  onSelectTheme,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onShareConversation,
  onOpenShortcuts,
  onOpenLegal,
  onTogglePinMessage,
  onJumpToMessage,
  adminAlertCount = 0,
  isFailoverActive = false,
  isAdminLoggedIn = false,
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [pinnedFilter, setPinnedFilter] = useState<'current' | 'all'>('current');
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);

  const workspaces: { id: WorkspaceType; label: string; icon: any }[] = [
    { id: 'general', label: locales.workspaces.general, icon: Layers },
    { id: 'student', label: locales.workspaces.student, icon: GraduationCap },
    { id: 'developer', label: locales.workspaces.developer, icon: Code2 },
    { id: 'founder', label: locales.workspaces.founder, icon: Rocket },
    { id: 'business', label: locales.workspaces.business, icon: Briefcase },
  ];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  // Pinned Messages computation (current conversation vs all conversations)
  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const currentPinnedMessages = (currentConversation?.messages || [])
    .filter((m) => m.isPinned)
    .map((m) => ({
      ...m,
      conversationId: currentConversation?.id,
      conversationTitle: currentConversation?.title || 'Current Chat',
    }));

  const allPinnedMessages = conversations.flatMap((c) =>
    (c.messages || [])
      .filter((m) => m.isPinned)
      .map((m) => ({
        ...m,
        conversationId: c.id,
        conversationTitle: c.title || 'Untitled Chat',
      }))
  );

  const displayedPinnedMessages =
    pinnedFilter === 'current'
      ? currentPinnedMessages
      : allPinnedMessages;

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Drawer / Column */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-full max-h-screen flex flex-col border-r border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-950/50 backdrop-blur-3xl backdrop-saturate-200 shadow-[8px_0_40px_rgba(0,0,0,0.08)] dark:shadow-[8px_0_45px_rgba(0,0,0,0.65)] transition-all duration-300 min-h-0 ${
          isCollapsed
            ? 'w-0 -translate-x-full md:w-0 md:-translate-x-full overflow-hidden border-r-0 pointer-events-none'
            : 'w-72 md:static md:translate-x-0'
        } ${
          isOpen
            ? 'translate-x-0 !w-72 shadow-2xl pointer-events-auto'
            : isCollapsed
            ? ''
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header (Fixed Top) */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/25 backdrop-blur-2xl">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white/50 dark:border-white/15 shadow-sm backdrop-blur-xl">
              <SparkLogo className="h-6 w-6" size={24} />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                SparkMind
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium tracking-wide">
                Chat. Code. Learn. Create.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              title="Close sidebar"
              className="flex md:hidden rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Unified Scrollable Container for all sidebar content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 divide-y divide-white/20 dark:divide-white/5 scrollbar-thin scrollbar-thumb-white/20 dark:scrollbar-thumb-white/10">
          {/* New Chat & Quick Actions */}
          <div className="p-3 space-y-2">
            <button
              type="button"
              data-testid="new-chat-sidebar-btn"
              onClick={() => {
                onNewChat(activeWorkspace);
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  onClose();
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-600/90 hover:from-amber-500 hover:to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/25 border border-white/40 backdrop-blur-xl active:scale-[0.98] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{locales.newChat}</span>
            </button>

            {/* Keyboard Shortcuts Button in Sidebar */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={() => {
                  onOpenShortcuts();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-white/5 hover:bg-white/65 dark:hover:bg-white/15 hover:text-amber-600 dark:hover:text-amber-400 border border-white/30 dark:border-white/10 backdrop-blur-xl transition cursor-pointer shadow-sm"
                title="Keyboard Shortcuts (Ctrl+/)"
              >
                <span className="flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5 text-amber-500" />
                  <span>Shortcuts</span>
                </span>
                <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                  Ctrl+/
                </span>
              </button>
            )}

            {/* Incognito / Temporary Chat Toggle */}
            <button
              onClick={onToggleTemporaryChat}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium backdrop-blur-md transition ${
                isTemporaryChat
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 bg-white/25 dark:bg-white/[0.03] hover:bg-white/50 dark:hover:bg-white/10 border border-white/20 dark:border-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{locales.temporaryChat}</span>
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isTemporaryChat ? 'bg-purple-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </button>
          </div>

          {/* Workspace Switcher Pills */}
          <div className="p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Workspaces
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-1">
              {workspaces.map((ws) => {
                const Icon = ws.icon;
                const isActive = activeWorkspace === ws.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      onClose();
                    }}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="truncate">{ws.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        {/* Search Conversations Input */}
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locales.searchChats}
              className="w-full rounded-xl border border-white/40 dark:border-white/15 bg-white/55 dark:bg-white/10 py-1.5 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 backdrop-blur-2xl shadow-inner transition"
            />
          </div>
        </div>

        {/* Pinned Messages Section in Sidebar */}
        <div className="p-3 pb-2 border-b border-white/20 dark:border-white/5 bg-amber-500/[0.03]">
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={() => setIsPinnedExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider hover:opacity-85 transition cursor-pointer"
            >
              <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>Pinned Messages</span>
              <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                {pinnedFilter === 'current' ? currentPinnedMessages.length : allPinnedMessages.length}
              </span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isPinnedExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Toggle if other chats also have pinned messages */}
            {allPinnedMessages.length > currentPinnedMessages.length && (
              <div className="flex items-center rounded-lg bg-black/5 dark:bg-white/5 p-0.5 text-[10px] font-medium">
                <button
                  type="button"
                  onClick={() => setPinnedFilter('current')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    pinnedFilter === 'current'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  This Chat
                </button>
                <button
                  type="button"
                  onClick={() => setPinnedFilter('all')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    pinnedFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({allPinnedMessages.length})
                </button>
              </div>
            )}
          </div>

          {isPinnedExpanded && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
              {displayedPinnedMessages.length > 0 ? (
                displayedPinnedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      if (onJumpToMessage) {
                        onJumpToMessage(msg.id, msg.conversationId);
                      }
                      onClose();
                    }}
                    className="group relative flex flex-col gap-1 rounded-xl p-2.5 text-xs transition cursor-pointer border border-white/45 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/80 backdrop-blur-md shadow-xs hover:border-amber-500/50 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                            msg.role === 'user'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {msg.role === 'user' ? 'Prompt' : 'Response'}
                        </span>
                        {pinnedFilter === 'all' && msg.conversationTitle && (
                          <span
                            className="text-[10px] text-slate-400 truncate max-w-[90px]"
                            title={msg.conversationTitle}
                          >
                            {msg.conversationTitle}
                          </span>
                        )}
                      </div>
                      {onTogglePinMessage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinMessage(msg.id);
                          }}
                          title="Unpin message"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition rounded cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="line-clamp-2 text-slate-700 dark:text-slate-300 font-normal leading-snug">
                      {msg.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-2.5 px-2 text-center rounded-xl border border-dashed border-white/25 dark:border-white/10 bg-white/30 dark:bg-white/[0.02]">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    No pinned messages yet
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Click the <Pin className="inline h-2.5 w-2.5 mx-0.5 text-amber-500 fill-amber-500" /> icon on any message to keep important context visible.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="p-3 space-y-2">
          {/* Recent History Section Header */}
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
              <span>Recent History</span>
              {filteredConversations.length > 0 && (
                <span className="rounded-full bg-white/20 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                  {filteredConversations.length}
                </span>
              )}
            </div>
          </div>

          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <Pin className="h-3 w-3" /> Pinned
              </div>
              {pinnedConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversationId === conv.id}
                  isEditing={editingId === conv.id}
                  editTitle={editTitle}
                  onSetEditTitle={setEditTitle}
                  onSaveRename={handleSaveRename}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onClose();
                  }}
                  onStartRename={startRename}
                  onTogglePin={onTogglePin}
                  onDelete={onDeleteConversation}
                  onShare={onShareConversation}
                />
              ))}
            </div>
          )}

          {/* Regular History Section */}
          {regularConversations.length > 0 ? (
            <div className="space-y-1">
              {regularConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversationId === conv.id}
                  isEditing={editingId === conv.id}
                  editTitle={editTitle}
                  onSetEditTitle={setEditTitle}
                  onSaveRename={handleSaveRename}
                  onSelect={(id) => {
                    onSelectConversation(id);
                    onClose();
                  }}
                  onStartRename={startRename}
                  onTogglePin={onTogglePin}
                  onDelete={onDeleteConversation}
                  onShare={onShareConversation}
                />
              ))}
            </div>
          ) : (
            pinnedConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-white/20 dark:border-white/10 my-2 bg-white/5 dark:bg-white/[0.02] backdrop-blur-md">
                <MessageSquare className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No recent chats yet</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 mb-2">Send a prompt in the composer to start!</p>
                <button
                  type="button"
                  onClick={() => {
                    onNewChat(activeWorkspace);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer backdrop-blur-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>Start a Chat</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Specialized Tools Navigation */}
        <div className="p-3 border-t border-white/15 dark:border-white/10 space-y-1 bg-white/5 dark:bg-black/5">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace Tools
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenTool('prompts');
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            <span className="truncate">{locales.tools.promptLibrary}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenTool('resume');
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
          >
            <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="truncate">{locales.tools.resumeAssistant}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenTool('data');
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            <span className="truncate">{locales.tools.dataAssistant}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenTool('saved');
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
          >
            <Bookmark className="h-3.5 w-3.5 text-purple-500" />
            <span className="truncate">{locales.tools.savedAnswers}</span>
          </button>
          {/* Admin Dashboard - only visible to logged-in admin users */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => {
                onOpenTool('admin');
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer backdrop-blur-sm ${
                isFailoverActive || adminAlertCount > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Activity className={`h-3.5 w-3.5 ${isFailoverActive || adminAlertCount > 0 ? 'text-rose-500 animate-pulse' : 'text-rose-500'}`} />
                <span className="truncate">{locales.tools.adminDashboard}</span>
              </div>
              {(isFailoverActive || adminAlertCount > 0) && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse shadow-sm">
                  {adminAlertCount > 0 ? `${adminAlertCount} Alert` : 'Alert'}
                </span>
              )}
            </button>
          )}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={() => {
                onOpenShortcuts();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5 text-amber-500" />
                <span className="truncate">Keyboard Shortcuts</span>
              </div>
              <span className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                Ctrl+/
              </span>
            </button>
          )}
          {onOpenLegal && (
            <button
              type="button"
              onClick={() => {
                onOpenLegal('terms');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white/15 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span className="truncate">Terms & MIT License</span>
              </div>
              <span className="rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold border border-emerald-500/30">
                MIT
              </span>
            </button>
          )}

          {/* Theme Selector Facility */}
          {onSelectTheme && (
            <div className="pt-1.5">
              <ThemeFacility
                theme={theme || 'system'}
                onSelectTheme={onSelectTheme}
                systemIsDark={systemIsDark}
                variant="sidebar"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer User Profile & Settings with Liquid Glassmorphism */}
        <div className="p-3 border-t border-white/15 dark:border-white/10 flex items-center justify-between bg-white/10 dark:bg-black/15 backdrop-blur-md">
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 overflow-hidden text-left hover:bg-white/10 dark:hover:bg-white/5 p-1 rounded-xl transition group mr-1 max-w-[190px]"
            title="Account & Unlimited Cloud Sync"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="h-7 w-7 rounded-lg object-cover border border-amber-500/40 flex-shrink-0"
              />
            ) : (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-xs font-bold text-white uppercase shadow-sm">
                {(currentUser?.displayName || currentUser?.email || user.name || 'U')[0]}
              </div>
            )}
            <div className="overflow-hidden text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-500 transition">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                {currentUser ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Active Sync</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (Ctrl+/)"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/15 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer backdrop-blur-sm"
              >
                <Keyboard className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onOpenSettings}
              title={locales.settings.title}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white/15 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSetEditTitle: (val: string) => void;
  onSaveRename: (id: string, e: React.FormEvent) => void;
  onSelect: (id: string) => void;
  onStartRename: (conv: Conversation, e: React.MouseEvent) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (conversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onSetEditTitle,
  onSaveRename,
  onSelect,
  onStartRename,
  onTogglePin,
  onDelete,
  onShare,
}) => {
  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition cursor-pointer backdrop-blur-xl ${
        isActive
          ? 'bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-purple-500/20 border border-amber-500/50 text-amber-900 dark:text-amber-200 font-semibold shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
          : 'text-slate-700 dark:text-slate-300 bg-white/45 dark:bg-white/[0.06] hover:bg-white/75 dark:hover:bg-white/15 border border-white/30 dark:border-white/10 hover:border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
      }`}
    >
      {isEditing ? (
        <form onSubmit={(e) => onSaveRename(conversation.id, e)} className="flex-1 mr-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onSetEditTitle(e.target.value)}
            onBlur={(e) => onSaveRename(conversation.id, e)}
            autoFocus
            className="w-full rounded bg-white/80 dark:bg-black/60 px-1.5 py-0.5 text-xs text-slate-900 dark:text-slate-100 border border-amber-500 focus:outline-none backdrop-blur-md"
          />
        </form>
      ) : (
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-amber-500/80 dark:text-amber-400" />
          <span className="truncate">{conversation.title}</span>
        </div>
      )}

      {/* Action buttons (Pin, Edit, Delete) on hover */}
      {!isEditing && (
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(conversation.id);
            }}
            title={conversation.isPinned ? 'Unpin' : 'Pin to top'}
            className={`p-1 rounded hover:bg-white/20 dark:hover:bg-white/10 ${
              conversation.isPinned ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => onStartRename(conversation, e)}
            title="Rename"
            className="p-1 rounded text-slate-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(conversation);
              }}
              title="Share Conversation"
              className="p-1 rounded text-slate-400 hover:bg-amber-500/20 hover:text-amber-500"
            >
              <Share2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            title="Delete"
            className="p-1 rounded text-slate-400 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
