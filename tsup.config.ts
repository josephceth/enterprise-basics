import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: false,
  clean: true,
  // Bundle everything except Node.js built-ins and major frameworks
  noExternal: [/.*/],
  // Only externalize Node.js built-ins and major frameworks
  external: [
    // Node.js built-ins (excluding those used by bundled dependencies)
    'fs',
    'path',
    'crypto',
    'buffer',
    'util',
    'os',
    'cluster',
    'dgram',
    'dns',
    'domain',
    'module',
    'punycode',
    'readline',
    'repl',
    'string_decoder',
    'sys',
    'timers',
    'tty',
    'v8',
    'vm',
    'worker_threads',
    // Major frameworks that should be external
    '@sveltejs/kit',
    'svelte',
    'vite',
  ],
  treeshake: true,
  minify: false,
  sourcemap: false, // Disable sourcemaps to avoid conflicts
  platform: 'node',
  target: 'node22',
  esbuildOptions(options) {
    // Ensure proper module resolution
    options.mainFields = ['module', 'main'];
    // Handle dynamic requires properly
    options.keepNames = true;
    // Disable code splitting to avoid issues
    options.splitting = false;
    // Disable sourcemaps in esbuild as well
    options.sourcemap = false;
  },
});
