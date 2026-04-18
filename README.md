**Filedromat** is a professional, terminal-first file organization utility that uses Google's latest Gemini models to intelligently categorize and move your files. It features a "Deep Wash" pipeline that looks inside your documents and PDFs to understand exactly where they belong.

---

## 🛡️ Security & Privacy

### Local Filesystem Access
**Filedromat** is designed as a local-first tool. To provide its core functionality, the backend server requires **read and write access** to your filesystem. 
- **Warning**: The server (port 3000 by default) does not include built-in authentication. **Never expose this port to a public network.** 
- **Recommendation**: Always run Filedromat on a firewalled machine or within your local internal network.

### Data Privacy
- **Metadata**: Only file metadata (names, sizes, extensions) and a small sample of content (if Deep Wash is enabled) are sent to your chosen AI provider (Google or Anthropic).
- **Control**: No file data is permanently stored on external servers or used for training by Filedromat.
- **API Keys**: Your keys are stored locally in `~/.filedromat/config.json`.

---

---

## Key Features

- **Gemini Powered**: Leverages the latest Gemini models for high-performance, cost-effective file analysis.
- **Deep Wash Pipeline**: Go beyond filenames. Extract metadata and first-page content from `.txt`, `.md`, `.pdf`, `.json`, and more for accurate categorization.
- **Interactive Browser**: Navigate your local filesystem with a professional, Ink-powered terminal interface.
- **Safety First**:
  - **Sequential Batching**: Processes files in chunks of 50 to strictly avoid 429 API rate limits.
  - **Review Stage**: Inspect every single proposed move before applying.
  - **Refinement Loop**: Don't like a path? Just tell the AI what to change in natural language.
- **Executive Summaries**: Automatically synthesizes complex organization plans into a single, high-level executive summary.
- **Parallel Scanning**: Background file system traversal with customizable recursion depth limits.

## Getting Started

### Prerequisites

- **Node.js**: >= 20.0.0
- **Google AI API Key**: Get one at [Google AI Studio](https://aistudio.google.com/).

### Installation

```bash
git clone https://github.com/RahmaniErfan/Filedromat.git
cd Filedromat
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Usage

Run the local development server to start the machine:

```bash
npm run dev
```

1. **Select a Directory**: Use the interactive browser to find the folder you want to clean.
2. **Configure Scan**: Choose "Deep Wash" for content analysis and set your folder depth.
3. **Instruction**: Pick a preset (Smart, Workspace Reset, Media Sort) or enter custom rules.
4. **Review**: Scroll through the sorted proposal and the AI-generated executive summary.
5. **Refine**: If needed, talk to the machine to tweak the plan.
6. **Apply**: Let Filedromat handle the heavy lifting.

---

- **Logic**: TypeScript
- **UI Framework**: [Ink](https://github.com/vadimdemedes/ink) (Cli) & React (Web)
- **AI Orchestration**: [AI SDK](https://sdk.vercel.ai/)
- **PDF Extraction**: `pdf-parse`

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the laundry machine:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
