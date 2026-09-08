import type { MetadataRoute } from 'next'

const BASE_URL = 'https://finiq.propiqla.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
