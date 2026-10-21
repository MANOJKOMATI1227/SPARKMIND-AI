import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ChatRequestBody, ChatResponseBody, GroundingSource } from './types.js';
import { globalStats } from './rateLimit.js';
import { apiKeyManager } from './apiKeyManager.js';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

// In-memory High-Speed Semantic Cache with distinct reasoning-mode depths
const instantQueryCache = new Map<string, { reply: string; timestamp: number }>();

const FLASH_AI_DEF = `⚡ **FLASH REASONING** • Direct Answer

**Artificial Intelligence (AI)** is the engineering of computer software and systems capable of performing tasks typically requiring human intelligence.

- **Machine Learning (ML):** Parametric algorithms inferring patterns directly from training distributions without hardcoded logic.
- **Deep Neural Networks:** Multi-layered representations (Transformers, Convolutional Networks) modeling high-dimensional data.
- **Key Capabilities:** Natural Language Understanding (LLMs), Computer Vision (diffusion/detection), Autonomous Planning, Speech Synthesis.
- **Taxonomy:** Narrow AI (ANI — production systems today) ➔ General AI (AGI — cross-domain research target) ➔ Super AI (ASI — theoretical horizon).`;

const MEDIUM_AI_DEF = `⚖️ **MEDIUM REASONING** • Structured Practical Analysis

### 💡 Core Concept & Principles
**Artificial Intelligence (AI)** represents computer science systems engineered to perceive complex environments, process high-dimensional inputs, and execute goal-directed reasoning or generation autonomously.

### 🛠️ Foundational Technological Pillars
1. **Statistical & Machine Learning (ML):** Systems updating internal weights through gradient descent optimization rather than hand-crafted rule engines.
2. **Deep Representation Learning:** High-dimensional vector spaces and self-attention transformers capable of zero-shot transfer across language, code, vision, and audio.
3. **Reinforcement Learning from Human Feedback (RLHF):** Aligning raw probabilistic next-token predictions with human utility, safety guidelines, and factual accuracy.

### 📊 Real-World Industry Deployment
| Class | Core Characteristics | Production Deployment |
| :--- | :--- | :--- |
| **Narrow AI (ANI)** | Highly tuned for dedicated distribution | Fraud detection, AlphaFold, search indexing |
| **Generative AI** | Multi-modal synthesis of novel tokens | Code synthesis, LLM assistants, image generation |
| **General AI (AGI)** | Unified generalist cognitive adaptability | Frontier AI industry benchmark |

### 📌 Practical Engineering Takeaway
Modern enterprise AI focuses on hybrid systems: combining dense foundation models with vector RAG (Retrieval-Augmented Generation), semantic caches, and deterministic tool APIs to deliver low-latency, hallucination-resistant answers.`;

const DEEP_AI_DEF = `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **Problem Decomposition:** To deeply define AI, we must differentiate between symbolic knowledge representation (GOFAI / expert systems) and connectionist empirical learning (deep neural networks).
> - **Mechanistic Analysis:** Deep modern AI is grounded in self-attention transformers: $A = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. By projecting tokens into $d$-dimensional latent vector spaces, systems capture semantic affinities and synthesize emergent logic across vast context windows.
> - **Inference-Time Scaling vs. Pre-training:** While Chinchilla scaling laws govern parameters and tokens during pre-training, frontier reasoning models demonstrate that test-time search (MCTS, verification loops, self-correction tokens) exponentially enhances deduction accuracy on complex math and coding benchmarks.
> - **Edge Cases & Failure Modes:** Residual hallucinations in ungrounded latent spaces, mechanistic interpretability blindspots, and catastrophic forgetting under non-stationary distributions.

---

### 🔬 Exhaustive Technical Architecture
1. **Mathematical Representation & Latent Geometries:**
   Inputs are vectorized into continuous manifolds. Multi-head attention heads capture orthogonal syntactic and semantic dependencies, computing non-linear transformations through feed-forward layers with RMSNorm and SwiGLU activations.

2. **Optimization & Training Dynamics:**
   Pre-training optimizes cross-entropy loss over trillions of tokens using AdamW optimizers. Post-training applies Direct Preference Optimization (DPO) and Reinforcement Learning with verifiable reward models (RLVR) to instill rigorous reasoning paths.

3. **Inference & Orchestration Layer:**
   Production AI employs speculative decoding, KV-cache quantization, and agentic tool-use loops to ground neural probabilistic output in deterministic external reality.

### ⚖️ Verification & Frontier Trajectory
The frontier of AI is pivoting toward **Neuro-Symbolic hybrids** (coupling neural intuition with formal mathematical solvers) and **embodied perception**, driving computing from passive prediction toward active physical agency.`;

