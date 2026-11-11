import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy-policy', '/terms', '/contact'],
      },
    ],
    sitemap: 'https://padhaipilot.vercel.app/sitemap.xml',
  };
}
