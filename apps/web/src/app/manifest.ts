import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PadhaiPilot',
    short_name: 'PadhaiPilot',
    description: 'All-in-one management platform for tuition centres and coaching institutes',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF9F5',
    theme_color: '#4A9EFF',
    icons: [
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
  };
}