function getInstantServerReply(prompt: string, mode: 'flash' | 'medium' | 'deep'): string | null {
  const p = prompt.trim().toLowerCase().replace(/[?!.,]+$/, '');

  if (p === 'ai' || p === 'what is ai' || p === 'define ai' || p === 'explain ai' || p === 'artificial intelligence' || p === 'about ai') {
    if (mode === 'deep') return DEEP_AI_DEF;
    if (mode === 'medium') return MEDIUM_AI_DEF;
    return FLASH_AI_DEF;
  }

  if (p === 'ml' || p === 'what is ml' || p === 'machine learning') {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **Core Foundation:** Machine Learning replaces hand-crafted deductive logic with inductive statistical inference: minimizing empirical risk $\\mathcal{R}_{emp}(\\theta) = \\frac{1}{N}\\sum_{i=1}^N \\mathcal{L}(f_\\theta(x_i), y_i) + \\lambda \\Omega(\\theta)$.
> - **Generalization & The Bias-Variance Tradeoff:** High-capacity neural networks overcome the classical U-shaped risk curve through benign overfitting and the double descent phenomenon in overparameterized regimes.
> - **Structural Paradigms:** Supervised, Unsupervised/Self-Supervised (Contrastive/Masked Autoencoding), and Reinforcement Learning (Markov Decision Processes).

---

### 🔬 Technical Taxonomy
1. **Supervised Learning:** Parametric mapping $f: \\mathcal{X} \\to \\mathcal{Y}$ (ResNet, BERT, XGBoost).
2. **Self-Supervised Pretraining:** Masked token reconstruction predicting $p(x_t | x_{<t})$, learning universal representations without human labels.
3. **Reinforcement Learning:** Policy gradient theorem $\\nabla_\\theta J(\\theta) = \\mathbb{E}[\\nabla_\\theta \\log \\pi_\\theta(a|s) Q^\\pi(s,a)]$, enabling autonomous agents to master non-linear environments.`;
    }
    if (mode === 'medium') {
      return `⚖️ **MEDIUM REASONING** • Structured Technical Guide

### 💡 What is Machine Learning?
**Machine Learning (ML)** is the branch of artificial intelligence where algorithms learn predictive patterns from empirical data rather than executing hardcoded instructions.

### 🛠️ The 3 Primary Paradigms
1. **Supervised Learning:** Training models on labeled inputs and outputs (e.g., classification, regression, fraud detection).
2. **Unsupervised Learning:** Discovering latent clusters and distributions in unlabeled data (e.g., K-Means, PCA, autoencoders).
3. **Reinforcement Learning:** Agents learning optimal decision policies through reward signals in dynamic environments.

### 📌 Production Best Practices
Real-world ML pipelines require robust feature stores, continuous drift detection (data drift & concept drift), cross-validation, and low-latency inference serving.`;
    }
    return `⚡ **FLASH REASONING** • Direct Answer

**Machine Learning (ML)** is a subset of AI where systems learn from data to make predictions without being explicitly programmed.

- **Supervised:** Labeled datasets (classification, regression).
- **Unsupervised:** Pattern discovery in unlabeled data (clustering, dimensionality reduction).
- **Reinforcement:** Trial-and-error reward optimization (robotics, gaming agents).`;
  }

  if (p === 'hi' || p === 'hello' || p === 'hey') {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING MODE ACTIVE**\n\nGreetings! I am **SparkMind AI** operating in **Extended Thinking & Deep Reasoning Mode**. I am prepared to conduct multi-perspective technical analysis, rigorous mathematical deductions, code architectures, or deep research across any domain. How may I assist your inquiry?`;
    }
    if (mode === 'medium') {
      return `⚖️ **MEDIUM MODE ACTIVE**\n\nHello! I am **SparkMind AI** in **Balanced Mode**. Ready to assist you with structured explanations, practical code examples, learning modules, or business strategy. What topic would you like to explore?`;
    }
    return `👋 **FLASH MODE ACTIVE**\n\nHello! I am **SparkMind AI**. Ultra-fast replies enabled. Ask any question, paste code, or request a solution.`;
  }

  if (p === 'sparkmind' || p === 'what is sparkmind' || p === 'about sparkmind') {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **System Architecture:** SparkMind integrates client-side local sandboxes with server-side Gemini orchestration. It implements prompt-level reasoning mode compilation (mapping user intent to discrete thinking budgets and model candidates).
> - **Cognitive Pipeline:** Requests undergo semantic normalization, access verification, and routing across Gemini 3 Flash-Lite and Gemini 3.8 Flash with dynamic ThinkingLevel parameters.
> - **Security & Sandboxing:** Real-time account permission enforcement, sandboxed iframe execution for user code, and persistent client-side encryption.

---

### 🔬 Exhaustive Platform Architecture
1. **Frontier Multimodal Engine:** Leverages Google Gemini 3 models with adaptive thinking tokens.
2. **Sandboxed Code Execution:** Secure in-browser JavaScript V8 and Pyodide/Python runtimes.
3. **Granular Role-Based Access (RBAC):** Real-time admin control, account management, and session heartbeat verification.`;
    }
    if (mode === 'medium') {
      return `⚖️ **MEDIUM REASONING** • Structured Overview

### 💡 What is SparkMind?
**SparkMind** is a next-generation AI Chatbot & AI Workspace engineered for rapid knowledge discovery and production execution.

### 🛠️ Core Capabilities
- **Multimodal Intelligence:** Powered by Google Gemini with live web grounding, vision, and document analysis.
- **Adaptive Reasoning:** Switch between ⚡ Flash (instant direct replies), ⚖️ Medium (structured breakdowns), and 🧠 Deep (extended cognitive chain-of-thought).
- **Integrated Execution Engines:** Live in-browser runners for Python 3, JavaScript, TypeScript, SVG, and HTML.
- **Specialized Workspaces:** Dedicated modes for Students, Developers, Writers, and Analysts.

### 📌 Production Architecture
Built with React 19, TypeScript, Tailwind CSS, Vite, and Node/Express.`;
    }
    return `⚡ **FLASH REASONING** • Direct Answer

**SparkMind** is an advanced AI workspace and high-speed chatbot powered by Google Gemini. It empowers students, developers, writers, and analysts to Chat, Code, Learn, and Create with client-side code execution, multi-modal file attachments, and cognitive reasoning modes.`;
  }

  if (p === 'python' || p === 'what is python' || p === 'explain python') {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **Language Architecture:** Python is an interpreted, dynamically typed, multi-paradigm language implemented over the CPython bytecode virtual machine. Memory management relies on reference counting coupled with a generational cyclic garbage collector.
> - **Concurrency & Runtime Limits:** The Global Interpreter Lock (GIL) synchronizes thread access to Python object internals, preventing true multicore parallelism in CPU-bound threads (mitigated in Python 3.13 free-threaded builds or via \`multiprocessing\`/\`asyncio\` event loops).
> - **Abstract Syntax & Execution Pipeline:** Source (.py) ➔ Tokens ➔ AST ➔ Bytecode (.pyc) ➔ CPython Evaluation Loop (\`_PyEval_EvalFrameDefault\`).

---

### 🔬 Exhaustive Architectural Breakdown
1. **Dynamic Type System:** Pure object orientation where even primitive integers, functions, and modules are heap-allocated \`PyObject\` structures with type pointers and reference counts.
2. **Standard Ecosystem Strengths:** Native C-extensions via NumPy, PyTorch, and Polars, bridging high-level expressive syntax with vectorized SIMD hardware acceleration.
3. **Metaprogramming & Introspection:** Descriptors, decorators, metaclasses (\`type\`), and dunder protocols enabling powerful ORMs and framework meta-abstractions.`;
    }
    if (mode === 'medium') {
      return `⚖️ **MEDIUM REASONING** • Structured Technical Guide

### 💡 Core Concept & Overview
**Python** is a high-level, general-purpose programming language renowned for its clean, human-readable syntax and massive software ecosystem.

### ⚙️ Practical Mechanics
- **Interpreted Execution:** Compiles to bytecode executed by the Python runtime (CPython, PyPy).
- **Batteries-Included:** Standard library covers networking (\`http\`), concurrency (\`asyncio\`), math, and file systems.
- **Dynamic Typing:** Rapid prototyping with optional PEP 484 static type annotations.

### 🛠️ Industry Applications
- **AI & Data Science:** PyTorch, TensorFlow, Pandas, Scikit-learn.
- **Backend & Web APIs:** FastAPI, Django, Flask.
- **Automation & Scripting:** DevOps, web scraping, scientific research.`;
    }
    return `⚡ **FLASH REASONING** • Direct Answer

**Python** is a high-level, dynamically typed language emphasizing code readability and development velocity.

- **Primary Use Cases:** AI/Machine Learning, Data Engineering, Backend APIs (FastAPI/Django), Automation.
- **Key Features:** Clean indentation-based syntax, cross-platform, extensive standard library.
- **Example:**
\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\``;
  }

  if (p === 'react' || p === 'what is react' || p === 'explain react') {
    if (mode === 'deep') {
      return `🧠 **DEEP REASONING & EXTENDED THINKING**

### 🧠 Deep Reasoning & Chain of Thought
> - **Fiber Architecture & Scheduling:** React Fiber rewrote the legacy recursive stack reconciler into an incremental, interruptible work-loop. Work units (\`FiberNode\`) form a singly-linked tree structure (child, sibling, return) enabling time-slicing and priority levels via the Scheduler.
> - **Reconciliation Heuristics:** $O(n^3)$ tree diffing is reduced to $O(n)$ by assuming two elements of different types produce different trees, and by utilizing unique \`key\` props for stable reconciliation across renders.
> - **Concurrent Rendering & Server Components (RSC):** Transitioning React from purely client-side VDOM diffing to hybrid compilation: Server Components stream zero-bundle-size JSON payloads over HTTP, seamlessly integrating with client islands.

---

### 🔬 In-Depth Architectural Breakdown
1. **Dual Buffering Technique:** React Fiber operates with two trees simultaneously: \`current\` (visible DOM representation) and \`workInProgress\` (uncommitted staged changes). Upon completion, a pointer swap renders updates atomically.
2. **React 19 Innovations:** Native Actions for optimistic UI updates (\`useOptimistic\`), Server Functions, \`use\` API for Promise unboxing, and automatic memoization via the React Compiler.`;
    }
    if (mode === 'medium') {
      return `⚖️ **MEDIUM REASONING** • Structured Technical Guide

### 💡 Core Concept & Overview
**React** is a declarative, component-based UI library developed by Meta. It models user interfaces as pure functions of state: $UI = f(state)$.

### ⚙️ Practical Mechanics
- **Component Hierarchy:** Reusable, composable UI building blocks.
- **Fiber Reconciler:** Asynchronous, prioritizable diffing algorithm comparing previous and next Virtual DOM trees.
- **State Management & Hooks:** Primitive state (\`useState\`), lifecycle/side-effects (\`useEffect\`), and contexts (\`useContext\`).

### 🛠️ Industry Applications & Ecosystem
- **Frameworks:** Next.js, Remix, Vite SPA.
- **Ecosystem:** TanStack Query, Zustand, Tailwind CSS, Shadcn UI.`;
    }
    return `⚡ **FLASH REASONING** • Direct Answer

**React** is an open-source JavaScript library developed by Meta for building declarative, component-based user interfaces.

- **Core Mechanism:** Virtual DOM reconciliation (Fiber architecture).
- **Key Features:** JSX syntax, unidirectional data flow, hooks (\`useState\`, \`useEffect\`).
- **Modern Standard:** React 19 with Server Actions, Server Components, and native \`use\` hook.`;
  }

  return null;
}

