import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: false,
  clean: true,
  // Bundle dependencies that cause dynamic require issues
  noExternal: [
    'proxy-agent',
    'agent-base',
    'http-proxy-agent',
    'https-proxy-agent',
    'socks-proxy-agent',
    'pac-proxy-agent',
    'ws',
    'events',
  ],
  // Only externalize Node.js built-ins and major frameworks
  external: [
    // Node.js built-ins (but not the problematic ones)
    'fs',
    'net',
    'tls',
    'zlib',
    'stream',
    'path',
    'crypto',
    'url',
    'querystring',
    'buffer',
    'util',
    'os',
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'domain',
    'module',
    'process',
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
  sourcemap: true,
  platform: 'node',
  target: 'node18',
  esbuildOptions(options) {
    // Ensure proper module resolution
    options.mainFields = ['module', 'main'];
    // Handle dynamic requires properly
    options.keepNames = true;
  },
});
