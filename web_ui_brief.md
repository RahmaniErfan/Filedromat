# 🧺 Filedromat: Web UI Implementation Brief

## 📋 1. Project Overview
**Filedromat** is an AI-powered local file organization utility (Version 1.0.0). It uses Gemini models to analyze files and propose folder structures. 

**The Goal:** Transform the existing Vite + React boilerplate in the `/web` directory into a professional, modern "File Laundry" dashboard.

---

## 🏗️ 2. Architecture & Backend Bridge
The web UI should leverage the existing TypeScript logic located in `src/core/`.

### Core Services to Expose:
- **`scanner.ts`**: Recursive directory scanning with "Deep Wash" (content extraction) and PDF support.
- **`provider.ts`**: Gemini-powered organization proposals and refinement loops (sequential batching).
- **`prompts.ts`**: AI instruction generation.

> [!IMPORTANT]
> **The Local Bridge:** Browsers cannot access the full filesystem directly. You must implement a local API server (using **Hono**, already in root dependencies) that acts as a bridge between the React frontend and the local `src/core` logic.

---

## 🎨 3. Design Requirements (The "Premium Wash")
The design should be modern, professional, and visually stunning, sticking to the "Laundry Machine" theme.

- **Style**: Solid, clean, modern UI (avoid Glassmorphism/frosted glass).
- **Shapes**: High-usage of **rounded corners** (8px to 16px) for an "app-like" feel.
- **Color**: Use **subtle gradients** and a curated, harmonious palette (Deep Blues, Clean Whites, Soft Grays).
- **Typography**: Modern sans-serif (e.g., **Inter**, **Outfit**, or **Roboto**).
- **Interactions**: Smooth micro-animations for transitions between organization stages.

---

## 🛠️ 4. Key Views to Implement
1. **Lobby/Dashboard**: Overview of system stats and a prominent "Start Wash" entry point.
2. **Directory Browser**: Interactive folder navigation with real-time file count indicators.
3. **Scan Config**: Options to toggle "Deep Wash" (content analysis) and set recursion depth.
4. **Instruction Phase**: Clean selection cards for presets (Smart Sort, Media Sort) and a custom prompt field.
5. **The Proposal Card**: A list of actions **sorted by destination folder**.
    - Display one-shot **Executive Summaries** at the top of the plan.
    - Show paths clearly: `source/file.txt -> destination/folder/`.
6. **Refinement Chat**: A sidebar or floating chat interface for natural language iterative adjustments.

---

## 📐 5. Technical Constraints
- **Stack**: Vite + React + TypeScript (inside `/web`).
- **Styling**: TailwindCSS or Vanilla CSS (maintain high-end aesthetic).
- **Processing**: You **must** respect the `BATCH_SIZE` and sequential processing logic in `provider.ts` to avoid being rate-limited by the Gemini API.
- **Auth**: No auth required; this is a local utility.

---

## 👨‍💻 Author Attribution
Project created by **Erfan Rahmani**.
Please ensure the "Laundry Machine" soul of the project remains intact!
