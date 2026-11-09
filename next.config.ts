import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite (banco do computador) usa WebAssembly e fica fora do bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // O botão de ferramentas do modo dev cobre o item "Hoje" do menu inferior.
  devIndicators: false,
};

export default nextConfig;
