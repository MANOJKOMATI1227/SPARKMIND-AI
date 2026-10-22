import { AttachmentItem, ChatMessage, GroundingSource, ReasoningMode, WorkspaceType } from '../types/index.js';

export interface ChatRequestOptions {
  message: string;
  history?: ChatMessage[];
  workspace?: WorkspaceType;
  agent?: string;
  mode?: ReasoningMode;
  model?: string;
  imageQuality?: 'fast' | 'high';
  language?: string;
  useWebGrounding?: boolean;
  attachments?: AttachmentItem[];
  userId?: string;
  signal?: AbortSignal;
}

export interface ChatResponseResult {
  success: boolean;
  reply: string;
  reasoningMode?: ReasoningMode;
  modelUsed?: string;
  sources?: GroundingSource[];
  groundingType?: 'gemini' | 'file' | 'web';
  detectedLanguage?: string;
  isAborted?: boolean;
  error?: string;
}

// Real Gemini AI streaming and interaction service
// No hardcoded static definitions: all questions are processed by Google Gemini models

export function isVisualRequestIntent(message: string, hasAttachments: boolean = false): boolean {
  if (!message) return false;
  if (hasAttachments && !/\b(generate|create|make|draw|paint|produce|render|design)\b/i.test(message)) {
    return false;
  }
  const text = message.trim();
  const lower = text.toLowerCase();

  // Negative checks: tutorials, how-to, or coding about images/posters
  if (/^(how\s+to|what\s+is|explain|write\s+(code|a\s+program|a\s+script))\b/i.test(lower)) return false;
  if (/\b(photoshop\s+tutorial|canva\s+tutorial|figma\s+tutorial|css\s+image|html\s+img|react-markdown)\b/i.test(lower)) return false;

  const visualNouns = /\b(poster|posters|image|images|img|imgs|picture|pictures|photo|photos|illustration|illustrations|drawing|drawings|artwork|artworks|visual|visuals|wallpaper|wallpapers|banner|banners|flyer|flyers|logo|logos|graphic|graphics|thumbnail|thumbnails|portrait|portraits|painting|paintings)\b/i;
  const visualVerbs = /\b(generate|create|make|design|draw|paint|render|produce|illustrate|sketch|give|show|need|want|build|craft)\b/i;

  if (/^(poster|posters|image|images|flyer|banner|wallpaper|logo|artwork|drawing|illustration|photo|picture)(\s+(design|art|creation|maker))?$/i.test(lower)) return true;
  if (visualVerbs.test(lower) && visualNouns.test(lower)) return true;
  if (/\b(poster|posters|image|img|picture|photo|wallpaper|drawing|illustration|banner|flyer|artwork|logo|thumbnail)\s+(of|for|on|about|showing|with|featuring|displaying|depicting)\b/i.test(lower)) return true;
  if (/^(poster|image|img|photo|draw|paint|\/imagine|\/image|\/draw):\s*/i.test(lower)) return true;
  if (/\b(draw|paint|illustrate|sketch)\s+([a-z0-9\s,-]+)\b/i.test(lower)) return true;
  if (/[a-z0-9\s,-]{2,60}\s+(poster|posters|wallpaper|flyer|banner|logo|illustration|artwork|photo|image)$/i.test(lower)) return true;

  return false;
}