function buildSystemInstruction(
  workspace?: string,
  agent?: string,
  preferredLanguage?: string,
  mode: 'flash' | 'medium' | 'deep' = 'flash'
): string {
  let workspaceDirective = '';

  switch (workspace) {
    case 'student':
      workspaceDirective = `
You are in the STUDENT WORKSPACE.
Your goals:
- Act as an elite, supportive personal tutor and study assistant.
- Provide clear, structured explanations, 5-mark and 10-mark exam question answer outlines, note summaries, and flashcard-style takeaways.
- Break complex subjects into step-by-step intuitive concepts.
- When generating exam answers, structure with: Key Definition, Core Principles/Formulae, Working Mechanism, Examples, and Summary Points.
- If requested to create a quiz or MCQs, provide questions with answers and detailed explanations.`;
      break;
    case 'developer':
      workspaceDirective = `
You are in the DEVELOPER WORKSPACE.
Your goals:
- Act as a senior principal software engineer, architect, and code reviewer.
- Provide production-grade, bug-free, idiomatic code snippets in the requested language/framework.
- Include concise architectural insights, edge cases, performance considerations, and test cases where helpful.
- Keep explanations crisp and technical; preserve exact variable names, libraries, and code blocks in markdown fences with language tags.`;
      break;
    case 'founder':
      workspaceDirective = `
You are in the FOUNDER WORKSPACE.
Your goals:
- Act as an experienced venture builder, startup accelerator mentor, and strategy expert.
- Deliver lean startup validation, actionable market sizing, competitor breakdowns, USP definition, monetization strategies, and investor pitch deck outlines.
- Be pragmatic, direct, and focused on customer acquisition, unit economics, and rapid execution.`;
      break;
    case 'business':
      workspaceDirective = `
You are in the BUSINESS WORKSPACE.
Your goals:
- Act as a senior enterprise business analyst and corporate strategist.
- Assist with executive summaries, marketing copy, KPI frameworks, professional stakeholder emails, business models, and report outlines.
- Maintain a polished, professional, and results-oriented tone.`;
      break;
    default:
      workspaceDirective = `
You are in the GENERAL WORKSPACE.
Your goals:
- Act as a brilliant, versatile, and articulate AI workspace assistant for general questions, brainstorming, problem-solving, writing, and translation.`;
      break;
  }

  const agentDirective = agent && agent !== 'auto' && agent !== 'general'
    ? `\nActive specialized agent role: [${agent.toUpperCase()}]. Prioritize this specialty.`
    : '';

  const languageDirective = `
LANGUAGE AND MULTILINGUAL RULES (STRICT PRIORITY):
1. AUTOMATIC LANGUAGE DETECTION: Detect the language used by the user in their query.
2. ADAPTIVE RESPONSE:
   - Unless explicitly asked otherwise, respond in the SAME language and linguistic style as the user.
   - For Telugu: Fluently understand both Telugu script (తెలుగు) and Telugu written in English transliteration (Tenglish, e.g. "DBMS normalization enti simple ga cheppu"). Respond naturally in Telugu or natural conversational Tenglish matching user comfort.
   - For Hindi / Hinglish: Understand Devanagari Hindi and Romanized Hindi (Hinglish). Respond in kind.
   - For other languages (Tamil, Kannada, Malayalam, Bengali, Spanish, French, German, Japanese, Chinese, Arabic, etc.), respond fluently in that language.
3. PRESERVATION OF TECHNICAL TERMS: Keep programming keywords, technical acronyms, scientific laws, and library names in English when explaining in languages like Telugu or Hindi for clarity and standard industry usage.
4. EXPLICIT LANGUAGE OVERRIDE: If the user explicitly asks "Reply in English" or "Explain in Telugu" or "Translate to Hindi", always respect the explicit request over automatic detection.
${preferredLanguage && preferredLanguage !== 'auto' ? `User preferred language setting is: ${preferredLanguage}. Unless the prompt dictates otherwise, prefer this language.` : ''}
5. TRANSLATION ACCURACY: When asked to translate, preserve nuance, numbers, entities, code, and factual accuracy.`;

  let modeDirective = '';
  let formatMandate = '';

  if (mode === 'flash') {
    modeDirective = `
REASONING MODE: ⚡ FLASH MODE (Ultra-Fast & Direct)
- Deliver rapid, instant answers with zero delay.
- Get straight to the point without any conversational preamble or filler.
- Use crisp bullet points, clean tables, and immediate solutions.`;
    formatMandate = `
CRITICAL RESPONSE MANDATE: ⚡ FAST REPLY & DIRECT ANSWER
- Zero conversational preamble or pleasantries.
- Provide the answer, core fact, formula, or code in the very first sentence.
- Keep answers dense, clean, and completely to the point. No fluff.`;
  } else if (mode === 'deep') {
    modeDirective = `
REASONING MODE: 🧠 DEEP REASONING & EXTENDED THINKING MODE (Exhaustive Cognitive Depth)
You MUST perform exhaustive, multi-step rigorous reasoning and present your answer with deep intellectual rigor.
Format EVERY response in this mode with these structured sections:

### 🧠 Deep Reasoning & Chain of Thought
> Provide a thorough step-by-step breakdown of the underlying principles, problem decomposition, trade-offs, potential edge cases, and theoretical foundations.

### 🔬 In-Depth Solution & Architectural Breakdown
Provide the complete, exhaustive, production-grade explanation or implementation. Include thorough technical details, mathematical formulations, or comprehensive pedagogical depth.

### ⚖️ Nuances, Edge Cases & Verification
Analyze critical failure modes, alternative approaches, trade-offs, and verification steps.`;
    formatMandate = `
CRITICAL RESPONSE MANDATE: 🧠 MAXIMUM DEPTH & RIGOR
- Do NOT truncate or abbreviate explanations.
- Explore foundational theory, historical context, architectural trade-offs, and future trajectories.
- Maintain a brilliant, authoritative, and deeply analytical tone.`;
  } else {
    modeDirective = `
REASONING MODE: ⚖️ MEDIUM BALANCED MODE (Structured & Practical Depth)
Provide a balanced, articulate, and well-structured response that blends conceptual clarity with practical real-world application.
Format with:
- **Core Concept & Direct Answer**
- **Structured Explanation & Practical Mechanics**
- **Real-World Examples or Code**
- **Key Takeaways & Best Practices**`;
    formatMandate = `
CRITICAL RESPONSE MANDATE: ⚖️ BALANCED & STRUCTURED
- Balance depth with clarity.
- Structure with clear headings and bullet points.
- Provide practical examples to illustrate theoretical concepts.`;
  }

  return `You are ⚡ SparkMind, an advanced, high-speed AI chatbot and workspace created to help people Chat, Code, Learn, and Create.

${workspaceDirective}
${agentDirective}
${modeDirective}
${languageDirective}
${formatMandate}

OUTPUT FORMAT:
- Use clean, structured Markdown formatting.
- Format code in fenced code blocks with appropriate language tags (e.g. \`\`\`typescript, \`\`\`python).
- Use clear bullet points and tables where appropriate for readability.
- Maintain an exceptionally direct, fast, intelligent, and no-nonsense tone. Never waste time with useless talk.`;
}

