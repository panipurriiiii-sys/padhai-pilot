import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PadhaiPilot — Teacher Portal',
    short_name: 'PadhaiPilot',
    description: 'Manage your batches, attendance, marks and fees from anywhere',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF9F5',
    theme_color: '#4A9EFF',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
  };
}