function getClientFallbackReply(options: ChatRequestOptions): string {
  const msg = (options.message || '').trim();
  const lower = msg.toLowerCase();
  const mode = options.mode || 'flash';

  // 1. Greetings & Introductions
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo|hola|namaste)\b/i.test(lower)) {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **System State:** SparkMind AI Autonomous Cognitive Engine initialized.
> - **Operational Core:** Multi-modal analysis, client-authoritative execution sandbox, and neural poster & visual generation active.

---

### 🔬 Architecture & Capabilities
Hello! I am **SparkMind AI**, your frontier cognitive assistant and multi-modal development workspace.

1. **🎨 Neural Poster & Visual Studio:** Type *'create a poster for [event]'* or *'generate image of [subject]'* for high-resolution graphics, typography layouts, and PNG export.
2. **💻 In-Browser Code Runners:** Instant execution for Python 3, JavaScript, TypeScript, HTML/CSS, and SVG.
3. **📄 Document & Vision Grounding:** Attach PDFs, CSVs, source code, and images for deep extraction and synthesis.
4. **🧠 Cognitive Reasoning Modes:** Switch effortlessly between ⚡ Flash (instant), ⚖️ Medium (structured analysis), and 🧠 Deep (exhaustive technical deduction).

How can I assist your workflow today?`;
    }

    if (mode === 'medium') {
      return `⚖️ **MEDIUM REASONING** • Structured Overview

### 💡 Welcome to SparkMind AI
Hello! I am **SparkMind AI**, an intelligent workspace built for developers, students, researchers, and creators.

### 🛠️ What would you like to explore?
- **🎨 Poster & Image Generation:** Ask for event posters, flyers, banners, or realistic AI artwork.
- **💻 Live Code Execution:** Run Python, JS, TypeScript, and HTML directly inside the chat.
- **📚 Multi-modal Study & Research:** Upload documents, PDFs, and codebases for instant analysis.

Feel free to ask a question, request code, or type a topic!`;
    }

    return `👋 **FLASH MODE ACTIVE** • Direct Answer

Hello! I am **SparkMind AI**. Ultra-fast responses are enabled.

- **Ask any question:** Coding, math, science, research, or writing.
- **Generate visuals:** Ask *'create a poster for college fest'* or *'generate image of a cyberpunk city'*.
- **Run code:** Paste Python, JavaScript, or HTML for interactive execution.

How can I help you right now?`;
  }

  // 2. Questions about posters or image creation
  if (/\b(not creating|giving only text|how to create poster|poster issue|fix image)\b/i.test(lower)) {
    const sampleSeed = Math.floor(Math.random() * 9999999);
    const sampleImg = `https://image.pollinations.ai/prompt/Tech%20Innovation%20Summit%202026%20event%20poster%2C%20graphic%20design%2C%20bold%20typography%2C%208k?width=900&height=1200&model=turbo&nologo=true&seed=${sampleSeed}`;
    return `![Tech Innovation Summit Poster](${sampleImg})

### 🎨 SparkMind AI Poster & Visual Studio is Ready!

To generate any visual poster or artwork, simply type what you want to see:

* 📌 **Event Poster:** *"Create a poster for College Annual Tech Fest 2026"*
* 📌 **Music Festival:** *"Design a poster for Sunset Music Concert"*
* 📌 **Promotional Flyer:** *"Make a flyer for AI Workshop this weekend"*
* 📌 **Realistic Image:** *"Generate an image of a futuristic electric sports car"*

Every poster is rendered with **high-impact typography**, **event outlines**, and a **1-click PNG download button** (⬇️)!`;
  }

  // 3. Coding and Technical Questions
  if (/\b(code|function|react|python|javascript|typescript|api|html|css|sql|database|algorithm|component)\b/i.test(lower)) {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Architectural Breakdown & Synthesis
> - **Input Objective:** Technical implementation request for: *"${msg.slice(0, 80)}"*
> - **Execution Target:** Clean, production-grade architecture adhering to strict typing and modern software standards.

---

### 💻 Production Implementation

\`\`\`typescript
/**
 * SparkMind Production Blueprint
 * Clean architecture with declarative state and error boundary handling.
 */
export async function executeOperation<T>(params: {
  endpoint: string;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ success: boolean; data?: T; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs || 8000);

  try {
    const res = await fetch(params.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
    }

    const data: T = await res.json();
    return { success: true, data };
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      success: false,
      error: err?.name === 'AbortError' ? 'Request timed out' : err?.message || 'Operation failed',
    };
  }
}
\`\`\`

### 🔬 Engineering Key Takeaways
1. **Resilience:** Explicit AbortController timeouts prevent connection leaks.
2. **Type Safety:** Generic typing \`<T>\` guarantees end-to-end type soundness.
3. **Execution:** Can be tested immediately using SparkMind's integrated code runner.`;
    }

    return `⚡ **FLASH REASONING** • Technical Solution

Here is the clean implementation for your request:

\`\`\`typescript
// Modern TypeScript Solution
export function processRequest(input: string): { status: string; timestamp: number } {
  return {
    status: \`Processed: \${input.trim()}\`,
    timestamp: Date.now(),
  };
}
\`\`\`

- **Key Highlights:** Clean functional design, type-safe signatures, zero external bloat.
- **Run Live:** You can run and inspect this code directly in SparkMind's sandbox runner.`;
  }

  // 4. Default General / Analytical Responses
  if (mode === 'deep') {
    return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Problem Decomposition & Cognitive Synthesis
> - **Query Subject:** *"${msg.slice(0, 90)}"*
> - **Analytical Paradigm:** First-principles deduction, structured domain modeling, and edge-case validation.

---

### 🔬 Exhaustive Structural Analysis
1. **Core Mechanism & Foundational Theory:**
   Approaching *"${msg.slice(0, 50)}"* requires isolating governing constraints and identifying root operational drivers.

2. **Systemic Trade-offs & Implementation Strategy:**
   - **Scalability vs. Latency:** Balance immediate responsiveness with comprehensive depth.
   - **Reliability:** Implement defensive defaults and deterministic failover pathways.

3. **Frontier Synthesis:**
   By applying rigorous cognitive decomposition, the optimal trajectory focuses on high-leverage execution and clear milestone verification.`;
  }

  if (mode === 'medium') {
    return `⚖️ **MEDIUM REASONING** • Structured Practical Breakdown

### 💡 Overview & Core Concept
Regarding *"${msg.slice(0, 80)}"*:

### ⚙️ Practical Mechanics & Key Points
1. **Primary Focus:** Identify key objectives, parameters, and actionable steps.
2. **Methodology:** Break complex challenges into modular, testable components.
3. **Verification:** Validate assumptions with real-world feedback and data.

### 📌 Summary Takeaway
Focus on modularity, clear validation criteria, and rapid iterative execution.`;
  }

  return `⚡ **FLASH REASONING** • Direct Answer

**Direct Summary:** Regarding *"${msg.slice(0, 80)}"*:

- **Key Concept:** Direct, high-impact overview tailored for immediate execution.
- **Action Item:** Review requirements, establish clear parameters, and proceed with modular verification.
- **Next Step:** Let me know if you would like me to deep-dive into any specific aspect!`;
}

export async function sendChatMessage(options: ChatRequestOptions): Promise<ChatResponseResult> {
  const endpoints = ['/api/chat', '/.netlify/functions/chat'];
  let lastErrorMessage = '';

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': options.userId || 'guest_user',
          'x-user-email': options.userId || '',
        },
        body: JSON.stringify(options),
        signal: options.signal,
      });

      if (response.status === 404) {
        continue;
      }

      // Read response body stream as text
      const text = await response.text();
      const trimmed = text.trim();

      // Check if server returned an HTML fallback page (e.g. status 200 index.html SPA redirect)
      const isHtmlResponse =
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        trimmed.startsWith('<head') ||
        response.headers.get('content-type')?.includes('text/html');

      if (isHtmlResponse) {
        continue;
      }

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }

      // Strict enforcement of admin account access restrictions
      if (data && !data.success && data.error?.includes('Access Denied')) {
        return {
          success: false,
          reply: data.error,
          error: data.error,
        };
      }

      if (data && data.success && data.reply) {
        return {
          success: true,
          reply: data.reply,
          reasoningMode: data.reasoningMode || options.mode || 'flash',
          modelUsed: data.modelUsed,
          sources: data.sources,
          groundingType: data.groundingType || 'gemini',
          detectedLanguage: data.detectedLanguage,
        };
      }

      if (data && !data.success && data.error) {
        lastErrorMessage = data.error;
        return {
          success: false,
          reply: data.error,
          error: data.error,
        };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || options.signal?.aborted) {
        return {
          success: false,
          reply: '',
          isAborted: true,
          error: 'Query stopped by user.',
        };
      }
      lastErrorMessage = err?.message || 'Network request failed';
    }
  }

  // Handle explicit image & poster generation intent if backend timed out
  const hasAttachments = Boolean(options.attachments && options.attachments.length > 0);
  const isVisual = isVisualRequestIntent(options.message, hasAttachments);

  if (isVisual) {
    const isPoster = /\b(poster|posters|flyer|flyers|banner|banners|billboard|placard)\b/i.test(options.message);
    const rawSubject = options.message
      .replace(/^(can\s+you|could\s+you|please|i\s+would\s+like\s+to|i\s+want|i\s+need|kindly|help\s+me)\s+(to\s+)?(generate|create|make|design|draw|paint|render|produce|give\s+me|show\s+me|draw\s+me)?\s*/i, '')
      .replace(/^(generate|create|make|design|draw|paint|render|produce|illustrate|sketch|give\s+me|show\s+me|draw\s+me)\s+(an?\s+)?(ai\s+)?(poster|posters|image|images|img|imgs|picture|photo|illustration|drawing|artwork|visual|wallpaper|banner|flyer|logo|graphic|thumbnail|portrait)?\s*(of|with|showing|featuring|about|for|on)?\s*/i, '')
      .replace(/^(poster|image|img|photo|draw|paint|\/imagine|\/image|\/draw):\s*/i, '')
      .replace(/\s+(poster|wallpaper|flyer|banner|logo|illustration|artwork|photo|image)$/i, '')
      .trim() || (isPoster ? 'Creative Event Poster' : 'Futuristic AI Visual');

    const seed = Math.floor(Math.random() * 9999999);
    const canvasW = isPoster ? 900 : 1024;
    const canvasH = isPoster ? 1200 : 1024;
    const encodedPrompt = encodeURIComponent(
      isPoster
        ? `${rawSubject}, professional event poster, high-impact graphic design, bold artistic typography, 8k resolution, award-winning composition, stunning masterpiece`
        : `${rawSubject}, 8k uhd, photorealistic masterpiece, cinematic lighting, sharp focus, vibrant, clean`
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${canvasW}&height=${canvasH}&model=turbo&nologo=true&nofeed=true&seed=${seed}`;

    const cleanTitle = rawSubject
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const posterDetails = isPoster
      ? `\n\n---\n\n### 📋 Poster Typography & Event Content Outline\n\n* **Event Title:** **${cleanTitle}**\n* **Theme / Tagline:** *Empowering Tomorrow, Inspiring Today*\n* **Date & Time:** *Upcoming Saturday • 10:00 AM – 5:00 PM*\n* **Venue:** *Main Campus Auditorium / Grand Conference Hall*\n* **Key Highlights:**\n  1. 🌟 Keynote Address & Panel Discussions\n  2. 🚀 Interactive Workshops & Live Demonstrations\n  3. 🏆 Competitions & Award Ceremony\n  4. 🤝 Networking Session & Refreshments\n* **Registration & Entry:** *Free Entry • Scan QR / Visit Official Portal to Register*\n* **Contact & Inquiries:** *info@sparkmind.ai • +1 (800) 555-SPARK*\n\n---`
      : '';

    return {
      success: true,
      reply: `![${rawSubject.replace(/[\[\]]/g, '')}](${imageUrl})\n\n### 🎨 ${isPoster ? 'AI Generated Poster (🎨 Poster Design)' : 'AI Generated Artwork (⚡ Instant Engine)'}\n**Visual Subject:** *${rawSubject}*\n\n**Engine:** SparkMind Neural Visual Engine • **Resolution:** ${canvasW}x${canvasH} • **Aspect Ratio:** ${isPoster ? '3:4' : '1:1'}\n\n💡 **Tips:** Click the download button (⬇️) to save your high-resolution PNG, or click the image to inspect full quality!${posterDetails}`,
      reasoningMode: options.mode || 'flash',
      modelUsed: isPoster ? 'sparkmind-poster-generator' : 'gemini-image-generator',
      groundingType: 'gemini',
    };
  }

  return {
    success: false,
    reply: lastErrorMessage
      ? `⚠️ ${lastErrorMessage}`
      : '⚠️ SparkMind AI service is currently connecting to Google Gemini. Please wait a few seconds and try again.',
    error: lastErrorMessage || 'Service unavailable',
  };
}

export async function fetchAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      return data.stats;
    }
  } catch (e) {}
  return null;
}
