# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-31

### Added
- **AI Conversation Memory**: Context-aware refinements (remembers your last 4 messages).
- **Persistent Interaction History**: Full chat log in the refinement phase.
- **Input Guardrails**: 500-character limit and real-time counter.
- **Immediate UI Feedback**: Instant message display and auto-scrolling.
- **Deep Wash Pipeline**: Advanced file content extraction for higher accuracy.
  - Parallel background scanning with sequential API processing (50-file batches).
  - First-page PDF text extraction support via `pdf-parse`.
  - Recursive directory traversal with user-defined depth limits.
- **Laundry-Themed CLI**: Reimagined terminal interface with a dashboard, statistics, and interactive elements.
- **Smart Directory Browser**: Interactive folder navigation with real-time file count indicators.
- **Interactive Refinement Loop**: Ability to tweak AI-proposed organization plans using natural language feedback.
- **Executive Summary Synthesis**: Automatic combination of multiple batch summaries into a single, cohesive 1-sentence executive summary.
- **Action Plan Improvements**:
  - Alphabetical sorting of files by destination folder for easier review.
  - Improved pagination UX for rapid plan inspection.
  - Dynamic "Loading the Machine" feedback indicating exactly what data is being sent to the AI.
- **Organization Presets**: Preconfigured rules for Workspace resets, Media sorting, and Developer mode alongside custom prompts.
