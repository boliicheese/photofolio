import { db } from '../db/client.js';
import { collections } from '../db/schema.js';
import { asc } from 'drizzle-orm';

const BASE = 'https://bolivarbarrios.work';

function url(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function getSitemap(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cols  = await db.select({ slug: collections.slug, createdAt: collections.createdAt })
      .from(collections).orderBy(asc(collections.displayOrder));

    const urls = [
      url(`${BASE}/`,            today, 'weekly',  '1.0'),
      url(`${BASE}/gallery`,     today, 'weekly',  '0.9'),
      url(`${BASE}/collections`, today, 'weekly',  '0.8'),
      url(`${BASE}/about`,       today, 'monthly', '0.7'),
      url(`${BASE}/contact`,     today, 'monthly', '0.6'),
      ...cols.map((c) =>
        url(`${BASE}/collections/${c.slug}`, c.createdAt.toISOString().slice(0, 10), 'weekly', '0.8')
      ),
    ];

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join('\n') +
      `\n</urlset>`
    );
  } catch (err) {
    next(err);
  }
}