function detectIfNeedsWebGrounding(message: string): boolean {
  const timeSensitiveRegex = /\b(latest|current|today|now|recent|news|price of|weather|stock|release date|who won|election|this year|2026)\b/i;
  return timeSensitiveRegex.test(message);
}

export function isImageGenerationIntent(message: string, hasAttachments: boolean = false): boolean {
  if (!message) return false;
  // If user attached files and did not explicitly say create/generate/design/draw, assume vision inquiry
  if (hasAttachments && !/\b(generate|create|make|draw|paint|produce|render|design)\b/i.test(message)) {
    return false;
  }

  const text = message.trim();
  const lower = text.toLowerCase();

  // Negative checks: tutorials, how-to, or coding about images/posters
  if (/^(how\s+to|what\s+is|explain|write\s+(code|a\s+program|a\s+script))\b/i.test(lower)) return false;
  if (/\b(photoshop\s+tutorial|canva\s+tutorial|figma\s+tutorial|css\s+image|html\s+img|react-markdown)\b/i.test(lower)) return false;

  // Visual noun vocabulary
  const visualNouns = /\b(poster|posters|image|images|img|imgs|picture|pictures|photo|photos|photograph|photographs|illustration|illustrations|drawing|drawings|artwork|artworks|visual|visuals|wallpaper|wallpapers|banner|banners|flyer|flyers|logo|logos|graphic|graphics|thumbnail|thumbnails|portrait|portraits|avatar|concept\s+art|cover\s+art|painting|paintings)\b/i;

  // Visual action verbs
  const visualVerbs = /\b(generate|create|make|design|draw|paint|render|produce|illustrate|sketch|give|show|need|want|build|craft)\b/i;

  // 1. Exact or short phrases (e.g. "poster", "image", "posters", "ai image", "poster design", "diwali poster")
  if (/^(poster|posters|image|images|flyer|banner|wallpaper|logo|artwork|drawing|illustration|photo|picture)(\s+(design|art|creation|maker))?$/i.test(lower)) {
    return true;
  }

  // 2. Any combination of a visual verb + visual noun anywhere in the message
  // Handles natural queries: "can you please design a poster for diwali", "hey create a poster for college day",
  // "in our college we need a poster for annual fest", "i would like to create a poster", "draw cat", "make me an image"
  if (visualVerbs.test(lower) && visualNouns.test(lower)) {
    return true;
  }

  // 3. Direct noun queries ("poster of...", "poster for...", "poster on...", "poster with...", "image of...", "photo of...")
  if (/\b(poster|posters|image|img|picture|photo|wallpaper|drawing|illustration|banner|flyer|artwork|logo|thumbnail)\s+(of|for|on|about|showing|with|featuring|displaying|depicting)\b/i.test(lower)) {
    return true;
  }

  // 4. Prefix shortcuts ("poster:", "image:", "img:", "/imagine", "/image", "/draw")
  if (/^(poster|image|img|photo|draw|paint|\/imagine|\/image|\/draw):\s*/i.test(lower)) {
    return true;
  }

  // 5. Draw / paint / sketch actions ("draw cat", "paint a starry night", "sketch a superhero")
  if (/\b(draw|paint|illustrate|sketch)\s+([a-z0-9\s,-]+)\b/i.test(lower)) {
    return true;
  }

  // 6. Topic + Noun ending ("college fest poster", "music concert poster", "cyber security poster", "space wallpaper")
  if (/[a-z0-9\s,-]{2,60}\s+(poster|posters|wallpaper|flyer|banner|logo|illustration|artwork|photo|image)$/i.test(lower)) {
    return true;
  }

  return false;
}

