# ⚡ SparkMind — AI Chatbot & AI Workspace
> **Chat. Code. Learn. Create.**  
> A production-ready multilingual AI chatbot and specialized workspace powered by Google Gemini, designed for local VS Code development and free 1-click deployment on Netlify.

---

## 🌟 Key Features

### 1. 🌍 Deep Multilingual & Telugu Support
* **Automatic Language Detection**: Detects user language automatically and responds in the same language and tone.
* **Telugu Script & Tenglish**: Understands both formal Telugu script (`తెలుగు`) and conversational English-transliterated Telugu (*"DBMS normalization enti simple ga cheppu"*).
* **Hindi & Hinglish**: Understands Devanagari Hindi and Romanized Hindi.
* **Global Languages**: Supports Spanish, French, German, Japanese, Tamil, Kannada, and all languages supported by Gemini.
* **Preserves Technical Terms**: Keeps code syntax and technical engineering terminology in English for maximum industry clarity.

### 2. 🏢 5 Specialized AI Workspaces
* **💬 General**: Everyday inquiries, brainstorming, writing, translation, and open dialogue.
* **🎓 Student Study Hub**:
  * 📋 10-Mark university exam answer structure (definitions, diagrams, working flow, comparison table).
  * 📝 High-yield revision notes and formula boxes.
  * ❓ 5-question MCQ generator with detailed distractor explanations.
  * 🧠 Flashcard creator.
* **💻 Developer Studio**:
  * 🔍 Senior code reviewer & OWASP security auditor.
  * 🐞 Root-cause bug debugger with drop-in fixes.
  * 🧪 Unit test generator (Vitest, Jest, Pytest).
  * ⚡ Scalable architecture and system design.
* **🚀 Founder Launchpad**:
  * 💡 Startup idea validator & customer profile (ICP).
  * 📑 10-slide investor pitch deck generator.
  * 💰 Pricing strategy & unit economics estimator.
  * 🚀 30-day Go-To-Market (GTM) launch checklist.
* **🏢 Business Strategy Suite**:
  * 📄 Executive client proposals & Statements of Work (SOW).
  * 📧 High-stakes negotiation email drafter.
  * 📣 Omnichannel marketing campaign roadmap.
  * 🎯 SWOT & competitive advantage analysis.

### 3. 🌐 Live Web Grounding
* Toggle live Google Search grounding on any message or trigger it automatically with time-sensitive keywords (*"latest"*, *"today"*, *"recent"*, *"news"*, *"current releases"*).
* Transparent, verified citations with clickable direct source links.

### 4. 📁 Advanced Multimodal File Grounding
* Attach images (`PNG`, `JPG`, `WebP`), documents, code files (`.ts`, `.py`, `.js`, `.java`, `.cpp`, `.sql`, `.html`, `.css`), markdown, spreadsheets (`CSV`, `TSV`), and audio.
* Client-side text and base64 extraction transmitted securely to server-side Gemini 2.5 Flash.

### 5. 🎙️ Voice Input & Read Aloud
* In-browser voice transcription with recording timer and live editable transcript.
* Language-aware speech synthesis (Read Aloud) that selects compatible browser voices matching response language.

### 6. 🛠️ Productivity Tools
* **Prompt Library**: Pre-built, categorized prompts for study, coding, startups, and translation with 1-click execution.
* **Resume ATS Assistant**: Calculates *SparkMind Estimated ATS Compatibility*, identifies missing keywords, and rewrites bullets with action verbs.
* **Data & CSV Analyzer**: Instant column schema, sample preview, statistical distribution notes, and chart recommendations.
* **Saved Answers**: Star and bookmark high-yield responses to build your personal knowledge base.
* **Temporary Chat**: Private incognito mode where messages are not saved to local history.

---

## 🔐 Security & Architecture

The browser **NEVER** accesses the private Gemini API key. All AI requests follow this serverless architecture:

