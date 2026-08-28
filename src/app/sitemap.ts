import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://netsentry.io';

  const coreRoutes = [
    '',
    '/download',
    '/admin',
  ];

  return coreRoutes.map((route) => {
    let priority = 0.5;
    if (route === '') priority = 1.0;
    else if (route === '/download') priority = 0.9;

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority,
    };
  });
}