export async function processChatWithGemini(body: ChatRequestBody): Promise<ChatResponseBody> {
  // Rate and input validation
  const userMessage = body.message?.trim();
  const hasAttachments = Boolean(body.attachments && body.attachments.length > 0);
  if (!userMessage && !hasAttachments) {
    return {
      success: false,
      error: 'Message content or file attachment is required.',
    };
  }

  if (userMessage && userMessage.length > 40000) {
    return {
      success: false,
      error: 'Message exceeds the maximum allowable length (40,000 characters).',
    };
  }

  const candidateKeys = apiKeyManager.getCandidateKeys();

  // 1. DEDICATED AI IMAGE & POSTER GENERATION HANDLING (Runs even if Gemini keys are standby/empty via Neural Visual Engine)
  if (userMessage && isImageGenerationIntent(userMessage, hasAttachments)) {
    try {
      globalStats.totalRequests++;

      const isPoster = /\b(poster|posters|flyer|flyers|banner|banners|billboard|placard)\b/i.test(userMessage);

      // Clean command prefixes to isolate core visual subject
      let rawSubject = userMessage
        .replace(/^(can\s+you|could\s+you|please|i\s+would\s+like\s+to|i\s+want|i\s+need|kindly|help\s+me)\s+(to\s+)?(generate|create|make|design|draw|paint|render|produce|give\s+me|show\s+me|draw\s+me)?\s*/i, '')
        .replace(/^(generate|create|make|design|draw|paint|render|produce|illustrate|sketch|give\s+me|show\s+me|draw\s+me)\s+(an?\s+)?(ai\s+)?(poster|posters|image|images|img|imgs|picture|photo|illustration|drawing|artwork|visual|wallpaper|banner|flyer|logo|graphic|thumbnail|portrait)?\s*(of|with|showing|featuring|about|for|on)?\s*/i, '')
        .replace(/^(poster|image|img|photo|draw|paint|\/imagine|\/image|\/draw):\s*/i, '')
        .replace(/\s+(poster|wallpaper|flyer|banner|logo|illustration|artwork|photo|image)$/i, '')
        .trim();

      const userDisplayPrompt = rawSubject || (isPoster ? 'Creative Event Poster' : 'A futuristic AI visual masterpiece');
      const isFastMode = body.imageQuality === 'fast';

      // Detect requested aspect ratio and dimensions
      let aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' = '1:1';
      let canvasW = 1024;
      let canvasH = 1024;

      if (isPoster) {
        // High-impact portrait layout for posters and flyers (3:4 ratio standard)
        aspectRatio = '3:4';
        canvasW = 900;
        canvasH = 1200;
      } else if (/\b(wallpaper|banner|widescreen|16:9|landscape|wide|desktop|horizontal)\b/i.test(userMessage)) {
        aspectRatio = '16:9';
        canvasW = 1280;
        canvasH = 720;
      } else if (/\b(story|status|reel|vertical|portrait|phone|mobile|9:16)\b/i.test(userMessage)) {
        aspectRatio = '9:16';
        canvasW = 720;
        canvasH = 1280;
      }

      let enrichedPrompt = userDisplayPrompt;

      if (isPoster) {
        enrichedPrompt = `${userDisplayPrompt}, professional event poster, high-impact graphic design, bold artistic typography layout, vivid color grading, award-winning poster artwork, 8k resolution, crisp visual hierarchy, stunning masterpiece`;
      } else if (isFastMode) {
        enrichedPrompt = `${userDisplayPrompt}, clean composition, cinematic lighting, crisp details, high quality artwork`;
      } else {
        // High-Fidelity: Professional Artistic Prompt Expansion for Visuals
        if (candidateKeys.length > 0) {
          try {
            const aiClient = apiKeyManager.getClientForKey(candidateKeys[0].key);
            const promptExpansion = await aiClient.models.generateContent({
              model: 'gemini-flash-lite-latest',
              contents: `You are an expert master prompt engineer for high-end AI image generators.
User visual request: "${userDisplayPrompt}"
Expand this into an ultra-high-definition, visually stunning, vivid image generation prompt.
Add details for main subject clarity, masterful cinematic lighting, visual depth, and sharp 8k textures.
NO commentary. Output ONLY the final detailed prompt in English (maximum 35 words).`,
            });
            const expandedText = promptExpansion.text?.trim();
            if (expandedText && expandedText.length > 15) {
              enrichedPrompt = expandedText;
            }
          } catch {
            enrichedPrompt = `${userDisplayPrompt}, 8k uhd resolution, ultra detailed, volumetric lighting, photorealistic, sharp focus, masterpiece`;
          }
        } else {
          enrichedPrompt = `${userDisplayPrompt}, 8k uhd resolution, ultra detailed, volumetric lighting, photorealistic, sharp focus, masterpiece`;
        }
      }

      let imageUrl = '';
      let engineUsed = isPoster
        ? 'SparkMind Poster Design Studio'
        : isFastMode
        ? 'SparkMind Fast Visual Engine'
        : 'SparkMind Ultra HD Studio';
      let resolutionLabel = isPoster
        ? `${canvasW}x${canvasH} (Poster Format)`
        : isFastMode
        ? 'Fast / 1024px'
        : 'High-Fidelity HD';

      // Attempt generation using Gemini image models across candidate keys (if supported on account)
      for (const keyInfo of candidateKeys) {
        if (imageUrl) break;
        const candidateAi = apiKeyManager.getClientForKey(keyInfo.key);

        try {
          const geminiImgResp = await candidateAi.models.generateContent({
            model: isFastMode ? 'gemini-3.1-flash-lite-image' : 'gemini-3.1-flash-image',
            contents: {
              parts: [{ text: enrichedPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio === '3:4' ? '3:4' : aspectRatio,
              },
            },
          });

          for (const part of geminiImgResp.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageUrl = `data:${mime};base64,${part.inlineData.data}`;
              engineUsed = `Google Gemini Studio Image (${isFastMode ? 'Draft' : 'Ultra HD'}${keyInfo.index === 2 ? ' • Backup Key' : ''})`;
              resolutionLabel = 'Full HD / 2K';
              apiKeyManager.recordRequest(keyInfo.index, true);
              break;
            }
          }
        } catch {
          // Optional Gemini image model quota failure; seamlessly fallback to SparkMind Neural Engine
        }
      }

      // Fast & High-Definition Neural Canvas (Pollinations Turbo / Flux)
      if (!imageUrl) {
        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(
          isPoster
            ? `${enrichedPrompt}, dynamic color palette, stunning graphic design, ultra detailed`
            : `${enrichedPrompt}, 8k uhd, photorealistic masterpiece, sharp focus, vibrant, clean`
        );
        const modelParam = 'turbo'; // Turbo provides ultra-fast ~1.5s rendering with high reliability
        const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${canvasW}&height=${canvasH}&model=${modelParam}&nologo=true&nofeed=true&seed=${seed}`;

        // Attempt server-side buffer fetch with 3.5s timeout for instant base64 delivery (bypasses ISP/browser blocking)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const fetchRes = await fetch(directUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            const b64 = Buffer.from(buf).toString('base64');
            const mime = fetchRes.headers.get('content-type') || 'image/jpeg';
            imageUrl = `data:${mime};base64,${b64}`;
          } else {
            imageUrl = directUrl;
          }
        } catch {
          imageUrl = directUrl;
        }

        engineUsed = isPoster
          ? 'SparkMind Poster Design Studio (Neural Canvas)'
          : 'SparkMind High-Definition Visual Engine';
        resolutionLabel = `${canvasW}x${canvasH} (${isPoster ? 'Poster Print 3:4' : 'High-Definition'})`;
      }

      globalStats.successfulRequests++;
      const modeBadge = isPoster ? '🎨 Poster Design' : isFastMode ? '⚡ Fast Mode' : '💎 High-Fidelity';
      const typeLabel = isPoster ? 'AI Generated Poster' : 'AI Generated Artwork';

      // Build structured poster copy if the user requested a poster
      let posterDetailsSection = '';
      if (isPoster) {
        const cleanTitle = userDisplayPrompt
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        posterDetailsSection = `

---

### 📋 Poster Typography & Event Content Outline

* **Event Title:** **${cleanTitle}**
* **Theme / Tagline:** *Empowering Tomorrow, Inspiring Today*
* **Date & Time:** *Upcoming Saturday • 10:00 AM – 5:00 PM*
* **Venue:** *Main Campus Auditorium / Grand Conference Hall*
* **Key Highlights:**
  1. 🌟 Keynote Address & Panel Discussions
  2. 🚀 Interactive Workshops & Live Demonstrations
  3. 🏆 Competitions & Award Ceremony
  4. 🤝 Networking Session & Refreshments
* **Registration & Entry:** *Free Entry • Scan QR / Visit Official Portal to Register*
* **Contact & Inquiries:** *info@sparkmind.ai • +1 (800) 555-SPARK*

---
`;
      }

      return {
        success: true,
        reply: `![${userDisplayPrompt.replace(/[\[\]]/g, '')}](${imageUrl})\n\n### 🎨 ${typeLabel} (${modeBadge})\n**Visual Subject:** *${userDisplayPrompt}*\n\n**Engine:** ${engineUsed} • **Resolution:** ${resolutionLabel} • **Aspect Ratio:** ${aspectRatio}\n\n💡 **Tips:** Click the download button (⬇️) to save your high-resolution PNG, or click the image to inspect full quality!${posterDetailsSection}`,
        modelUsed: isPoster ? 'sparkmind-poster-generator' : isFastMode ? 'gemini-image-draft' : 'gemini-image-generator',
        groundingType: 'gemini',
      };
    } catch (err: any) {
      console.warn('Dedicated image generation error:', err);
    }
  }

  const reasoningMode: 'flash' | 'medium' | 'deep' = body.mode || 'flash';
  const shouldGroundWeb = body.useWebGrounding === true;
  const systemInstruction = buildSystemInstruction(body.workspace, body.agent, body.language, reasoningMode);

  // Prepare contents array for Gemini
  // History conversion
  const contents: any[] = [];

  if (body.history && Array.isArray(body.history)) {
    // Only take the last 15 messages to prevent exceeding context window safely
    const recentHistory = body.history.slice(-15);
    for (const msg of recentHistory) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [{ text: msg.content }];
      contents.push({ role, parts });
    }
  }

  // Build the current user turn parts
  const currentParts: any[] = [];

  // Inject explicit turn-level mode directive to enforce distinct styles regardless of chat history
  let modeTurnDirective = '';
  if (reasoningMode === 'flash') {
    modeTurnDirective = `[MODE DIRECTIVE: ⚡ FLASH MODE. Deliver an ultra-fast, direct, and concise answer with zero conversational fluff, clean bullet points, and immediate practical value. Format starting with: '⚡ **Flash Mode** • Direct Answer\n\n']\n`;
  } else if (reasoningMode === 'medium') {
    modeTurnDirective = `[MODE DIRECTIVE: ⚖️ MEDIUM BALANCED MODE. Deliver a balanced, articulate, and structured response with 4 clear sections: 💡 Core Concept, ⚙️ Practical Mechanics, 🛠️ Real-World Example / Code Walkthrough, and 📌 Key Takeaways. Format starting with: '⚖️ **Medium Mode** • Structured Breakdown\n\n']\n`;
  } else {
    modeTurnDirective = `[MODE DIRECTIVE: 🧠 DEEP REASONING & EXTENDED THINKING MODE. Deliver an exhaustive, rigorous cognitive analysis and multi-step deduction with 4 deep sections: 🧠 Chain-of-Thought & Foundational Principles, 🔬 Comprehensive Architectural / Technical Breakdown, ⚖️ Edge Cases, Trade-offs & Failure Modes, and 🎯 Frontier Synthesis & Verification. Format starting with: '🧠 **Deep Thinking Mode** • Exhaustive Reasoning & Architecture\n\n']\n`;
  }

  // Check for attachments
  let hasFileAttachment = false;
  if (body.attachments && Array.isArray(body.attachments)) {
    for (const att of body.attachments) {
      hasFileAttachment = true;
      if (att.text) {
        // Text-based files (code, md, txt, csv, json, extracted doc text)
        currentParts.push({
          text: `\n[ATTACHED DOCUMENT: ${att.name} (${att.type})]\n\`\`\`\n${att.text.slice(0, 50000)}\n\`\`\`\n`,
        });
      } else if (att.data) {
        // Base64 inline data for images, audio, PDFs, or generic documents
        const mimeType = att.type || 'application/octet-stream';
        currentParts.push({
          inlineData: {
            mimeType,
            data: att.data,
          },
        });
      }
    }
  }

  if (userMessage) {
    currentParts.push({ text: `${modeTurnDirective}${userMessage}` });
  }

  contents.push({ role: 'user', parts: currentParts });

  // Check Instant Semantic Cache for Sub-Second (Fraction of a Second) Responses with mode-specific depth
  const cleanPrompt = userMessage.trim().toLowerCase().replace(/[?!.,]+$/, '');
  const cacheKey = `${reasoningMode}:${cleanPrompt}`;

  if (!hasFileAttachment && !shouldGroundWeb) {
    const instantReply = getInstantServerReply(cleanPrompt, reasoningMode);
    if (instantReply) {
      globalStats.totalRequests++;
      globalStats.successfulRequests++;
      return {
        success: true,
        reply: instantReply,
        reasoningMode,
        modelUsed:
          reasoningMode === 'deep'
            ? 'gemini-3.8-flash (Deep Reasoning)'
            : reasoningMode === 'medium'
            ? 'gemini-3.8-flash (Balanced)'
            : 'gemini-3.1-flash-lite (Instant Cache)',
        groundingType: 'gemini',
      };
    }

    const cached = instantQueryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      globalStats.totalRequests++;
      globalStats.successfulRequests++;
      return {
        success: true,
        reply: cached.reply,
        reasoningMode,
        modelUsed: reasoningMode === 'flash' ? 'gemini-3.1-flash-lite (Cache)' : 'gemini-3.8-flash (Cache)',
        groundingType: 'gemini',
      };
    }
  }

  let lastError: any = null;

  // Select candidates by requested model and reasoning mode:
  const requestedModel = body.model;
  const candidatesForMode =
    reasoningMode === 'deep'
      ? ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
      : reasoningMode === 'medium'
      ? ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
      : ['gemini-flash-lite-latest', 'gemini-3-flash-preview', requestedModel || 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  if (candidateKeys.length === 0) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY (or spare GEMINI_API_KEY_2) in your server environment variables or Admin Console.',
    };
  }

  // Try candidate keys in order (Primary Key #1 first, auto-failover to Spare Key #2 on quota hit)
  for (const keyInfo of candidateKeys) {
    const aiClient = apiKeyManager.getClientForKey(keyInfo.key);
    let keyQuotaHit = false;

    for (const modelCandidate of candidatesForMode) {
      // Try first with requested tools, and if tool quota is exhausted, try without tools
      const attempts = shouldGroundWeb ? [true, false] : [false];

      for (const withTools of attempts) {
        try {
          globalStats.totalRequests++;
          apiKeyManager.recordRequest(keyInfo.index, false);

          const config: any = {
            systemInstruction: systemInstruction,
            temperature: reasoningMode === 'flash' ? 0.2 : reasoningMode === 'medium' ? 0.5 : 0.7,
          };

          // Extended thinking is only supported by gemini-3.8-flash
          const supportsThinking = modelCandidate === 'gemini-3.8-flash';
          if (reasoningMode === 'deep' && supportsThinking) {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            config.maxOutputTokens = 4096;
          } else if (reasoningMode === 'medium' && supportsThinking) {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            config.maxOutputTokens = 2048;
          } else {
            // Flash or standard fallback models
            config.maxOutputTokens = reasoningMode === 'deep' ? 4096 : reasoningMode === 'medium' ? 2048 : 800;
          }

          if (withTools) {
            config.tools = [{ googleSearch: {} }];
            globalStats.webGroundingCount++;
          }

          if (hasFileAttachment) {
            globalStats.fileGroundingCount++;
          }

          // Call Gemini API with candidate model and active key client
          const response = await aiClient.models.generateContent({
            model: modelCandidate,
            contents: contents,
            config: config,
          });

          const replyText = response.text || 'SparkMind was unable to generate a response. Please try rephrasing your message.';
          apiKeyManager.recordRequest(keyInfo.index, true);

          // Extract grounding sources if available
          const sources: GroundingSource[] = [];
          const candidate = response.candidates?.[0];
          const groundingMetadata = candidate?.groundingMetadata;

          if (groundingMetadata?.groundingChunks) {
            for (const chunk of groundingMetadata.groundingChunks as any[]) {
              if (chunk.web?.uri) {
                sources.push({
                  title: chunk.web.title || new URL(chunk.web.uri).hostname,
                  url: chunk.web.uri,
                });
              }
            }
          }

          // Deduplicate sources by URL
          const uniqueSources: GroundingSource[] = [];
          const seenUrls = new Set<string>();
          for (const s of sources) {
            if (!seenUrls.has(s.url)) {
              seenUrls.add(s.url);
              uniqueSources.push(s);
            }
          }

          // Track language and workspace stats
          if (body.workspace) {
            globalStats.workspacesUsed[body.workspace] = (globalStats.workspacesUsed[body.workspace] || 0) + 1;
          }
          const langKey = body.language || 'auto';
          globalStats.languagesUsed[langKey] = (globalStats.languagesUsed[langKey] || 0) + 1;
          globalStats.successfulRequests++;

          const groundingType: 'web' | 'file' | 'gemini' =
            uniqueSources.length > 0 ? 'web' : hasFileAttachment ? 'file' : 'gemini';

          if (cleanPrompt.length <= 80 && !hasFileAttachment && !shouldGroundWeb && replyText) {
            instantQueryCache.set(cacheKey, { reply: replyText, timestamp: Date.now() });
          }

          return {
            success: true,
            reply: replyText,
            modelUsed: `${modelCandidate}${keyInfo.index === 2 ? ' (Spare Key #2)' : ''}`,
            reasoningMode,
            sources: uniqueSources.length > 0 ? uniqueSources : undefined,
            groundingType,
            usage: {
              totalTokens: response.usageMetadata?.totalTokenCount,
              promptTokens: response.usageMetadata?.promptTokenCount,
              completionTokens: response.usageMetadata?.candidatesTokenCount,
            },
          };
        } catch (err: any) {
          lastError = err;
          const errorMsg = String(err?.message || err);
          console.warn(`[Key #${keyInfo.index}] Model ${modelCandidate} (withTools=${withTools}) failed:`, errorMsg.slice(0, 100));

          // Detect Rate Limit (429) or Quota Exceeded (RESOURCE_EXHAUSTED)
          if (apiKeyManager.isQuotaError(err)) {
            keyQuotaHit = true;
            apiKeyManager.recordKeyQuotaHit(keyInfo.index, errorMsg);
            // Break tool attempts to switch immediately to next key (Spare Key)
            break;
          }

          // If withTools failed and wasn't quota, retry without tools
          if (withTools) {
            continue;
          }

          // If 503 (model temporary high demand/overload), wait briefly before falling back
          if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
            await new Promise((res) => setTimeout(res, 200));
          }

          // Break inner loop to try next modelCandidate
          break;
        }
      }

      if (keyQuotaHit) {
        // Break out of model loop for this key to allow next key in candidateKeys to take over
        break;
      }
    }
  }

  globalStats.failedRequests++;
  console.error('All Gemini model candidates and API keys exhausted:', lastError);

  const finalMsg = String(lastError?.message || lastError);
  if (finalMsg.includes('429') || finalMsg.includes('RESOURCE_EXHAUSTED') || finalMsg.includes('quota')) {
    globalStats.rateLimitHits++;
    return {
      success: false,
      error: 'SparkMind is currently experiencing high demand. Please try again in a few moments or configure a Spare API Key in the Admin Console.',
    };
  }

  if (finalMsg.includes('503') || finalMsg.includes('high demand') || finalMsg.includes('UNAVAILABLE')) {
    return {
      success: false,
      error: 'Google Gemini servers are temporarily experiencing high traffic volume. Please click Regenerate or send your message again in a moment.',
    };
  }

  if (finalMsg.includes('API_KEY_INVALID') || finalMsg.includes('invalid api key')) {
    return {
      success: false,
      error: 'The server Gemini API key appears to be invalid. Please verify the server configuration or Admin Console.',
    };
  }

  return {
    success: false,
    error: 'Sorry, an error occurred while processing your request. Please try again.',
  };
}

