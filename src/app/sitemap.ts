import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://talaqi.vercel.app';
  const routes = [
    '',
    '/courses',
    '/how-it-works',
    '/about',
    '/apply',
    '/share',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' || route === '/courses' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1.0 : route === '/courses' || route === '/apply' ? 0.9 : 0.7,
  }));
}
