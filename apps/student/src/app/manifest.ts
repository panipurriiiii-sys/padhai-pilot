import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PadhaiPilot — Student Portal',
    short_name: 'PadhaiPilot',
    description: 'View your results, assignments, attendance and study materials',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF9F5',
    theme_color: '#4A9EFF',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
  };
}