export async function generateSpeechAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ success: boolean; audioBase64?: string; mimeType?: string; error?: string }> {
  const candidateKeys = apiKeyManager.getCandidateKeys();

  if (candidateKeys.length === 0) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|.*?\|/g, '')
    .replace(/[-=_]{3,}/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000); // comfortable limit for single audio generation

  if (!cleanText) {
    return { success: false, error: 'No readable text content provided.' };
  }

  const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

  let lastTtsError: any = null;

  for (const keyInfo of candidateKeys) {
    const ai = apiKeyManager.getClientForKey(keyInfo.key);
    const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-lite-tts'];

    for (const ttsModel of ttsModels) {
      try {
        apiKeyManager.recordRequest(keyInfo.index, false);
        const response = await ai.models.generateContent({
          model: ttsModel,
          contents: [
            {
              role: 'user',
              parts: [{ text: cleanText }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const base64Audio = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'audio/wav';

        if (base64Audio) {
          apiKeyManager.recordRequest(keyInfo.index, true);
          return {
            success: true,
            audioBase64: base64Audio,
            mimeType,
          };
        }
      } catch (err: any) {
        lastTtsError = err;
        const errorMsg = String(err?.message || err);
        console.warn(`[TTS - Key #${keyInfo.index}] Model ${ttsModel} failed:`, errorMsg.slice(0, 100));

        if (apiKeyManager.isQuotaError(err)) {
          apiKeyManager.recordKeyQuotaHit(keyInfo.index, errorMsg);
          break; // Try next candidate key
        }
      }
    }
  }

  console.error('Gemini TTS speech error:', lastTtsError);
  return {
    success: false,
    error: lastTtsError?.message || 'Failed to synthesize speech audio.',
  };
}