```
[Browser / Client]
       ↓ (x-user-id header, message payload, attachments)
[Netlify Serverless Function: /.netlify/functions/chat]
       ↓ (Rate limiting & validation)
[Google Gemini 2.5 Flash via @google/genai]
       ↓ (Optional Google Search Grounding)
[Netlify Serverless Function]
       ↓ (Clean JSON response with sources)
[SparkMind UI]
```

* **No Secrets in Frontend**: `GEMINI_API_KEY` is loaded exclusively from `process.env.GEMINI_API_KEY` in the serverless function.
* **Rate Protection**: Built-in 40 req/min per-client throttling with friendly 429 backoff messaging.
* **Local Persistence**: User conversations and starred answers are stored in localStorage namespaced by user ID.

---

## 🚀 Local Development (VS Code)

### Prerequisites
* [Node.js](https://nodejs.org/) v18+ or v20+
* Google Gemini API Key from [Google AI Developer Portal](https://ai.google.dev/)

### 1. Clone & Install
```bash
git clone https://github.com/MANOJKOMATI1227/SPARKMIND-AI.git
cd SPARKMIND-AI
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"
PORT=3000
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Free Netlify Deployment Guide

SparkMind is configured out-of-the-box for **Netlify's Free Tier** using Netlify Functions.

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: complete SparkMind AI chatbot platform"
git branch -M main
git remote add origin https://github.com/MANOJKOMATI1227/SPARKMIND-AI.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select **GitHub** and authorize access to your `SPARKMIND-AI` repository.

### Step 3: Build Settings
Netlify will automatically detect settings from `netlify.toml`:
* **Build command**: `npm run build`
* **Publish directory**: `dist`
* **Functions directory**: `netlify/functions`

### Step 4: Configure Environment Variables
1. Under **Site configuration** > **Environment variables** (or during the setup screen), click **"Add a variable"**.
2. Key: `GEMINI_API_KEY`
3. Value: `Your-Real-Google-Gemini-API-Key`
4. Optional Key: `GEMINI_MODEL` → Value: `gemini-2.5-flash`

### Step 5: Deploy!
Click **"Deploy site"**. Your production URL will be live in ~60 seconds (e.g. `https://sparkmind-ai.netlify.app`).

---

## 🧪 Testing Checklist

- [x] Send text message in English → AI answers accurately in markdown.
- [x] Send query in Telugu script (`DBMS normalization అంటే ఏమిటి?`) → AI answers in Telugu.
- [x] Send casual Tenglish query (`OOP pillars enti simple ga cheppu`) → AI answers in natural conversational style.
- [x] Toggle **Web Grounding** and query recent news → AI returns verified citations.
- [x] Attach a code file or image → AI analyzes content and grounds answer.
- [x] Click **Copy**, **Edit**, or **Share** on user queries → Branches and copies correctly.
- [x] Click **Read Aloud** (`🔊`) → Browser speaks response in matching language.
- [x] Open **Prompt Library** → Select prompt and verify immediate composer population.
- [x] Open **Resume Assistant** → Generates ATS compatibility report.
- [x] Open **Data Assistant** → Analyzes CSV and provides statistical insights.
- [x] Switch between **General, Student, Developer, Founder, and Business** workspaces.
- [x] Test responsive layout on mobile, tablet, and desktop views.

---

## 👨‍💻 Administrator & Author
* **Lead Developer & Administrator:** Komati Manoj Kumar
* **Email:** [komatimanojkumar1227@gmail.com](mailto:komatimanojkumar1227@gmail.com)
* **Project:** SparkMind AI Workspace

---

## 📄 License & Terms
This project is licensed under the **MIT License** — authored and copyright (c) 2026 Komati Manoj Kumar.  
See [`LICENSE`](./LICENSE) and [`TERMS.md`](./TERMS.md) for full terms, conditions, and permissions. Free to inspect, use, fork, and deploy.
