# Lumina: The Writing Architect

A privacy-first, local-only productivity tool for authors and researchers.

## Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the app**:
   ```bash
   npm run dev
   ```
   The development server will start on [http://localhost:3000](http://localhost:3000).

### How it works
- **No AI Required**: This project does not use LLMs or external AI APIs.
- **Local Storage**: Your data is saved locally in your browser's `localStorage`.
- **Vite**: The app uses Vite for a fast development experience. The `npm run dev` command is defined in `package.json` and runs the Vite development server.

## Features
- **Manuscript Management**: Organize your book into chapters and sections.
- **Research Pipeline**: Track your sources and investigation tasks.
- **Progress Tracking**: Monitor your daily word count and overall project goals.
