import type { MetadataRoute } from 'next';

/** Atalho na tela de início do celular: nome, cores e ícones do logo da Bella Si. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bella Si · Pedidos',
    short_name: 'Bella Si',
    description: 'Pedidos e entregas da Bella Si Cozinha Saudável',
    start_url: '/hoje',
    display: 'standalone',
    background_color: '#F7F3E8',
    theme_color: '#3F5A1E',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
