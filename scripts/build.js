#!/usr/bin/env node

import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

console.log('🔨 Starting custom build pipeline...');

// Ensure dist directories exist
if (!existsSync('dist')) mkdirSync('dist');
if (!existsSync('dist/public')) mkdirSync('dist/public', { recursive: true });

try {
  // Bundle server
  console.log('📦 Bundling server...');
  const serverStart = Date.now();
  await esbuild.build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/server.js',
    external: ['lucide-react', 'recharts', 'd3', 'lodash'],
    packages: 'external'
  });
  const serverTime = Date.now() - serverStart;
  console.log(`✅ Server bundled in ${serverTime}ms`);

  // Bundle client
  console.log('📦 Bundling client...');
  const clientStart = Date.now();
  await esbuild.build({
    entryPoints: ['client/src/main.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/public/main.js',
    loader: { '.tsx': 'tsx', '.ts': 'tsx' },
    define: { 'process.env.NODE_ENV': '"production"' },
    external: ['lucide-react', 'recharts', 'd3', 'lodash']
  });
  const clientTime = Date.now() - clientStart;
  console.log(`✅ Client bundled in ${clientTime}ms`);

  // Copy CSS
  console.log('📄 Copying CSS...');
  copyFileSync('client/src/index.css', 'dist/public/index.css');
  console.log('✅ CSS copied');

  // Copy HTML template
  if (existsSync('client/index.html')) {
    copyFileSync('client/index.html', 'dist/public/index.html');
    console.log('✅ HTML copied');
  }

  console.log('🎉 Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}