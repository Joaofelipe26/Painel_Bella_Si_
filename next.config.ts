import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite (banco do computador) usa WebAssembly e fica fora do bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
};

export default nextConfig;
