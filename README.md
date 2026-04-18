# Filedromat

Local file organization tool that uses AI to propose and execute directory structures.

## System Architecture

- **Backend**: Hono (Node.js) server for filesystem access and AI orchestration.
- **Frontend (Web)**: React dashboard for visual management.
- **Frontend (CLI)**: Ink-based terminal interface for interactive sessions.
- **AI Integration**: Google Gemini and Anthropic Claude via Vercel AI SDK.

## Features

- **Recursive Scanning**: File metadata collection with path suggestions.
- **Content Sampling**: Metadata and text/PDF content extraction for context-aware sorting.
- **AI Proposals**: Automated directory structure generation based on file context.
- **Boundary Enforcement**: Optional constraints to keep files within their top-level directories.
- **Refinement Loop**: Natural language interface for tweaking move plans.
- **Execution Engine**: Atomic file moves followed by empty directory cleanup.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure API Keys**: Provide keys in a `.env` file or via the settings panel in the Web UI.
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key
   ```

## Usage

### Web Interface
Start the backend server and the web dashboard:
```bash
npm run dev:all
```
- **Web UI**: http://localhost:5173
- **API Server**: http://localhost:3000

### Command Line Interface
Start the interactive terminal app (does not require the backend server):
```bash
npm run dev
```

## Security

- **Permissions**: The server requires read/write access to the local filesystem.
- **Networking**: No authentication is provided. Restrict access to localhost.
- **Data**: Metadata and content samples are transmitted to AI providers for analysis.

## License

MIT

