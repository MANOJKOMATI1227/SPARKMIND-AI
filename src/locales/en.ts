export interface LocaleStrings {
  appName: string;
  tagline: string;
  newChat: string;
  searchChats: string;
  noChatsYet: string;
  clearAllChats: string;
  temporaryChat: string;
  temporaryChatActive: string;
  workspaces: {
    general: string;
    student: string;
    developer: string;
    founder: string;
    business: string;
  };
  composer: {
    placeholder: string;
    attachFile: string;
    webSearch: string;
    webSearchActive: string;
    voiceInput: string;
    recording: string;
    stopRecording: string;
    send: string;
    tokensRemaining: string;
  };
  actions: {
    copy: string;
    copied: string;
    edit: string;
    share: string;
    save: string;
    saved: string;
    regenerate: string;
    readAloud: string;
    stopSpeaking: string;
    like: string;
    dislike: string;
    cancel: string;
    saveAndSubmit: string;
  };
  tools: {
    promptLibrary: string;
    resumeAssistant: string;
    dataAssistant: string;
    savedAnswers: string;
    adminDashboard: string;
    studentTools: string;
    developerTools: string;
    founderTools: string;
    businessTools: string;
  };
  settings: {
    title: string;
    language: string;
    appearance: string;
    light: string;
    dark: string;
    system: string;
    model: string;
    imageQuality?: string;
    imageQualityFast?: string;
    imageQualityHigh?: string;
    clearHistory: string;
    account: string;
    save: string;
  };
  auth: {
    login: string;
    signup: string;
    logout: string;
    continueWithGoogle: string;
    continueWithGitHub: string;
    continueAsGuest: string;
    email: string;
    password: string;
    name: string;
    forgotPassword: string;
    noAccount: string;
    haveAccount: string;
  };
}

export const enLocale: LocaleStrings = {
  appName: 'SparkMind',
  tagline: 'Chat. Code. Learn. Create.',
  newChat: 'New Chat',
  searchChats: 'Search conversations...',
  noChatsYet: 'No conversations yet',
  clearAllChats: 'Clear Conversations',
  temporaryChat: 'Temporary Chat',
  temporaryChatActive: 'Temporary Mode: Messages will not be saved',
  workspaces: {
    general: 'General',
    student: 'Student',
    developer: 'Developer',
    founder: 'Founder',
    business: 'Business',
  },
  composer: {
    placeholder: 'Ask SparkMind anything (English, Telugu, Hindi, code, questions)...',
    attachFile: 'Attach document, image, code, or data',
    webSearch: 'Web Grounding',
    webSearchActive: 'Live Web Grounding Active',
    voiceInput: 'Voice Input (Hold or click to speak)',
    recording: 'Listening... Speak in any language',
    stopRecording: 'Stop recording',
    send: 'Send message',
    tokensRemaining: 'Gemini 2.5 Flash',
  },
  actions: {
    copy: 'Copy',
    copied: 'Copied!',
    edit: 'Edit',
    share: 'Share',
    save: 'Save Answer',
    saved: 'Saved to library',
    regenerate: 'Regenerate response',
    readAloud: 'Read aloud',
    stopSpeaking: 'Stop audio',
    like: 'Helpful',
    dislike: 'Not helpful',
    cancel: 'Cancel',
    saveAndSubmit: 'Save & Submit',
  },
  tools: {
    promptLibrary: 'Prompt Library',
    resumeAssistant: 'Resume ATS Assistant',
    dataAssistant: 'Data Analyzer',
    savedAnswers: 'Saved Answers',
    adminDashboard: 'Admin & Analytics',
    studentTools: 'Student Study Center',
    developerTools: 'Developer Studio',
    founderTools: 'Founder Launchpad',
    businessTools: 'Business Strategy Suite',
  },
  settings: {
    title: 'SparkMind Settings',
    language: 'Conversation Language',
    appearance: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System default',
    model: 'Gemini Model',
    imageQuality: 'Image Generation Quality',
    imageQualityFast: 'Fast / Draft',
    imageQualityHigh: 'High-Fidelity (2K)',
    clearHistory: 'Delete all local chat history',
    account: 'Account Profile',
    save: 'Done',
  },
  auth: {
    login: 'Log In',
    signup: 'Create Account',
    logout: 'Log Out',
    continueWithGoogle: 'Continue with Google',
    continueWithGitHub: 'Continue with GitHub',
    continueAsGuest: 'Continue as Guest',
    email: 'Email address',
    password: 'Password',
    name: 'Full Name',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Log in',
  },
};
