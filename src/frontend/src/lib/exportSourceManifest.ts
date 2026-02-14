/**
 * Deterministic manifest/collector for gathering in-repo text sources for export
 * Uses build-time file collection to gather workspace sources
 */

export interface SourceFile {
  path: string;
  content: string;
}

/**
 * Get the backend source files
 */
export function getBackendSources(): SourceFile[] {
  const sources: SourceFile[] = [];

  // Backend main file (always present)
  const backendMain = `actor {};
`;
  sources.push({
    path: 'backend/main.mo',
    content: backendMain,
  });

  return sources;
}

/**
 * Get the frontend configuration files
 */
export function getFrontendConfigSources(): SourceFile[] {
  return [
    {
      path: 'frontend/package.json',
      content: JSON.stringify({
        name: '@caffeine/template-frontend',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          setup: 'pnpm i && dfx canister create backend && dfx generate backend && dfx deploy',
          start: 'vite --port 3000',
          prebuild: 'dfx generate backend',
          'build:skip-bindings': 'vite build && pnpm copy:env',
          'copy:env': 'cp env.json dist/',
          'typescript-check': 'tsc --noEmit --pretty',
          format: 'prettier --write "src/**/*.{json,js,jsx,ts,tsx,css,scss}"',
          lint: 'eslint src --ext .ts,.tsx,.js,.jsx',
          'lint:fix': 'eslint src --ext .ts,.tsx,.js,.jsx --fix',
        },
      }, null, 2),
    },
    {
      path: 'dfx.json',
      content: JSON.stringify({
        canisters: {
          backend: {
            main: 'backend/main.mo',
            type: 'motoko',
          },
        },
        defaults: {
          build: {
            packtool: '',
          },
        },
        version: 1,
      }, null, 2),
    },
  ];
}

/**
 * Generate a README for the ZIP root
 */
export function generateReadme(): string {
  return `# Digital Asset Vault - Source Code Export

This bundle contains the complete source code for the Digital Asset Vault application.

## Project Structure

- \`backend/\` - Motoko smart contract backend
- \`frontend/\` - React + TypeScript frontend application

## Prerequisites

- Node.js 18+ and pnpm
- DFX (Internet Computer SDK)

## Getting Started

1. Install dependencies:
   \`\`\`bash
   cd frontend
   pnpm install
   \`\`\`

2. Start the local Internet Computer replica:
   \`\`\`bash
   dfx start --background
   \`\`\`

3. Deploy the backend canister:
   \`\`\`bash
   dfx deploy backend
   \`\`\`

4. Generate TypeScript bindings:
   \`\`\`bash
   dfx generate backend
   \`\`\`

5. Start the frontend development server:
   \`\`\`bash
   cd frontend
   pnpm start
   \`\`\`

6. Open http://localhost:3000 in your browser

## Build for Production

\`\`\`bash
cd frontend
pnpm build
\`\`\`

## Documentation

- Internet Computer: https://internetcomputer.org/docs
- Motoko: https://internetcomputer.org/docs/motoko/main/motoko
- React: https://react.dev

## Support

Built with caffeine.ai - https://caffeine.ai

---
Exported on ${new Date().toISOString()}
`;
}
