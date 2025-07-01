# Agent Shifts - Shift Rostering SaaS

A mobile-first, multi-tenant shift-rostering SaaS application built with React, TypeScript, and Tailwind CSS.

## Development

```bash
npm run dev    # Start development server
```

## Build & Lint

```bash
node scripts/build.js   # bundles server & client
bash scripts/lint.sh    # runs ESLint
```

## Testing

```bash
npx vitest run --config vitest.config.ts   # Run tests
```

## Type Checking

```bash
npm run check   # TypeScript type checking
```

## Architecture

- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest with React Testing Library
- **Build**: Custom ESBuild pipeline for optimized bundles